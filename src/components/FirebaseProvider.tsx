import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  auth,
  db,
  doc,
  getDoc,
  onAuthStateChanged,
  onSnapshot,
  collection,
  query,
  setDoc,
  signInAnonymously,
  signInWithPopup,
  signOut,
  googleProvider,
  Timestamp,
  type FirebaseUser,
} from '../firebase';

export { ErrorBoundary } from './ErrorBoundary';

export type AppProfile = {
  id?: string;
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  accountNumber?: string;
  photoURL?: string;
  familyId?: string;
  vendorOrgId?: string;
  role: 'admin' | 'member' | 'vendor';
  createdAt?: unknown;
};

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: AppProfile | null;
  loading: boolean;
  familyData: any | null;
  tasks: any[];
  documents: any[];
  vendors: any[];
  vendorOrg: any | null;
  ensureSignedIn: () => Promise<FirebaseUser>;
  signInWithGoogle: () => Promise<FirebaseUser>;
  signInAsGuest: () => Promise<FirebaseUser>;
  signOutUser: () => Promise<void>;
  ensureFamilyContext: () => Promise<{ user: FirebaseUser; profile: AppProfile; family: any }>;
  updateUserProfile: (updates: Partial<Pick<AppProfile, 'firstName' | 'lastName' | 'phone' | 'address' | 'city' | 'state' | 'zip'>>) => Promise<void>;
  setAppFamilyData: (data: any | null) => Promise<any | null>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};

function fallbackEmailFor(user: FirebaseUser) {
  return user.email || `guest-${user.uid}@ditto.local`;
}

function accountNumberFor(uid: string) {
  return `DITTO-${uid.slice(0, 5).toUpperCase()}`;
}

function firstNameFor(user: FirebaseUser) {
  if (user.displayName) return user.displayName.split(' ')[0] || 'Guest';
  if (user.email) return user.email.split('@')[0];
  return 'Guest';
}

function lastNameFor(user: FirebaseUser) {
  return user.displayName?.split(' ').slice(1).join(' ') || '';
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

function familyNameFor(profile: AppProfile | null, user: FirebaseUser) {
  const lastName = profile?.lastName || lastNameFor(user);
  const firstName = profile?.firstName || firstNameFor(user);
  return `${lastName || firstName || 'Ditto'} Family`;
}

function defaultFamilyPayload(profile: AppProfile | null, user: FirebaseUser) {
  return {
    name: familyNameFor(profile, user),
    ownerId: user.uid,
    deceased: {},
    preferences: {},
    checklist: {},
    subscriptionStatus: 'free',
    localBusinesses: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

async function ensureUserProfile(user: FirebaseUser): Promise<AppProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  const existing = snap.exists() ? ({ id: snap.id, ...snap.data() } as AppProfile) : null;

  const payload = compactObject({
    uid: user.uid,
    email: user.email || existing?.email || fallbackEmailFor(user),
    firstName: existing?.firstName || firstNameFor(user),
    lastName: existing?.lastName ?? lastNameFor(user),
    phone: existing?.phone,
    address: existing?.address,
    city: existing?.city,
    state: existing?.state,
    zip: existing?.zip,
    accountNumber: existing?.accountNumber || accountNumberFor(user.uid),
    photoURL: user.photoURL || existing?.photoURL || '',
    familyId: existing?.familyId,
    vendorOrgId: existing?.vendorOrgId,
    role: existing?.role || 'member',
    createdAt: existing?.createdAt || Timestamp.now(),
  });

  await setDoc(userRef, payload, { merge: true });
  return { id: user.uid, ...payload } as AppProfile;
}

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorOrg, setVendorOrg] = useState<any | null>(null);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await ensureUserProfile(result.user);
    return result.user;
  };

  const signInAsGuest = async () => {
    const result = await signInAnonymously(auth);
    await ensureUserProfile(result.user);
    return result.user;
  };

  const ensureSignedIn = async () => {
    if (auth.currentUser) {
      await ensureUserProfile(auth.currentUser);
      return auth.currentUser;
    }
    return signInAsGuest();
  };

  const signOutUser = async () => {
    await signOut(auth);
    setProfile(null);
    setFamilyData(null);
    setTasks([]);
    setDocuments([]);
    setVendors([]);
    setVendorOrg(null);
  };

  const updateUserProfile = async (updates: Partial<Pick<AppProfile, 'firstName' | 'lastName' | 'phone' | 'address' | 'city' | 'state' | 'zip'>>) => {
    const signedInUser = await ensureSignedIn();
    const currentProfile = await ensureUserProfile(signedInUser);
    const nextProfile = compactObject({
      uid: signedInUser.uid,
      email: signedInUser.email || currentProfile.email || fallbackEmailFor(signedInUser),
      firstName: updates.firstName ?? currentProfile.firstName ?? firstNameFor(signedInUser),
      lastName: updates.lastName ?? currentProfile.lastName ?? lastNameFor(signedInUser),
      phone: updates.phone ?? currentProfile.phone,
      address: updates.address ?? currentProfile.address,
      city: updates.city ?? currentProfile.city,
      state: updates.state ?? currentProfile.state,
      zip: updates.zip ?? currentProfile.zip,
      accountNumber: currentProfile.accountNumber || accountNumberFor(signedInUser.uid),
      photoURL: signedInUser.photoURL || currentProfile.photoURL || '',
      familyId: currentProfile.familyId,
      vendorOrgId: currentProfile.vendorOrgId,
      role: currentProfile.role || 'member',
      createdAt: currentProfile.createdAt || Timestamp.now(),
    });

    await setDoc(doc(db, 'users', signedInUser.uid), nextProfile, { merge: true });
    setProfile({ id: signedInUser.uid, ...nextProfile } as AppProfile);
  };

  const ensureFamilyContext = async () => {
    const signedInUser = await ensureSignedIn();
    let currentProfile = await ensureUserProfile(signedInUser);
    const familyId = currentProfile.familyId || `family-${signedInUser.uid}`;
    const familyRef = doc(db, 'families', familyId);

    if (!currentProfile.familyId) {
      const nextProfile = compactObject({
        ...currentProfile,
        uid: signedInUser.uid,
        email: signedInUser.email || currentProfile.email || fallbackEmailFor(signedInUser),
        firstName: currentProfile.firstName || firstNameFor(signedInUser),
        lastName: currentProfile.lastName ?? lastNameFor(signedInUser),
        accountNumber: currentProfile.accountNumber || accountNumberFor(signedInUser.uid),
        photoURL: signedInUser.photoURL || currentProfile.photoURL || '',
        role: currentProfile.role || 'member',
        familyId,
        createdAt: currentProfile.createdAt || Timestamp.now(),
      });

      delete (nextProfile as any).id;
      await setDoc(doc(db, 'users', signedInUser.uid), nextProfile, { merge: true });
      currentProfile = { id: signedInUser.uid, ...nextProfile } as AppProfile;
      const familyPayload = defaultFamilyPayload(currentProfile, signedInUser);
      await setDoc(familyRef, familyPayload, { merge: true });
      const family = { id: familyId, ...familyPayload };
      setProfile(currentProfile);
      setFamilyData(family);
      return { user: signedInUser, profile: currentProfile, family };
    }

    const familySnap = await getDoc(familyRef);
    if (familySnap.exists()) {
      const family = { id: familySnap.id, ...familySnap.data() };
      setFamilyData(family);
      return { user: signedInUser, profile: currentProfile, family };
    }

    const familyPayload = defaultFamilyPayload(currentProfile, signedInUser);

    await setDoc(familyRef, familyPayload, { merge: true });
    const family = { id: familyId, ...familyPayload };
    setFamilyData(family);
    return { user: signedInUser, profile: currentProfile, family };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setFamilyData(null);
        setTasks([]);
        setDocuments([]);
        setVendors([]);
        setVendorOrg(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await ensureUserProfile(nextUser);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    return onSnapshot(userRef, (snap) => {
      setProfile(snap.exists() ? ({ id: snap.id, ...snap.data() } as AppProfile) : null);
    });
  }, [user]);

  useEffect(() => {
    if (!profile?.familyId) {
      setFamilyData(null);
      setTasks([]);
      setDocuments([]);
      setVendors([]);
      return;
    }

    const familyId = profile.familyId;
    const unsubscribers = [
      onSnapshot(doc(db, 'families', familyId), (snap) => {
        setFamilyData(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      }),
      onSnapshot(query(collection(db, 'families', familyId, 'tasks')), (snap) => {
        setTasks(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      }),
      onSnapshot(query(collection(db, 'families', familyId, 'documents')), (snap) => {
        setDocuments(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      }),
      onSnapshot(query(collection(db, 'families', familyId, 'vendors')), (snap) => {
        setVendors(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
      }),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [profile?.familyId]);

  useEffect(() => {
    if (!profile?.vendorOrgId) {
      setVendorOrg(null);
      return;
    }

    return onSnapshot(doc(db, 'vendorOrganizations', profile.vendorOrgId), (snap) => {
      setVendorOrg(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    });
  }, [profile?.vendorOrgId]);

  const setAppFamilyData = async (data: any | null) => {
    if (!data) {
      setFamilyData(null);
      return null;
    }

    const signedInUser = await ensureSignedIn();
    const familyId = data.id || `family-${signedInUser.uid}`;
    const payload = {
      name: data.name || `${data.deceased?.fullName || 'Ditto'} Family`,
      ownerId: signedInUser.uid,
      deceased: data.deceased || {},
      preferences: data.preferences || {},
      checklist: data.checklist || {},
      subscriptionStatus: data.subscriptionStatus || 'free',
      nextSteps: data.nextSteps || null,
      localBusinesses: data.localBusinesses || [],
      createdAt: data.createdAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const profilePayload = compactObject({
      uid: signedInUser.uid,
      email: fallbackEmailFor(signedInUser),
      firstName: data.profile?.firstName || firstNameFor(signedInUser),
      lastName: data.profile?.lastName || lastNameFor(signedInUser),
      phone: data.profile?.phone || '',
      address: data.profile?.address || '',
      city: data.profile?.city || data.preferences?.city || '',
      state: data.profile?.state || data.preferences?.state || '',
      zip: data.profile?.zip || data.preferences?.zip || '',
      accountNumber: profile?.accountNumber || accountNumberFor(signedInUser.uid),
      photoURL: signedInUser.photoURL || '',
      role: data.profile?.role || profile?.role || 'member',
      familyId,
      createdAt: profile?.createdAt || Timestamp.now(),
    });

    await setDoc(doc(db, 'families', familyId), payload, { merge: true });
    await setDoc(doc(db, 'users', signedInUser.uid), profilePayload, { merge: true });

    setFamilyData({ id: familyId, ...payload });
    setProfile({ id: signedInUser.uid, ...profilePayload } as AppProfile);

    return { id: familyId, ...payload };
  };

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    familyData,
    tasks,
    documents,
    vendors,
    vendorOrg,
    ensureSignedIn,
    signInWithGoogle,
    signInAsGuest,
    signOutUser,
    ensureFamilyContext,
    updateUserProfile,
    setAppFamilyData,
  }), [user, profile, loading, familyData, tasks, documents, vendors, vendorOrg]);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
