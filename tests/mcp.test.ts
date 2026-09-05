import { describe, expect, test } from "bun:test";

import { HttpError } from "../api/_lib/errors.js";
import { requireMcpToken, sha256 } from "../api/_lib/mcp-auth.js";
import {
  callDittoMcpTool,
  handleMcpRequest,
  maxMcpDocumentDataBytes,
  maxMcpUpsertDataBytes,
  type DittoMcpStore,
  type McpDocument,
} from "../api/_lib/mcp.js";
import type { DocumentPath } from "../api/_lib/documents.js";
import mcpHandler from "../api/mcp.js";

function document(path: string, data: Record<string, unknown> = {}): McpDocument {
  return {
    id: path.split("/").at(-1)!,
    path,
    data,
    dataBytes: Buffer.byteLength(JSON.stringify(data), "utf8"),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function fakeStore(seed: McpDocument[] = []) {
  const documents = new Map(seed.map((item) => [item.path, item]));
  const metadata = (item: McpDocument): McpDocument => {
    const { data: _data, ...rest } = item;
    return { ...rest, dataOmitted: true };
  };
  const store: DittoMcpStore = {
    async health() {},
    async list(collectionPath, limit, afterDocumentId) {
      return [...documents.values()]
        .filter((item) => item.path.split("/").slice(0, -1).join("/") === collectionPath && (!afterDocumentId || item.id > afterDocumentId))
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, limit)
        .map(metadata);
    },
    async get(path) {
      const item = documents.get(path);
      if (!item) return null;
      return item.dataBytes <= maxMcpDocumentDataBytes ? item : metadata(item);
    },
    async upsert(target: DocumentPath, data) {
      const existing = documents.get(target.path);
      const next = document(target.path, { ...existing?.data, ...data });
      documents.set(target.path, next);
      return metadata(next);
    },
  };
  return { store, documents };
}

describe("MCP bearer authentication", () => {
  test("accepts only a token matching the configured digest", () => {
    const digest = sha256("agent-secret");
    expect(() => requireMcpToken({ authorization: "Bearer agent-secret" }, digest)).not.toThrow();
    expect(() => requireMcpToken({ authorization: "Bearer wrong" }, digest)).toThrow(HttpError);
    expect(() => requireMcpToken({}, digest)).toThrow("Authentication is required");
  });

  test("fails closed when the digest is missing or malformed", () => {
    expect(() => requireMcpToken({ authorization: "Bearer anything" }, "")).toThrow("MCP authentication is not configured");
    expect(() => requireMcpToken({ authorization: "Bearer anything" }, "not-a-digest")).toThrow("MCP authentication is not configured");
  });

  test("protects the HTTP endpoint before handling JSON-RPC", async () => {
    const previousDigest = process.env.DITTO_MCP_TOKEN_SHA256;
    process.env.DITTO_MCP_TOKEN_SHA256 = sha256("agent-secret");
    try {
      const unauthorized = responseRecorder();
      await mcpHandler({ method: "POST", headers: {}, body: { jsonrpc: "2.0", id: 1, method: "initialize" } }, unauthorized.response);
      expect(unauthorized.statusCode).toBe(401);
      expect(unauthorized.headers["WWW-Authenticate"]).toBe("Bearer");

      const authorized = responseRecorder();
      await mcpHandler({
        method: "POST",
        headers: { authorization: "Bearer agent-secret" },
        body: { jsonrpc: "2.0", id: 1, method: "initialize" },
      }, authorized.response);
      expect(authorized.statusCode).toBe(200);
      expect(authorized.body).toMatchObject({ result: { serverInfo: { name: "ditto-production-mcp" } } });
    } finally {
      if (previousDigest === undefined) delete process.env.DITTO_MCP_TOKEN_SHA256;
      else process.env.DITTO_MCP_TOKEN_SHA256 = previousDigest;
    }
  });
});

function responseRecorder() {
  const recorder: {
    headers: Record<string, string>;
    statusCode?: number;
    body?: unknown;
    response: {
      setHeader(name: string, value: string): void;
      status(code: number): typeof recorder.response;
      json(body: unknown): void;
      end(): void;
    };
  } = {
    headers: {},
    response: undefined as never,
  };
  recorder.response = {
    setHeader(name, value) {
      recorder.headers[name] = value;
    },
    status(code) {
      recorder.statusCode = code;
      return recorder.response;
    },
    json(body) {
      recorder.body = body;
    },
    end() {},
  };
  return recorder;
}

describe("Ditto MCP tools", () => {
  test("advertises its protocol and tools", async () => {
    const { store } = fakeStore();
    const initialized = await handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "initialize" }, store);
    expect(initialized).toMatchObject({ result: { protocolVersion: "2024-11-05", serverInfo: { name: "ditto-production-mcp" } } });

    const listed = await handleMcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list" }, store);
    expect(JSON.stringify(listed)).toContain("ditto_document_upsert");
  });

  test("lists approved documents with bounded pagination", async () => {
    const { store } = fakeStore([document("families/a"), document("families/b"), document("users/u")]);
    const result = await callDittoMcpTool("ditto_documents_list", { collection: "families", limit: 1 }, store);
    expect(result).toMatchObject({
      documents: [{ id: "a", path: "families/a", dataOmitted: true }],
      nextAfterDocumentId: "a",
    });
  });

  test("lists metadata without fetching or returning document data", async () => {
    const { store } = fakeStore([
      document("families/a", { notes: "a".repeat(900_000) }),
      document("families/b", { notes: "b".repeat(900_000) }),
    ]);
    const result = await callDittoMcpTool("ditto_documents_list", { collection: "families", limit: 2 }, store) as {
      documents: McpDocument[];
      nextAfterDocumentId: string | null;
    };
    expect(result.documents.map(({ id }) => id)).toEqual(["a", "b"]);
    expect(result.documents.every(({ data, dataOmitted }) => data === undefined && dataOmitted)).toBeTrue();
    expect(Buffer.byteLength(JSON.stringify(result), "utf8")).toBeLessThan(10_000);
  });

  test("reads an approved document", async () => {
    const expected = document("families/family-1/tasks/task-1", { title: "Call director" });
    const { store } = fakeStore([expected]);
    expect(await callDittoMcpTool("ditto_document_get", { path: expected.path }, store)).toEqual({ document: expected });
  });

  test("omits oversized document data from get responses", async () => {
    const expected = document("families/family-1/documents/document-1", { notes: "🙂".repeat(400_000) });
    const { store } = fakeStore([expected]);
    const result = await callDittoMcpTool("ditto_document_get", { path: expected.path }, store) as { document: McpDocument };
    expect(result.document).toMatchObject({ path: expected.path, dataOmitted: true, dataBytes: expected.dataBytes });
    expect(result.document.data).toBeUndefined();
    expect(result.document.dataBytes).toBeGreaterThan(maxMcpDocumentDataBytes);
  });

  test("merges approved writes", async () => {
    const original = document("families/family-1/tasks/task-1", { title: "Call director", done: false });
    const { store, documents } = fakeStore([original]);
    const result = await callDittoMcpTool("ditto_document_upsert", { path: original.path, data: { done: true } }, store) as { document: McpDocument };
    expect(documents.get(original.path)?.data).toEqual({ title: "Call director", done: true });
    expect(result.document).toMatchObject({ path: original.path, dataOmitted: true });
    expect(result.document.data).toBeUndefined();
  });

  test("rejects MCP writes above the UTF-8 byte limit before mutation", async () => {
    const { store, documents } = fakeStore();
    const data = { notes: "🙂".repeat(Math.floor(maxMcpUpsertDataBytes * 0.3)) };
    await expect(callDittoMcpTool("ditto_document_upsert", { path: "families/family-1/tasks/task-1", data }, store)).rejects.toThrow("write limit");
    expect(documents.size).toBe(0);
  });

  test("keeps user profiles and audit logs read-only", async () => {
    const { store } = fakeStore();
    await expect(callDittoMcpTool("ditto_document_upsert", { path: "users/user-1", data: { role: "admin" } }, store)).rejects.toThrow("read-only");
    await expect(callDittoMcpTool("ditto_document_upsert", { path: "auditLogs/event-1", data: { userId: "user-1" } }, store)).rejects.toThrow("read-only");
  });

  test("rejects unapproved and unexpected nested roots", async () => {
    const { store } = fakeStore();
    await expect(callDittoMcpTool("ditto_document_get", { path: "secrets/key" }, store)).rejects.toThrow("not available");
    await expect(callDittoMcpTool("ditto_document_get", { path: "users/user-1/private/note" }, store)).rejects.toThrow("Nested access");
    await expect(callDittoMcpTool("ditto_document_get", { path: "families/family-1/secrets/note" }, store)).rejects.toThrow("family record path");
  });

  test("returns tool failures without failing the JSON-RPC transport", async () => {
    const { store } = fakeStore();
    const response = await handleMcpRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "ditto_document_upsert", arguments: { path: "users/user-1", data: { role: "admin" } } },
    }, store);
    expect(response).toMatchObject({ result: { isError: true } });
  });

  test("executes notifications without returning JSON-RPC responses", async () => {
    const { store, documents } = fakeStore();
    expect(await handleMcpRequest({ jsonrpc: "2.0", method: "ping" }, store)).toBeNull();
    expect(await handleMcpRequest({ jsonrpc: "2.0", method: "notifications/roots/list_changed" }, store)).toBeNull();
    expect(await handleMcpRequest({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name: "ditto_document_upsert", arguments: { path: "families/family-1/tasks/task-1", data: { done: true } } },
    }, store)).toBeNull();
    expect(documents.get("families/family-1/tasks/task-1")?.data).toEqual({ done: true });
  });
});
