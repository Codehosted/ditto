import { createRemoteJWKSet, jwtVerify } from "jose";

import { HttpError } from "./errors";

const defaultProjectId = "gen-lang-client-0065789810";
const jwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export type Identity = {
  uid: string;
  email: string | null;
};

function headerValue(headers: Record<string, string | string[] | undefined>, name: string) {
  const value = headers[name] ?? headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export async function requireIdentity(headers: Record<string, string | string[] | undefined>): Promise<Identity> {
  const authorization = headerValue(headers, "authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication is required");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token || token.length > 16_384) {
    throw new HttpError(401, "Invalid authentication token");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || defaultProjectId;
  const { payload } = await jwtVerify(token, jwks, {
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new HttpError(401, "Invalid authentication token");
  }

  return {
    uid: payload.sub,
    email: typeof payload.email === "string" ? payload.email.toLowerCase() : null,
  };
}
