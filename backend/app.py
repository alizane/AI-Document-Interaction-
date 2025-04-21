import os
import boto3
import PyPDF2
import ffmpeg
import faiss
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
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
    """Return raw Markdown text without converting to HTML."""
    return text

def process_document_insights(text: str) -> dict:
    mistral_llm = HuggingFaceEndpoint(
        repo_id="mistralai/Mixtral-8x7B-Instruct-v0.1",
        huggingfacehub_api_token=HUGGINGFACE_API_TOKEN,
        task="text-generation",
        model_kwargs={"max_length": 1000},
        temperature=0.5
    )
    
    prompt = f"""
    [INST]
    Context: {text}
    
    Instructions:
    - Analyze the provided text and extract the following sections:
      - **Extracted Text**: The full raw text provided (up to 500 characters).
      - **Key Points**: 3-5 bullet points summarizing the main ideas (each point should be concise).
      - **Keywords**: 5 most relevant keywords (comma-separated list).
      - **Tables**: Any tables present in the text formatted as Markdown tables (if none, state "No tables found").
    - Use Markdown formatting for clarity.
    - If the text is insufficient, provide default values or note the limitation.
    
    **Formatted Output**:
    [/INST]
    """
    
    try:
        mistral_response = mistral_llm.invoke(prompt)
        logger.info(f"Mistral processed document insights: {mistral_response[:200]}...")
        
        response_text = mistral_response
        extracted_text = response_text.split("**Extracted Text**:")[1].split("**Key Points**:")[0].strip().split("\n")[0][:500] + "..."
        key_points = response_text.split("**Key Points**:")[1].split("**Keywords**:")[0].strip().split("\n")[1:6]
        keywords = response_text.split("**Keywords**:")[1].split("**Tables**:")[0].strip().split(",")[:5]
        tables = response_text.split("**Tables**:")[1].strip().split("\n\n")[0]

        return {
            "text": extracted_text if extracted_text.strip() else "No text extracted from PDF.",
            "key_points": [kp.strip("- ").strip() for kp in key_points if kp.strip()] or ["No key points available."],
            "keywords": [kw.strip() for kw in keywords if kw.strip()] or ["No keywords available."],
            "tables": tables if tables != "No tables found" else [],
            "metadata": {}
        }
    except Exception as e:
        logger.error(f"Failed to process document insights with Mistral: {str(e)}")
        return {
            "text": f"Error: Failed to process document. {str(e)}. Please try again.",
            "key_points": ["No key points available."],
            "keywords": ["No keywords available."],
            "tables": [],
            "metadata": {}
        }

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
        logger.info(f"File written to {input_path}")

        if file_extension == '.pdf':
            compress_pdf(input_path, compressed_path)
        elif file_extension == '.mp4':
            compress_video(input_path, compressed_path)

        s3_client.upload_file(input_path, BUCKET_NAME, s3_key)
        logger.info(f"Uploaded to S3: {s3_key}")
        s3_client.upload_file(compressed_path, BUCKET_NAME, compressed_s3_key)
        logger.info(f"Uploaded compressed to S3: {compressed_s3_key}")

        if file_extension == '.pdf':
            text = extract_raw_text(s3_key)
            vector_store = create_vector_store(text)
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
        logger.error(f"Invalid document ID format: {document_id}")
        raise HTTPException(status_code=400, detail="Invalid document ID")
    
    s3_key = f"documents/{document_id}"
    logger.info(f"Attempting to fetch document from S3 key: {s3_key}")
    
    try:
        s3_client.head_object(Bucket=BUCKET_NAME, Key=s3_key)
        logger.info(f"Head object succeeded for {s3_key}")
        text = extract_raw_text(s3_key)
        data = process_document_insights(text)
        logger.info(f"Successfully processed data for {document_id}")
        return data
    except s3_client.exceptions.NoSuchKey:
        logger.error(f"Document not found in S3 for key: {s3_key}")
        return {
            "text": f"Error: Failed to fetch document data: 404 Not Found. Please ensure the document is uploaded correctly or try again later, bro.",
            "key_points": ["No key points available."],
            "keywords": ["No keywords available."],
            "tables": [],
            "metadata": {}
        }
    except s3_client.exceptions.ClientError as e:
        logger.error(f"S3 client error for {document_id}: {str(e)} - HTTP Status Code: {e.response['Error']['Code']}")
        return {
            "text": f"Error: S3 access error: {str(e)}. Please try again later, dude.",
            "key_points": ["No key points available."],
            "keywords": ["No keywords available."],
            "tables": [],
            "metadata": {}
        }
    except Exception as e:
        logger.error(f"Unexpected error fetching document data for {document_id}: {str(e)}")
        return {
            "text": f"Error: Failed to fetch document data: {str(e)}. Please try again later, bro.",
            "key_points": ["No key points available."],
            "keywords": ["No keywords available."],
            "tables": [],
            "metadata": {}
        }

def extract_raw_text(s3_key: str) -> str:
    temp_dir = tempfile.gettempdir()
    local_path = os.path.join(temp_dir, s3_key.split('/')[-1])
    logger.info(f"Attempting to download {s3_key} to {local_path}")
    try:
        s3_client.download_file(BUCKET_NAME, s3_key, local_path)
        logger.info(f"Successfully downloaded {s3_key} to {local_path}")
        text = ""
        with pdfplumber.open(local_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        logger.info(f"Extracted text length: {len(text)} characters")
        return text
    except Exception as e:
        logger.error(f"Raw text extraction failed for {s3_key}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Raw text extraction failed: {str(e)}")
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)
            
@app.post("/query")
async def query_document(request: QueryRequest):
    if not re.match(r'^[a-f0-9]{32}\.(pdf|mp4)$', request.document_id):
        return {"answer": "Whoa, looks like that document ID isn’t quite right, bro! Let’s get a valid one and try again.", "raw_answer": ""}

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
        return {"answer": "Oops, couldn’t grab the document data, dude! Maybe upload it again or check the ID.", "raw_answer": ""}

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
        model_kwargs={"max_length": 1000},
        temperature=0.7
    )
    mistral_prompt = f"""
    [INST]
    Context: {context}
    
    Question: {question}
    
    Instructions:
    - Provide a concise, accurate answer to the question based on the context.
    - If the context lacks relevant information, state: "No relevant info here, bro!"
    - Avoid unnecessary details.
    - Keep it casual and friendly like a chat with a buddy.
    
    Answer:
    [/INST]
    """
    try:
        mistral_response = mistral_llm.invoke(mistral_prompt)
        logger.info(f"Mistral response for {document_id}: {mistral_response}")
    except Exception as e:
        logger.error(f"Mistral query failed for {document_id}: {str(e)}")
        return {"answer": "Yikes, something went wrong with the AI, dude! Let’s try that again.", "raw_answer": ""}

    # Step 2: Format Mistral response with Gemini
    gemini_llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=GOOGLE_API_KEY,
        max_output_tokens=5000,
        temperature=0.5
    )
    gemini_prompt = f"""
    **Input Response**: {mistral_response}

    **Instructions**:
    - Format the input response into a structured output with the following sections:
      - **Answer**: A concise answer in 1-2 sentences, avoiding extra punctuation or quotes.
      - **Insights**: 2-4 bullet-point insights derived from the response, each on a new line, no trailing punctuation. Ensure this section is fully completed.
      - **Table**: A Markdown table summarizing key information (e.g., question, answer, source), with clean cell content. Include at least one row if data exists, or use "N/A" if none.
      - **Diagram**: A simple ASCII or Markdown-based flowchart or diagram (if applicable, e.g., for processes), or "N/A" if not applicable.
    - Use Markdown formatting for clarity.
    - Ensure all sections are fully completed, even if the input is short. If incomplete, pad with "N/A" and log a warning.
    - Remove unnecessary characters (e.g., extra '."*,' or quotes) from the output.
    - Keep the tone casual and friendly.

    **Formatted Output**: 
    """
    try:
        gemini_response = gemini_llm.invoke(gemini_prompt).content
        if "Insights" in gemini_response and not gemini_response.split("**Insights**")[1].strip().split("\n")[1:]:
            logger.warning(f"Insights section incomplete for {document_id}")
        formatted_response = format_response(gemini_response)
        logger.info(f"Gemini formatted response for {document_id}: {formatted_response[:200]}...")
        return {
            "answer": formatted_response,
            "raw_answer": mistral_response
        }
    except Exception as e:
        logger.error(f"Gemini formatting failed for {document_id}: {str(e)}")
        return {"answer": "Uh-oh, formatting hit a snag, bro! Let’s give it another shot.", "raw_answer": ""}
    finally:
        if os.path.exists(index_path):
            for file in os.listdir(index_path):
                os.remove(os.path.join(index_path, file))
            os.rmdir(index_path)

@app.post("/summarize")
async def summarize_document(request: QueryRequest):
    if not re.match(r'^[a-f0-9]{32}\.(pdf|mp4)$', request.document_id):
        return {"summary": "Hey dude, that document ID looks off! Let’s get a good one and try again.", "raw_summary": ""}

    document_id = request.document_id

    temp_dir = tempfile.gettempdir()
    index_path = os.path.join(temp_dir, f"{document_id}_index")
    os.makedirs(index_path, exist_ok=True)
    try:
        s3_client.download_file(BUCKET_NAME, f"indexes/{document_id}_index.faiss", os.path.join(index_path, "index.faiss"))
        s3_client.download_file(BUCKET_NAME, f"indexes/{document_id}_index.pkl", os.path.join(index_path, "index.pkl"))
    except Exception as e:
        logger.error(f"Failed to download vector store for {document_id}: {str(e)}")
        return {"summary": "Whoops, couldn’t load the doc, bro! Maybe upload it again?", "raw_summary": ""}

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
        model_kwargs={"max_length": 900},
        temperature=0.5
    )
    mistral_prompt = f"""
    [INST]
    Context: {context}
    
    Instructions:
    - Provide a concise summary of the document in 3-5 sentences.
    - Focus on the main topics and key information.
    - If the context is insufficient, state: "Not enough info to summarize, dude!"
    - Keep it casual and friendly like a chat with a buddy.
    
    Summary:
    [/INST]
    """
    try:
        mistral_response = mistral_llm.invoke(mistral_prompt)
        logger.info(f"Mistral summary for {document_id}: {mistral_response}")
    except Exception as e:
        logger.error(f"Mistral summary failed for {document_id}: {str(e)}")
        return {"summary": "Aw man, the summary bot tripped up! Let’s try again.", "raw_summary": ""}

    # Step 2: Format Mistral summary with Gemini
    gemini_llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-pro",
        google_api_key=GOOGLE_API_KEY,
        max_output_tokens=2000,
        temperature=0.5
    )
    gemini_prompt = f"""
    **Input Summary**: {mistral_response}
    
    **Instructions**:
    - Format the input response into a structured output with the following sections:
      - **Answer**: A concise answer in 1-2 sentences, avoiding extra punctuation or quotes.
      - **Insights**: 2-4 bullet-point insights derived from the response, each on a new line, no trailing punctuation.
      - **Table**: A Markdown table summarizing key information (e.g., question, answer, source), with clean cell content.
      - **Diagram**: A simple ASCII or Markdown-based flowchart or diagram (if applicable, e.g., for processes).
    - Use Markdown formatting for clarity.
    - Remove unnecessary characters (e.g., extra '."*,' or quotes) from the output.
    - Ensure the output is clean and suitable for frontend rendering.
    - Keep the tone casual and friendly.
    
    **Formatted Output**:
    """
    try:
        gemini_response = gemini_llm.invoke(gemini_prompt).content
        formatted_response = format_response(gemini_response)
        logger.info(f"Gemini formatted summary for {document_id}: {formatted_response[:200]}...")
        return {
            "summary": formatted_response,
            "raw_summary": mistral_response
        }
    except Exception as e:
        logger.error(f"Gemini formatting failed for {document_id}: {str(e)}")
        return {"summary": "Formatting glitch, bro! Let’s hit retry.", "raw_summary": ""}
    finally:
        if os.path.exists(index_path):
            for file in os.listdir(index_path):
                os.remove(os.path.join(index_path, file))
            os.rmdir(index_path)