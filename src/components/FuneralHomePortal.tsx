import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, 
  Users, 
  Search, 
  FileText, 
  CreditCard, 
  Settings, 
  LogOut, 
  Plus, 
  UserPlus,
  Video,
  PenTool,
  ChevronRight, 
  ShieldCheck, 
  Download, 
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileUp,
  History,
  Globe
} from "lucide-react";
import { useFirebase } from "./FirebaseProvider";
import { auth } from "../firebase";

// Mock data for Insurance Search
const MOCK_POLICIES = [
  { id: "POL-123", carrier: "MetLife", beneficiary: "Robert Smith", amount: "$50,000", status: "Active", verified: true },
  { id: "POL-456", carrier: "Prudential", beneficiary: "Sarah Smith", amount: "$100,000", status: "Active", verified: true },
  { id: "POL-789", carrier: "New York Life", beneficiary: "Estate of Jane Doe", amount: "$25,000", status: "Pending", verified: false },
];

export default function FuneralHomePortal() {
  const { profile, user } = useFirebase();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleLogout = async () => {
    window.location.reload();
  };

  const handleInsuranceSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    // Simulate national search
    await new Promise(resolve => setTimeout(resolve, 2500));
    setSearchResults(MOCK_POLICIES);
    setIsSearching(false);
  };

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        activeTab === id 
          ? "bg-stone-900 text-stone-50 shadow-lg shadow-stone-200" 
          : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
      }`}
    >
      <Icon size={20} strokeWidth={activeTab === id ? 2 : 1.5} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stone-200 bg-white hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="text-stone-900" size={24} />
            <span className="font-serif text-2xl tracking-tight text-stone-900">Ditto</span>
          </div>
          <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium px-1">Vendor Portal</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <NavItem id="dashboard" icon={Globe} label="Dashboard" />
          <NavItem id="clients" icon={Users} label="Client Files" />
          <NavItem id="insurance" icon={Search} label="Insurance Search" />
          <NavItem id="meetings" icon={Video} label="Video Meetings" />
          <NavItem id="signatures" icon={PenTool} label="E-Signatures" />
          <NavItem id="billing" icon={CreditCard} label="Billing & Stripe" />
          <NavItem id="staff" icon={UserPlus} label="Staff Management" />
          <NavItem id="settings" icon={Settings} label="Settings" />
        </nav>

        <div className="p-4 border-t border-stone-100">
          <div className="bg-stone-50 rounded-2xl p-4 mb-4">
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Funeral Home</p>
            <p className="text-sm font-medium text-stone-900 truncate">{profile?.firstName} {profile?.lastName}</p>
            <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8 lg:p-12">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-serif text-stone-900 mb-2">Welcome back.</h1>
                    <p className="text-stone-500 font-light">Here's what's happening at your funeral home today.</p>
                  </div>
                  <button className="bg-stone-900 text-stone-50 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-200">
                    <Plus size={20} />
                    New Client File
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <Users size={20} />
                    </div>
                    <p className="text-3xl font-serif text-stone-900">12</p>
                    <p className="text-sm text-stone-400 uppercase tracking-widest mt-1">Active Cases</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                      <Search size={20} />
                    </div>
                    <p className="text-3xl font-serif text-stone-900">8</p>
                    <p className="text-sm text-stone-400 uppercase tracking-widest mt-1">Policy Searches</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                      <Clock size={20} />
                    </div>
                    <p className="text-3xl font-serif text-stone-900">4</p>
                    <p className="text-sm text-stone-400 uppercase tracking-widest mt-1">Pending Payments</p>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-serif text-xl text-stone-900">Recent Activity</h3>
                    <button className="text-sm text-stone-400 hover:text-stone-900 transition-colors">View all</button>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {[
                      { action: "Policy Verified", client: "Smith Family", time: "2 hours ago", icon: ShieldCheck, color: "text-emerald-500" },
                      { action: "Document Uploaded", client: "Johnson Estate", time: "4 hours ago", icon: FileUp, color: "text-blue-500" },
                      { action: "Invoice Sent", client: "Williams Family", time: "1 day ago", icon: DollarSign, color: "text-amber-500" },
                    ].map((item, i) => (
                      <div key={i} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center ${item.color}`}>
                            <item.icon size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{item.action}</p>
                            <p className="text-sm text-stone-500 font-light">{item.client}</p>
                          </div>
                        </div>
                        <span className="text-xs text-stone-400">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "insurance" && (
              <motion.div
                key="insurance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="max-w-2xl">
                  <h1 className="text-4xl font-serif text-stone-900 mb-4">National Insurance Search</h1>
                  <p className="text-stone-500 font-light leading-relaxed">
                    Our proprietary tool scrubs national databases for active life insurance policies and beneficiaries. 
                    Enter the deceased's information to begin the search.
                  </p>
                </div>

                <form onSubmit={handleInsuranceSearch} className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Full Legal Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Jane Doe"
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl focus:ring-2 focus:ring-stone-200 outline-none font-light"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Social Security Number</label>
                      <input 
                        type="password" 
                        required
                        placeholder="XXX-XX-XXXX"
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl focus:ring-2 focus:ring-stone-200 outline-none font-light"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Date of Birth</label>
                      <input 
                        type="date" 
                        required
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl focus:ring-2 focus:ring-stone-200 outline-none font-light"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Last Known Address</label>
                      <input 
                        type="text" 
                        placeholder="123 Main St, Detroit, MI"
                        className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl focus:ring-2 focus:ring-stone-200 outline-none font-light"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Search Scope</label>
                      <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl outline-none font-light">
                        <option>National (All 50 States)</option>
                        <option>Regional (Midwest)</option>
                        <option>State Specific (Michigan)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Database Sources</label>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-xs text-stone-600">
                          <input type="checkbox" defaultChecked className="rounded border-stone-300" /> NAIC
                        </label>
                        <label className="flex items-center gap-2 text-xs text-stone-600">
                          <input type="checkbox" defaultChecked className="rounded border-stone-300" /> SSA Death Master
                        </label>
                        <label className="flex items-center gap-2 text-xs text-stone-600">
                          <input type="checkbox" defaultChecked className="rounded border-stone-300" /> Unclaimed Property
                        </label>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="w-full py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-5 h-5 border-2 border-stone-400 border-t-stone-50 rounded-full animate-spin" />
                        Scrubbing National Databases...
                      </>
                    ) : (
                      <>
                        <Globe size={20} />
                        Initiate National Policy Search
                      </>
                    )}
                  </button>
                </form>

                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">Search Results</h3>
                    <div className="grid gap-4">
                      {searchResults.map((policy) => (
                        <div key={policy.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                              <ShieldCheck size={24} />
                            </div>
                            <div>
                              <p className="font-medium text-stone-900">{policy.carrier} - {policy.id}</p>
                              <p className="text-sm text-stone-500 font-light">Beneficiary: {policy.beneficiary}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-serif text-stone-900">{policy.amount}</p>
                            <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-medium">Verified</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "clients" && (
              <motion.div
                key="clients"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-serif text-stone-900 mb-2">Client Files</h1>
                    <p className="text-stone-500 font-light">Paperless cloud storage for all legal and service documents.</p>
                  </div>
                  <div className="flex gap-3">
                    <button className="bg-white border border-stone-200 text-stone-900 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-stone-50 transition-all">
                      <Download size={20} />
                      Export All
                    </button>
                    <button className="bg-stone-900 text-stone-50 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-200">
                      <Upload size={20} />
                      Upload Batch
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search client files by name or case ID..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-200 outline-none text-sm font-light"
                      />
                    </div>
                    <select className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm font-light outline-none">
                      <option>All Statuses</option>
                      <option>Active</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="px-6 py-4 text-xs font-medium text-stone-400 uppercase tracking-widest">Client Name</th>
                        <th className="px-6 py-4 text-xs font-medium text-stone-400 uppercase tracking-widest">Case ID</th>
                        <th className="px-6 py-4 text-xs font-medium text-stone-400 uppercase tracking-widest">Documents</th>
                        <th className="px-6 py-4 text-xs font-medium text-stone-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-xs font-medium text-stone-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {[
                        { name: "Robert Smith", id: "CASE-9921", docs: 8, status: "Active" },
                        { name: "Sarah Johnson", id: "CASE-8842", docs: 12, status: "Completed" },
                        { name: "Michael Williams", id: "CASE-7731", docs: 5, status: "Active" },
                        { name: "Emily Davis", id: "CASE-6621", docs: 10, status: "Active" },
                      ].map((client, i) => (
                        <tr key={i} className="hover:bg-stone-50 transition-colors group">
                          <td className="px-6 py-4 font-medium text-stone-900">{client.name}</td>
                          <td className="px-6 py-4 text-sm text-stone-500 font-light">{client.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FileText size={16} className="text-stone-300" />
                              <span className="text-sm text-stone-600">{client.docs} files</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full font-medium ${
                              client.status === "Active" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                            }`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-stone-400 hover:text-stone-900 transition-colors">
                              <ChevronRight size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-serif text-stone-900 mb-2">Billing & Stripe</h1>
                    <p className="text-stone-500 font-light">Bill insurance companies directly and manage your revenue.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full border border-emerald-100">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-medium uppercase tracking-widest">Stripe Connected</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                    <h3 className="font-serif text-2xl text-stone-900">Create Insurance Invoice</h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Insurance Carrier</label>
                        <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl outline-none font-light">
                          <option>Select Carrier...</option>
                          <option>MetLife</option>
                          <option>Prudential</option>
                          <option>New York Life</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Policy Number</label>
                        <input type="text" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl outline-none font-light" placeholder="POL-XXXXXX" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">Billing Amount</label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                          <input type="number" className="w-full pl-10 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-xl outline-none font-light" placeholder="0.00" />
                        </div>
                      </div>
                      <button 
                        onClick={() => alert("Invoice submitted to insurance carrier via Stripe Connect.")}
                        className="w-full py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-3"
                      >
                        <CreditCard size={20} />
                        Submit to Stripe
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-stone-900 text-stone-50 p-8 rounded-3xl shadow-xl">
                      <p className="text-xs text-stone-400 uppercase tracking-widest mb-2">Total Revenue (MTD)</p>
                      <h4 className="text-4xl font-serif mb-6">$42,500.00</h4>
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <History size={16} />
                        <span>+12% from last month</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                      <h4 className="font-medium text-stone-900 mb-4">Payout Schedule</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-stone-500 font-light">Next Payout</span>
                          <span className="text-sm font-medium text-stone-900">March 18, 2026</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-stone-500 font-light">Amount</span>
                          <span className="text-sm font-medium text-stone-900">$12,450.00</span>
                        </div>
                        <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-stone-900 w-3/4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "meetings" && (
              <motion.div
                key="meetings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-serif text-stone-900 mb-2">Video Meetings</h1>
                  <p className="text-stone-500 font-light">Schedule and manage virtual consultations with families.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                    <h3 className="text-xl font-serif mb-6">Schedule New Meeting</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-stone-400 uppercase tracking-widest mb-2">Platform</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all">
                            <Video size={20} className="text-blue-600" />
                            <span>Zoom</span>
                          </button>
                          <button className="flex items-center justify-center gap-2 p-4 border border-stone-200 rounded-2xl hover:bg-stone-50 transition-all">
                            <Video size={20} className="text-indigo-600" />
                            <span>Teams</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-stone-500 italic">Integration with Zoom and Microsoft Teams allows for seamless virtual meetings.</p>
                    </div>
                  </div>

                  <div className="bg-stone-900 text-stone-50 p-8 rounded-3xl shadow-xl">
                    <h3 className="text-xl font-serif mb-6">Upcoming Meetings</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">Family Consultation: Johnson</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full uppercase tracking-tighter">Live</span>
                        </div>
                        <p className="text-xs text-stone-400 mb-4">Today at 2:00 PM • Zoom</p>
                        <button className="w-full py-2 bg-white text-stone-900 rounded-xl text-sm font-medium hover:bg-stone-100 transition-all">
                          Join Meeting
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "signatures" && (
              <motion.div
                key="signatures"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-4xl font-serif text-stone-900 mb-2">E-Signatures</h1>
                  <p className="text-stone-500 font-light">Track and manage digital signature requests via DocuSign.</p>
                </div>

                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="px-8 py-4 text-[10px] text-stone-400 uppercase tracking-widest font-medium">Document</th>
                        <th className="px-8 py-4 text-[10px] text-stone-400 uppercase tracking-widest font-medium">Family</th>
                        <th className="px-8 py-4 text-[10px] text-stone-400 uppercase tracking-widest font-medium">Status</th>
                        <th className="px-8 py-4 text-[10px] text-stone-400 uppercase tracking-widest font-medium">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      <tr className="hover:bg-stone-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400">
                              <FileText size={20} />
                            </div>
                            <span className="text-sm font-medium text-stone-900">Cremation Authorization</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm text-stone-500 font-light">Johnson Family</td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-full uppercase tracking-tighter font-medium">Pending</span>
                        </td>
                        <td className="px-8 py-6 text-sm text-stone-400 font-light">2 hours ago</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === "staff" && (
              <motion.div
                key="staff"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-serif text-stone-900 mb-2">Staff Management</h1>
                    <p className="text-stone-500 font-light">Manage your funeral home team and their access levels.</p>
                  </div>
                  <button className="bg-stone-900 text-stone-50 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-stone-800 transition-all">
                    <UserPlus size={20} />
                    Invite Staff
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-stone-100">
                        <th className="px-8 py-6 text-xs font-medium text-stone-400 uppercase tracking-widest">Name</th>
                        <th className="px-8 py-6 text-xs font-medium text-stone-400 uppercase tracking-widest">Role</th>
                        <th className="px-8 py-6 text-xs font-medium text-stone-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-xs font-medium text-stone-400 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      <tr>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-100" />
                            <p className="font-medium text-stone-900">Sarah Jenkins</p>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-stone-600">Director</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">Active</span>
                        </td>
                        <td className="px-8 py-6">
                          <button className="text-stone-400 hover:text-stone-900 transition-colors">Edit</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-stone-100" />
                            <p className="font-medium text-stone-900">Michael Ross</p>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-stone-600">Coordinator</td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs rounded-full">Active</span>
                        </td>
                        <td className="px-8 py-6">
                          <button className="text-stone-400 hover:text-stone-900 transition-colors">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
