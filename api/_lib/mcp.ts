import postgres from "postgres";

import { db } from "./db.js";
import { parseCollectionPath, parseDocumentData, parseDocumentPath, type DocumentPath } from "./documents.js";
import { HttpError } from "./errors.js";

const protocolVersion = "2024-11-05";
const readRoots = new Set([
  "users",
  "families",
  "vendorOrganizations",
  "vendors",
  "invitations",
  "auditLogs",
  "checkoutRequests",
  "meetings",
  "signatureRequests",
]);
const writeRoots = new Set([
  "families",
  "vendorOrganizations",
  "vendors",
  "invitations",
  "checkoutRequests",
  "meetings",
  "signatureRequests",
]);
const familySubcollections = new Set(["tasks", "documents", "vendors"]);

export type McpDocument = {
  id: string;
  path: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type StoredDocument = {
  document_path: string;
  collection_path: string;
  document_id: string;
  data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

export type DittoMcpStore = {
  health(): Promise<void>;
  list(collectionPath: string, limit: number, afterDocumentId?: string): Promise<McpDocument[]>;
  get(documentPath: string): Promise<McpDocument | null>;
  upsert(target: DocumentPath, data: Record<string, unknown>): Promise<McpDocument>;
};

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
};

function documentForClient(row: StoredDocument): McpDocument {
  return {
    id: row.document_id,
    path: row.document_path,
    data: row.data,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const postgresMcpStore: DittoMcpStore = {
  async health() {
    await db()`SELECT 1`;
  },

  async list(collectionPath, limit, afterDocumentId) {
    const rows = afterDocumentId
      ? await db()<StoredDocument[]>`
          SELECT document_path, collection_path, document_id, data, created_at, updated_at
          FROM ditto_documents
          WHERE collection_path = ${collectionPath} AND document_id > ${afterDocumentId}
          ORDER BY document_id ASC
          LIMIT ${limit}
        `
      : await db()<StoredDocument[]>`
          SELECT document_path, collection_path, document_id, data, created_at, updated_at
          FROM ditto_documents
          WHERE collection_path = ${collectionPath}
          ORDER BY document_id ASC
          LIMIT ${limit}
        `;
    return rows.map(documentForClient);
  },

  async get(documentPath) {
    const [row] = await db()<StoredDocument[]>`
      SELECT document_path, collection_path, document_id, data, created_at, updated_at
      FROM ditto_documents
      WHERE document_path = ${documentPath}
    `;
    return row ? documentForClient(row) : null;
  },

  async upsert(target, data) {
    const [row] = await db()<StoredDocument[]>`
      INSERT INTO ditto_documents (document_path, collection_path, document_id, data)
      VALUES (${target.path}, ${target.collectionPath}, ${target.id}, ${db().json(data as postgres.JSONValue)})
      ON CONFLICT (document_path) DO UPDATE SET
        data = ditto_documents.data || EXCLUDED.data,
        updated_at = now()
      RETURNING document_path, collection_path, document_id, data, created_at, updated_at
    `;

    if (target.segments[0] === "families" && target.segments.length === 2 && typeof row.data.ownerId === "string") {
      await db()`
        INSERT INTO ditto_family_members (family_id, user_id)
        VALUES (${target.id}, ${row.data.ownerId})
        ON CONFLICT (family_id, user_id) DO NOTHING
      `;
    }

    return documentForClient(row);
  },
};

export const dittoMcpTools = [
  {
    name: "ditto_system_status",
    description: "Check Ditto's production data connection and report this agent's data access scope.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "ditto_documents_list",
    description: "List documents in an approved Ditto collection, ordered by document ID.",
    inputSchema: {
      type: "object",
      properties: {
        collection: { type: "string", description: "Collection path, such as families or families/FAMILY_ID/tasks." },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
        afterDocumentId: { type: "string", description: "Return IDs after this value for pagination." },
      },
      required: ["collection"],
      additionalProperties: false,
    },
  },
  {
    name: "ditto_document_get",
    description: "Read one document from an approved Ditto path.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "Document path, such as families/FAMILY_ID." } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "ditto_document_upsert",
    description: "Create or merge fields into an approved Ditto document. Existing fields not supplied are preserved.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Writable document path." },
        data: { type: "object", description: "Fields to merge into the document." },
      },
      required: ["path", "data"],
      additionalProperties: false,
    },
  },
] as const;

function objectArguments(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Tool arguments must be an object");
  }
  return value as Record<string, unknown>;
}

function optionalString(value: unknown, label: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value || value.length > 200 || /[\u0000-\u001f]/.test(value)) {
    throw new HttpError(400, `${label} is invalid`);
  }
  return value;
}

function assertRoot(path: string, writable: boolean) {
  const segments = path.split("/");
  const root = segments[0];
  const roots = writable ? writeRoots : readRoots;
  if (!roots.has(root)) {
    throw new HttpError(403, writable ? "This collection is read-only" : "This collection is not available");
  }
  if (root === "families") {
    if (segments.length === 2 || (segments.length === 4 && familySubcollections.has(segments[2]))) return;
    throw new HttpError(403, "This family record path is not available");
  }
  if (segments.length > 2) {
    throw new HttpError(403, "Nested access is not available for this collection");
  }
}

function jsonRpcResult(id: JsonRpcRequest["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function jsonRpcError(id: JsonRpcRequest["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

function toolResult(result: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
  };
}

export async function callDittoMcpTool(name: string, input: unknown, store: DittoMcpStore = postgresMcpStore) {
  const args = objectArguments(input);

  switch (name) {
    case "ditto_system_status":
      await store.health();
      return {
        ok: true,
        database: "connected",
        readRoots: [...readRoots],
        writeRoots: [...writeRoots],
        writes: "merge-only",
      };

    case "ditto_documents_list": {
      const collectionPath = parseCollectionPath(args.collection);
      assertRoot(`${collectionPath}/placeholder`, false);
      const limit = args.limit === undefined ? 50 : args.limit;
      if (!Number.isInteger(limit) || (limit as number) < 1 || (limit as number) > 100) {
        throw new HttpError(400, "Limit must be an integer from 1 to 100");
      }
      const afterDocumentId = optionalString(args.afterDocumentId, "After document ID");
      const documents = await store.list(collectionPath, limit as number, afterDocumentId);
      return {
        documents,
        nextAfterDocumentId: documents.length === limit ? documents.at(-1)?.id ?? null : null,
      };
    }

    case "ditto_document_get": {
      const target = parseDocumentPath(args.path);
      assertRoot(target.path, false);
      return { document: await store.get(target.path) };
    }

    case "ditto_document_upsert": {
      const target = parseDocumentPath(args.path);
      assertRoot(target.path, true);
      const data = parseDocumentData(args.data);
      return { document: await store.upsert(target, data) };
    }

    default:
      throw new HttpError(404, `Unknown MCP tool: ${name}`);
  }
}

export async function handleMcpRequest(message: JsonRpcRequest, store: DittoMcpStore = postgresMcpStore) {
  const id = message?.id ?? null;
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return jsonRpcError(id, -32600, "Invalid JSON-RPC request");
  }

  switch (message.method) {
    case "initialize":
      return jsonRpcResult(id, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: "ditto-production-mcp", version: "1.0.0" },
      });
    case "notifications/initialized":
      return null;
    case "ping":
      return jsonRpcResult(id, {});
    case "tools/list":
      return jsonRpcResult(id, { tools: dittoMcpTools });
    case "tools/call": {
      const params = message.params && typeof message.params === "object" && !Array.isArray(message.params)
        ? message.params as Record<string, unknown>
        : {};
      if (typeof params.name !== "string" || !params.name) {
        return jsonRpcError(id, -32602, "Missing tool name");
      }
      try {
        return jsonRpcResult(id, toolResult(await callDittoMcpTool(params.name, params.arguments ?? {}, store)));
      } catch (error) {
        const message = error instanceof HttpError ? error.message : "Tool call failed";
        return jsonRpcResult(id, { isError: true, content: [{ type: "text", text: message }] });
      }
    }
    default:
      return jsonRpcError(id, -32601, `Method not found: ${message.method}`);
  }
}
