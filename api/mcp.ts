import { HttpError } from "./_lib/errors.js";
import { requireMcpToken } from "./_lib/mcp-auth.js";
import { handleMcpRequest } from "./_lib/mcp.js";

type RequestLike = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ResponseLike = {
  setHeader(name: string, value: string): void;
  status(code: number): ResponseLike;
  json(body: unknown): void;
  end(): void;
};

function parseBody(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    requireMcpToken(req.headers);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    if (statusCode === 401) res.setHeader("WWW-Authenticate", "Bearer");
    res.status(statusCode).json({ error: error instanceof HttpError ? error.message : "MCP authentication is unavailable" });
    return;
  }

  const payload = parseBody(req.body);
  if (!payload || typeof payload !== "object") {
    res.status(400).json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    return;
  }

  try {
    if (Array.isArray(payload)) {
      if (payload.length === 0) {
        res.status(400).json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid JSON-RPC request" } });
        return;
      }
      const results = (await Promise.all(payload.map((message) => handleMcpRequest(message)))).filter(Boolean);
      if (results.length === 0) {
        res.status(204).end();
        return;
      }
      res.status(200).json(results);
      return;
    }

    const result = await handleMcpRequest(payload);
    if (!result) {
      res.status(204).end();
      return;
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("[api/mcp]", error);
    res.status(500).json({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Internal error" } });
  }
}
