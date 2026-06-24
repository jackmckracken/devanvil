import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

const INGEST_KEY_PREFIX = "dvi_";
const KEY_BYTES = 24;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getPepper(): string {
  return (
    process.env.DEVANVIL_INGEST_KEY_PEPPER ??
    process.env.DEVANVIL_SESSION_SECRET ??
    "devanvil-ingest-pepper"
  );
}

export function hashIngestKey(rawKey: string): string {
  const data = `${getPepper()}:${rawKey}`;
  return createHash("sha256").update(data).digest("hex");
}

export function generateIngestKey(): {
  rawKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const random = bytesToHex(crypto.getRandomValues(new Uint8Array(KEY_BYTES)));
  const rawKey = `${INGEST_KEY_PREFIX}${random}`;
  const keyPrefix = rawKey.slice(0, 12);
  return {
    rawKey,
    keyPrefix,
    keyHash: hashIngestKey(rawKey),
  };
}

export function verifyEnvIngestToken(token: string): boolean {
  const expected = process.env.DEVANVIL_INGEST_TOKEN;
  if (!expected) return false;
  if (token.length !== expected.length) return false;

  let result = 0;
  for (let i = 0; i < token.length; i += 1) {
    result |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyDatabaseIngestKey(
  token: string,
): Promise<boolean> {
  if (!token.startsWith(INGEST_KEY_PREFIX)) return false;

  const keyHash = hashIngestKey(token);
  const record = await prisma.ingestKey.findFirst({
    where: { keyHash, revokedAt: null },
    select: { id: true },
  });

  if (!record) return false;

  await prisma.ingestKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return true;
}

export async function verifyIngestBearerToken(
  token: string,
): Promise<boolean> {
  if (!token) return false;
  if (verifyEnvIngestToken(token)) return true;
  return verifyDatabaseIngestKey(token);
}

export type IngestKeySummary = {
  id: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export async function listIngestKeys(): Promise<IngestKeySummary[]> {
  const keys = await prisma.ingestKey.findMany({
    orderBy: { createdAt: "desc" },
  });

  return keys.map((key) => ({
    id: key.id,
    label: key.label,
    keyPrefix: key.keyPrefix,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    revokedAt: key.revokedAt?.toISOString() ?? null,
  }));
}

export async function createIngestKey(
  label = "DevAnvil Ingest Key",
): Promise<{ key: IngestKeySummary; rawKey: string }> {
  const { rawKey, keyPrefix, keyHash } = generateIngestKey();

  const record = await prisma.ingestKey.create({
    data: { label, keyPrefix, keyHash },
  });

  return {
    rawKey,
    key: {
      id: record.id,
      label: record.label,
      keyPrefix: record.keyPrefix,
      createdAt: record.createdAt.toISOString(),
      lastUsedAt: null,
      revokedAt: null,
    },
  };
}

export async function revokeIngestKey(id: string): Promise<boolean> {
  const record = await prisma.ingestKey.findUnique({ where: { id } });
  if (!record || record.revokedAt) return false;

  await prisma.ingestKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  return true;
}
