import { ArrowRight } from "lucide-react"

export default function Hero() {
  return (
    <div className="relative pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-purple-100/40 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">AI-Powered</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
              Document Compression
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Reduce file sizes by up to 90% without losing important information. Our AI understands your documents and
            keeps what matters.
          </p>
          <div className="mt-10 max-w-md mx-auto sm:flex sm:justify-center md:mt-12">
            <div className="rounded-md shadow">
              <a
                href="#"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 md:py-4 md:text-lg md:px-10"
              >
                Try for free
              </a>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <a
                href="#how-it-works"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                How it works
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-gradient-to-r from-indigo-50 to-white text-sm text-gray-500">
              Trusted by innovative companies
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-1 flex justify-center items-center">
            <div className="h-12 text-gray-400">Company 1</div>
          </div>
          <div className="col-span-1 flex justify-center items-center">
            <div className="h-12 text-gray-400">Company 2</div>
          </div>
          <div className="col-span-1 flex justify-center items-center">
            <div className="h-12 text-gray-400">Company 3</div>
          </div>
          <div className="col-span-1 flex justify-center items-center">
            <div className="h-12 text-gray-400">Company 4</div>
          </div>
        </div>
      </div>
    </div>
  )
}
