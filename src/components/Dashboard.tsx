import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Calendar, 
  FileText, 
  Plus, 
  Search, 
  Settings, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FilePlus,
  UserPlus,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Truck,
  Heart,
  Video,
  PenTool,
  Users,
  Hotel,
  LogOut,
  Map,
  BookOpen
} from "lucide-react";
import DocumentVault from "./DocumentVault";
import VendorCoordination from "./VendorCoordination";
import FamilyManagement from "./FamilyManagement";
import FamilySync from "./FamilySync";
import HotelFinder from "./HotelFinder";
import NextStepsView from "./NextStepsView";
import DocumentMap from "./DocumentMap";
import Obituary from "./Obituary";
import { useFirebase } from "./FirebaseProvider";
import { auth, signOut } from "../firebase";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";

const Section = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <section className={`space-y-4 ${className}`}>
    <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">{title}</h3>
    {children}
  </section>
);

const DashboardCard = ({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={`bg-white border border-stone-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}
  >
    {children}
  </div>
);

export default function Dashboard({ onLogoClick }: { onLogoClick?: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { user, profile, familyData, tasks, documents } = useFirebase();

  // Unified timeline schema stub
  const timelineEvents = [
    {
      id: "1",
      type: "meeting",
      title: "Funeral Arrangement Meeting",
      description: "Zoom consultation with Director Smith",
      date: new Date(),
      status: "upcoming",
      icon: Video
    },
    {
      id: "2",
      type: "document",
      title: "Cremation Authorization",
      description: "Signature required from next of kin",
      date: new Date(Date.now() + 86400000), // tomorrow
      status: "pending",
      icon: PenTool
    },
    {
      id: "3",
      type: "task",
      title: "Draft Obituary",
      description: "Review templates and start drafting",
      date: new Date(Date.now() + 86400000 * 2),
      status: "pending",
      icon: BookOpen
    },
    {
      id: "4",
      type: "milestone",
      title: "Service Date",
      description: "Memorial service at Springfield Chapel",
      date: new Date(Date.now() + 86400000 * 7),
      status: "upcoming",
      icon: Calendar
    }
  ];

  const handleLogout = async () => {
    if (onLogoClick) onLogoClick();
  };

  const firstName = profile?.firstName || user?.displayName?.split(" ")[0] || "there";
  const lovedOneName = familyData?.deceased?.fullName || "your loved one";
  const accountNumber = profile?.accountNumber || "DITTO-7721X";

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-stone-200 bg-white hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <button 
            onClick={onLogoClick}
            className="font-serif text-2xl tracking-tight text-stone-900 hover:opacity-70 transition-opacity"
          >
            Ditto
          </button>
          <div className="mt-2 px-1">
            <span className="text-[10px] text-stone-400 uppercase tracking-widest font-medium">Account # {accountNumber}</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: "overview", icon: Clock, label: "Overview" },
            { id: "next-steps", icon: Map, label: "Next Steps Guide" },
            { id: "timeline", icon: Calendar, label: "Timeline" },
            { id: "documents", icon: FileText, label: "Documents" },
            { id: "obituary", icon: BookOpen, label: "Obituary" },
            { id: "meetings", icon: Video, label: "Meetings" },
            { id: "signatures", icon: PenTool, label: "Signatures" },
            { id: "vendors", icon: Truck, label: "Vendors" },
            { id: "travel", icon: Hotel, label: "Travel" },
            { id: "family", icon: Users, label: "Family Sync" },
            { id: "settings", icon: Settings, label: "Settings" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                activeTab === item.id 
                  ? "bg-stone-100 text-stone-900 font-medium" 
                  : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              <item.icon size={18} strokeWidth={activeTab === item.id ? 2 : 1.5} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-stone-100">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors">
            <Search size={18} />
            Search everything
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-stone-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-serif text-stone-900">
              {activeTab === "overview" ? `Good morning, ${firstName}` : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <span className="text-xs text-stone-400 font-light bg-stone-100 px-2 py-1 rounded-full">
              Planning for: {lovedOneName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-stone-400 rounded-full border-2 border-white" />
            </button>
            <div className="w-8 h-8 rounded-full bg-stone-200 border border-stone-300 overflow-hidden">
              <img src={user?.photoURL || "https://picsum.photos/seed/user/100/100"} alt="Profile" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "overview" ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                {/* What Needs Attention */}
                <Section title="What needs attention">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <DashboardCard className="border-l-4 border-l-stone-300 bg-stone-50/50">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-stone-500 shadow-sm">
                          <Heart size={20} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-stone-900">Set Burial Preferences</h4>
                          <p className="text-sm text-stone-600 font-light">
                            Help us understand your desired arrangements.
                          </p>
                          <button 
                            className="text-sm text-stone-900 font-medium hover:underline pt-2 block"
                          >
                            Add preferences
                          </button>
                        </div>
                      </div>
                    </DashboardCard>
                    <DashboardCard className="border-l-4 border-l-stone-300 bg-stone-50/50">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-stone-500 shadow-sm">
                          <AlertCircle size={20} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-stone-900">Finalize service location</h4>
                          <p className="text-sm text-stone-600 font-light">
                            Confirming the venue will help us notify guests.
                          </p>
                          <button 
                            onClick={() => setActiveTab("vendors")}
                            className="text-xs font-medium text-stone-900 flex items-center gap-1 pt-2 hover:opacity-70 transition-opacity"
                          >
                            Resolve now <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </DashboardCard>
                    
                    <DashboardCard className="border-l-4 border-l-emerald-200 bg-emerald-50/10">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                          <Search size={20} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-stone-900">Insurance Scrubbing</h4>
                          <p className="text-sm text-stone-600 font-light">
                            Our tool is currently scrubbing for policies nationally.
                          </p>
                          <div className="flex items-center gap-2 pt-2">
                            <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-emerald-500"
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                              />
                            </div>
                            <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-widest">Active</span>
                          </div>
                        </div>
                      </div>
                    </DashboardCard>

                    <DashboardCard className="border-l-4 border-l-stone-200">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-stone-500 shadow-sm">
                          <FilePlus size={20} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-stone-900">Upload documents</h4>
                          <p className="text-sm text-stone-600 font-light">
                            We're missing 3 required legal documents.
                          </p>
                          <button 
                            onClick={() => setActiveTab("documents")}
                            className="text-xs font-medium text-stone-900 flex items-center gap-1 pt-2 hover:opacity-70 transition-opacity"
                          >
                            Upload files <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </DashboardCard>
                  </div>
                </Section>

                <div className="grid lg:grid-cols-3 gap-12">
                  {/* Left Column: Timeline & Activity */}
                  <div className="lg:col-span-2 space-y-12">
                    <Section title="Required Document Locations">
                      <DocumentMap />
                    </Section>

                    <Section title="Timeline">
                      <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-stone-200">
                        {timelineEvents.slice(0, 3).map((event) => {
                          const Icon = event.icon;
                          return (
                            <div key={event.id} className="relative pl-12">
                              <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                event.status === 'completed' ? 'bg-stone-900' : 'bg-stone-300'
                              }`} />
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-sm font-medium ${event.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                                    {event.title}
                                  </h4>
                                  <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                                    {format(event.date, "MMM d")}
                                  </span>
                                </div>
                                <p className="text-sm text-stone-500 font-light">{event.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Section>

                    <Section title="Activity Log">
                      <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden">
                        {[
                          { text: "Ditto contacted Social Security Administration", time: "2 hours ago" },
                          { text: "Sarah uploaded 'Last Will and Testament.pdf'", time: "5 hours ago" },
                          { text: "Mark Miller joined the family space", time: "Yesterday" },
                          { text: "Ditto verified insurance policy #4492", time: "2 days ago" },
                        ].map((log, i) => (
                          <div key={i} className="px-6 py-4 flex items-center justify-between group hover:bg-stone-50 transition-colors">
                            <span className="text-sm text-stone-600 font-light">{log.text}</span>
                            <span className="text-xs text-stone-400">{log.time}</span>
                          </div>
                        ))}
                        <button className="w-full py-3 text-xs text-stone-400 hover:text-stone-900 transition-colors font-medium">
                          View full history
                        </button>
                      </div>
                    </Section>
                  </div>

                  {/* Right Column: Family Sync & Next Steps */}
                  <div className="space-y-12">
                    <Section title="Family Sync">
                      <DashboardCard 
                        onClick={() => setActiveTab("family")}
                        className="p-6 bg-stone-50 border-stone-200 hover:border-stone-900 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center">
                              <Users size={20} />
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-stone-900">Coordination Status</h5>
                              <p className="text-[10px] text-stone-400 uppercase tracking-widest">3 Members Active</p>
                            </div>
                          </div>
                          <ArrowRight size={16} className="text-stone-300 group-hover:text-stone-900 transition-colors" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-stone-500">Burden Balance</span>
                            <span className="text-stone-900 font-medium">Optimal</span>
                          </div>
                          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-stone-900 w-[85%]" />
                          </div>
                          <p className="text-[10px] text-stone-400 font-light italic">
                            Planning is 85% distributed across the family circle.
                          </p>
                        </div>
                      </DashboardCard>
                    </Section>

                    <Section title="Suggested next steps">
                      <div className="space-y-4">
                        <DashboardCard className="p-4 bg-stone-900 text-stone-50 border-none">
                          <h5 className="text-sm font-medium mb-2">Invite family members</h5>
                          <p className="text-xs text-stone-300 font-light leading-relaxed mb-4">
                            Planning is easier when shared. Invite siblings or relatives to help coordinate.
                          </p>
                          <button className="w-full py-2 bg-white text-stone-900 rounded-lg text-xs font-medium hover:bg-stone-100 transition-colors">
                            Send invites
                          </button>
                        </DashboardCard>

                        <DashboardCard className="p-4">
                          <h5 className="text-sm font-medium text-stone-900 mb-2">Draft obituary</h5>
                          <p className="text-sm text-stone-600 font-light leading-relaxed mb-4">
                            We have templates to help you honor their memory with the right words.
                          </p>
                          <button className="w-full py-2 border border-stone-200 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors">
                            Start drafting
                          </button>
                        </DashboardCard>
                      </div>
                    </Section>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === "timeline" ? (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-5xl mx-auto"
              >
                <header className="space-y-4">
                  <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Timeline</h1>
                  <p className="text-lg text-stone-500 font-light max-w-2xl">
                    A chronological view of all upcoming tasks, meetings, and milestones.
                  </p>
                </header>
                <Section title="Upcoming Events">
                  <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-stone-200">
                    {timelineEvents.map((event) => {
                      const Icon = event.icon;
                      return (
                        <div key={event.id} className="relative pl-12">
                          <div className={`absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                            event.status === 'completed' ? 'bg-stone-900' : 'bg-stone-300'
                          }`} />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${event.status === 'completed' ? 'text-stone-400 line-through' : 'text-stone-900'}`}>
                                {event.title}
                              </h4>
                              <span className="text-[10px] text-stone-400 uppercase tracking-wider">
                                {format(event.date, "MMM d, yyyy")}
                              </span>
                            </div>
                            <p className="text-sm text-stone-500 font-light">{event.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </motion.div>
            ) : activeTab === "documents" ? (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DocumentVault />
              </motion.div>
            ) : activeTab === "meetings" ? (
              <motion.div
                key="meetings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-5xl mx-auto"
              >
                <header className="space-y-4">
                  <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Your Meetings</h1>
                  <p className="text-lg text-stone-500 font-light max-w-2xl">
                    Connect with your funeral director and family members via video consultation.
                  </p>
                </header>
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <Section title="Upcoming Consultations">
                      <DashboardCard className="bg-stone-900 text-stone-50 border-none">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                          <div>
                            <p className="text-lg font-medium mb-1">Funeral Arrangement Meeting</p>
                            <p className="text-sm text-stone-400 font-light">Today at 2:00 PM • Zoom Meeting</p>
                          </div>
                          <button className="px-8 py-3 bg-white text-stone-900 rounded-xl font-medium hover:bg-stone-100 transition-all">
                            Join Call
                          </button>
                        </div>
                      </DashboardCard>
                    </Section>
                  </div>
                  <div className="space-y-8">
                    <Section title="Calendar">
                      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex justify-center">
                        <DayPicker 
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="font-sans"
                        />
                      </div>
                    </Section>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === "signatures" ? (
              <motion.div
                key="signatures"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-5xl mx-auto"
              >
                <header className="space-y-4">
                  <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Signatures Needed</h1>
                  <p className="text-lg text-stone-500 font-light max-w-2xl">
                    Review and sign important documents securely via DocuSign.
                  </p>
                </header>
                <Section title="Pending Requests">
                  <DashboardCard>
                    <div className="flex items-center gap-4 p-4 border border-stone-100 rounded-2xl hover:bg-stone-50 transition-all cursor-pointer">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <PenTool size={24} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-stone-900">Cremation Authorization Form</p>
                        <p className="text-xs text-stone-400">Requested by Director Smith • 2 hours ago</p>
                      </div>
                      <button className="px-6 py-2 bg-stone-900 text-stone-50 rounded-lg text-sm font-medium">
                        Review & Sign
                      </button>
                    </div>
                  </DashboardCard>
                </Section>
              </motion.div>
            ) : activeTab === "vendors" ? (
              <motion.div
                key="vendors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <VendorCoordination />
              </motion.div>
            ) : activeTab === "travel" ? (
              <motion.div
                key="travel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <HotelFinder />
              </motion.div>
            ) : activeTab === "family" ? (
              <motion.div
                key="family"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <FamilySync />
              </motion.div>
            ) : activeTab === "obituary" ? (
              <motion.div
                key="obituary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Obituary />
              </motion.div>
            ) : activeTab === "next-steps" ? (
              <motion.div
                key="next-steps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <NextStepsView />
              </motion.div>
            ) : activeTab === "settings" ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8 max-w-5xl mx-auto"
              >
                <header className="space-y-4">
                  <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Settings</h1>
                  <p className="text-lg text-stone-500 font-light max-w-2xl">
                    Manage your account, family preferences, and notification settings.
                  </p>
                </header>
                <div className="grid md:grid-cols-2 gap-8">
                  <Section title="Account Settings">
                    <DashboardCard className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                        <div>
                          <p className="text-sm font-medium text-stone-900">Profile Information</p>
                          <p className="text-xs text-stone-500 font-light">Update your name and contact details</p>
                        </div>
                        <ChevronRight size={16} className="text-stone-400" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                        <div>
                          <p className="text-sm font-medium text-stone-900">Notification Preferences</p>
                          <p className="text-xs text-stone-500 font-light">Manage email and SMS alerts</p>
                        </div>
                        <ChevronRight size={16} className="text-stone-400" />
                      </div>
                    </DashboardCard>
                  </Section>
                  <Section title="Security">
                    <DashboardCard className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                        <div>
                          <p className="text-sm font-medium text-stone-900">Password & Authentication</p>
                          <p className="text-xs text-stone-500 font-light">Update your security settings</p>
                        </div>
                        <ChevronRight size={16} className="text-stone-400" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 cursor-pointer" onClick={handleLogout}>
                        <div>
                          <p className="text-sm font-medium text-red-600">Sign Out</p>
                          <p className="text-xs text-red-500 font-light">Log out of your account</p>
                        </div>
                        <LogOut size={16} className="text-red-400" />
                      </div>
                    </DashboardCard>
                  </Section>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="other"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-20 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 mx-auto mb-4">
                  <Clock size={32} strokeWidth={1} />
                </div>
                <h2 className="text-xl font-serif text-stone-900">Coming soon</h2>
                <p className="text-stone-500 text-sm font-light">This section is being prepared to help you.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
