"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Navbar from "../components/navbar"
import Footer from "../components/footer"

export default function CompressPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionComplete, setCompressionComplete] = useState(false)
  const [progress, setProgress] = useState(0)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)

  const filename = searchParams.get("filename")
  const size = searchParams.get("size")

  useEffect(() => {
    if (!filename || !size) {
      router.push("/")
    } else {
      setOriginalSize(Number.parseInt(size))
    }
  }, [filename, size, router])

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleCompress = () => {
    setIsCompressing(true)

    // Simulate compression progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 5
      setProgress(currentProgress)

      if (currentProgress >= 100) {
        clearInterval(interval)
        setIsCompressing(false)
        setCompressionComplete(true)

        // Simulate compressed file size (30-70% of original)
        const compressionRatio = 0.3 + Math.random() * 0.4
        setCompressedSize(Math.floor(originalSize * compressionRatio))
      }
    }, 200)
  }

  const handleDownload = () => {
    // In a real app, this would download the actual compressed file
    alert("In a real application, this would download your compressed PDF file.")
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-indigo-50">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 sm:p-12">
            <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Compress PDF</h1>

            <div className="bg-indigo-50 rounded-lg p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-12 flex items-center justify-center bg-indigo-100 rounded">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-indigo-600"
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
                <div>
                  <p className="font-medium text-gray-900 truncate max-w-xs sm:max-w-sm md:max-w-md">{filename}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(originalSize)}</p>
                </div>
              </div>

              {compressionComplete && (
                <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Compression Results:</span>
                    <span className="text-sm font-medium text-green-600">
                      {Math.round((1 - compressedSize / originalSize) * 100)}% Reduced
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Original: {formatFileSize(originalSize)}</span>
                    <span className="text-sm text-gray-500">Compressed: {formatFileSize(compressedSize)}</span>
                  </div>
                </div>
              )}
            </div>

            {isCompressing && (
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Compressing...</span>
                  <span className="text-sm font-medium text-gray-700">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isCompressing && !compressionComplete && (
                <button
                  onClick={handleCompress}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all"
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
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                  Compress Now
                </button>
              )}

              {compressionComplete && (
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg shadow-md hover:from-purple-700 hover:to-indigo-700 transition-all"
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
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Compressed PDF
                </button>
              )}

              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg shadow-md border border-indigo-200 hover:bg-indigo-50 transition-all"
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
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
