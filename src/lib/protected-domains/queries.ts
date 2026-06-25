import type { DomainChangeStatus, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type {
  ProtectedDomainChangeSummary,
  ProtectedDomainDetail,
  ProtectedDomainSummary,
} from "@/lib/protected-domains/types";

const OPEN_CHANGE_STATUSES: DomainChangeStatus[] = ["open", "in_review", "blocked"];

const domainInclude = {
  project: { select: { slug: true } },
  artifacts: { orderBy: { kind: "asc" as const } },
  changeGates: { orderBy: { sortOrder: "asc" as const } },
  extensionPoints: { orderBy: { name: "asc" as const } },
  changes: { orderBy: { updatedAt: "desc" as const }, take: 20 },
  violations: {
    where: { resolvedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 10,
  },
  audits: { orderBy: { createdAt: "desc" as const }, take: 10 },
  _count: {
    select: {
      changes: { where: { status: { in: OPEN_CHANGE_STATUSES } } },
      violations: { where: { resolvedAt: null } },
    },
  },
};

type DomainRow = NonNullable<Awaited<ReturnType<typeof fetchDomainBySlug>>>;

function toSummary(row: DomainRow): ProtectedDomainSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    owner: row.owner,
    status: row.status,
    protectionLevel: row.protectionLevel,
    projectSlug: row.project?.slug ?? null,
    lastAuditAt: row.lastAuditAt?.toISOString() ?? null,
    lastGoldenMasterAt: row.lastGoldenMasterAt?.toISOString() ?? null,
    contractVersion: row.contractVersion,
    inventoryVersion: row.inventoryVersion,
    regressionStatus: row.regressionStatus,
    openChanges: row._count.changes,
    recentViolations: row._count.violations,
  };
}

function toDetail(row: DomainRow): ProtectedDomainDetail {
  const summary = toSummary(row);
  return {
    ...summary,
    keywords: Array.isArray(row.keywords) ? (row.keywords as string[]) : [],
    pathPatterns: Array.isArray(row.pathPatterns)
      ? (row.pathPatterns as string[])
      : [],
    artifacts: row.artifacts.map((a) => ({
      id: a.id,
      kind: a.kind,
      title: a.title,
      path: a.path,
      version: a.version,
      updatedAt: a.updatedAt.toISOString(),
    })),
    changeGates: row.changeGates.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      required: g.required,
      sortOrder: g.sortOrder,
    })),
    extensionPoints: row.extensionPoints.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      category: e.category,
    })),
    changes: row.changes.map(
      (c): ProtectedDomainChangeSummary => ({
        id: c.id,
        title: c.title,
        description: c.description,
        risk: c.risk,
        status: c.status,
        devItemId: c.devItemId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }),
    ),
    violations: row.violations.map((v) => ({
      id: v.id,
      description: v.description,
      severity: v.severity,
      resolvedAt: v.resolvedAt?.toISOString() ?? null,
      createdAt: v.createdAt.toISOString(),
    })),
    audits: row.audits.map((a) => ({
      id: a.id,
      note: a.note,
      auditor: a.auditor,
      passed: a.passed,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

async function fetchDomainBySlug(slug: string, client: PrismaClient = prisma) {
  return client.protectedDomain.findUnique({
    where: { slug },
    include: domainInclude,
  });
}

export async function listProtectedDomains(
  projectSlug?: string,
  client: PrismaClient = prisma,
): Promise<ProtectedDomainSummary[]> {
  const rows = await client.protectedDomain.findMany({
    where: {
      status: "active",
      ...(projectSlug ? { project: { slug: projectSlug } } : {}),
    },
    include: domainInclude,
    orderBy: [{ protectionLevel: "desc" }, { name: "asc" }],
  });

  return rows.map(toSummary);
}

export async function getProtectedDomainBySlug(
  slug: string,
  client: PrismaClient = prisma,
): Promise<ProtectedDomainDetail | null> {
  const row = await fetchDomainBySlug(slug, client);
  return row ? toDetail(row) : null;
}

export async function getProtectedDomainById(
  id: string,
  client: PrismaClient = prisma,
): Promise<ProtectedDomainDetail | null> {
  const row = await client.protectedDomain.findUnique({
    where: { id },
    include: domainInclude,
  });

  return row ? toDetail(row) : null;
}

export async function getProtectedDomainStatus(
  slug: string,
  client: PrismaClient = prisma,
) {
  const domain = await getProtectedDomainBySlug(slug, client);
  if (!domain) return null;

  return {
    slug: domain.slug,
    name: domain.name,
    protectionLevel: domain.protectionLevel,
    owner: domain.owner,
    regressionStatus: domain.regressionStatus,
    contractVersion: domain.contractVersion,
    inventoryVersion: domain.inventoryVersion,
    lastAuditAt: domain.lastAuditAt,
    lastGoldenMasterAt: domain.lastGoldenMasterAt,
    openChanges: domain.openChanges,
    recentViolations: domain.recentViolations,
    requiredGates: domain.changeGates
      .filter((g) => g.required)
      .map((g) => g.name),
    blockedChanges: domain.extensionPoints
      .filter((e) => e.category === "requires_adr")
      .map((e) => e.name),
  };
}
