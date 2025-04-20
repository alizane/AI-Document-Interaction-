"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import FileUpload from "./components/file-upload"
import FilePreview from "./components/file-preview"
import Navbar from "./components/navbar"
import Footer from "./components/footer"
import Features from "./components/features"
import HowItWorks from "./components/how-it-works"
import Pricing from "./components/pricing"
import FAQ from "./components/faq"
import CTA from "./components/cta"

export default function Home() {
  const [file, setFile] = useState(null)
  const router = useRouter()

  const handleFileUpload = (uploadedFile) => {
    setFile(uploadedFile)
  }

  const handleCompress = () => {
    if (file) {
      router.push(`/compress?filename=${encodeURIComponent(file.name)}&size=${file.size}`)
    }
  }

  const handleInteract = () => {
    if (file) {
      router.push(`/interact?filename=${encodeURIComponent(file.name)}&size=${file.size}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-indigo-50">
      <Navbar />
      <main className="flex-grow">
        <div className="flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 sm:p-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-gray-900">AI-Powered PDF Tools</h1>
              <p className="text-center text-gray-600 mb-8">
                Upload your PDF to compress or interact with it using our advanced AI
              </p>

              {!file ? (
                <FileUpload onFileUpload={handleFileUpload} />
              ) : (
                <div className="space-y-8">
                  <FilePreview file={file} onRemove={() => setFile(null)} />

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Compress PDF
                    </button>

                    <button
                      onClick={handleInteract}
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
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Interact with PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Old homepage sections */}
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
