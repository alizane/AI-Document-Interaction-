import os
import boto3
import PyPDF2
import ffmpeg
import faiss
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceInferenceAPIEmbeddings
from langchain_huggingface import HuggingFaceEndpoint
from langchain_google_genai import ChatGoogleGenerativeAI
import pdfplumber
from dotenv import load_dotenv
import tempfile
import uuid
from fastapi.middleware.cors import CORSMiddleware
from collections import Counter
import re
import markdown
from bs4 import BeautifulSoup
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Validate environment variables
HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "ccproject12321")

if not HUGGINGFACE_API_TOKEN:
    logger.error("HUGGINGFACE_API_TOKEN is not set in environment variables")
    raise ValueError("HUGGINGFACE_API_TOKEN is required")
if not GOOGLE_API_KEY:
    logger.error("GOOGLE_API_KEY is not set in environment variables")
    raise ValueError("GOOGLE_API_KEY is required")
if not BUCKET_NAME:
    logger.error("S3_BUCKET_NAME is not set in environment variables")
    raise ValueError("S3_BUCKET_NAME is required")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS clients
s3_client = boto3.client('s3')

# Configuration
ALLOWED_EXTENSIONS = {'.pdf', '.mp4'}
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Pydantic model for query input
class QueryRequest(BaseModel):
    document_id: str
    question: str

# Helper functions
def allowed_file(filename: str) -> bool:
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

def compress_pdf(input_path: str, output_path: str):
    with open(input_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        writer = PyPDF2.PdfWriter()
        for page in reader.pages:
            page.compress_content_streams()
            writer.add_page(page)
        with open(output_path, 'wb') as output:
            writer.write(output)

def compress_video(input_path: str, output_path: str):
    stream = ffmpeg.input(input_path)
    stream = ffmpeg.output(stream, output_path, vcodec='libx264', crf=23, preset='medium')
    ffmpeg.run(stream)

def extract_text_and_metadata(s3_key: str) -> dict:
    temp_dir = tempfile.gettempdir()
    local_path = os.path.join(temp_dir, s3_key.split('/')[-1])
    try:
        s3_client.download_file(BUCKET_NAME, s3_key, local_path)
    except Exception as e:
        logger.error(f"Failed to download file from S3: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download file from S3: {str(e)}")
    
    text = ""
    metadata = {}
    tables = []
    try:
        with pdfplumber.open(local_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
                page_tables = page.extract_tables()
                for table in page_tables:
                    tables.append(table)
            metadata = pdf.metadata or {}
    except Exception as e:
        logger.error(f"Text extraction failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)
    
    # Extract key points
    sentences = text.split('\n')
    key_points = [s.strip() for s in sentences if len(s.strip()) > 50][:5]
    
    # Extract keywords
    words = re.findall(r'\w+', text.lower())
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
    keywords = [word for word in words if word not in stop_words]
    keyword_counts = Counter(keywords).most_common(5)
    keywords = [word for word, _ in keyword_counts]
    
    return {
        "text": text,
        "metadata": metadata,
        "tables": tables,
        "key_points": key_points,
        "keywords": keywords
    }

def create_vector_store(text: str) -> FAISS:
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
    )
    chunks = text_splitter.split_text(text)
    embeddings = HuggingFaceInferenceAPIEmbeddings(
        api_key=HUGGINGFACE_API_TOKEN,
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vector_store = FAISS.from_texts(chunks, embeddings)
    return vector_store

def format_response(text: str) -> str:
    """Convert Markdown to HTML for frontend rendering."""
    html = markdown.markdown(text)
    soup = BeautifulSoup(html, 'html.parser')
    return str(soup)

# API Endpoints
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")

    file_extension = os.path.splitext(file.filename)[1].lower()
    document_id = f"{uuid.uuid4().hex}{file_extension}"
    temp_dir = tempfile.gettempdir()
    input_path = os.path.join(temp_dir, document_id)
    compressed_path = os.path.join(temp_dir, f"compressed_{document_id}")
    s3_key = f"documents/{document_id}"
    compressed_s3_key = f"compressed/{document_id}"

    try:
        with open(input_path, "wb") as f:
            f.write(await file.read())

        if file_extension == '.pdf':
            compress_pdf(input_path, compressed_path)
        elif file_extension == '.mp4':
            compress_video(input_path, compressed_path)

        s3_client.upload_file(input_path, BUCKET_NAME, s3_key)
        s3_client.upload_file(compressed_path, BUCKET_NAME, compressed_s3_key)

        if file_extension == '.pdf':
            data = extract_text_and_metadata(s3_key)
            vector_store = create_vector_store(data["text"])
            index_path = os.path.join(temp_dir, f"{document_id}_index")
            vector_store.save_local(index_path)
            s3_client.upload_file(
                os.path.join(index_path, "index.faiss"), BUCKET_NAME, f"indexes/{document_id}_index.faiss"
            )
            s3_client.upload_file(
                os.path.join(index_path, "index.pkl"), BUCKET_NAME, f"indexes/{document_id}_index.pkl"
            )

        logger.info(f"Uploaded document {document_id}")
        return {
            "document_id": document_id,
            "original_s3_key": s3_key,
            "compressed_s3_key": compressed_s3_key
        }

    except Exception as e:
        logger.error(f"Upload failed for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(compressed_path):
            os.remove(compressed_path)

@app.get("/document/{document_id}")
async def get_document_data(document_id: str):
    if not re.match(r'^[a-f0-9]{32}\.(pdf|mp4)$', document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")
    s3_key = f"documents/{document_id}"
    try:
        data = extract_text_and_metadata(s3_key)
        return data
    except Exception as e:
        logger.error(f"Failed to fetch document data for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch document data: {str(e)}")

@app.post("/query")
async def query_document(request: QueryRequest):
    if not re.match(r'^[a-f0-9]{32}\.(pdf|mp4)$', request.document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    document_id = request.document_id
    question = request.question

    temp_dir = tempfile.gettempdir()
    index_path = os.path.join(temp_dir, f"{document_id}_index")
    os.makedirs(index_path, exist_ok=True)
    try:
        s3_client.download_file(BUCKET_NAME, f"indexes/{document_id}_index.faiss", os.path.join(index_path, "index.faiss"))
        s3_client.download_file(BUCKET_NAME, f"indexes/{document_id}_index.pkl", os.path.join(index_path, "index.pkl"))
    except Exception as e:
        logger.error(f"Failed to download vector store for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download vector store: {str(e)}")

    embeddings = HuggingFaceInferenceAPIEmbeddings(
        api_key=HUGGINGFACE_API_TOKEN,
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vector_store = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)

    docs = vector_store.similarity_search(question, k=2)
    context = "\n".join([doc.page_content for doc in docs])

    # Step 1: Generate raw response with Mistral
    mistral_llm = HuggingFaceEndpoint(
        repo_id="mistralai/Mixtral-8x7B-Instruct-v0.1",
        huggingfacehub_api_token=HUGGINGFACE_API_TOKEN,
        task="text-generation",
        model_kwargs={"max_length": 200},
        temperature=0.7
    )
    mistral_prompt = f"""
    [INST]
    Context: {context}
    
    Question: {question}
    
    Instructions:
    - Provide a concise, accurate answer to the question based on the context.
    - If the context lacks relevant information, state: "No relevant information found."
    - Avoid unnecessary details.
    
    Answer:
    [/INST]
    """
    try:
        mistral_response = mistral_llm.invoke(mistral_prompt)
        logger.info(f"Mistral response for {document_id}: {mistral_response}")
    except Exception as e:
        logger.error(f"Mistral query failed for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mistral query failed: {str(e)}")

    # Step 2: Format Mistral response with Gemini
    gemini_llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=GOOGLE_API_KEY,
        max_output_tokens=500,
        temperature=0.5
    )
    gemini_prompt = f"""
    **Input Response**: {mistral_response}
    
    **Instructions**:
    - Format the input response into a structured output with the following sections:
      - **Answer**: A concise answer in 1-2 sentences.
      - **Insights**: 2-4 bullet-point insights derived from the response.
      - **Table**: A Markdown table summarizing key information (e.g., question, answer, source).
      - **Diagram**: A simple ASCII or Markdown-based flowchart or diagram (if applicable, e.g., for processes).
    - Use Markdown formatting for clarity.
    - If the response lacks sufficient information, note it in the answer section.
    - Ensure the output is clean and suitable for frontend rendering.
    
    **Formatted Output**:
    """
    try:
        gemini_response = gemini_llm.invoke(gemini_prompt).content
        formatted_response = format_response(gemini_response)
        logger.info(f"Gemini formatted response for {document_id}: {formatted_response[:200]}...")
        return {
            "answer": formatted_response,
            "raw_answer": mistral_response  # Include raw Mistral response for debugging
        }
    except Exception as e:
        logger.error(f"Gemini formatting failed for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini formatting failed: {str(e)}")
    finally:
        if os.path.exists(index_path):
            for file in os.listdir(index_path):
                os.remove(os.path.join(index_path, file))
            os.rmdir(index_path)

@app.post("/summarize")
async def summarize_document(request: QueryRequest):
    if not re.match(r'^[a-f0-9]{32}\.(pdf|mp4)$', request.document_id):
        raise HTTPException(status_code=400, detail="Invalid document ID")

    document_id = request.document_id

    temp_dir = tempfile.gettempdir()
    index_path = os.path.join(temp_dir, f"{document_id}_index")
    os.makedirs(index_path, exist_ok=True)
    try:
        s3_client.download_file(BUCKET_NAME, f"indexes/{document_id}_index.faiss", os.path.join(index_path, "index.faiss"))
        s3_client.download_file(BUCKET_NAME, f"indexes/{document_id}_index.pkl", os.path.join(index_path, "index.pkl"))
    except Exception as e:
        logger.error(f"Failed to download vector store for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to download vector store: {str(e)}")

    embeddings = HuggingFaceInferenceAPIEmbeddings(
        api_key=HUGGINGFACE_API_TOKEN,
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )
    vector_store = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)

    docs = vector_store.similarity_search("Summarize the document", k=5)
    context = "\n".join([doc.page_content for doc in docs])

    # Step 1: Generate raw summary with Mistral
    mistral_llm = HuggingFaceEndpoint(
        repo_id="mistralai/Mixtral-8x7B-Instruct-v0.1",
        huggingfacehub_api_token=HUGGINGFACE_API_TOKEN,
        task="text-generation",
        model_kwargs={"max_length": 300},
        temperature=0.5
    )
    mistral_prompt = f"""
    [INST]
    Context: {context}
    
    Instructions:
    - Provide a concise summary of the document in 3-5 sentences.
    - Focus on the main topics and key information.
    - If the context is insufficient, state: "Insufficient information for summary."
    
    Summary:
    [/INST]
    """
    try:
        mistral_response = mistral_llm.invoke(mistral_prompt)
        logger.info(f"Mistral summary for {document_id}: {mistral_response}")
    except Exception as e:
        logger.error(f"Mistral summary failed for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mistral summary failed: {str(e)}")

    # Step 2: Format Mistral summary with Gemini
    gemini_llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=GOOGLE_API_KEY,
        max_output_tokens=500,
        temperature=0.5
    )
    gemini_prompt = f"""
    **Input Summary**: {mistral_response}
    
    **Instructions**:
    - Format the input summary into a structured output with the following sections:
      - **Summary**: A concise summary in 3-5 sentences.
      - **Insights**: 3-5 bullet-point insights derived from the summary.
      - **Table**: A Markdown table summarizing key information (e.g., main topics, key points).
      - **Diagram**: A simple ASCII or Markdown-based flowchart (if applicable, e.g., for processes).
    - Use Markdown formatting for clarity.
    - If the summary lacks sufficient information, note it in the summary section.
    - Ensure the output is clean and suitable for frontend rendering.
    
    **Formatted Output**:
    """
    try:
        gemini_response = gemini_llm.invoke(gemini_prompt).content
        formatted_response = format_response(gemini_response)
        logger.info(f"Gemini formatted summary for {document_id}: {formatted_response[:200]}...")
        return {
            "summary": formatted_response,
            "raw_summary": mistral_response  # Include raw Mistral summary for debugging
        }
    except Exception as e:
        logger.error(f"Gemini formatting failed for {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gemini formatting failed: {str(e)}")
    finally:
        if os.path.exists(index_path):
            for file in os.listdir(index_path):
                os.remove(os.path.join(index_path, file))
            os.rmdir(index_path)