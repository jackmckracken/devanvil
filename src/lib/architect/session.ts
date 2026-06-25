import type { ArchitectSessionStatus, StrategicValue } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { assertCapturePromotable, markCapturePromoted } from "@/lib/capture/promote";
import {
  buildInitiativeDescription,
  runArchitectAnalysis,
} from "@/lib/architect/analyze";
import { normalizeArchitectAnalysis } from "@/lib/architect/normalize";
import type {
  ArchitectAnalysis,
  ArchitectMessage,
  ArchitectSessionView,
} from "@/lib/architect/types";

function newMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function parseMessages(json: unknown): ArchitectMessage[] {
  if (!Array.isArray(json)) return [];
  return json as ArchitectMessage[];
}

function toView(
  session: {
    id: string;
    captureId: string | null;
    status: ArchitectSessionStatus;
    originalInput: string;
    analysisJson: unknown;
    messagesJson: unknown;
    initiativeId: string | null;
    createdAt: Date;
    updatedAt: Date;
    project: { slug: string };
  },
): ArchitectSessionView {
  const rawAnalysis = session.analysisJson as Record<string, unknown> | null;
  const messageCount = parseMessages(session.messagesJson).filter((m) => m.role === "user").length;
  const analysis = rawAnalysis
    ? normalizeArchitectAnalysis(rawAnalysis, messageCount)
    : null;

  return {
    id: session.id,
    projectSlug: session.project.slug,
    captureId: session.captureId,
    status: session.status,
    originalInput: session.originalInput,
    analysis,
    messages: parseMessages(session.messagesJson),
    initiativeId: session.initiativeId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

async function createArchitectSession(
  projectSlug: string,
  text: string,
  captureId?: string,
): Promise<ArchitectSessionView> {
  const project = await prisma.project.findUnique({ where: { slug: projectSlug } });
  if (!project) throw new Error(`Project not found: ${projectSlug}`);

  const analysis = await runArchitectAnalysis(text, projectSlug, [], text);

  const messages: ArchitectMessage[] = [
    {
      id: newMessageId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    },
    {
      id: newMessageId(),
      role: "architect",
      content: analysis.architectMessage,
      createdAt: new Date().toISOString(),
    },
  ];

  const session = await prisma.architectSession.create({
    data: {
      projectId: project.id,
      captureId,
      originalInput: text,
      analysisJson: analysis as object,
      messagesJson: messages,
      status: "active",
    },
    include: { project: { select: { slug: true } } },
  });

  return toView(session);
}

export async function startArchitectSessionFromCapture(
  captureId: string,
  projectSlug: string,
): Promise<ArchitectSessionView> {
  const capture = await assertCapturePromotable(captureId);

  const session = await createArchitectSession(
    projectSlug,
    capture.rawText,
    captureId,
  );

  await markCapturePromoted(
    captureId,
    "architect",
    `Promoted to architect session ${session.id}`,
  );

  return session;
}

export async function startArchitectSession(
  text: string,
  projectSlug: string,
  captureId?: string,
): Promise<ArchitectSessionView> {
  if (captureId) {
    return startArchitectSessionFromCapture(captureId, projectSlug);
  }

  return createArchitectSession(projectSlug, text);
}

export async function continueArchitectSession(
  sessionId: string,
  userMessage: string,
): Promise<ArchitectSessionView> {
  const session = await prisma.architectSession.findUnique({
    where: { id: sessionId },
    include: { project: { select: { slug: true } } },
  });
  if (!session) throw new Error("Session not found");
  if (session.status !== "active") throw new Error("Session is not active");

  const messages = parseMessages(session.messagesJson);
  messages.push({
    id: newMessageId(),
    role: "user",
    content: userMessage,
    createdAt: new Date().toISOString(),
  });

  const corpus = [session.originalInput, ...messages.map((m) => m.content)].join("\n");
  const priorAnalysis = session.analysisJson as ArchitectAnalysis | null;
  const analysis = await runArchitectAnalysis(
    corpus,
    session.project.slug,
    messages,
    session.originalInput,
    priorAnalysis?.mentalModel ?? null,
  );

  messages.push({
    id: newMessageId(),
    role: "architect",
    content: analysis.architectMessage,
    createdAt: new Date().toISOString(),
  });

  const updated = await prisma.architectSession.update({
    where: { id: sessionId },
    data: {
      analysisJson: analysis as object,
      messagesJson: messages,
    },
    include: { project: { select: { slug: true } } },
  });

  return toView(updated);
}

export async function getArchitectSession(sessionId: string): Promise<ArchitectSessionView | null> {
  const session = await prisma.architectSession.findUnique({
    where: { id: sessionId },
    include: { project: { select: { slug: true } } },
  });
  if (!session) return null;
  return toView(session);
}

export async function createInitiativeFromSession(sessionId: string) {
  const session = await prisma.architectSession.findUnique({
    where: { id: sessionId },
    include: { project: true },
  });
  if (!session) throw new Error("Session not found");
  if (session.initiativeId) {
    return { initiativeId: session.initiativeId };
  }

  const analysis = session.analysisJson
    ? normalizeArchitectAnalysis(
        session.analysisJson as Record<string, unknown>,
        parseMessages(session.messagesJson).filter((m) => m.role === "user").length,
      )
    : null;
  if (!analysis) throw new Error("No analysis available");

  const strategicValue = (analysis.suggestedInitiative.strategicValue ??
    "growth") as StrategicValue;

  const initiative = await prisma.initiative.create({
    data: {
      projectId: session.projectId,
      title: analysis.suggestedInitiative.title,
      description: buildInitiativeDescription(analysis),
      status: "proposed",
      priority: "medium",
      strategicValue,
    },
  });

  await prisma.architectSession.update({
    where: { id: sessionId },
    data: {
      status: "initiative_created",
      initiativeId: initiative.id,
    },
  });

  return { initiativeId: initiative.id };
}

export async function discardArchitectSession(sessionId: string) {
  await prisma.architectSession.update({
    where: { id: sessionId },
    data: { status: "discarded" },
  });
}

export async function listRecentArchitectSessions(projectSlug: string, limit = 6) {
  return prisma.architectSession.findMany({
    where: {
      project: { slug: projectSlug },
      status: { not: "discarded" },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      originalInput: true,
      status: true,
      analysisJson: true,
      createdAt: true,
    },
  });
}
