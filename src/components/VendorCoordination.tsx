import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ThumbsUp, 
  X, 
  ChevronRight, 
  Info,
  Building2,
  Flower2,
  Printer,
  Music,
  Utensils,
  ExternalLink,
  MapPin,
  CreditCard,
  Navigation,
  Search
} from "lucide-react";
import { useFirebase } from "./FirebaseProvider";
import { db, doc, updateDoc, OperationType, handleFirestoreError } from "../firebase";

const ICON_MAP: Record<string, any> = {
  Building2,
  Flower2,
  Printer,
  Music,
  Utensils,
  Truck
};

const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; classes: string }> = {
    coordinating: { label: "Coordinating", classes: "bg-stone-100 text-stone-600" },
    confirmed: { label: "Confirmed", classes: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    awaiting_reply: { label: "Awaiting reply", classes: "bg-stone-50 text-stone-400" },
    action_required: { label: "Action required", classes: "bg-amber-50 text-amber-700 border-amber-100" },
  };

  const config = configs[status] || configs.coordinating;
  return (
    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${config.classes}`}>
      {config.label}
    </span>
  );
};

export default function VendorCoordination() {
  const { vendors, familyData } = useFirebase();
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState<string | null>(null);

  const selectedVendor = useMemo(() => 
    vendors.find(v => v.id === selectedVendorId) || null
  , [vendors, selectedVendorId]);

  const approvals = useMemo(() => 
    vendors.filter(v => v.status === 'action_required')
  , [vendors]);

  const handleApprove = async (vendorId: string, name: string) => {
    if (!familyData) return;
    try {
      const vendorRef = doc(db, 'families', familyData.id, 'vendors', vendorId);
      await updateDoc(vendorRef, {
        status: 'confirmed',
        lastAction: `You approved the proposal. Ditto is finalizing the details.`
      });
      setShowConfirmation(name);
      setTimeout(() => setShowConfirmation(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `families/${familyData.id}/vendors/${vendorId}`);
    }
  };

  const handlePay = async (vendorId: string) => {
    if (!familyData) return;
    setIsPaying(vendorId);
    try {
      // Simulate Stripe payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const vendorRef = doc(db, 'families', familyData.id, 'vendors', vendorId);
      await updateDoc(vendorRef, {
        status: 'confirmed',
        lastAction: `Payment processed successfully.`
      });
      
      setShowConfirmation("Payment successful");
      setTimeout(() => setShowConfirmation(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `families/${familyData.id}/vendors/${vendorId}`);
    } finally {
      setIsPaying(null);
    }
  };

  return (
    <div className="space-y-12 pb-20 max-w-5xl mx-auto">
      {/* Header Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <header className="space-y-4 max-w-2xl">
          <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Vendor Coordination</h1>
          <p className="text-lg text-stone-500 font-light max-w-2xl">
            Ditto is managing the details with your selected vendors. We'll handle the 
            back-and-forth and only ask for your input when a final decision is needed.
          </p>
        </header>
        
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm">
            <Search size={20} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-medium">Insurance Scrubbing</p>
            <p className="text-sm font-medium text-stone-900">National Search Active</p>
          </div>
        </div>
      </div>

      {/* Approvals Section */}
      <AnimatePresence>
        {approvals.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">Needs your approval</h3>
            <div className="grid gap-4">
              {approvals.map((vendor) => (
                <motion.div 
                  key={vendor.id}
                  layout
                  className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">{vendor.name}</span>
                      <span className="w-1 h-1 rounded-full bg-stone-200" />
                      <span className="text-xs text-stone-400 font-light">Approval requested</span>
                    </div>
                    <h4 className="text-lg font-serif text-stone-900">Approve proposal</h4>
                    <p className="text-sm text-stone-600 font-light max-w-lg">{vendor.lastAction}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-6 py-2 text-sm text-stone-400 hover:text-stone-600 transition-colors">
                      View details
                    </button>
                    <button 
                      onClick={() => handleApprove(vendor.id, vendor.name)}
                      className="px-8 py-2 bg-stone-900 text-stone-50 rounded-full text-sm font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ThumbsUp size={16} />
                      Approve & Pay
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Vendor List */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">Your Vendors</h3>

          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100">
            {vendors.map((vendor) => {
              const Icon = ICON_MAP[vendor.icon] || Building2;
              return (
                <div 
                  key={vendor.id} 
                  onClick={() => setSelectedVendorId(vendor.id)}
                  className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-stone-50 transition-colors cursor-pointer ${selectedVendorId === vendor.id ? 'bg-stone-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors">
                      <Icon size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-stone-900">{vendor.name}</h4>
                        <StatusBadge status={vendor.status} />
                      </div>
                      <p className="text-xs text-stone-400 font-light uppercase tracking-wider">{vendor.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 md:max-w-xs">
                    <div className="flex items-start gap-2 text-stone-500">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <p className="text-xs font-light truncate">{vendor.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePay(vendor.id); }}
                      disabled={isPaying === vendor.id}
                      className="px-4 py-2 bg-stone-100 text-stone-900 rounded-lg text-xs font-medium hover:bg-stone-200 transition-colors flex items-center gap-2"
                    >
                      {isPaying === vendor.id ? <div className="w-3 h-3 border-2 border-stone-400 border-t-stone-900 rounded-full animate-spin" /> : <CreditCard size={14} />}
                      Pay
                    </button>
                    <ChevronRight size={20} className="text-stone-200 group-hover:text-stone-400 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vendor Details Sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">Vendor Details</h3>
          <AnimatePresence mode="wait">
            {selectedVendor ? (
              <motion.div
                key={selectedVendor.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-stone-900 text-stone-50 flex items-center justify-center">
                    {React.createElement(ICON_MAP[selectedVendor.icon] || Building2, { size: 32 })}
                  </div>
                  <div>
                    <h4 className="text-lg font-serif text-stone-900">{selectedVendor.name}</h4>
                    <p className="text-xs text-stone-400 uppercase tracking-widest">{selectedVendor.type}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-stone-100">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-stone-300 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm text-stone-600 font-light">{selectedVendor.address}</p>
                      <button className="text-xs font-medium text-stone-900 flex items-center gap-1 hover:underline">
                        <Navigation size={12} /> Get directions
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ExternalLink size={18} className="text-stone-300 shrink-0" />
                    <a href={selectedVendor.website} target="_blank" rel="noreferrer" className="text-sm text-stone-600 font-light hover:underline truncate">
                      {selectedVendor.website?.replace('https://', '')}
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-stone-300 shrink-0" />
                    <p className="text-sm text-stone-600 font-light">{selectedVendor.phone}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">Latest Activity</p>
                  <div className="p-3 bg-stone-50 rounded-xl italic">
                    <p className="text-xs text-stone-500 font-light leading-relaxed">
                      "{selectedVendor.lastAction}"
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-stone-200 border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center h-[400px]">
                <MapPin size={32} className="text-stone-200 mb-4" />
                <p className="text-sm text-stone-400 font-light">Select a vendor to view location and contact details.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Activity Log */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-stone-400 uppercase tracking-widest px-1">Recent Activity</h3>
        <div className="space-y-3">
          {vendors.filter(v => v.lastAction).slice(0, 4).map((vendor, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3 bg-white border border-stone-200 rounded-xl">
              <span className="text-sm text-stone-600 font-light">
                Ditto: {vendor.lastAction} ({vendor.name})
              </span>
              <span className="text-xs text-stone-400">Just now</span>
            </div>
          ))}
        </div>
      </section>

      {/* Support Note */}
      <div className="pt-8 text-center">
        <p className="text-stone-400 text-xs font-light italic">
          “Ditto is handling the logistics so you can focus on your family.”
        </p>
      </div>
    </div>
  );
}
