"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  const [documentId, setDocumentId] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleFileUpload = async (uploadedFile) => {
    const formData = new FormData()
    formData.append("file", uploadedFile)

    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })
      if (!response.ok) throw new Error("Upload failed")
      const data = await response.json()
      setDocumentId(data.document_id)
      setFile(uploadedFile)
      setError(null)
    } catch (error) {
      console.error("Upload failed:", error)
      setError("Failed to upload file. Please try again.")
    }
  }

  const handleCompress = () => {
    if (file) {
      router.push(`/compress?filename=${encodeURIComponent(file.name)}&size=${file.size}`)
    }
  }

  const handleInteract = () => {
    if (documentId) {
      router.push(`/interact?document_id=${encodeURIComponent(documentId)}`)
    } else {
      alert("Please upload a file first to interact with it.")
    }
  }

  // Animation variants for the card
  const cardVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 20, 
        duration: 0.6 
      }
    }
  }

  // Button animation variants
  const buttonVariants = {
    hover: { 
      scale: 1.05, 
      boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.2)",
      transition: { type: "spring", stiffness: 300 }
    },
    tap: { scale: 0.95 }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-indigo-50 to-purple-100">
      <Navbar />
      <main className="flex-grow">
        <div className="flex flex-col items-center justify-center p-4 sm:p-8">
          <motion.div
            className="w-full max-w-4xl mx-auto overflow-hidden bg-white shadow-2xl rounded-2xl"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ 
              rotateY: 2, 
              rotateX: -2, 
              scale: 1.02, 
              transition: { duration: 0.3 } 
            }}
            style={{ perspective: 1000 }}
          >
            <div className="p-8 sm:p-12">
              <motion.h1 
                className="mb-2 text-3xl font-bold text-center text-gray-900 sm:text-4xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                AI-Powered PDF Tools
              </motion.h1>
              <motion.p 
                className="mb-8 text-center text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Upload your PDF to compress or interact with it using our advanced AI
              </motion.p>

              {error && (
                <motion.p 
                  className="mb-4 text-center text-red-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.p>
              )}

              <AnimatePresence mode="wait">
                {!file ? (
                  <motion.div
                    key="file-upload"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FileUpload onFileUpload={handleFileUpload} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="file-preview"
                    className="space-y-8"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FilePreview file={file} onRemove={() => { setFile(null); setDocumentId(null); setError(null); }} />

                    <div className="flex flex-col justify-center gap-4 sm:flex-row">
                      <motion.button
                        onClick={handleCompress}
                        className="flex items-center justify-center gap-2 px-6 py-3 font-medium text-white rounded-lg shadow-md bg-gradient-to-r from-purple-600 to-indigo-600"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
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
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Compress PDF
                      </motion.button>

                      <motion.button
                        onClick={handleInteract}
                        className="flex items-center justify-center gap-2 px-6 py-3 font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg shadow-md"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
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
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Interact with PDF
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Features />
          <HowItWorks />
          <Pricing />
          <FAQ />
          <CTA />
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}