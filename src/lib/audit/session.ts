import type { AuditSessionStatus, StrategicValue } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { assertCapturePromotable, markCapturePromoted } from "@/lib/capture/promote";
import {
  analyzeAuditCapture,
  buildPolishInitiativeDescription,
} from "@/lib/audit/analyze";
import type { AuditScope, AuditSessionView } from "@/lib/audit/types";

function toView(
  session: {
    id: string;
    captureId: string;
    status: AuditSessionStatus;
    originalInput: string;
    scopeJson: unknown;
    initiativeId: string | null;
    createdAt: Date;
    updatedAt: Date;
    project: { slug: string };
  },
): AuditSessionView {
  return {
    id: session.id,
    projectSlug: session.project.slug,
    captureId: session.captureId,
    status: session.status,
    originalInput: session.originalInput,
    scope: (session.scopeJson as AuditScope | null) ?? null,
    initiativeId: session.initiativeId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

export async function startAuditSessionFromCapture(
  captureId: string,
  projectSlug: string,
): Promise<AuditSessionView> {
  const capture = await assertCapturePromotable(captureId);

  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) throw new Error(`Project not found: ${projectSlug}`);

  const scope = await analyzeAuditCapture(capture.rawText, projectSlug);

  const session = await prisma.auditSession.create({
    data: {
      projectId: project.id,
      captureId,
      originalInput: capture.rawText,
      scopeJson: scope as object,
      status: "active",
    },
    include: { project: { select: { slug: true } } },
  });

  await markCapturePromoted(
    captureId,
    "audit",
    `Promoted to audit session ${session.id}`,
  );

  return toView(session);
}

export async function getAuditSession(sessionId: string): Promise<AuditSessionView | null> {
  const session = await prisma.auditSession.findUnique({
    where: { id: sessionId },
    include: { project: { select: { slug: true } } },
  });
  if (!session) return null;
  return toView(session);
}

export async function createPolishInitiativeFromAudit(sessionId: string) {
  const session = await prisma.auditSession.findUnique({
    where: { id: sessionId },
    include: { project: true },
  });
  if (!session) throw new Error("Audit session not found");
  if (session.initiativeId) {
    return { initiativeId: session.initiativeId };
  }

  const scope = session.scopeJson as AuditScope | null;
  if (!scope) throw new Error("No audit scope available");

  const strategicValue: StrategicValue =
    scope.affectedDomains.some(
      (d) =>
        d.domain.protectionLevel === "protected" ||
        d.domain.protectionLevel === "locked",
    )
      ? "beta_critical"
      : "delight";

  const initiative = await prisma.initiative.create({
    data: {
      projectId: session.projectId,
      title: scope.title.replace(/^Audit:\s*/i, "Polish: "),
      description: buildPolishInitiativeDescription(scope, session.captureId),
      status: "proposed",
      priority: "medium",
      strategicValue,
    },
  });

  await prisma.auditSession.update({
    where: { id: sessionId },
    data: {
      status: "polish_initiative_created",
      initiativeId: initiative.id,
    },
  });

  return { initiativeId: initiative.id };
}

export async function discardAuditSession(sessionId: string) {
  await prisma.auditSession.update({
    where: { id: sessionId },
    data: { status: "discarded" },
  });
}

export async function listRecentAuditSessions(projectSlug: string, limit = 6) {
  return prisma.auditSession.findMany({
    where: {
      project: { slug: projectSlug },
      status: { not: "discarded" },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      captureId: true,
      originalInput: true,
      status: true,
      scopeJson: true,
      createdAt: true,
    },
  });
}
