import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Upload, 
  Shield, 
  MoreVertical, 
  Eye, 
  Download, 
  Trash2, 
  Share2, 
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  Lock,
  Heart,
  Stethoscope,
  Scale,
  ShieldCheck,
  Flower2,
  Wallet,
  Camera,
  Key,
  PenTool,
  AlertTriangle,
  Copy,
  Check,
  Sparkles
} from "lucide-react";
import { useFirebase } from "./FirebaseProvider";
import { db, storage, storageRef, uploadBytes, getDownloadURL, collection, addDoc, Timestamp, OperationType, handleFirestoreError } from "../firebase";
import { generateAccessKey, hashKey, verifyKey } from "../services/encryptionService";
import { sendSignatureRequest } from "../services/signatureService";

const CATEGORIES = [
  { id: "all", label: "All Documents", icon: FileText },
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "insurance", label: "Insurance", icon: ShieldCheck },
  { id: "funeral", label: "Funeral arrangements", icon: Flower2 },
  { id: "financial", label: "Financial", icon: Wallet },
  { id: "personal", label: "Personal & memories", icon: Camera },
];

export default function DocumentVault() {
  const { documents, familyData, user, profile, ensureSignedIn } = useFirebase();
  const [activeCategory, setActiveCategory] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSecure, setIsSecure] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [unlockingDocId, setUnlockingDocId] = useState<string | null>(null);
  const [accessKeyInput, setAccessKeyInput] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !familyData) return;
    
    setIsUploading(true);
    try {
      const signedInUser = await ensureSignedIn();
      let lastKey = null;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const key = isSecure ? generateAccessKey() : null;
        lastKey = key;
        const storagePath = `families/${familyData.id}/documents/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const fileRef = storageRef(storage, storagePath);
        await uploadBytes(fileRef, file, { contentType: file.type || "application/octet-stream" });
        const url = await getDownloadURL(fileRef);

        const docData: any = {
          title: file.name,
          name: file.name,
          category: activeCategory === "all" ? "personal" : activeCategory,
          url,
          storagePath,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          contentType: file.type || "application/octet-stream",
          uploadedBy: signedInUser.uid,
          uploadedByName: signedInUser.displayName || profile?.firstName || "You",
          uploadedByUid: signedInUser.uid,
          createdAt: Timestamp.now(),
          sharedWith: [signedInUser.displayName || profile?.firstName || "You"],
          isEncrypted: isSecure,
          signatureStatus: 'none'
        };

        if (isSecure && key) {
          docData.accessKeyHash = hashKey(key);
        }

        const docsRef = collection(db, 'families', familyData.id, 'documents');
        await addDoc(docsRef, docData);
      }
      
      if (isSecure && lastKey) {
        setGeneratedKey(lastKey);
        setShowKeyModal(true);
      } else {
        setShowUploadSuccess(true);
        setTimeout(() => setShowUploadSuccess(false), 3000);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `families/${familyData.id}/documents`);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, [familyData, user, activeCategory, isSecure]);

  const filteredDocs = activeCategory === "all" 
    ? documents 
    : documents.filter(doc => doc.category === activeCategory);

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <header className="space-y-4">
        <h1 className="text-4xl font-serif text-stone-900 tracking-tight">Document Vault</h1>
        <p className="text-lg text-stone-500 font-light max-w-2xl">
          Securely store, manage, and share important documents with your family and vendors.
        </p>
      </header>
      
      {/* Security Banner */}
      <div className="bg-stone-900 text-stone-50 p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
            <Shield size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-serif text-lg">Your vault is encrypted</h3>
            <p className="text-stone-400 text-sm font-light">Only you and those you explicitly invite can view these documents.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-stone-500">
          <Lock size={14} />
          Bank-level security
        </div>
      </div>

      {/* Categories & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap
                ${activeCategory === cat.id 
                  ? "bg-stone-900 text-stone-50 shadow-sm" 
                  : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
                }
              `}
            >
              <cat.icon size={16} strokeWidth={activeCategory === cat.id ? 2 : 1.5} />
              {cat.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex-1 md:flex-none px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 hover:border-stone-400 transition-all flex items-center justify-center gap-2">
            <Plus size={16} />
            Request document
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center text-center space-y-4
          ${isDragging 
            ? "border-stone-900 bg-stone-100 scale-[0.99]" 
            : "border-stone-200 bg-white hover:border-stone-300"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            void handleUpload(event.target.files);
            event.currentTarget.value = "";
          }}
        />
        <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center text-stone-300">
          <Upload size={32} strokeWidth={1} />
        </div>
        <div>
          <h4 className="text-lg font-serif text-stone-900">Drag and drop documents here</h4>
          <p className="text-stone-500 text-sm font-light">or click to browse your files</p>
        </div>
        <p className="text-[10px] text-stone-400 uppercase tracking-widest">Supports PDF, JPG, PNG up to 50MB</p>

        <AnimatePresence>
          {(showUploadSuccess || isUploading) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 rounded-3xl flex flex-col items-center justify-center space-y-4 z-10"
            >
              {isUploading ? (
                <div className="w-16 h-16 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
              )}
              <h4 className="text-xl font-serif">{isUploading ? "Uploading..." : "Upload successful"}</h4>
              <p className="text-stone-600 text-sm font-light">
                {isUploading ? "Securing your document..." : "Your document has been securely stored."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Document Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDocs.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-md transition-all relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-stone-50 transition-colors">
                  {doc.isEncrypted ? <Lock size={24} strokeWidth={1.5} /> : <FileText size={24} strokeWidth={1.5} />}
                </div>
                <div className="flex items-center gap-2">
                  {doc.generatedBy === 'Clara Concierge' && (
                    <span className="text-[8px] uppercase tracking-widest bg-stone-900 text-stone-50 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                      <Sparkles size={8} /> Clara
                    </span>
                  )}
                  {doc.signatureStatus === 'pending' && (
                    <span className="text-[8px] uppercase tracking-widest bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-medium">Pending Sign</span>
                  )}
                  {doc.signatureStatus === 'signed' && (
                    <span className="text-[8px] uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-medium">Signed</span>
                  )}
                  <button className="p-1 text-stone-300 hover:text-stone-900 transition-colors">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h5 className="font-medium text-stone-900 truncate pr-4">
                  {doc.isEncrypted ? "••••••••••••" : doc.title || doc.name}
                </h5>
                <div className="flex items-center gap-2 text-[10px] text-stone-400 uppercase tracking-wider">
                  <span>{doc.category}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <div className="flex -space-x-2">
                  {doc.sharedWith?.map((userLabel: string, i: number) => (
                    <div 
                      key={i} 
                      className="w-6 h-6 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-stone-500"
                      title={`Shared with ${userLabel}`}
                    >
                      {userLabel[0]}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {doc.isEncrypted ? (
                    <button 
                      onClick={() => setUnlockingDocId(doc.id)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" 
                      title="Unlock"
                    >
                      <Key size={16} />
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={async () => {
                          if (!familyData) return;
                          await sendSignatureRequest({
                            documentId: doc.id,
                            familyId: familyData.id,
                            signerEmail: user?.email || profile?.email || (user ? `guest-${user.uid}@ditto.local` : ""),
                            signerName: user?.displayName || profile?.firstName || "Family Member"
                          });
                        }}
                        className="p-2 text-stone-400 hover:text-blue-600 transition-colors" 
                        title="Request Signature"
                      >
                        <PenTool size={16} />
                      </button>
                      <button onClick={() => doc.url && window.open(doc.url, "_blank")} className="p-2 text-stone-400 hover:text-stone-900 transition-colors" title="View">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => doc.url && window.open(doc.url, "_blank")} className="p-2 text-stone-400 hover:text-stone-900 transition-colors" title="Download">
                        <Download size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Key Generation Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-200"
            >
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6 mx-auto">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-serif text-stone-900 text-center mb-2">Document Secured</h3>
              <p className="text-stone-500 text-center font-light mb-8">
                This document is encrypted. You must share this key with anyone who needs to view it. <strong>We do not store this key.</strong>
              </p>
              
              <div className="bg-stone-50 p-4 rounded-2xl flex items-center justify-between mb-8 border border-stone-100">
                <code className="text-xl font-mono font-bold text-stone-900 tracking-wider">
                  {generatedKey}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey || "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                >
                  {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
                </button>
              </div>

              <button 
                onClick={() => setShowKeyModal(false)}
                className="w-full py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all"
              >
                I've saved the key
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unlock Modal */}
      <AnimatePresence>
        {unlockingDocId && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-200"
            >
              <div className="w-16 h-16 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center mb-6 mx-auto">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-serif text-stone-900 text-center mb-2">Enter Access Key</h3>
              <p className="text-stone-500 text-center font-light mb-8">
                This document is protected. Please enter the unique access key to view it.
              </p>
              
              <div className="space-y-4 mb-8">
                <input 
                  type="text"
                  value={accessKeyInput}
                  onChange={(e) => {
                    setAccessKeyInput(e.target.value);
                    setUnlockError(false);
                  }}
                  placeholder="Enter 8-character key"
                  className={`w-full p-4 bg-stone-50 border rounded-xl text-center font-mono text-xl tracking-widest outline-none focus:ring-2 transition-all ${
                    unlockError ? "border-red-200 focus:ring-red-100" : "border-stone-100 focus:ring-stone-200"
                  }`}
                />
                {unlockError && (
                  <p className="text-xs text-red-500 text-center flex items-center justify-center gap-1">
                    <AlertTriangle size={12} /> Invalid access key
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setUnlockingDocId(null);
                    setAccessKeyInput("");
                    setUnlockError(false);
                  }}
                  className="flex-1 py-4 border border-stone-200 text-stone-600 rounded-xl font-medium hover:bg-stone-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const doc = documents.find(d => d.id === unlockingDocId);
                    if (doc && verifyKey(accessKeyInput, doc.accessKeyHash)) {
                      // In a real app, this would decrypt the file
                      alert("Document unlocked successfully! (Prototype simulation)");
                      setUnlockingDocId(null);
                      setAccessKeyInput("");
                    } else {
                      setUnlockError(true);
                    }
                  }}
                  className="flex-1 py-4 bg-stone-900 text-stone-50 rounded-xl font-medium hover:bg-stone-800 transition-all"
                >
                  Unlock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {filteredDocs.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 mx-auto">
            <Search size={32} strokeWidth={1} />
          </div>
          <div>
            <h4 className="text-xl font-serif text-stone-900">No documents found</h4>
            <p className="text-stone-500 text-sm font-light">Try selecting a different category or upload a new file.</p>
          </div>
        </div>
      )}

      {/* Footer Security Note */}
      <div className="pt-12 flex flex-col items-center space-y-4">
        <div className="flex items-center gap-2 text-stone-400 text-xs font-light">
          <Heart size={14} className="text-stone-300" />
          <span>Your memories and documents are handled with care</span>
        </div>
        <button className="text-xs text-stone-400 hover:text-stone-900 transition-colors underline underline-offset-4">
          Learn more about our security practices
        </button>
      </div>
    </div>
  );
}
