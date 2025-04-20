export default function CTA() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl shadow-xl overflow-hidden">
          <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
            <div className="lg:self-center lg:max-w-3xl">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Ready to save space and time?</span>
                <span className="block">Start compressing your documents today.</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-indigo-100">
                Join thousands of professionals and companies who are already using our AI-powered document compression
                to optimize their workflows.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row">
                <a
                  href="#"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50"
                >
                  Get started for free
                </a>
                <a
                  href="#"
                  className="mt-3 sm:mt-0 sm:ml-3 inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-800 bg-opacity-60 hover:bg-opacity-70"
                >
                  Contact sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
