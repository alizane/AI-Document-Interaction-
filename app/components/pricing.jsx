import { Check } from "lucide-react"

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying out our service",
    features: ["Up to 10 documents per month", "Max 10MB per file", "Basic compression algorithm", "Email support"],
    cta: "Start for free",
    mostPopular: false,
  },
  {
    name: "Pro",
    price: "$19",
    description: "For professionals and small teams",
    features: [
      "Up to 100 documents per month",
      "Max 50MB per file",
      "Advanced AI compression",
      "Priority email support",
      "Detailed analytics",
      "API access",
    ],
    cta: "Start free trial",
    mostPopular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations with advanced needs",
    features: [
      "Unlimited documents",
      "Max 1GB per file",
      "Custom AI training for your documents",
      "Dedicated account manager",
      "Advanced security features",
      "Custom integrations",
      "SLA guarantees",
    ],
    cta: "Contact sales",
    mostPopular: false,
  },
]

export default function Pricing() {
  return (
    <div id="pricing" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase text-center">Pricing</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl text-center">
            Plans for teams of all sizes
          </p>
          <p className="mt-5 text-xl text-gray-500 max-w-3xl mx-auto text-center">
            Choose the perfect plan for your needs. All plans include our core AI compression technology.
          </p>
        </div>
        <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col ${tier.mostPopular ? "ring-2 ring-indigo-600" : ""}`}
            >
              {tier.mostPopular && (
                <div className="absolute top-0 inset-x-0 transform translate-y-px">
                  <div className="flex justify-center transform -translate-y-1/2">
                    <span className="inline-flex rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold tracking-wider uppercase text-white">
                      Most popular
                    </span>
                  </div>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                  {tier.name !== "Enterprise" && <span className="ml-1 text-xl font-semibold">/month</span>}
                </p>
                <p className="mt-6 text-gray-500">{tier.description}</p>

                <ul role="list" className="mt-6 space-y-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex">
                      <Check className="flex-shrink-0 w-6 h-6 text-green-500" aria-hidden="true" />
                      <span className="ml-3 text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#"
                className={`mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium ${
                  tier.mostPopular
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
