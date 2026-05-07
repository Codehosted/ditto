import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Upload } from "lucide-react";
import { db, doc, setDoc, Timestamp } from "../firebase";
import { useFirebase } from "./FirebaseProvider";
import { generateNextStepsAndDocs, findLocalBusinesses } from "../services/aiService";
import { uploadFamilyDocument } from "../services/documentService";

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

const DEFAULT_NEXT_STEPS = {
  nextSteps: {
    immediateActions: [
      "Contact a funeral home or coroner if that has not already happened.",
      "Notify close family members and identify the primary point of contact.",
      "Locate identification, insurance documents, and any pre-arrangement records.",
    ],
    shortTermActions: [
      "Request certified death certificates through the funeral home or local vital records office.",
      "Confirm service preferences and coordinate with selected vendors.",
      "Begin notifying Social Security, employers, banks, and insurers.",
    ],
    longTermActions: [
      "Organize estate documents and contact the estate attorney or probate court if needed.",
      "Submit insurance claims and track benefit decisions.",
      "Archive important documents in the family vault for future reference.",
    ],
  },
  requiredDocuments: [
    {
      documentName: "Death Certificate",
      description: "Certified copies are usually needed for benefits, banking, insurance, and estate tasks.",
      obtainingGuidance: "The funeral home can usually request certified copies, or you can contact the local county or state vital records office.",
    },
    {
      documentName: "Will or Trust Documents",
      description: "Estate planning records determine who can act on behalf of the estate.",
      obtainingGuidance: "Check home files, safe deposit boxes, attorney offices, and county probate records.",
    },
  ],
};

const DEFAULT_BUSINESSES = [
  {
    category: "funeral_home",
    name: "Grace Memorial Chapel",
    address: "123 Serenity Ln, Springfield",
    rating: 4.9,
    phoneNumber: "(555) 010-1221",
    websiteUrl: "https://example.com/grace-memorial",
  },
  {
    category: "flowers",
    name: "Bloom & Petal",
    address: "789 Flower St, Springfield",
    rating: 4.8,
    phoneNumber: "(555) 010-4432",
    websiteUrl: "https://example.com/bloom-petal",
  },
  {
    category: "cemetery",
    name: "Evergreen Cemetery",
    address: "456 Peace Way, Springfield",
    rating: 4.7,
    phoneNumber: "(555) 010-7788",
    websiteUrl: "https://example.com/evergreen",
  },
];

const EMPTY_ONBOARDING_DATA: OnboardingData = {
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
};

function docIdFrom(value: string, fallback: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug || fallback;
}

function iconForCategory(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("flower")) return "Flower2";
  if (normalized.includes("funeral")) return "Building2";
  if (normalized.includes("church")) return "Music";
  if (normalized.includes("cemetery")) return "Building2";
  if (normalized.includes("casket")) return "Truck";
  return "Truck";
}

function flattenGeneratedTasks(nextSteps: any) {
  const groups = [
    { key: "immediateActions", label: "Immediate", days: 1 },
    { key: "shortTermActions", label: "Short-term", days: 7 },
    { key: "longTermActions", label: "Long-term", days: 30 },
  ];

  return groups.flatMap((group) => {
    const actions = nextSteps?.nextSteps?.[group.key];
    if (!Array.isArray(actions)) return [];
    return actions.map((title: string, index: number) => ({
      id: docIdFrom(`${group.key}-${title}`, `${group.key}-${index}`),
      data: {
        title,
        description: `${group.label} guidance generated during onboarding.`,
        status: "pending",
        category: group.label,
        dueDate: Timestamp.fromDate(new Date(Date.now() + group.days * 86400000)),
        createdAt: Timestamp.now(),
      },
    }));
  });
}

function onboardingDocumentCategory(itemId: string) {
  if (itemId.includes("insurance")) return "insurance";
  if (itemId.includes("birth") || itemId.includes("death") || itemId.includes("ss")) return "legal";
  return "personal";
}

async function seedFamilyCollections(familyId: string, nextSteps: any, businesses: any[]) {
  const taskWrites = flattenGeneratedTasks(nextSteps).map(({ id, data }) =>
    setDoc(doc(db, "families", familyId, "tasks", id), data, { merge: true })
  );

  const vendorWrites = businesses.slice(0, 8).map((business, index) => {
    const category = String(business.category || business.type || "vendor");
    const name = String(business.name || `Provider ${index + 1}`);
    return setDoc(doc(db, "families", familyId, "vendors", docIdFrom(`${category}-${name}`, `provider-${index}`)), {
      name,
      type: category.replace(/_/g, " "),
      category,
      status: index === 0 ? "action_required" : "coordinating",
      address: business.address || "",
      phone: business.phoneNumber || business.phone || "",
      website: business.websiteUrl || business.website || "",
      rating: typeof business.rating === "number" ? business.rating : null,
      amenities: Array.isArray(business.amenities) ? business.amenities : [],
      icon: iconForCategory(category),
      lastAction: index === 0
        ? "Provider details are ready for family review."
        : "Ditto is tracking this provider as a local option.",
      source: "onboarding",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  });

  await Promise.all([...taskWrites, ...vendorWrites]);
}

export default function Onboarding({ onComplete, onExit, onLogin }: { onComplete: () => void; onExit: () => void; onLogin?: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(EMPTY_ONBOARDING_DATA);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const { user, profile, setAppFamilyData, ensureSignedIn, ensureFamilyContext } = useFirebase();
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState("Finalizing your account...");
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string[]>>({});
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [completedAccount, setCompletedAccount] = useState<{ accountNumber: string; email: string } | null>(null);
  const uploadInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setData((previous) => ({
      ...previous,
      firstName: previous.firstName || profile?.firstName || user?.displayName?.split(" ")[0] || "",
      lastName: previous.lastName || profile?.lastName || user?.displayName?.split(" ").slice(1).join(" ") || "",
      phone: previous.phone || profile?.phone || "",
      address: previous.address || profile?.address || "",
      city: previous.city || profile?.city || "",
      state: previous.state || profile?.state || "",
      zip: previous.zip || profile?.zip || "",
      role: previous.role || (profile?.role === "vendor" ? "Funeral Home / Vendor" : "Family Member"),
    }));
  }, [profile, user]);

  const handleClearForm = () => {
    setData(EMPTY_ONBOARDING_DATA);
    setUploadedDocs({});
    setUploadError(null);
  };

  const handleOnboardingUpload = async (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingDocId(itemId);
    setUploadError(null);
    try {
      const { user: signedInUser, profile: uploadProfile, family } = await ensureFamilyContext();
      const uploadedNames: string[] = [];

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        await uploadFamilyDocument({
          file,
          familyId: family.id,
          user: signedInUser,
          profile: uploadProfile || profile,
          category: onboardingDocumentCategory(itemId),
          source: "onboarding",
        });
        uploadedNames.push(file.name);
      }

      setUploadedDocs((previous) => ({
        ...previous,
        [itemId]: [...(previous[itemId] || []), ...uploadedNames],
      }));
      setChecklist((previous) => ({ ...previous, docs_uploaded: true }));
    } catch (error) {
      const message = error instanceof Error && error.message.includes("50MB")
        ? "Files must be 50MB or smaller."
        : "Upload failed. Please confirm Firebase Storage rules are deployed and try again.";
      setUploadError(message);
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === STEPS.length - 1) {
      setIsSaving(true);
      try {
        const signedInUser = await ensureSignedIn();
        setSavingStatus("Generating personalized next steps and finding local businesses...");
        const location = { city: data.city, state: data.state, zipCode: data.zip };
        
        const [aiSteps, aiBusinesses] = await Promise.all([
          generateNextStepsAndDocs(location).catch(e => { console.error(e); return null; }),
          findLocalBusinesses(location).catch(e => { console.error(e); return []; })
        ]);

        const nextSteps = aiSteps || DEFAULT_NEXT_STEPS;
        const businesses = aiBusinesses && aiBusinesses.length > 0 ? aiBusinesses : DEFAULT_BUSINESSES;

        localStorage.setItem('ditto_next_steps', JSON.stringify(nextSteps));
        localStorage.setItem('ditto_businesses', JSON.stringify(businesses));
        
        // Also save deceased info to local storage for the DevToolbar / Dashboard
        localStorage.setItem('ditto_deceased', JSON.stringify({
          firstName: data.deceasedFullName.split(' ')[0] || '',
          lastName: data.deceasedFullName.split(' ').slice(1).join(' ') || '',
          dateOfPassing: data.deceasedDOD,
          location: location
        }));

        setSavingStatus("Saving to Firebase...");
        const savedFamily = await setAppFamilyData({
          id: `family-${signedInUser.uid}`,
          profile: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
            role: data.role === "Funeral Home / Vendor" ? "vendor" : "member",
          },
          deceased: {
            fullName: data.deceasedFullName,
            dob: data.deceasedDOB,
            dod: data.deceasedDOD,
            ssn: data.deceasedSSN,
            birthPlace: data.deceasedBirthPlace,
            occupation: data.deceasedOccupation,
            maritalStatus: data.deceasedMaritalStatus,
            legalInfo: data.deceasedLegalInfo,
          },
          preferences: {
            burialType: data.burialPreference,
            zip: data.zip,
            city: data.city,
            state: data.state,
            funeralHome: data.funeralHome,
            cemetery: data.cemetery,
            church: data.church,
            repastSite: data.repastSite,
          },
          checklist,
          nextSteps,
          localBusinesses: businesses,
        });

        if (savedFamily?.id) {
          await seedFamilyCollections(savedFamily.id, nextSteps, businesses);
        }

        setCompletedAccount({
          accountNumber: profile?.accountNumber || `DITTO-${signedInUser.uid.slice(0, 5).toUpperCase()}`,
          email: signedInUser.email || profile?.email || `guest-${signedInUser.uid}@ditto.local`,
        });
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
                      Your account has been created. Your Ditto Account # is <span className="font-medium text-stone-900">{completedAccount?.accountNumber || profile?.accountNumber || "DITTO-7721X"}</span>.
                      We have sent a confirmation email to <span className="font-medium text-stone-900">{completedAccount?.email || user?.email || "your email address"}</span>.
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
                            <p className="text-xs text-stone-400">
                              {uploadedDocs[item.id]?.length
                                ? uploadedDocs[item.id].join(", ")
                                : "PDF, JPG, or PNG"}
                            </p>
                          </div>
                        </div>
                        <input
                          ref={(node) => {
                            uploadInputRefs.current[item.id] = node;
                          }}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            void handleOnboardingUpload(item.id, event.currentTarget.files);
                            event.currentTarget.value = "";
                          }}
                        />
                        <button
                          type="button"
                          disabled={uploadingDocId === item.id}
                          onClick={() => uploadInputRefs.current[item.id]?.click()}
                          className="px-4 py-2 bg-stone-50 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-100 transition-all disabled:opacity-50"
                        >
                          {uploadingDocId === item.id ? "Uploading..." : uploadedDocs[item.id]?.length ? "Add More" : "Select File"}
                        </button>
                      </div>
                    ))}
                  </div>
                  {uploadError && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {uploadError}
                    </div>
                  )}
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
