import type { PrismaClient } from "@/generated/prisma/client";

export const HEWN_PRINCIPLES = [
  {
    slug: "craftsmanship-permanence",
    title: "Craftsmanship deserves permanence.",
    description:
      "Work worth doing deserves to endure. We build systems and experiences that honor the time invested in mastery.",
    originStory:
      "Born from watching artists lose years of creative work to fragmented tools and abandoned projects.",
    sortOrder: 1,
  },
  {
    slug: "technology-amplifies-humanity",
    title: "Technology should amplify humanity.",
    description:
      "Software exists to extend human capability, not replace human judgment, taste, or connection.",
    originStory:
      "A rejection of automation-for-automation's-sake. Every feature must make people more capable, not more dependent.",
    sortOrder: 2,
  },
  {
    slug: "mastery-together",
    title: "No one reaches mastery alone.",
    description:
      "Learning is social. Mentorship, feedback, and continuity are not features—they are prerequisites for growth.",
    originStory:
      "Observed across music, craft, and engineering: isolated practice plateaus; guided practice compounds.",
    sortOrder: 3,
  },
  {
    slug: "beauty-matters",
    title: "Beauty matters.",
    description:
      "Aesthetic quality is not decoration. It signals care, builds trust, and shapes how people feel about their work.",
    originStory:
      "Hewn products should feel intentional—never utilitarian afterthoughts.",
    sortOrder: 4,
  },
  {
    slug: "knowledge-compounds",
    title: "Knowledge should compound.",
    description:
      "Institutional memory should grow over time. Decisions, evidence, and learning must accumulate—not evaporate.",
    originStory:
      "The founding insight behind DevAnvil itself: teams forget why they built things.",
    sortOrder: 5,
  },
] as const;

type SeedResearchQuestion = {
  principleSlug: string;
  question: string;
  whyItMatters: string;
  currentUnderstanding: string;
  unknowns: string[];
  theses: string[];
  projectSlugs?: string[];
};

const RESEARCH_QUESTIONS: SeedResearchQuestion[] = [
  {
    principleSlug: "mastery-together",
    question: "Why do artists abandon songs?",
    whyItMatters:
      "Abandoned songs represent lost creative capital and broken creative lifecycles—directly threatening StudioOps' mission.",
    currentUnderstanding:
      "Multiple factors likely interact. We have early signals from Practice Coach usage but no converged explanation.",
    unknowns: [
      "Role of feedback timing",
      "Emotional connection decay over weeks",
      "Technical complexity thresholds",
      "Definition of 'finished' for artists",
    ],
    theses: [
      "Artists abandon songs because they lack continuous mentorship.",
      "Artists lose emotional connection to work over time.",
      "Songs become too technically complex to finish alone.",
      "Artists receive feedback too late in the creative process.",
      "Artists don't know what 'finished' looks like.",
    ],
    projectSlugs: ["studioops"],
  },
  {
    principleSlug: "knowledge-compounds",
    question: "Why do engineering teams repeatedly make the same architectural mistakes?",
    whyItMatters:
      "Repeated mistakes waste engineering capital and erode system quality—DevAnvil exists to break this cycle.",
    currentUnderstanding:
      "Decision context is lost between projects. Teams lack accessible institutional memory at decision time.",
    unknowns: [
      "When in the workflow decisions are actually made",
      "Whether documentation alone is sufficient",
      "Role of tooling vs culture",
    ],
    theses: [
      "Teams forget why past decisions were made.",
      "Architectural context is not available at decision time.",
      "Teams lack feedback loops connecting shipped code to original intent.",
      "Documentation exists but is never consulted during implementation.",
    ],
    projectSlugs: ["hewn-ventures", "levrops"],
  },
  {
    principleSlug: "craftsmanship-permanence",
    question: "Why do meaningful work and objects disappear?",
    whyItMatters:
      "If craftsmanship deserves permanence, we must understand what causes creative and cultural work to vanish.",
    currentUnderstanding:
      "Continuity breaks—through platform churn, life transitions, or loss of momentum—appear central.",
    unknowns: [
      "Digital vs physical permanence",
      "Role of identity in sustained effort",
      "Intergenerational transfer of craft knowledge",
    ],
    theses: [
      "People lose momentum when continuity is broken.",
      "People abandon work when feedback arrives too late.",
      "People lose identity when progress isn't visible.",
      "Platform dependency makes work fragile.",
    ],
    projectSlugs: ["heirloom", "studioops"],
  },
  {
    principleSlug: "technology-amplifies-humanity",
    question: "Under what conditions does AI genuinely improve creative work?",
    whyItMatters:
      "Hewn builds AI-augmented products. We must know when AI helps vs when it hollows out the creative process.",
    currentUnderstanding:
      "AI helps most at friction points—not at moments requiring taste, identity, or emotional judgment.",
    unknowns: [
      "Threshold of creative ownership",
      "Artist perception of AI-assisted work",
      "Long-term skill development effects",
    ],
    theses: [
      "AI improves creative work when it removes friction, not when it replaces judgment.",
      "AI harms creative work when it short-circuits the learning loop.",
      "AI is most valuable as a continuity mechanism between sessions.",
    ],
    projectSlugs: ["studioops"],
  },
];

export async function seedPrinciplesAndResearch(
  prisma: PrismaClient,
): Promise<{ principles: number; questions: number; theses: number }> {
  let principleCount = 0;
  let questionCount = 0;
  let thesisCount = 0;

  const principleBySlug = new Map<string, string>();

  for (const p of HEWN_PRINCIPLES) {
    const principle = await prisma.principle.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        originStory: p.originStory,
        sortOrder: p.sortOrder,
      },
      create: p,
    });
    principleBySlug.set(p.slug, principle.id);
    principleCount++;
  }

  for (const rq of RESEARCH_QUESTIONS) {
    const principleId = principleBySlug.get(rq.principleSlug);
    if (!principleId) continue;

    const existing = await prisma.researchQuestion.findFirst({
      where: { question: rq.question },
    });

    const researchQuestion = existing
      ? await prisma.researchQuestion.update({
          where: { id: existing.id },
          data: {
            principleId,
            whyItMatters: rq.whyItMatters,
            currentUnderstanding: rq.currentUnderstanding,
            unknowns: rq.unknowns,
          },
        })
      : await prisma.researchQuestion.create({
          data: {
            principleId,
            question: rq.question,
            whyItMatters: rq.whyItMatters,
            currentUnderstanding: rq.currentUnderstanding,
            unknowns: rq.unknowns,
          },
        });

    questionCount++;

    for (const statement of rq.theses) {
      const existingThesis = await prisma.thesis.findFirst({
        where: {
          researchQuestionId: researchQuestion.id,
          statement,
        },
      });
      if (!existingThesis) {
        await prisma.thesis.create({
          data: {
            researchQuestionId: researchQuestion.id,
            statement,
            confidence: 50,
            status: "competing",
            principleLinks: {
              create: { principleId },
            },
          },
        });
        thesisCount++;
      }
    }

    if (rq.projectSlugs) {
      for (const slug of rq.projectSlugs) {
        const project = await prisma.project.findUnique({ where: { slug } });
        if (!project) continue;

        await prisma.projectPrinciple.upsert({
          where: {
            projectId_principleId: {
              projectId: project.id,
              principleId,
            },
          },
          update: {},
          create: { projectId: project.id, principleId },
        });

        const theses = await prisma.thesis.findMany({
          where: { researchQuestionId: researchQuestion.id },
        });
        for (const thesis of theses) {
          await prisma.projectThesis.upsert({
            where: {
              projectId_thesisId: {
                projectId: project.id,
                thesisId: thesis.id,
              },
            },
            update: {},
            create: { projectId: project.id, thesisId: thesis.id },
          });
        }
      }
    }
  }

  // Mark leading thesis for artist abandonment question
  const artistQuestion = await prisma.researchQuestion.findFirst({
    where: { question: "Why do artists abandon songs?" },
    include: { theses: true },
  });
  if (artistQuestion) {
    const mentorshipThesis = artistQuestion.theses.find((t) =>
      t.statement.includes("mentorship"),
    );
    if (mentorshipThesis) {
      await prisma.thesis.update({
        where: { id: mentorshipThesis.id },
        data: { status: "leading", confidence: 72 },
      });
      await prisma.researchQuestion.update({
        where: { id: artistQuestion.id },
        data: { status: "converging" },
      });
      await prisma.evidence.create({
        data: {
          thesisId: mentorshipThesis.id,
          title: "Practice Coach users completed 27% more songs",
          description: "Early beta cohort comparison over 8 weeks.",
          source: "product_analytics",
          effect: "supports",
          strength: 70,
        },
      }).catch(() => {
        // already seeded
      });
    }
  }

  return { principles: principleCount, questions: questionCount, theses: thesisCount };
}
