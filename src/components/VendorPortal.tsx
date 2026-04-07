import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, 
  Search, 
  ShieldCheck, 
  User, 
  Building2, 
  ArrowRight, 
  FileSearch, 
  Users, 
  CheckCircle2,
  AlertCircle,
  ChevronLeft
} from "lucide-react";

interface SearchResult {
  policyNumber: string;
  carrier: string;
  type: string;
  benefitAmount: string;
  beneficiaries: string[];
  status: string;
}

export default function VendorPortal({ onBack }: { onBack: () => void }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchType, setSearchType] = useState<"deceased" | "beneficiary">("deceased");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate API call to government/insurance databases
    setTimeout(() => {
      setResults([
        {
          policyNumber: "POL-88291-X",
          carrier: "MetLife",
          type: "Whole Life",
          benefitAmount: "$250,000",
          beneficiaries: ["Sarah Miller (Spouse)", "Mark Miller (Son)"],
          status: "Active"
        },
        {
          policyNumber: "GRP-4410-B",
          carrier: "Prudential (Employer Group)",
          type: "Term Life",
          benefitAmount: "$100,000",
          beneficiaries: ["Sarah Miller (Spouse)"],
          status: "Active"
        }
      ]);
      setIsSearching(false);
    }, 2000);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Ditto
        </button>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-stone-200 rounded-3xl p-10 shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-stone-900 text-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 size={32} />
            </div>
            <h1 className="text-3xl font-serif text-stone-900 mb-2">Vendor Portal</h1>
            <p className="text-stone-500 font-light">Secure access for funeral home administrators</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Administrator ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                <input 
                  type="text" 
                  required
                  placeholder="Enter unique ID"
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
            >
              Sign in to portal
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400 font-light">
              Access is restricted to authorized funeral service providers. 
              All searches are logged for compliance.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <nav className="bg-white border-b border-stone-200 px-8 h-20 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="font-serif text-2xl tracking-tight text-stone-900 hover:opacity-70 transition-opacity"
          >
            Ditto <span className="text-stone-300 font-sans text-sm font-light">Vendor Portal</span>
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-stone-900">Grace Memorial Chapel</p>
            <p className="text-xs text-stone-400">Admin: Sarah Jenkins</p>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        <div className="mb-12">
          <h2 className="text-3xl font-serif text-stone-900 mb-2">Policy Verification Search</h2>
          <p className="text-stone-500 font-light">Search state and federal databases for insurance policy information.</p>
        </div>

        {/* Search Toggle */}
        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => { setSearchType("deceased"); setResults(null); }}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              searchType === "deceased" ? "bg-stone-900 text-stone-50 shadow-md" : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
            }`}
          >
            <User size={18} />
            Search by Deceased
          </button>
          <button 
            onClick={() => { setSearchType("beneficiary"); setResults(null); }}
            className={`px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              searchType === "beneficiary" ? "bg-stone-900 text-stone-50 shadow-md" : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
            }`}
          >
            <Users size={18} />
            Search by Beneficiary
          </button>
        </div>

        {/* Search Form */}
        <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm mb-12">
          <form onSubmit={handleSearch} className="grid md:grid-cols-2 gap-6">
            {searchType === "deceased" ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Full Legal Name</label>
                  <input type="text" required placeholder="John Doe Miller" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Date of Birth</label>
                  <input type="date" required className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Social Security Number</label>
                  <input type="text" required placeholder="XXX-XX-XXXX" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Last Known Employer</label>
                  <input type="text" required placeholder="Company Name" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Potential Carrier (Optional)</label>
                  <input type="text" placeholder="e.g. MetLife, Prudential" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Beneficiary Full Name</label>
                  <input type="text" required placeholder="Jane Doe Miller" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Beneficiary DOB</label>
                  <input type="date" required className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Beneficiary SSN</label>
                  <input type="text" required placeholder="XXX-XX-XXXX" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Name of Deceased</label>
                  <input type="text" required placeholder="John Doe Miller" className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none" />
                </div>
              </>
            )}
            <div className="md:col-span-2 pt-4">
              <button 
                type="submit"
                disabled={isSearching}
                className="w-full py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-50 rounded-full animate-spin" />
                    Scrubbing databases...
                  </>
                ) : (
                  <>
                    <FileSearch size={20} />
                    Initiate Policy Search
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest">Search Results Found ({results.length})</h3>
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                  <ShieldCheck size={14} />
                  Verified Information
                </div>
              </div>

              <div className="grid gap-6">
                {results.map((res, i) => (
                  <div key={i} className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row justify-between gap-8">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">{res.carrier}</p>
                        <h4 className="text-2xl font-serif text-stone-900">{res.type} Insurance</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Policy Number</p>
                          <p className="font-mono text-stone-900">{res.policyNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Benefit Amount</p>
                          <p className="font-medium text-emerald-700">{res.benefitAmount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-64 space-y-4">
                      <div>
                        <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">Beneficiaries</p>
                        <div className="space-y-2">
                          {res.beneficiaries.map((b, j) => (
                            <div key={j} className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 px-3 py-2 rounded-lg">
                              <CheckCircle2 size={14} className="text-emerald-500" />
                              {b}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Note */}
        <div className="mt-12 p-6 bg-stone-100 rounded-2xl flex gap-4">
          <AlertCircle className="text-stone-400 shrink-0" size={20} />
          <p className="text-xs text-stone-500 font-light leading-relaxed">
            This search tool connects to the National Association of Insurance Commissioners (NAIC) Life Insurance Policy Locator Service and state-level unclaimed property databases. Results are verified against Social Security Administration death records.
          </p>
        </div>
      </main>
    </div>
  );
}
