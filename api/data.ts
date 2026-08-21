import { randomUUID } from "node:crypto";
import postgres from "postgres";

import { requireIdentity, type Identity } from "./_lib/auth";
import { db } from "./_lib/db";
import { parseCollectionPath, parseDocumentData, parseDocumentPath, type DocumentPath } from "./_lib/documents";
import { HttpError } from "./_lib/errors";

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

type StoredDocument = {
  document_path: string;
  collection_path: string;
  document_id: string;
  data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

type Operation = "get" | "list" | "set" | "add" | "update" | "delete";

type RequestBody = {
  action?: Operation;
  path?: unknown;
  collection?: unknown;
  data?: unknown;
  merge?: unknown;
};

const adminEmail = (process.env.DITTO_ADMIN_EMAIL || "bookdrakequantum@gmail.com").toLowerCase();

function documentForClient(row: StoredDocument) {
  return {
    id: row.document_id,
    path: row.document_path,
    data: row.data,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function parseBody(value: unknown): RequestBody {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as RequestBody;
    } catch {
      throw new HttpError(400, "Request body must be valid JSON");
    }
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Request body must be an object");
  }

  return value as RequestBody;
}

function operationFor(value: unknown): Operation {
  if (value === "get" || value === "list" || value === "set" || value === "add" || value === "update" || value === "delete") {
    return value;
  }

  throw new HttpError(400, "Unsupported data operation");
}

async function findDocument(path: string) {
  const [row] = await db()<StoredDocument[]>`
    SELECT document_path, collection_path, document_id, data, created_at, updated_at
    FROM ditto_documents
    WHERE document_path = ${path}
  `;
  return row;
}

function dataString(row: StoredDocument | undefined, key: string) {
  const value = row?.data[key];
  return typeof value === "string" ? value : undefined;
}

function isAdmin(identity: Identity) {
  return identity.email === adminEmail;
}

async function canAccessFamily(identity: Identity, familyId: string, admin: boolean) {
  if (admin) return true;

  const family = await findDocument(`families/${familyId}`);
  if (!family) return false;
  if (dataString(family, "ownerId") === identity.uid) return true;

  const [member] = await db()<{ user_id: string }[]>`
    SELECT user_id
    FROM ditto_family_members
    WHERE family_id = ${familyId} AND user_id = ${identity.uid}
    LIMIT 1
  `;
  return Boolean(member);
}

async function grantFamilyAccess(target: DocumentPath, family: StoredDocument) {
  if (target.segments[0] !== "families" || target.segments.length !== 2) return;

  const ownerId = dataString(family, "ownerId");
  if (!ownerId) return;

  await db()`
    INSERT INTO ditto_family_members (family_id, user_id)
    VALUES (${target.id}, ${ownerId})
    ON CONFLICT (family_id, user_id) DO NOTHING
  `;
}

async function authorizeDocument(
  operation: Operation,
  target: DocumentPath,
  identity: Identity,
  incoming: Record<string, unknown> | undefined,
  existing: StoredDocument | undefined,
) {
  const admin = isAdmin(identity);
  const [root, rootId] = target.segments;

  if (root === "users") {
    if (rootId !== identity.uid && !admin) {
      throw new HttpError(403, "You cannot access this profile");
    }

    if (operation === "set" || operation === "update" || operation === "add") {
      const nextUid = incoming?.uid;
      const nextRole = incoming?.role;
      const previousRole = dataString(existing, "role") || "member";

      if (rootId !== identity.uid && !admin) {
        throw new HttpError(403, "You cannot modify this profile");
      }
      if (typeof nextUid === "string" && nextUid !== rootId) {
        throw new HttpError(400, "Profile UID cannot change");
      }
      const authenticatedEmail = identity.email || `guest-${identity.uid}@ditto.local`;
      if (!admin && incoming?.email !== undefined && incoming.email !== authenticatedEmail) {
        throw new HttpError(403, "Profile email must match the signed-in user");
      }
      if (!admin && nextRole !== undefined && nextRole !== previousRole) {
        throw new HttpError(403, "Profile role cannot change");
      }
    }
    return;
  }

  if (root === "families") {
    if (!rootId) throw new HttpError(400, "Family ID is required");
    const familyAccess = await canAccessFamily(identity, rootId, admin);

    if (target.segments.length === 2) {
      const ownerId = incoming?.ownerId;
      if (!existing && (operation === "set" || operation === "add")) {
        if (ownerId !== identity.uid && !admin) {
          throw new HttpError(403, "Only the family owner can create a family");
        }
        return;
      }

      if (!familyAccess) throw new HttpError(403, "You cannot access this family");
      const previousOwner = dataString(existing, "ownerId");
      if (incoming?.ownerId !== undefined && previousOwner && ownerId !== previousOwner && !admin) {
        throw new HttpError(403, "Family owner cannot change");
      }
      return;
    }

    if (!familyAccess) throw new HttpError(403, "You cannot access this family");

    if (!existing && (operation === "set" || operation === "add") && target.segments[2] === "documents") {
      if (incoming?.uploadedBy !== identity.uid || incoming?.uploadedByUid !== identity.uid) {
        throw new HttpError(403, "Document uploads must identify the signed-in user");
      }
    }
    return;
  }

  if (root === "vendorOrganizations") {
    const organizationAccess = admin || dataString(existing, "ownerId") === identity.uid;
    if (!existing && (operation === "set" || operation === "add")) {
      if (incoming?.ownerId !== identity.uid && !admin) {
        throw new HttpError(403, "Only the organization owner can create it");
      }
      return;
    }
    if (!organizationAccess) throw new HttpError(403, "You cannot access this organization");
    return;
  }

  if (root === "vendors") {
    if (operation !== "get" && !admin) throw new HttpError(403, "Only administrators can modify vendors");
    return;
  }

  if (root === "invitations") {
    if (operation === "get" || operation === "update" || operation === "delete") {
      const email = dataString(existing, "email");
      const familyId = dataString(existing, "familyId");
      if (!admin && identity.email !== email && !(familyId && await canAccessFamily(identity, familyId, admin))) {
        throw new HttpError(403, "You cannot access this invitation");
      }
      return;
    }

    const familyId = typeof incoming?.familyId === "string" ? incoming.familyId : undefined;
    if (!familyId || !(await canAccessFamily(identity, familyId, admin))) {
      throw new HttpError(403, "You cannot create an invitation for this family");
    }
    return;
  }

  if (root === "auditLogs") {
    if (operation === "get" || operation === "update" || operation === "delete") {
      if (!admin) throw new HttpError(403, "Only administrators can read audit logs");
      return;
    }
    if (incoming?.userId !== identity.uid && !admin) throw new HttpError(403, "Audit records must belong to the signed-in user");
    return;
  }

  if (root === "checkoutRequests") {
    const ownerId = dataString(existing, "uid") || (typeof incoming?.uid === "string" ? incoming.uid : undefined);
    if (!admin && ownerId !== identity.uid) throw new HttpError(403, "You cannot access this checkout request");
    return;
  }

  if (root === "meetings" || root === "signatureRequests") {
    const familyId = dataString(existing, "familyId") || (typeof incoming?.familyId === "string" ? incoming.familyId : undefined);
    if (!familyId || !(await canAccessFamily(identity, familyId, admin))) {
      throw new HttpError(403, "You cannot access this family record");
    }
    return;
  }

  throw new HttpError(403, "This collection is not available");
}

async function authorizeCollection(operation: Operation, collectionPath: string, identity: Identity) {
  const target = parseDocumentPath(`${collectionPath}/placeholder`);
  const admin = isAdmin(identity);
  const [root, rootId] = target.segments;

  if (root === "families" && target.segments.length > 2 && rootId && await canAccessFamily(identity, rootId, admin)) {
    return;
  }
  if (root === "vendors" && operation === "list") return;

  throw new HttpError(403, "You cannot list this collection");
}

async function handleDataRequest(body: RequestBody, identity: Identity) {
  const operation = operationFor(body.action);

  if (operation === "list") {
    const collectionPath = parseCollectionPath(body.collection);
    await authorizeCollection(operation, collectionPath, identity);
    const rows = await db()<StoredDocument[]>`
      SELECT document_path, collection_path, document_id, data, created_at, updated_at
      FROM ditto_documents
      WHERE collection_path = ${collectionPath}
      ORDER BY document_id ASC
    `;
    return { documents: rows.map(documentForClient) };
  }

  if (operation === "add") {
    const collectionPath = parseCollectionPath(body.collection);
    const data = parseDocumentData(body.data);
    const target = parseDocumentPath(`${collectionPath}/${randomUUID()}`);
    await authorizeDocument(operation, target, identity, data, undefined);
    const [row] = await db()<StoredDocument[]>`
      INSERT INTO ditto_documents (document_path, collection_path, document_id, data)
      VALUES (${target.path}, ${target.collectionPath}, ${target.id}, ${db().json(data as postgres.JSONValue)})
      RETURNING document_path, collection_path, document_id, data, created_at, updated_at
    `;
    await grantFamilyAccess(target, row);
    return { document: documentForClient(row) };
  }

  const target = parseDocumentPath(body.path);
  const existing = await findDocument(target.path);

  if (operation === "get") {
    await authorizeDocument(operation, target, identity, undefined, existing);
    return { document: existing ? documentForClient(existing) : null };
  }

  if (operation === "delete") {
    await authorizeDocument(operation, target, identity, undefined, existing);
    if (existing) {
      await db()`DELETE FROM ditto_documents WHERE document_path = ${target.path}`;
    }
    return { deleted: Boolean(existing) };
  }

  const data = parseDocumentData(body.data);
  await authorizeDocument(operation, target, identity, data, existing);

  if (operation === "update" && !existing) {
    throw new HttpError(404, "Document not found");
  }

  const merge = operation === "update" || body.merge !== false;
  const [row] = await db()<StoredDocument[]>`
    INSERT INTO ditto_documents (document_path, collection_path, document_id, data)
    VALUES (${target.path}, ${target.collectionPath}, ${target.id}, ${db().json(data as postgres.JSONValue)})
    ON CONFLICT (document_path) DO UPDATE SET
      data = CASE WHEN ${merge} THEN ditto_documents.data || EXCLUDED.data ELSE EXCLUDED.data END,
      updated_at = now()
    RETURNING document_path, collection_path, document_id, data, created_at, updated_at
  `;

  await grantFamilyAccess(target, row);
  return { document: documentForClient(row) };
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  res.setHeader("Cache-Control", "no-store");

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
    const identity = await requireIdentity(req.headers);
    const result = await handleDataRequest(parseBody(req.body), identity);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error instanceof HttpError ? error.statusCode : 500;
    const message = error instanceof HttpError ? error.message : "The data service is unavailable";
    if (statusCode >= 500) console.error("[api/data]", error);
    res.status(statusCode).json({ error: message });
  }
}
