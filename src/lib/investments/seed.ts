import type { PrismaClient } from "@/generated/prisma/client";

const STUDIOOPS_INVESTMENTS = [
  {
    title: "Learn Komplete Kontrol",
    description: "Master Komplete Kontrol templates and production workflows",
    category: "learning" as const,
    capabilityTarget: "Faster production starts with template-based workflows",
    intentConnection: "Help artists finish more songs and improve production speed",
    leverage: "high" as const,
    estimatedHours: 15,
    compoundingValue: "Each session starts faster — hours saved compound weekly",
  },
  {
    title: "Upgrade to Ableton 12",
    description: "Upgrade DAW and learn new features relevant to StudioOps integration",
    category: "infrastructure" as const,
    capabilityTarget: "Access to Ableton 12 features for MIDI and live performance work",
    intentConnection: "Increase builder velocity for Workbench integrations",
    leverage: "compound" as const,
    estimatedHours: 4,
    compoundingValue: "Platform knowledge compounds across all future Ableton-related features",
  },
  {
    title: "Organize Studio",
    description: "Clean, cable-manage, and optimize studio layout for daily songwriting",
    category: "environment" as const,
    capabilityTarget: "Studio setup time drops from 30 minutes to 5",
    intentConnection: "Reduce friction between inspiration and creation",
    leverage: "medium" as const,
    estimatedHours: 3,
    compoundingValue: "Daily time savings compound into weeks of extra creative output per year",
  },
  {
    title: "Experiment with Ableton SDK",
    description: "Spike on Ableton Live API capabilities and limitations",
    category: "experimentation" as const,
    capabilityTarget: "Knowledge of SDK feasibility for MIDI sync and clip launching",
    intentConnection: "Enable Workbench MIDI Integration and live performance features",
    leverage: "high" as const,
    estimatedHours: 8,
    compoundingValue: "Informs all future Ableton integration architecture",
  },
  {
    title: "Learn MCP",
    description: "Deep dive into Model Context Protocol for agent automation",
    category: "infrastructure" as const,
    capabilityTarget: "Ability to build and extend MCP integrations",
    intentConnection: "Increase builder velocity and reduce implementation friction",
    leverage: "compound" as const,
    estimatedHours: 10,
    compoundingValue: "MCP skills compound across every Hewn product and agent workflow",
  },
];

export async function seedStudioOpsInvestments(
  client: PrismaClient,
  projectSlug = "studioops",
): Promise<number> {
  const project = await client.project.findUnique({
    where: { slug: projectSlug },
    select: { id: true },
  });
  if (!project) return 0;

  const existing = await client.investment.count({
    where: { projectId: project.id },
  });
  if (existing > 0) return existing;

  for (const inv of STUDIOOPS_INVESTMENTS) {
    await client.investment.create({
      data: {
        projectId: project.id,
        ...inv,
        status: "captured",
      },
    });
  }

  return STUDIOOPS_INVESTMENTS.length;
}
