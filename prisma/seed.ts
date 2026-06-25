import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedProtectedDomains } from "../src/lib/protected-domains/seed";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const projects = [
  {
    name: "StudioOps",
    slug: "studioops",
    description: "Music studio operations and practice coaching platform.",
  },
  {
    name: "LevrOps",
    slug: "levrops",
    description: "Multi-tenant operations and CRM platform.",
  },
  {
    name: "Heirloom",
    slug: "heirloom",
    description: "Family legacy and archive experiences.",
  },
  {
    name: "Hewn Ventures",
    slug: "hewn-ventures",
    description: "Venture studio and portfolio initiatives.",
  },
];

async function main() {
  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        name: project.name,
        description: project.description,
        status: "active",
      },
      create: project,
    });
  }

  console.log(`Seeded ${projects.length} projects.`);

  const domainCount = await seedProtectedDomains(prisma, "studioops");
  console.log(`Seeded ${domainCount} protected domains for studioops.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
