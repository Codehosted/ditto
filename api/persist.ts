import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

type PersistPayload = Record<string, unknown>;

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const sql = getSql();
  if (!sql) {
    return res.status(503).json({ error: 'DATABASE_URL is not configured' });
  }

  try {
    if (req.method === 'GET') {
      const clientId = typeof req.query.clientId === 'string' ? req.query.clientId : '';
      if (!clientId) {
        return res.status(400).json({ error: 'clientId query parameter is required' });
      }
      const rows = await sql`
        SELECT payload, updated_at
        FROM app_snapshots
        WHERE client_id = ${clientId}
        LIMIT 1
      `;
      const row = rows[0] as { payload: PersistPayload; updated_at: string } | undefined;
      if (!row) {
        return res.status(404).json({ error: 'not found' });
      }
      return res.status(200).json({
        payload: row.payload,
        updatedAt: row.updated_at,
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const clientId = body?.clientId as string | undefined;
      const payload = body?.payload as PersistPayload | undefined;
      if (!clientId || !payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'clientId and payload are required' });
      }
      const json = JSON.stringify(payload);
      await sql`
        INSERT INTO app_snapshots (client_id, payload, updated_at)
        VALUES (${clientId}, ${json}::jsonb, NOW())
        ON CONFLICT (client_id) DO UPDATE SET
          payload = EXCLUDED.payload,
          updated_at = NOW()
      `;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'persist failed';
    console.error('[api/persist]', message);
    return res.status(500).json({ error: message });
  }
}
