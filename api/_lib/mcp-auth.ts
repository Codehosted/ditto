import { createHash, timingSafeEqual } from "node:crypto";

import { HttpError } from "./errors.js";

type HeadersLike = Record<string, string | string[] | undefined>;

function headerValue(headers: HeadersLike, name: string) {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function requireMcpToken(headers: HeadersLike, expectedDigest = process.env.DITTO_MCP_TOKEN_SHA256) {
  if (!expectedDigest || !/^[a-f0-9]{64}$/.test(expectedDigest)) {
    throw new HttpError(503, "MCP authentication is not configured");
  }

  const authorization = headerValue(headers, "authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token || token.length > 16_384) {
    throw new HttpError(401, "Authentication is required");
  }

  const actual = Buffer.from(sha256(token), "hex");
  const expected = Buffer.from(expectedDigest, "hex");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new HttpError(401, "Invalid authentication token");
  }
}
