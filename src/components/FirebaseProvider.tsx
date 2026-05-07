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

type AppProfile = {
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

async function ensureUserProfile(user: FirebaseUser) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) return;

  await setDoc(userRef, {
    uid: user.uid,
    email: fallbackEmailFor(user),
    firstName: firstNameFor(user),
    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
    accountNumber: accountNumberFor(user.uid),
    photoURL: user.photoURL || '',
    role: 'member',
    createdAt: Timestamp.now(),
  });
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

    await setDoc(doc(db, 'families', familyId), payload, { merge: true });
    await setDoc(doc(db, 'users', signedInUser.uid), {
      uid: signedInUser.uid,
      email: fallbackEmailFor(signedInUser),
      firstName: data.profile?.firstName || firstNameFor(signedInUser),
      lastName: data.profile?.lastName || signedInUser.displayName?.split(' ').slice(1).join(' ') || '',
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
    }, { merge: true });

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
    setAppFamilyData,
  }), [user, profile, loading, familyData, tasks, documents, vendors, vendorOrg]);

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};
