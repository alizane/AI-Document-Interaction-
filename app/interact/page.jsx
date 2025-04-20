"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "../components/navbar"
import Footer from "../components/footer"

export default function InteractPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showSidePanel, setShowSidePanel] = useState(true)
  const messagesEndRef = useRef(null)

  const filename = searchParams.get("filename")
  const size = searchParams.get("size")

  useEffect(() => {
    if (!filename || !size) {
      router.push("/")
    } else {
      // Add initial message
      setMessages([
        {
          role: "system",
          content: `I've analyzed your PDF "${filename}". What would you like to know about it?`,
        },
      ])
    }
  }, [filename, size, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()

    if (!input.trim() && !isRecording) return

    const userMessage = isRecording ? "Voice transcription: Tell me what this PDF is about." : input

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setInput("")
    setIsLoading(true)

    // Simulate AI response delay
    setTimeout(() => {
      const responses = [
        "This PDF contains a research paper on artificial intelligence and its applications in document processing. The main focus is on compression algorithms that preserve semantic meaning.",
        "Based on my analysis, this document outlines the technical specifications for a new compression algorithm that can reduce PDF sizes by up to 80% while maintaining visual fidelity.",
        "The PDF you uploaded is a business proposal for implementing AI-powered document management systems. It includes cost estimates, implementation timelines, and expected ROI.",
        "This appears to be a legal document with several sections on data privacy and information handling. Would you like me to summarize a specific section?",
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      setMessages((prev) => [...prev, { role: "system", content: randomResponse }])
      setIsLoading(false)
    }, 1500)
  }

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording and process
      setIsRecording(false)
      handleSendMessage()
    } else {
      // Start recording
      setIsRecording(true)
      // In a real app, this would activate the microphone
      setTimeout(() => {
        setIsRecording(false)
        setInput("Voice transcription: Tell me what this PDF is about.")
        handleSendMessage()
      }, 2000)
    }
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-indigo-50">
      <Navbar />
      <main className="flex-grow flex flex-col p-4 sm:p-8">
        <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
          <div className={`flex-grow ${showSidePanel ? "lg:w-2/3" : "w-full"}`}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-10 flex items-center justify-center bg-indigo-100 rounded">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-indigo-600"
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
                    <p className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-sm">{filename}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSidePanel(!showSidePanel)}
                    className="p-2 text-gray-500 hover:text-indigo-600 lg:hidden"
                  >
                    {showSidePanel ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
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
                        className="h-5 w-5"
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
                  <button onClick={handleBack} className="p-2 text-gray-500 hover:text-indigo-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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

              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 text-gray-800">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-2 rounded-full ${
                      isRecording
                        ? "bg-red-100 text-red-600 animate-pulse"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="submit" className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
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
              </div>
            </div>
          </div>

          {showSidePanel && (
            <div className="border-t lg:border-t-0 lg:border-l lg:w-1/3">
              <div className="p-4 border-b">
                <h3 className="font-medium text-gray-900">Document Content</h3>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(100vh-16rem)]">
                <div className="prose prose-sm max-w-none">
                  <h4 className="text-sm font-medium text-gray-900">Extracted Text</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit
                    arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut
                    in nulla enim.
                  </p>

                  <h4 className="text-sm font-medium text-gray-900 mt-4">Key Points</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-600 mt-2">
                    <li>The document discusses AI-powered compression techniques</li>
                    <li>Compression ratios of up to 80% are mentioned</li>
                    <li>There are references to maintaining visual fidelity</li>
                    <li>Several algorithms are compared in the results section</li>
                  </ul>

                  <h4 className="text-sm font-medium text-gray-900 mt-4">Tables</h4>
                  <div className="mt-2 border rounded overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Algorithm
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Compression Ratio
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quality Score
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-3 py-2 whitespace-nowrap">Standard</td>
                          <td className="px-3 py-2 whitespace-nowrap">45%</td>
                          <td className="px-3 py-2 whitespace-nowrap">7.2/10</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 whitespace-nowrap">Enhanced</td>
                          <td className="px-3 py-2 whitespace-nowrap">68%</td>
                          <td className="px-3 py-2 whitespace-nowrap">8.5/10</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 whitespace-nowrap">AI-Powered</td>
                          <td className="px-3 py-2 whitespace-nowrap">82%</td>
                          <td className="px-3 py-2 whitespace-nowrap">9.3/10</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
