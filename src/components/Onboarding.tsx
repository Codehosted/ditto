import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Info, Upload } from "lucide-react";
import { db, auth, addDoc, collection, Timestamp, updateDoc, doc } from "../firebase";
import { useFirebase } from "./FirebaseProvider";
import { generateNextStepsAndDocs, findLocalBusinesses } from "../services/aiService";

interface OnboardingData {
  // POC Demographics
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  // Deceased Demographics
  deceasedFullName: string;
  deceasedDOB: string;
  deceasedDOD: string;
  deceasedSSN: string;
  deceasedBirthPlace: string;
  deceasedOccupation: string;
  deceasedMaritalStatus: string;
  deceasedLegalInfo: string;
  // Legal & Preferences
  burialPreference: string;
  funeralHome: string;
  cemetery: string;
  church: string;
  repastSite: string;
}

const STEPS = [
  {
    id: "poc_demographics",
    title: "Point of Contact",
    question: "Tell us about yourself.",
    explanation: "As the primary point of contact, we need your details to coordinate legal and administrative tasks.",
    fields: [
      { id: "firstName", label: "First Name", type: "text", placeholder: "John" },
      { id: "lastName", label: "Last Name", type: "text", placeholder: "Doe" },
      { id: "phone", label: "Phone Number", type: "tel", placeholder: "(555) 000-0000" },
      { id: "role", label: "I am a...", type: "select", options: ["Family Member", "Funeral Home / Vendor"] },
      { id: "address", label: "Street Address", type: "text", placeholder: "123 Main St" },
      { id: "city", label: "City", type: "text", placeholder: "Springfield" },
      { id: "state", label: "State", type: "text", placeholder: "IL" },
      { id: "zip", label: "Zip Code", type: "text", placeholder: "62704" },
    ]
  },
  {
    id: "deceased_demographics",
    title: "Deceased Information",
    question: "Tell us about your loved one.",
    explanation: "This information is required for legal documents, death certificates, and social security notifications.",
    fields: [
      { id: "deceasedFullName", label: "Full Legal Name", type: "text", placeholder: "Jane Doe" },
      { id: "deceasedDOB", label: "Date of Birth", type: "date" },
      { id: "deceasedDOD", label: "Date of Death", type: "date" },
      { id: "deceasedSSN", label: "Social Security Number", type: "password", placeholder: "XXX-XX-XXXX" },
      { id: "deceasedBirthPlace", label: "Place of Birth", type: "text", placeholder: "City, State" },
      { id: "deceasedOccupation", label: "Occupation", type: "text", placeholder: "Retired Teacher" },
      { id: "deceasedMaritalStatus", label: "Marital Status", type: "select", options: ["Single", "Married", "Widowed", "Divorced"] },
      { id: "deceasedLegalInfo", label: "Legal Information / Notes", type: "text", placeholder: "Any specific legal instructions or notes" },
    ]
  },
  {
    id: "service_details",
    title: "Service Details",
    question: "Where will the services be held?",
    explanation: "This helps us coordinate with local vendors and provide travel assistance for family members.",
    fields: [
      { id: "funeralHome", label: "Funeral Home Name", type: "text", placeholder: "Grace Memorial Chapel" },
      { id: "zip", label: "Service Zip Code", type: "text", placeholder: "62704" },
      { id: "burialPreference", label: "Burial Preference", type: "select", options: ["Traditional Burial", "Cremation", "Green Burial", "Donation"] },
    ]
  },
  {
    id: "upload_docs",
    title: "Document Upload",
    question: "Upload necessary documents.",
    explanation: "Please upload any available documents to speed up the process. You can also do this later in your portal.",
    type: "upload",
    items: [
      { id: "birth_cert", label: "Birth Certificate" },
      { id: "death_cert", label: "Death Certificate" },
      { id: "ss_card", label: "Social Security Card" },
      { id: "insurance_policy", label: "Insurance Policies" },
    ]
  },
  {
    id: "checklist",
    title: "Onboarding Checklist",
    question: "Final Review",
    explanation: "A summary of your onboarding progress.",
    type: "checklist",
    items: [
      { id: "poc_complete", label: "Point of Contact Info" },
      { id: "deceased_complete", label: "Deceased Information" },
      { id: "docs_uploaded", label: "Documents Uploaded" },
      { id: "insurance_search", label: "Insurance Search Initiated" },
    ]
  }
];

export default function Onboarding({ onComplete, onExit, onLogin }: { onComplete: () => void; onExit: () => void; onLogin?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    firstName: "John",
    lastName: "Doe",
    phone: "(555) 123-4567",
    role: "Family Member",
    address: "123 Main St",
    city: "Springfield",
    state: "IL",
    zip: "62704",
    deceasedFullName: "Jane Doe",
    deceasedDOB: "1950-01-01",
    deceasedDOD: "2024-01-01",
    deceasedSSN: "000-00-0000",
    deceasedBirthPlace: "Chicago, IL",
    deceasedOccupation: "Teacher",
    deceasedMaritalStatus: "Widowed",
    deceasedLegalInfo: "None",
    burialPreference: "Cremation",
    funeralHome: "Grace Memorial",
    cemetery: "Springfield Cemetery",
    church: "First Church",
    repastSite: "Community Center",
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const { user, profile, setAppFamilyData } = useFirebase();
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState("Finalizing your account...");

  const handleClearForm = () => {
    setData({
      firstName: "",
      lastName: "",
      phone: "",
      role: "Family Member",
      address: "",
      city: "",
      state: "",
      zip: "",
      deceasedFullName: "",
      deceasedDOB: "",
      deceasedDOD: "",
      deceasedSSN: "",
      deceasedBirthPlace: "",
      deceasedOccupation: "",
      deceasedMaritalStatus: "",
      deceasedLegalInfo: "",
      burialPreference: "",
      funeralHome: "",
      cemetery: "",
      church: "",
      repastSite: "",
    });
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === STEPS.length - 1) {
      setIsSaving(true);
      try {
        setSavingStatus("Generating personalized next steps and finding local businesses...");
        const location = { city: data.city, state: data.state, zipCode: data.zip };
        
        // Generate AI content based on location
        const [aiSteps, aiBusinesses] = await Promise.all([
          generateNextStepsAndDocs(location).catch(e => { console.error(e); return null; }),
          findLocalBusinesses(location).catch(e => { console.error(e); return []; })
        ]);

        if (aiSteps) {
          localStorage.setItem('ditto_next_steps', JSON.stringify(aiSteps));
        }
        if (aiBusinesses && aiBusinesses.length > 0) {
          localStorage.setItem('ditto_businesses', JSON.stringify(aiBusinesses));
        }
        
        // Also save deceased info to local storage for the DevToolbar / Dashboard
        localStorage.setItem('ditto_deceased', JSON.stringify({
          firstName: data.deceasedFullName.split(' ')[0] || '',
          lastName: data.deceasedFullName.split(' ').slice(1).join(' ') || '',
          dateOfPassing: data.deceasedDOD,
          location: location
        }));

        setAppFamilyData({
          id: `ditto-${Date.now()}`,
          deceased: { fullName: data.deceasedFullName },
          preferences: {
            zip: data.zip,
            city: data.city,
            funeralHome: data.funeralHome,
          },
        });

        setSavingStatus("Saving to database...");

        // Mock a successful save with a small delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        setCurrentStep(STEPS.length);
      } catch (error) {
        console.error("Error saving onboarding data", error);
        // Proceed anyway so the user can see the generated AI results
        setCurrentStep(STEPS.length);
      } finally {
        setIsSaving(false);
      }
    } else {
      onComplete();
    }
  };

  const isSuccessStep = currentStep === STEPS.length;
  const progress = isSuccessStep ? 100 : ((currentStep + 1) / STEPS.length) * 100;
  const step = isSuccessStep ? null : STEPS[currentStep];

  const completionPercentage = Math.round((Object.values(checklist).filter(Boolean).length / 5) * 100);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="px-6 h-20 flex items-center justify-between border-b border-stone-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <button onClick={() => currentStep > 0 ? setCurrentStep(prev => prev - 1) : onExit()} className="p-2 text-stone-400 hover:text-stone-900 flex items-center gap-2 text-sm">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
            {isSuccessStep ? "Complete" : `Step ${currentStep + 1} of ${STEPS.length}`}
          </span>
          <div className="w-32 h-1 bg-stone-200 rounded-full overflow-hidden">
            <motion.div className="h-full bg-stone-900" animate={{ width: `${progress}%` }} />
          </div>
        </div>
        <button onClick={handleNext} className="text-sm text-stone-900 font-medium">
          {currentStep === STEPS.length - 1 ? "Finish" : "Next"}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative">
        {isSaving && (
          <div className="absolute inset-0 bg-stone-50/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
              <p className="text-stone-600 font-light">{savingStatus}</p>
            </div>
          </div>
        )}
        <div className="max-w-2xl w-full">
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              {isSuccessStep ? (
                <div className="text-center space-y-8">
                  <div className="w-20 h-20 bg-stone-900 text-stone-50 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Check size={40} />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-serif text-stone-900 leading-tight">Welcome to Ditto.</h2>
                    <p className="text-stone-600 font-light leading-relaxed max-w-md mx-auto">
                      Your account has been created. Your Ditto Account # is <span className="font-medium text-stone-900">{profile?.accountNumber || "DITTO-7721X"}</span>.
                      We have sent a confirmation email to <span className="font-medium text-stone-900">{user?.email || "your email address"}</span>.
                    </p>
                    <div className="p-6 bg-white border border-stone-200 rounded-2xl text-left space-y-4">
                      <h4 className="text-sm font-medium uppercase tracking-widest text-stone-400">Next Steps</h4>
                      <ul className="space-y-3 text-sm text-stone-600 font-light">
                        <li className="flex gap-3"><Check size={16} className="text-emerald-500 shrink-0" /> We will contact you shortly at your designated email.</li>
                        <li className="flex gap-3"><Check size={16} className="text-emerald-500 shrink-0" /> Our team is beginning to coordinate with local providers in {data.zip}.</li>
                        <li className="flex gap-3"><Check size={16} className="text-emerald-500 shrink-0" /> We are scrubbing for insurance policies nationally.</li>
                      </ul>
                    </div>
                  </div>
                  <button onClick={handleNext} className="w-full py-5 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all flex items-center justify-center gap-3">
                    Go to Dashboard <ArrowRight size={20} />
                  </button>
                </div>
              ) : step?.type === "checklist" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl text-stone-900">{step.question}</h2>
                    <p className="text-stone-500 font-light">{step.explanation}</p>
                  </div>
                  <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-stone-900">Document Readiness</span>
                      <span className="text-sm font-medium text-stone-900">{completionPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
                    </div>
                    <div className="grid gap-3 pt-4">
                      {step.items?.map(item => (
                        <button key={item.id} onClick={() => setChecklist(prev => ({ ...prev, [item.id]: !prev[item.id] }))} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${checklist[item.id] ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}>
                          <span className="font-light">{item.label}</span>
                          {checklist[item.id] ? <Check size={18} /> : <div className="w-5 h-5 rounded-full border border-stone-200" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={handleNext} 
                    className="w-full py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all"
                  >
                    {currentStep === 1 ? "Submit Deceased Information" : "Continue"}
                  </button>
                </div>
              ) : step?.type === "upload" ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl text-stone-900">{step.question}</h2>
                    <p className="text-stone-500 font-light">{step.explanation}</p>
                  </div>
                  <div className="grid gap-4">
                    {step.items?.map(item => (
                      <div key={item.id} className="p-6 bg-white border border-stone-200 rounded-2xl flex items-center justify-between group hover:border-stone-400 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-xl flex items-center justify-center group-hover:bg-stone-900 group-hover:text-stone-50 transition-all">
                            <Upload size={24} />
                          </div>
                          <div>
                            <p className="font-medium text-stone-900">{item.label}</p>
                            <p className="text-xs text-stone-400">PDF, JPG, or PNG</p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-stone-50 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-100 transition-all">
                          Select File
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleNext} 
                    className="w-full py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl text-stone-900">{step?.question}</h2>
                    <p className="text-stone-500 font-light">{step?.explanation}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {step?.fields?.map(field => (
                      <div key={field.id} className={`space-y-1.5 ${field.id === 'address' || field.id === 'deceasedFullName' ? 'md:col-span-2' : ''}`}>
                        <label className="text-xs font-medium text-stone-400 uppercase tracking-widest">{field.label}</label>
                        {field.type === "select" ? (
                          <select value={(data as any)[field.id]} onChange={(e) => setData(prev => ({ ...prev, [field.id]: e.target.value }))} className="w-full p-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-100 outline-none font-light">
                            <option value="">Select...</option>
                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input type={field.type} value={(data as any)[field.id]} onChange={(e) => setData(prev => ({ ...prev, [field.id]: e.target.value }))} placeholder={field.placeholder} className="w-full p-4 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-100 outline-none font-light" />
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleNext} 
                    className="w-full py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all"
                  >
                    {currentStep === 1 ? "Submit Deceased Information" : "Continue"}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Clear Button */}
      <button
        onClick={handleClearForm}
        className="fixed bottom-8 right-8 bg-red-50 text-red-600 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all text-sm font-medium border border-red-100 z-50"
      >
        Clear Form
      </button>
    </div>
  );
}
