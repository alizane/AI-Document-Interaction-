"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import ReactMarkdown from "react-markdown"
import Mermaid from "mermaid"
import { Chart } from "chart.js/auto"
import { motion } from "framer-motion"

export default function InteractPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [documentData, setDocumentData] = useState({
    text: "",
    key_points: [],
    tables: [],
    metadata: {},
    keywords: [],
  })
  const [isFetchingData, setIsFetchingData] = useState(false)
  const messagesEndRef = useRef(null)
  const mermaidRef = useRef([])
  const chartRef = useRef(null)
  const canvasRef = useRef(null)
  const [chartInstance, setChartInstance] = useState(null)

  const documentId = searchParams.get("document_id")

  // Utility function to clean response text
  const cleanResponse = (text) => {
    return text
      .replace(/[\s"]*\.*[\s"]*$/gm, "")
      .replace(/,\s*$/gm, "")
      .trim()
  }

  useEffect(() => {
    if (!documentId || !/^[a-f0-9]{32}\.(pdf|mp4)$/.test(documentId)) {
      router.push("/")
      setMessages([{ role: "system", content: "Whoa, invalid document ID, bro! Head back and upload a valid PDF." }])
    } else {
      setMessages([
        {
          role: "system",
          content: `Hey bro, I’ve checked out your PDF with ID "${documentId}". What’s on your mind?`,
        },
      ])
      fetchDocumentData()
    }
  }, [documentId, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    Mermaid.initialize({ startOnLoad: true, theme: darkMode ? "dark" : "default" })
    mermaidRef.current = messages
      .map((message, index) => {
        const mermaidMatch = message.content.match(/```mermaid\n([\s\S]*?)\n```/)
        return mermaidMatch ? { id: `mermaid-${index}`, code: mermaidMatch[1] } : null
      })
      .filter(Boolean)

    mermaidRef.current.forEach(({ id, code }) => {
      Mermaid.render(id, code, (svgCode) => {
        const element = document.getElementId(id)
        if (element && !element.innerHTML) element.innerHTML = svgCode
      })
    })
  }, [messages, darkMode])

  useEffect(() => {
    if (chartInstance) {
      chartInstance.destroy()
    }
    if (chartRef.current && documentData.keywords.length > 0) {
      const ctx = chartRef.current.getContext("2d")
      const newChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: documentData.keywords,
          datasets: [
            {
              label: "Keyword Frequency",
              data: Array(documentData.keywords.length).fill(1), // Placeholder
              backgroundColor: darkMode ? "rgba(75, 192, 192, 0.6)" : "rgba(75, 192, 192, 0.8)",
              borderColor: darkMode ? "rgba(75, 192, 192, 1)" : "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "Count" } },
            x: { title: { display: true, text: "Keywords" } },
          },
          plugins: { legend: { display: false } },
        },
      })
      setChartInstance(newChartInstance)
    }
  }, [documentData, darkMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchDocumentData = async () => {
    setIsFetchingData(true)
    try {
      const response = await fetch(`/api/document/${documentId}`)
      console.log("Fetch response:", response.status, response.statusText)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setDocumentData(data || {
        text: "No data available, bro! Upload a valid PDF.",
        key_points: ["No key points available."],
        tables: [],
        metadata: {},
        keywords: ["No keywords available."],
      })
    } catch (error) {
      console.error("Error fetching document data:", error.message, error)
      setDocumentData({
        text: `Error: ${error.message}. Please ensure the document ID "${documentId}" is correct and uploaded, or try again later, bro.`,
        key_points: ["No key points available."],
        tables: [],
        metadata: {},
        keywords: ["No keywords available."],
      })
    } finally {
      setIsFetchingData(false)
    }
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim() && !isRecording) return

    const userMessage = isRecording ? "Voice transcription: Summarize the document." : input
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, question: userMessage }),
      })
      if (!response.ok) throw new Error("API request failed")
      const data = await response.json()
      const cleanedAnswer = cleanResponse(data.answer)
      setMessages((prev) => [...prev, { role: "system", content: cleanedAnswer }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Sorry, an error occurred, dude! Let’s try again." },
      ])
      console.error("Query failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarize = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId }),
      })
      if (!response.ok) throw new Error("Summarization failed")
      const data = await response.json()
      const cleanedSummary = cleanResponse(data.summary)
      setMessages((prev) => [...prev, { role: "system", content: cleanedSummary }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Failed to summarize, bro! Give it another go." },
      ])
      console.error("Summarization failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      handleSendMessage()
    } else {
      setIsRecording(true)
      setTimeout(() => {
        setIsRecording(false)
        setInput("Voice transcription: Summarize the document.")
        handleSendMessage()
      }, 2000)
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handleBack = () => {
    router.push("/")
  }

  const renderMessageContent = (content, index) => {
    const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)\n```/)
    const mermaidId = `mermaid-${index}`

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="markdown">
          <ReactMarkdown
            components={{
              table: ({ node, ...props }) => (
                <table
                  className={`border-collapse w-full my-2 ${
                    darkMode ? "border-gray-600" : "border-gray-300"
                  }`}
                  {...props}
                />
              ),
              th: ({ node, ...props }) => (
                <th
                  className={`border px-4 py-2 ${
                    darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-100 border-gray-300"
                  }`}
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td
                  className={`border px-4 py-2 ${
                    darkMode ? "border-gray-600" : "border-gray-300"
                  }`}
                  {...props}
                />
              ),
              p: ({ node, ...props }) => <p className="mb-2" {...props} />,
              ul: ({ node, ...props }) => <ul className="pl-5 mb-2 list-disc" {...props} />,
              ol: ({ node, ...props }) => <ol className="pl-5 mb-2 list-decimal" {...props} />,
            }}
          >
            {mermaidMatch ? content.replace(mermaidMatch[0], "") : content}
          </ReactMarkdown>
        </div>
        {mermaidMatch && (
          <div className="my-4" id={mermaidId}>
            {/* Mermaid diagram will render here */}
          </div>
        )}
      </motion.div>
    )
  }

  const openCanvasPanel = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (chartInstance) chartInstance.destroy()
      const newChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: documentData.keywords,
          datasets: [
            {
              label: "Keyword Frequency",
              data: Array(documentData.keywords.length).fill(Math.floor(Math.random() * 10) + 1),
              backgroundColor: darkMode ? "rgba(75, 192, 192, 0.6)" : "rgba(75, 192, 192, 0.8)",
              borderColor: darkMode ? "rgba(75, 192, 192, 1)" : "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: { beginAtZero: true, title: { display: true, text: "Count" } },
            x: { title: { display: true, text: "Keywords" } },
          },
          plugins: { legend: { display: false } },
        },
      })
      setChartInstance(newChartInstance)
    }
  }

  return (
    <div
      className={`flex flex-col min-h-screen ${
        darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-br from-white to-indigo-50"
      }`}
    >
      <Navbar />
      <main className="flex flex-col flex-grow p-4 sm:p-8">
        <div className="flex justify-between mb-4">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            onClick={openCanvasPanel}
            className={`p-2 rounded-full ${
              darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
          >
            📊
          </button>
        </div>
        <div
          className={`flex flex-col w-full mx-auto overflow-hidden ${
            darkMode ? "bg-gray-800" : "bg-white"
          } shadow-xl max-w-7xl rounded-2xl lg:flex-row`}
        >
          <div className={`flex-grow ${showSidePanel ? "lg:w-2/3" : "w-full"}`}>
            <div className="flex flex-col h-full">
              <div
                className={`flex items-center justify-between p-4 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-10 rounded ${
                      darkMode ? "bg-gray-700" : "bg-indigo-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 ${darkMode ? "text-gray-300" : "text-indigo-600"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="truncate">
                    <p
                      className={`font-medium truncate max-w-[200px] sm:max-w-sm ${
                        darkMode ? "text-gray-300" : "text-gray-900"
                      }`}
                    >
                      Document ID: {documentId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSidePanel(!showSidePanel)}
                    className={`p-2 ${
                      darkMode ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-indigo-600"
                    } lg:hidden`}
                  >
                    {showSidePanel ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleBack}
                    className={`p-2 ${
                      darkMode ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-indigo-600"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                  </button>
                </div>
              </div>

              <div
                className={`flex-grow p-4 space-y-4 overflow-y-auto ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? darkMode
                            ? "bg-indigo-500 text-white"
                            : "bg-indigo-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-200"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {renderMessageContent(message.content, index)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        darkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <div className="flex space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            darkMode ? "bg-gray-400" : "bg-gray-400"
                          }`}
                        ></div>
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            darkMode ? "bg-gray-400" : "bg-gray-400"
                          }`}
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className={`w-2 h-2 rounded-full animate-bounce ${
                            darkMode ? "bg-gray-400" : "bg-gray-400"
                          }`}
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className={`p-4 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-2 rounded-full ${
                      isRecording
                        ? "bg-red-100 text-red-600 animate-pulse"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about your PDF..."
                    className={`flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      darkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "border-gray-300 text-gray-800"
                    }`}
                    disabled={isRecording}
                  />
                  <button
                    type="submit"
                    className={`p-2 rounded-lg ${
                      darkMode ? "bg-indigo-500 text-white hover:bg-indigo-600" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                </form>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleSummarize}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Summarize
                  </button>
                  <button
                    onClick={() => setInput("What are the key points of this document?")}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Key Points
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showSidePanel && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`border-t lg:border-t-0 lg:border-l lg:w-1/3 ${
                darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className={`p-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                  Document Insights
                </h3>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
                <div className="prose-sm prose max-w-none">
                  {documentData.metadata.title && (
                    <>
                      <h4 className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                        Metadata
                      </h4>
                      <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Title: {documentData.metadata.title}
                      </p>
                      {documentData.metadata.author && (
                        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Author: {documentData.metadata.author}
                        </p>
                      )}
                    </>
                  )}
                  <h4 className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                    Extracted Text
                  </h4>
                  {isFetchingData ? (
                    <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Loading...
                    </p>
                  ) : (
                    <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      {documentData.text}
                    </p>
                  )}
                  <h4 className={`mt-4 text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                    Key Points
                  </h4>
                  {isFetchingData ? (
                    <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Loading...
                    </p>
                  ) : (
                    <ul className={`pl-5 mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} list-disc`}>
                      {documentData.key_points.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  )}
                  <h4 className={`mt-4 text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                    Keywords
                  </h4>
                  {isFetchingData ? (
                    <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Loading...
                    </p>
                  ) : (
                    <ul className={`pl-5 mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} list-disc`}>
                      {documentData.keywords.map((keyword, index) => (
                        <li key={index}>{keyword}</li>
                      ))}
                    </ul>
                  )}
                  <h4 className={`mt-4 text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                    Keyword Chart
                  </h4>
                  <div className="mt-2">
                    <canvas ref={chartRef} style={{ maxHeight: "200px" }}></canvas>
                  </div>
                  <h4 className={`mt-4 text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-900"}`}>
                    Tables
                  </h4>
                  {isFetchingData ? (
                    <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      Loading...
                    </p>
                  ) : documentData.tables.length > 0 ? (
                    documentData.tables.map((table, index) => (
                      <div key={index} className="mt-2 overflow-x-auto border rounded">
                        <ReactMarkdown
                          components={{
                            table: ({ node, ...props }) => (
                              <table
                                className={`min-w-full text-sm divide-y ${
                                  darkMode ? "divide-gray-600" : "divide-gray-200"
                                }`}
                                {...props}
                              />
                            ),
                            th: ({ node, ...props }) => (
                              <th
                                className={`px-3 py-2 text-xs font-medium tracking-wider text-left uppercase ${
                                  darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
                                }`}
                                {...props}
                              />
                            ),
                            td: ({ node, ...props }) => (
                              <td
                                className={`px-3 py-2 ${
                                  darkMode ? "border-gray-600" : "border-gray-300"
                                }`}
                                {...props}
                              />
                            ),
                          }}
                        >
                          {table}
                        </ReactMarkdown>
                      </div>
                    ))
                  ) : (
                    <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                      No tables found.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-4 right-4 w-64 h-64 bg-white rounded-lg shadow-lg p-4 ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
        style={{ display: chartInstance ? "block" : "none" }}
      >
        <h4 className="mb-2 text-sm font-medium">Chart Canvas</h4>
        <canvas ref={canvasRef} style={{ maxHeight: "200px" }}></canvas>
        <button
          onClick={() => setChartInstance(null)}
          className={`mt-2 px-3 py-1 text-sm rounded-lg ${
            darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"
          }`}
        >
          Close
        </button>
      </motion.div>

      <style jsx global>{`
        .markdown ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .markdown ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .markdown table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .markdown th,
        .markdown td {
          border: 1px solid ${darkMode ? "#4b5563" : "#d1d5db"};
          padding: 8px;
          text-align: left;
        }
        .markdown th {
          background-color: ${darkMode ? "#374151" : "#f3f4f6"};
          font-weight: 600;
        }
        .markdown strong {
          font-weight: 600;
        }
        .mermaid {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
    </div>
  )
}