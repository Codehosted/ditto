import { db } from "./_lib/db";

type RequestLike = { method?: string };
type ResponseLike = {
  setHeader(name: string, value: string): void;
  status(code: number): ResponseLike;
  json(body: unknown): void;
};

export default async function handler(_req: RequestLike, res: ResponseLike) {
  res.setHeader("Cache-Control", "no-store");

  try {
    await db()`SELECT 1`;
    res.status(200).json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("[api/health]", error);
    res.status(503).json({ ok: false, database: "unavailable" });
  }
}
