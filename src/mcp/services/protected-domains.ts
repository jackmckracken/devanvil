import { prisma } from "@/lib/db";
import {
  analyzeForgeTask,
  detectProtectedDomains,
  formatForgeWarning,
  getProtectedDomainChecklist,
} from "@/lib/protected-domains/detection";
import {
  getProtectedDomainBySlug,
  getProtectedDomainStatus,
  listProtectedDomains,
} from "@/lib/protected-domains/queries";
import { assertFound } from "@/mcp/errors";
import type { z } from "zod";
import type {
  detectProtectedDomainsSchema,
  getProtectedDomainSchema,
  protectedDomainArtifactsSchema,
  protectedDomainAuditSchema,
  protectedDomainChangeGatesSchema,
  protectedDomainChecklistSchema,
  protectedDomainRecentChangesSchema,
  protectedDomainStatusSchema,
  protectedDomainsSchema,
} from "@/mcp/schemas";

type ProtectedDomainsInput = z.infer<typeof protectedDomainsSchema>;
type GetProtectedDomainInput = z.infer<typeof getProtectedDomainSchema>;
type ProtectedDomainStatusInput = z.infer<typeof protectedDomainStatusSchema>;
type ProtectedDomainArtifactsInput = z.infer<typeof protectedDomainArtifactsSchema>;
type ProtectedDomainChangeGatesInput = z.infer<typeof protectedDomainChangeGatesSchema>;
type ProtectedDomainChecklistInput = z.infer<typeof protectedDomainChecklistSchema>;
type ProtectedDomainAuditInput = z.infer<typeof protectedDomainAuditSchema>;
type ProtectedDomainRecentChangesInput = z.infer<typeof protectedDomainRecentChangesSchema>;
type DetectProtectedDomainsInput = z.infer<typeof detectProtectedDomainsSchema>;

export async function protectedDomainsMcp(input: ProtectedDomainsInput) {
  return listProtectedDomains(input.projectSlug);
}

export async function getProtectedDomainMcp(input: GetProtectedDomainInput) {
  const domain = await getProtectedDomainBySlug(input.slug);
  assertFound(domain, `Protected domain not found: ${input.slug}`);
  return domain;
}

export async function protectedDomainStatusMcp(input: ProtectedDomainStatusInput) {
  const status = await getProtectedDomainStatus(input.slug);
  assertFound(status, `Protected domain not found: ${input.slug}`);
  return status;
}

export async function protectedDomainArtifactsMcp(
  input: ProtectedDomainArtifactsInput,
) {
  const domain = await getProtectedDomainBySlug(input.slug);
  assertFound(domain, `Protected domain not found: ${input.slug}`);
  return {
    slug: domain.slug,
    name: domain.name,
    artifacts: domain.artifacts,
  };
}

export async function protectedDomainChangeGatesMcp(
  input: ProtectedDomainChangeGatesInput,
) {
  const domain = await getProtectedDomainBySlug(input.slug);
  assertFound(domain, `Protected domain not found: ${input.slug}`);
  return {
    slug: domain.slug,
    name: domain.name,
    protectionLevel: domain.protectionLevel,
    gates: domain.changeGates,
    blockedChanges: domain.extensionPoints
      .filter((e) => e.category === "requires_adr")
      .map((e) => e.name),
    allowedChanges: domain.extensionPoints
      .filter((e) => e.category === "allowed")
      .map((e) => e.name),
  };
}

export async function protectedDomainChecklistMcp(
  input: ProtectedDomainChecklistInput,
) {
  const checklist = await getProtectedDomainChecklist(
    input.slug,
    input.gateResults,
  );
  assertFound(checklist, `Protected domain not found: ${input.slug}`);
  return checklist;
}

export async function protectedDomainAuditMcp(input: ProtectedDomainAuditInput) {
  const domain = await prisma.protectedDomain.findUnique({
    where: { slug: input.slug },
    select: { id: true, slug: true, name: true },
  });
  assertFound(domain, `Protected domain not found: ${input.slug}`);

  const audit = await prisma.protectedDomainAudit.create({
    data: {
      domainId: domain.id,
      note: input.note,
      auditor: input.auditor ?? null,
      passed: input.passed ?? true,
    },
  });

  await prisma.protectedDomain.update({
    where: { id: domain.id },
    data: { lastAuditAt: new Date() },
  });

  return {
    slug: domain.slug,
    name: domain.name,
    audit: {
      id: audit.id,
      note: audit.note,
      auditor: audit.auditor,
      passed: audit.passed,
      createdAt: audit.createdAt.toISOString(),
    },
  };
}

export async function protectedDomainRecentChangesMcp(
  input: ProtectedDomainRecentChangesInput,
) {
  const domain = await getProtectedDomainBySlug(input.slug);
  assertFound(domain, `Protected domain not found: ${input.slug}`);

  return {
    slug: domain.slug,
    name: domain.name,
    openChanges: domain.changes.filter((c) =>
      ["open", "in_review", "blocked"].includes(c.status),
    ),
    recentChanges: domain.changes.slice(0, input.limit ?? 10),
  };
}

export async function detectProtectedDomainsMcp(input: DetectProtectedDomainsInput) {
  const analysis = await analyzeForgeTask({
    text: input.text,
    paths: input.paths,
    projectSlug: input.projectSlug,
  });

  return {
    ...analysis,
    forgeWarning: formatForgeWarning(analysis),
  };
}
