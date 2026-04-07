import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { FirebaseUser } from '../firebase';
import { loadPersistedSnapshot, savePersistedSnapshot, type AppPersistSnapshot } from '../services/neonPersistence';

export { ErrorBoundary } from './ErrorBoundary';

interface FirebaseContextType {
  user: FirebaseUser | null;
  profile: any | null;
  loading: boolean;
  familyData: any | null;
  tasks: any[];
  documents: any[];
  vendors: any[];
  vendorOrg: any | null;
  /** Merge local app state after onboarding or similar flows (persists to Neon). */
  setAppFamilyData: (data: any | null) => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};

function migrateFromLocalStorage(): any | null {
  try {
    const raw = localStorage.getItem('ditto_deceased');
    if (!raw) return null;
    const d = JSON.parse(raw) as {
      firstName?: string;
      lastName?: string;
      dateOfPassing?: string;
      location?: { zipCode?: string; city?: string };
    };
    const fullName = [d.firstName, d.lastName].filter(Boolean).join(' ').trim();
    return {
      id: 'local-migrated',
      deceased: { fullName: fullName || 'your loved one' },
      preferences: {
        zip: d.location?.zipCode,
        city: d.location?.city,
      },
    };
  } catch {
    return null;
  }
}

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user] = useState<any | null>(null);
  const [profile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyData, setFamilyData] = useState<any | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [vendorOrg, setVendorOrg] = useState<any | null>(null);
  const hydrated = useRef(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await loadPersistedSnapshot();
        if (cancelled) return;
        if (remote) {
          if (remote.familyData != null) setFamilyData(remote.familyData);
          if (Array.isArray(remote.tasks)) setTasks(remote.tasks);
          if (Array.isArray(remote.documents)) setDocuments(remote.documents);
          if (Array.isArray(remote.vendors)) setVendors(remote.vendors);
          if (remote.vendorOrg !== undefined) setVendorOrg(remote.vendorOrg);
        } else {
          const migrated = migrateFromLocalStorage();
          if (migrated) setFamilyData(migrated);
        }
      } finally {
        if (!cancelled) {
          hydrated.current = true;
          setLoading(false);
          skipNextSave.current = true;
          setTimeout(() => {
            skipNextSave.current = false;
          }, 0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated.current || skipNextSave.current) return;
    const snapshot: AppPersistSnapshot = {
      familyData,
      tasks,
      documents,
      vendors,
      vendorOrg,
    };
    const t = window.setTimeout(() => {
      void savePersistedSnapshot(snapshot);
    }, 700);
    return () => window.clearTimeout(t);
  }, [familyData, tasks, documents, vendors, vendorOrg]);

  const setAppFamilyData = (data: any | null) => {
    setFamilyData(data);
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        profile,
        loading,
        familyData,
        tasks,
        documents,
        vendors,
        vendorOrg,
        setAppFamilyData,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
