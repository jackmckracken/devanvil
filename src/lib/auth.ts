import { NextRequest } from "next/server";

const SESSION_COOKIE = "devanvil_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret(): string {
  const secret = process.env.DEVANVIL_SESSION_SECRET;
  if (!secret) {
    throw new Error("DEVANVIL_SESSION_SECRET is not configured");
  }
  return secret;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function signPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `authenticated:${expiresAt}`;
  return `${payload}.${await signPayload(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await signPayload(payload);
  if (!timingSafeEqualHex(signature, expected)) return false;

  const [, expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return payload.startsWith("authenticated:");
}

export function verifyIngestToken(request: NextRequest): boolean {
  const expected = process.env.DEVANVIL_INGEST_TOKEN;
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length).trim();
  if (token.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < token.length; i += 1) {
    result |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

export function verifyUiPassword(password: string): boolean {
  const expected = process.env.DEVANVIL_UI_PASSWORD;
  if (!expected) return false;
  if (password.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < password.length; i += 1) {
    result |= password.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export async function isUiAuthenticated(
  token?: string | null,
): Promise<boolean> {
  return verifySessionToken(token ?? undefined);
}
