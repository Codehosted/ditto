import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import {
  collection as legacyCollection,
  doc as legacyDoc,
  getDoc as getLegacyDoc,
  getDocs as getLegacyDocs,
  getFirestore,
} from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const db = { kind: "ditto-postgres" } as const;
const legacyDb = getFirestore(app);

export type DocumentReference = {
  kind: "document";
  path: string;
  id: string;
};

export type CollectionReference = {
  kind: "collection";
  path: string;
};

type ClientDocument = {
  id: string;
  path: string;
  data: Record<string, unknown>;
};

export type DocumentSnapshot = {
  id: string;
  exists: () => boolean;
  data: () => Record<string, unknown>;
};

export type QuerySnapshot = {
  docs: DocumentSnapshot[];
};

export type SetOptions = {
  merge?: boolean;
};

export class Timestamp {
  static now() {
    return new Date();
  }

  static fromDate(date: Date) {
    return date;
  }
}

function pathFrom(parts: string[]) {
  if (!parts.length || parts.some((part) => typeof part !== "string" || !part || part.includes("/"))) {
    throw new Error("Invalid data path");
  }
  return parts.join("/");
}

function snapshotFor(document: ClientDocument | null, fallbackId: string): DocumentSnapshot {
  return {
    id: document?.id || fallbackId,
    exists: () => Boolean(document),
    data: () => document?.data || {},
  };
}

async function dataRequest<T>(body: Record<string, unknown>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in before accessing Ditto data");

  const token = await user.getIdToken();
  const response = await fetch("/api/data", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || "Ditto data request failed");
  return payload;
}

function legacyRecord(value: unknown): Record<string, unknown> {
  const serialized = JSON.stringify(value);
  const parsed = serialized ? JSON.parse(serialized) : null;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Legacy Firestore document is not an object");
  }
  return parsed as Record<string, unknown>;
}

function legacyEmailFor(user: FirebaseUser) {
  return user.email || `guest-${user.uid}@ditto.local`;
}

async function importLegacyFamilyCollection(familyId: string, collectionName: string) {
  const legacyItems = await getLegacyDocs(legacyCollection(legacyDb, "families", familyId, collectionName));
  for (const legacyItem of legacyItems.docs) {
    await setDoc(
      doc(db, "families", familyId, collectionName, legacyItem.id),
      legacyRecord(legacyItem.data()),
      { merge: false },
    );
  }
}

export async function migrateLegacyFirestoreData(user: FirebaseUser) {
  if (auth.currentUser?.uid !== user.uid) return false;

  const legacyUser = await getLegacyDoc(legacyDoc(legacyDb, "users", user.uid));
  if (!legacyUser.exists()) return false;

  const { id: _legacyId, familyId: legacyFamilyId, vendorOrgId: legacyVendorOrgId, role: legacyRole, ...legacyProfile } = legacyRecord(legacyUser.data());
  const profile = {
    ...legacyProfile,
    uid: user.uid,
    email: legacyEmailFor(user),
    role: legacyRole === "vendor" ? "vendor" : "member",
  };

  await setDoc(doc(db, "users", user.uid), profile, { merge: true });

  if (typeof legacyFamilyId === "string" && legacyFamilyId) {
    const legacyFamily = await getLegacyDoc(legacyDoc(legacyDb, "families", legacyFamilyId));
    if (legacyFamily.exists()) {
      const family = legacyRecord(legacyFamily.data());
      const ownerId = typeof family.ownerId === "string" ? family.ownerId : user.uid;
      if (ownerId === user.uid) {
        await setDoc(doc(db, "families", legacyFamilyId), { ...family, ownerId }, { merge: false });
        for (const collectionName of ["tasks", "documents", "vendors"]) {
          await importLegacyFamilyCollection(legacyFamilyId, collectionName);
        }
        await setDoc(doc(db, "users", user.uid), { familyId: legacyFamilyId }, { merge: true });
      }
    }
  }

  if (typeof legacyVendorOrgId === "string" && legacyVendorOrgId) {
    const legacyOrganization = await getLegacyDoc(legacyDoc(legacyDb, "vendorOrganizations", legacyVendorOrgId));
    if (legacyOrganization.exists()) {
      const organization = legacyRecord(legacyOrganization.data());
      if (organization.ownerId === user.uid) {
        await setDoc(doc(db, "vendorOrganizations", legacyVendorOrgId), organization, { merge: false });
        await setDoc(doc(db, "users", user.uid), { vendorOrgId: legacyVendorOrgId }, { merge: true });
      }
    }
  }

  return true;
}

export function doc(_database: typeof db, ...segments: string[]): DocumentReference {
  const path = pathFrom(segments);
  const ids = path.split("/");
  if (ids.length % 2 !== 0) throw new Error("Document path must end with a document ID");
  return { kind: "document", path, id: ids.at(-1)! };
}

export function collection(_database: typeof db, ...segments: string[]): CollectionReference {
  const path = pathFrom(segments);
  if (path.split("/").length % 2 === 0) throw new Error("Collection path must end with a collection ID");
  return { kind: "collection", path };
}

export function query(reference: CollectionReference, ..._constraints: unknown[]) {
  return reference;
}

export function where(..._constraints: unknown[]) {
  return undefined;
}

export async function getDoc(reference: DocumentReference) {
  const payload = await dataRequest<{ document: ClientDocument | null }>({ action: "get", path: reference.path });
  return snapshotFor(payload.document, reference.id);
}

export const getDocFromServer = getDoc;

export async function setDoc(reference: DocumentReference, data: Record<string, unknown>, options: SetOptions = {}) {
  await dataRequest({ action: "set", path: reference.path, data, merge: options.merge !== false });
}

export async function updateDoc(reference: DocumentReference, data: Record<string, unknown>) {
  await dataRequest({ action: "update", path: reference.path, data });
}

export async function deleteDoc(reference: DocumentReference) {
  await dataRequest({ action: "delete", path: reference.path });
}

export async function addDoc(reference: CollectionReference, data: Record<string, unknown>) {
  const payload = await dataRequest<{ document: ClientDocument }>({ action: "add", collection: reference.path, data });
  return { kind: "document", path: payload.document.path, id: payload.document.id } as DocumentReference;
}

async function refreshDocument(reference: DocumentReference, next: (snapshot: DocumentSnapshot) => void) {
  const snapshot = await getDoc(reference);
  next(snapshot);
}

async function refreshCollection(reference: CollectionReference, next: (snapshot: QuerySnapshot) => void) {
  const payload = await dataRequest<{ documents: ClientDocument[] }>({ action: "list", collection: reference.path });
  next({ docs: payload.documents.map((document) => snapshotFor(document, document.id)) });
}

export function onSnapshot(reference: DocumentReference, next: (snapshot: DocumentSnapshot) => void, onError?: (error: Error) => void): () => void;
export function onSnapshot(reference: CollectionReference, next: (snapshot: QuerySnapshot) => void, onError?: (error: Error) => void): () => void;
export function onSnapshot(
  reference: DocumentReference | CollectionReference,
  next: ((snapshot: DocumentSnapshot) => void) | ((snapshot: QuerySnapshot) => void),
  onError?: (error: Error) => void,
) {
  let stopped = false;
  const refresh = async () => {
    try {
      if (reference.kind === "document") {
        await refreshDocument(reference, next as (snapshot: DocumentSnapshot) => void);
      } else {
        await refreshCollection(reference, next as (snapshot: QuerySnapshot) => void);
      }
    } catch (error) {
      if (stopped) return;
      const syncError = error instanceof Error ? error : new Error(String(error));
      if (onError) onError(syncError);
      else console.error("Ditto data sync failed", syncError);
    }
  };

  void refresh();
  const timer = window.setInterval(() => void refresh(), 5_000);
  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map((provider) => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Ditto data error:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export {
  signInAnonymously,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  storageRef,
  uploadBytes,
  getDownloadURL,
};
export type { FirebaseUser };
