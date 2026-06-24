import "./load-env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { printCurationSummary, runCuration } from "../src/lib/curation/run-curation";

function parseArgs(argv: string[]): {
  project: string;
  dryRun: boolean;
} {
  let project = "studioops";
  let dryRun = true;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project" && argv[i + 1]) {
      project = argv[i + 1];
      i += 1;
    } else if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--apply") {
      dryRun = false;
    }
  }

  return { project, dryRun };
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const { project, dryRun } = parseArgs(process.argv.slice(2));

  if (dryRun) {
    console.log("Dry run mode (pass --apply to persist changes)");
  } else {
    console.log("Apply mode — changes will be written to the database");
  }

  const { report, logPath } = await runCuration({
    projectSlug: project,
    dryRun,
    prisma,
  });

  printCurationSummary(report, logPath);

  if (dryRun) {
    console.log("No changes applied. Re-run with --apply to persist.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
