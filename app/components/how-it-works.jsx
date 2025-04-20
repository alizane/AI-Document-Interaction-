import { Upload, Cpu, Download } from "lucide-react"

const steps = [
  {
    id: "01",
    name: "Upload Your Documents",
    description: "Drag and drop your files or select them from cloud storage. We support PDF, DOCX, PPTX, and more.",
    icon: Upload,
  },
  {
    id: "02",
    name: "AI Processing",
    description:
      "Our AI analyzes your documents, identifying key information, redundancies, and opportunities for compression.",
    icon: Cpu,
  },
  {
    id: "03",
    name: "Download Compressed Files",
    description:
      "Get your compressed documents instantly. Compare before and after to see the amazing difference in file size.",
    icon: Download,
  },
]

export default function HowItWorks() {
  return (
    <div id="how-it-works" className="bg-gradient-to-b from-white to-indigo-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">How It Works</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple, powerful document compression
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Our process is designed to be intuitive and efficient, saving you time and storage space.
          </p>
        </div>

        <div className="mt-16">
          <div className="space-y-16">
            {steps.map((step, stepIdx) => (
              <div key={step.id} className="flex flex-col lg:flex-row">
                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xl font-bold">
                  {step.id}
                </div>
                <div className="mt-6 lg:mt-0 lg:ml-8">
                  <div className="flex items-center">
                    <step.icon className="h-8 w-8 text-indigo-600" aria-hidden="true" />
                    <h3 className="ml-3 text-xl leading-6 font-medium text-gray-900">{step.name}</h3>
                  </div>
                  <p className="mt-2 text-base text-gray-500">{step.description}</p>

                  {stepIdx !== steps.length - 1 && (
                    <div className="hidden lg:block absolute left-8 mt-8 ml-8 h-24 w-0.5 bg-gradient-to-b from-indigo-600 to-purple-600"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 bg-white rounded-2xl shadow-xl overflow-hidden lg:grid lg:grid-cols-2 lg:gap-4">
          <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
            <div className="lg:self-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                <span className="block">Ready to try it out?</span>
                <span className="block text-indigo-600">Start compressing today.</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-gray-500">
                Experience the power of AI document compression with our free trial. No credit card required.
              </p>
              <a
                href="#"
                className="mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 border border-transparent rounded-md shadow px-5 py-3 inline-flex items-center text-base font-medium text-white hover:from-purple-700 hover:to-indigo-700"
              >
                Start free trial
              </a>
            </div>
          </div>
          <div className="relative -mt-6 aspect-w-5 aspect-h-3 md:aspect-w-2 md:aspect-h-1">
            <div className="transform translate-x-6 translate-y-6 rounded-md object-cover object-left-top sm:translate-x-16 lg:translate-y-20 bg-gradient-to-r from-purple-200 to-indigo-200 h-full w-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
