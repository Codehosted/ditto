import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Check, 
  Shield, 
  FileText, 
  Users, 
  Truck, 
  CreditCard, 
  Lock,
  ArrowRight
} from "lucide-react";

const TIERS = [
  {
    id: "vault",
    name: "Document Vault",
    price: "99.00",
    description: "Secure housing for essential documents and memories.",
    features: [
      "Encrypted document storage",
      "Role-based family sharing",
      "Digital legacy planning",
      "24/7 access for retrieval"
    ],
    buttonText: "Start with Vault",
    highlight: false
  },
  {
    id: "coordination",
    name: "Essential Coordination",
    price: "349.00",
    description: "Guided support for the first critical days.",
    features: [
      "Everything in Document Vault",
      "Guided task checklists",
      "Vendor coordination tools",
      "Obituary templates & drafting",
      "Basic estate guidance"
    ],
    buttonText: "Choose Essential",
    highlight: true
  },
  {
    id: "complete",
    name: "Complete Coordination",
    price: "749.00",
    description: "Full-service logistics management for your family.",
    features: [
      "Everything in Essential",
      "Direct vendor payment portal",
      "Policy verification search",
      "Priority family sync tools",
      "Professional service directory",
      "Dedicated concierge support"
    ],
    buttonText: "Get Full Support",
    highlight: false
  }
];

export default function Subscription() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = (tierId: string) => {
    setLoading(tierId);
    // Simulate Stripe Checkout
    setTimeout(() => {
      alert("Redirecting to Stripe Checkout for " + tierId);
      setLoading(null);
    }, 1500);
  };

  return (
    <section className="py-32 bg-stone-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-serif text-stone-900 mb-4">Choose the support you need.</h2>
          <p className="text-stone-500 font-light max-w-2xl mx-auto">
            Transparent pricing to help you navigate this journey. No hidden fees, just clear support when it matters most.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {TIERS.map((tier) => (
            <motion.div
              key={tier.id}
              whileHover={{ y: -5 }}
              className={`relative bg-white border rounded-3xl p-8 flex flex-col ${
                tier.highlight ? "border-stone-900 shadow-xl ring-1 ring-stone-900" : "border-stone-200 shadow-sm"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-stone-900 text-stone-50 text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                  Most Recommended
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-serif text-stone-900 mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-serif text-stone-900">${tier.price}</span>
                  <span className="text-stone-400 text-sm font-light">one-time</span>
                </div>
                <p className="mt-4 text-sm text-stone-500 font-light leading-relaxed">{tier.description}</p>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                      <Check size={10} className="text-stone-900" />
                    </div>
                    <span className="text-sm text-stone-600 font-light">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={loading !== null}
                className={`w-full py-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  tier.highlight 
                    ? "bg-stone-900 text-stone-50 hover:bg-stone-800" 
                    : "bg-stone-100 text-stone-900 hover:bg-stone-200"
                } disabled:opacity-50`}
              >
                {loading === tier.id ? (
                  <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-900 rounded-full animate-spin" />
                ) : (
                  <>
                    {tier.buttonText}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Security & Trust */}
        <div className="mt-20 flex flex-wrap justify-center gap-12 items-center opacity-50 grayscale">
          <div className="flex items-center gap-2 text-stone-900 font-bold">
            <CreditCard size={20} />
            STRIPE
          </div>
          <div className="flex items-center gap-2 text-stone-900 font-bold">
            <Shield size={20} />
            SECURE PAY
          </div>
          <div className="flex items-center gap-2 text-stone-900 font-bold">
            <Lock size={20} />
            ENCRYPTED
          </div>
        </div>
      </div>
    </section>
  );
}
