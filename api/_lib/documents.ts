import { HttpError } from "./errors.js";

const maxPathSegments = 8;
const maxSegmentLength = 200;
const maxDocumentBytes = 1_000_000;

export type DocumentPath = {
  path: string;
  collectionPath: string;
  id: string;
  segments: string[];
};

function asSegments(value: unknown, label: string) {
  if (typeof value !== "string" || !value) {
    throw new HttpError(400, `${label} is required`);
  }

  const segments = value.split("/");
  if (segments.length > maxPathSegments || segments.some((segment) => !segment || segment.length > maxSegmentLength || /[\u0000-\u001f]/.test(segment))) {
    throw new HttpError(400, `${label} is invalid`);
  }

  return segments;
}

export function parseDocumentPath(value: unknown): DocumentPath {
  const segments = asSegments(value, "Document path");
  if (segments.length % 2 !== 0) {
    throw new HttpError(400, "Document path must end with a document ID");
  }

  return {
    path: segments.join("/"),
    collectionPath: segments.slice(0, -1).join("/"),
    id: segments.at(-1)!,
    segments,
  };
}

export function parseCollectionPath(value: unknown) {
  const segments = asSegments(value, "Collection path");
  if (segments.length % 2 === 0) {
    throw new HttpError(400, "Collection path must end with a collection ID");
  }

  return segments.join("/");
}

export function parseDocumentData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "Document data must be an object");
  }

  let encoded: string;
  try {
    encoded = JSON.stringify(value);
  } catch {
    throw new HttpError(400, "Document data is not serializable");
  }

  if (encoded.length > maxDocumentBytes) {
    throw new HttpError(413, "Document data is too large");
  }

  return JSON.parse(encoded) as Record<string, unknown>;
}
