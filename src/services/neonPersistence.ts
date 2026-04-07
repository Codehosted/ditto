const CLIENT_KEY = 'ditto_neon_client_id';

export type AppPersistSnapshot = {
  familyData: unknown;
  tasks: unknown[];
  documents: unknown[];
  vendors: unknown[];
  vendorOrg: unknown | null;
};

function getOrCreateClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `ditto-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return `ditto-fallback-${Date.now()}`;
  }
}

export function getPersistClientId(): string {
  return getOrCreateClientId();
}

export async function loadPersistedSnapshot(): Promise<AppPersistSnapshot | null> {
  const clientId = getOrCreateClientId();
  const res = await fetch(`/api/persist?clientId=${encodeURIComponent(clientId)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    if (res.status === 503) {
      console.warn('Neon persistence API unavailable (configure DATABASE_URL on the server).');
    }
    return null;
  }
  const data = (await res.json()) as { payload: AppPersistSnapshot };
  return data.payload ?? null;
}

export async function savePersistedSnapshot(snapshot: AppPersistSnapshot): Promise<void> {
  const clientId = getOrCreateClientId();
  const res = await fetch('/api/persist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, payload: snapshot }),
  });
  if (!res.ok && res.status !== 503) {
    console.warn('Failed to save snapshot', await res.text());
  }
}
