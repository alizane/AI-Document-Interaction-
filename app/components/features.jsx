import { FileText, Zap, Lock, BarChart4 } from "lucide-react"

const features = [
  {
    name: "Intelligent Compression",
    description:
      "Our AI analyzes document content to identify and preserve essential information while reducing file size by up to 90%.",
    icon: FileText,
  },
  {
    name: "Lightning Fast",
    description:
      "Process hundreds of documents in minutes. Our optimized algorithms work at scale for enterprise needs.",
    icon: Zap,
  },
  {
    name: "Bank-Level Security",
    description:
      "Your documents are encrypted end-to-end. We never store your content and automatically delete all processed files.",
    icon: Lock,
  },
  {
    name: "Detailed Analytics",
    description:
      "Track compression rates, processing times, and storage saved across your organization with our analytics dashboard.",
    icon: BarChart4,
  },
]

export default function Features() {
  return (
    <div id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            A better way to manage documents
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Our AI-powered compression technology understands your documents like a human would, but works at machine
            scale.
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
