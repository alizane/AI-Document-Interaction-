"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

const faqs = [
  {
    question: "How does AI document compression work?",
    answer:
      "Our AI analyzes the content of your documents to understand what's important. It then applies intelligent compression techniques that preserve the essential information while reducing file size. This is different from traditional compression which treats all data equally.",
  },
  {
    question: "What types of documents can I compress?",
    answer:
      "We support a wide range of document formats including PDF, DOCX, PPTX, XLSX, TXT, and more. Our AI is particularly effective with text-heavy documents, but can also optimize documents containing images.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use end-to-end encryption for all document transfers. Your documents are processed in isolated environments and automatically deleted after compression is complete. We never store the content of your documents.",
  },
  {
    question: "Will compression affect document quality?",
    answer:
      "Our AI is designed to maintain the quality of important content. While some visual elements might be optimized, the key information and readability of your documents will remain intact. You can always compare before and after to ensure you're satisfied.",
  },
  {
    question: "Do you offer an API for integration?",
    answer:
      "Yes, we provide a comprehensive API for Pro and Enterprise customers. This allows you to integrate our compression technology directly into your workflows, document management systems, or applications.",
  },
  {
    question: "What if I need to compress more documents than my plan allows?",
    answer:
      "You can upgrade your plan at any time to increase your document allowance. For temporary needs, we also offer one-time packages that you can purchase without changing your subscription.",
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  return (
    <div id="faq" className="bg-indigo-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">Frequently asked questions</h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="pt-6">
                <dt className="text-lg">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="text-left w-full flex justify-between items-start text-gray-900 focus:outline-none"
                  >
                    <span className="font-medium">{faq.question}</span>
                    <span className="ml-6 h-7 flex items-center">
                      {openIndex === index ? (
                        <ChevronUp className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                </dt>
                <dd className={`mt-2 pr-12 ${openIndex === index ? "block" : "hidden"}`}>
                  <p className="text-base text-gray-500">{faq.answer}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
