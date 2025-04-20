"use client"

import { useState, useRef } from "react"
import { FileText } from "lucide-react"

export default function FileUpload({ onFileUpload }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateFile = (file) => {
    // Check if file is a PDF
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed")
      return false
    }

    // Check file size (limit to 10MB for example)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return false
    }

    setError("")
    return true
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) {
      onFileUpload(file)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && validateFile(file)) {
      onFileUpload(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current.click()
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" />

      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
          <FileText className="h-8 w-8 text-indigo-600" />
        </div>
        <div>
          <p className="text-lg font-medium text-gray-700">Drag & drop your PDF here</p>
          <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  )
}
