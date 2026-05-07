import {
  db,
  storage,
  storageRef,
  uploadBytes,
  getDownloadURL,
  collection,
  addDoc,
  Timestamp,
  type FirebaseUser,
} from "../firebase";

export const MAX_DOCUMENT_UPLOAD_BYTES = 50 * 1024 * 1024;

export type DocumentUploadProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

export type UploadFamilyDocumentInput = {
  file: File;
  familyId: string;
  user: FirebaseUser;
  profile?: DocumentUploadProfile | null;
  category: string;
  isEncrypted?: boolean;
  accessKeyHash?: string;
  source?: "vault" | "onboarding";
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "document";
}

function uniqueUploadId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function uploaderNameFor(user: FirebaseUser, profile?: DocumentUploadProfile | null) {
  const profileName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  if (profileName) return profileName;
  if (user.displayName) return user.displayName;
  if (profile?.email) return profile.email.split("@")[0];
  if (user.email) return user.email.split("@")[0];
  return "You";
}

export async function uploadFamilyDocument(input: UploadFamilyDocumentInput) {
  const {
    file,
    familyId,
    user,
    profile,
    category,
    isEncrypted = false,
    accessKeyHash,
    source = "vault",
  } = input;

  if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
    throw new Error("Files must be 50MB or smaller.");
  }

  const contentType = file.type || "application/octet-stream";
  const safeName = sanitizeFileName(file.name);
  const storagePath = `families/${familyId}/documents/${user.uid}/${uniqueUploadId()}-${safeName}`;
  const fileRef = storageRef(storage, storagePath);

  await uploadBytes(fileRef, file, {
    contentType,
    customMetadata: {
      familyId,
      uploadedByUid: user.uid,
      originalName: file.name,
      source,
    },
  });

  const url = await getDownloadURL(fileRef);
  const uploadedByName = uploaderNameFor(user, profile);
  const docData: Record<string, unknown> = {
    title: file.name,
    name: file.name,
    category,
    url,
    storagePath,
    size: formatFileSize(file.size),
    contentType,
    uploadedBy: user.uid,
    uploadedByName,
    uploadedByUid: user.uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    sharedWith: [uploadedByName],
    isEncrypted,
    signatureStatus: "none",
    metadata: {
      originalName: file.name,
      bytes: file.size,
      source,
    },
  };

  if (accessKeyHash) {
    docData.accessKeyHash = accessKeyHash;
  }

  const docRef = await addDoc(collection(db, "families", familyId, "documents"), docData);
  return { id: docRef.id, ...docData };
}
