import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Bump when Prisma schema changes so dev HMR does not keep a stale client. */
const PRISMA_CLIENT_VERSION = "20260626152248_add_principles_research_theses";

const ONTOLOGY_DELEGATES = ["principle", "researchQuestion", "thesis", "evidence"] as const;

function clientHasOntologyDelegates(client: PrismaClient): boolean {
  return ONTOLOGY_DELEGATES.every(
    (delegate) => delegate in client && client[delegate as keyof PrismaClient] != null,
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion: string | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const cachedVersion = globalForPrisma.prismaClientVersion;

  if (
    cached &&
    cachedVersion === PRISMA_CLIENT_VERSION &&
    clientHasOntologyDelegates(cached)
  ) {
    return cached;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }

  return client;
}

export const prisma = getPrismaClient();
