import "./load-env";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
  DevItemStatus,
  ItemType,
  Prisma,
} from "../src/generated/prisma/client";
import { PrismaClient } from "../src/generated/prisma/client";
import { findMatches, persistMatches } from "../src/lib/duplicate-detection";
import {
  buildBranchName,
  extractSummary,
  extractTitle,
  normalizeText,
  slugify,
} from "../src/lib/text";

const PROJECT_SLUG = "studioops";
const MAX_EXCERPT = 2000;
const MAX_TITLE = 120;
const MIN_ITEM_LENGTH = 8;
const IMPORT_ACTIONS = new Set(["studioops_import", "studioops_updated"]);

const SOURCE_FILES = [
  "docs/product-roadmap.md",
  "docs/feature-inventory.md",
  "docs/product-relationships.md",
  "docs/product-decisions.md",
  "docs/studioops-development-control-center.md",
  "docs/agent-memory/regression-log.md",
  "docs/agent-memory/lessons-learned.md",
  "docs/agent-memory/decisions.md",
] as const;

const SECTION_STATUS: Record<string, DevItemStatus> = {
  "active development": "in_build",
  "approved next": "approved",
  "future concepts": "captured",
  "parking lot": "captured",
  shipped: "shipped",
  "orphaned features": "archived",
  "known regressions": "captured",
  "regression watchlist": "triaged",
  "open questions": "captured",
  "planned features": "approved",
  "deferred features": "archived",
};

const SECTION_TYPE: Record<string, ItemType> = {
  "known regressions": "regression",
  "regression watchlist": "regression",
  "open questions": "question",
  "parking lot": "opportunity",
  "deferred features": "feature",
};

const FILE_TYPE: Record<string, ItemType> = {
  "docs/agent-memory/regression-log.md": "regression",
  "docs/product-decisions.md": "decision",
  "docs/agent-memory/decisions.md": "decision",
  "docs/agent-memory/lessons-learned.md": "decision",
  "docs/product-roadmap.md": "feature",
  "docs/feature-inventory.md": "feature",
  "docs/product-relationships.md": "feature",
  "docs/studioops-development-control-center.md": "chore",
};

const STATUS_PATTERNS: Array<{ pattern: RegExp; status: DevItemStatus }> = [
  { pattern: /\bshipped\b/i, status: "shipped" },
  { pattern: /\bin progress\b/i, status: "in_build" },
  { pattern: /\bapproved\b/i, status: "approved" },
  { pattern: /\bproposed\b/i, status: "captured" },
  { pattern: /\bconcept\b/i, status: "captured" },
  { pattern: /\bdeferred\b/i, status: "archived" },
  { pattern: /\bfrozen\b/i, status: "archived" },
  { pattern: /\bduplicate\b/i, status: "duplicate" },
  { pattern: /\bfixed\b/i, status: "shipped" },
  { pattern: /\bresolved\b/i, status: "shipped" },
  { pattern: /\bunresolved\b/i, status: "captured" },
  { pattern: /\bwatchlist\b/i, status: "triaged" },
  { pattern: /\bcurrent\b/i, status: "captured" },
];

type ParsedCandidate = {
  title: string;
  excerpt: string;
  sourceFile: string;
  sourceHeading: string;
  itemType: ItemType;
  status: DevItemStatus;
  externalKey: string;
};

type ImportStats = {
  created: number;
  updated: number;
  skipped: number;
  matched: number;
  missingFiles: string[];
  errors: Array<{ externalKey?: string; title?: string; error: string }>;
  items: Array<{
    action: "created" | "updated" | "skipped" | "matched";
    externalKey: string;
    title: string;
    itemId?: string;
    note?: string;
  }>;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function capExcerpt(text: string): string {
  const normalized = normalizeText(text);
  if (normalized.length <= MAX_EXCERPT) return normalized;
  return `${normalized.slice(0, MAX_EXCERPT - 3)}...`;
}

function capTitle(text: string): string {
  const title = extractTitle(text);
  if (title.length <= MAX_TITLE) return title;
  return `${title.slice(0, MAX_TITLE - 3)}...`;
}

function normalizeHeading(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function makeExternalKey(
  sourceFile: string,
  sourceHeading: string,
  title: string,
): string {
  const payload = `${sourceFile}|${normalizeHeading(sourceHeading)}|${normalizeHeading(title)}`;
  const hash = createHash("sha256").update(payload).digest("hex").slice(0, 12);
  return `studioops:${sourceFile}:${hash}`;
}

function inferStatusFromText(text: string, fallback: DevItemStatus): DevItemStatus {
  for (const { pattern, status } of STATUS_PATTERNS) {
    if (pattern.test(text)) return status;
  }
  return fallback;
}

function inferTypeFromFileAndSection(
  sourceFile: string,
  sectionHeading: string,
): ItemType {
  const sectionKey = normalizeHeading(sectionHeading);
  if (SECTION_TYPE[sectionKey]) return SECTION_TYPE[sectionKey];
  if (FILE_TYPE[sourceFile]) return FILE_TYPE[sourceFile];
  return "feature";
}

function inferStatusFromSection(sectionHeading: string): DevItemStatus {
  const key = normalizeHeading(sectionHeading);
  return SECTION_STATUS[key] ?? "captured";
}

function buildImportSuggestedCommand(
  itemType: ItemType,
  title: string,
  itemId?: string,
): string {
  const slug = slugify(title);
  if (itemType === "bug" || itemType === "regression") {
    return `/bug_fix ${PROJECT_SLUG} ${slug}`;
  }
  if (itemType === "chore" || itemType === "decision" || itemType === "question") {
    return `/chore ${PROJECT_SLUG} ${slug}`;
  }
  const idPart = itemId ? ` ${itemId}` : "";
  return `/forge_pick${idPart}`;
}

function cleanBulletText(line: string): string {
  return line
    .replace(/^[\s>*-]+/, "")
    .replace(/^\[[ xX]\]\s*/, "")
    .replace(/\*\*/g, "")
    .trim();
}

function extractTitleFromLine(line: string): string {
  const cleaned = cleanBulletText(line);
  const withoutStatus = cleaned
    .replace(/^\[(?:concept|proposed|approved|in progress|shipped|deferred|frozen|fixed|resolved|duplicate|unresolved|watchlist|current)\]\s*/i, "")
    .replace(/^\((?:concept|proposed|approved|in progress|shipped|deferred|frozen|fixed|resolved|duplicate|unresolved|watchlist|current)\)\s*/i, "")
    .trim();

  const dashSplit = withoutStatus.split(/\s[-–—]\s/);
  const candidate = dashSplit[0]?.trim() || withoutStatus;
  return capTitle(candidate);
}

function isLikelyBacklogLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < MIN_ITEM_LENGTH) return false;
  if (/^#{1,6}\s/.test(trimmed)) return false;
  if (/^\|/.test(trimmed)) return false;
  if (/^[-|:|\s]+$/.test(trimmed)) return false;
  if (/^(see also|note:|todo:|table of contents)/i.test(trimmed)) return false;
  return /^[-*+]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
}

type MarkdownSection = {
  heading: string;
  content: string;
  headingPath: string[];
};

function parseMarkdownSections(content: string): MarkdownSection[] {
  const lines = content.split(/\r?\n/);
  const sections: MarkdownSection[] = [];
  let headingStack: string[] = [];
  let currentHeading = "Document";
  let currentLines: string[] = [];

  const flush = () => {
    const body = currentLines.join("\n").trim();
    if (body) {
      sections.push({
        heading: currentHeading,
        content: body,
        headingPath: [...headingStack],
      });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flush();
      const level = headingMatch[1].length;
      const title = headingMatch[2].replace(/#+\s*$/, "").trim();
      headingStack = headingStack.slice(0, level - 1);
      headingStack[level - 1] = title;
      headingStack = headingStack.filter(Boolean);
      currentHeading = title;
      continue;
    }
    currentLines.push(line);
  }

  flush();
  return sections;
}

function parseTableRows(content: string): Array<Record<string, string>> {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().startsWith("|"));
  if (lines.length < 2) return [];

  const splitRow = (line: string) =>
    line
      .split("|")
      .map((cell) => cell.trim())
      .filter((_, index, arr) => index > 0 && index < arr.length - 1);

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase());
  const rows: Array<Record<string, string>> = [];

  for (const line of lines.slice(2)) {
    if (/^[-:\s|]+$/.test(line)) continue;
    const cells = splitRow(line);
    if (cells.length === 0) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    rows.push(row);
  }

  return rows;
}

function pickTableTitle(row: Record<string, string>): string | null {
  const titleKeys = [
    "feature",
    "title",
    "name",
    "item",
    "decision",
    "question",
    "regression",
    "bug",
  ];
  for (const key of titleKeys) {
    if (row[key]?.trim()) return capTitle(row[key].trim());
  }
  const firstValue = Object.values(row).find((value) => value.trim().length >= MIN_ITEM_LENGTH);
  return firstValue ? capTitle(firstValue.trim()) : null;
}

function pickTableStatus(row: Record<string, string>): string {
  const statusKeys = ["status", "state", "phase"];
  for (const key of statusKeys) {
    if (row[key]?.trim()) return row[key].trim();
  }
  return Object.values(row).join(" ");
}

function extractItemsFromSection(
  section: MarkdownSection,
  sourceFile: string,
): ParsedCandidate[] {
  const items: ParsedCandidate[] = [];
  const sectionStatus = inferStatusFromSection(section.heading);
  const sectionType = inferTypeFromFileAndSection(sourceFile, section.heading);
  const sourceHeading = section.headingPath.join(" > ") || section.heading;

  for (const row of parseTableRows(section.content)) {
    const title = pickTableTitle(row);
    if (!title || title.length < MIN_ITEM_LENGTH) continue;

    const rowText = Object.values(row).join(" | ");
    const status = inferStatusFromText(
      `${pickTableStatus(row)} ${rowText}`,
      sectionStatus,
    );
    const itemType =
      sectionType === "regression" || /\bregression\b/i.test(rowText)
        ? "regression"
        : inferStatusFromText(rowText, sectionStatus) === "duplicate"
          ? sectionType
          : sectionType;

    const excerpt = capExcerpt(`${sourceHeading}\n${rowText}`);
    items.push({
      title,
      excerpt,
      sourceFile,
      sourceHeading,
      itemType: /\bbug\b/i.test(rowText) ? "bug" : itemType,
      status,
      externalKey: makeExternalKey(sourceFile, sourceHeading, title),
    });
  }

  const lines = section.content.split(/\r?\n/);
  for (const line of lines) {
    if (!isLikelyBacklogLine(line)) continue;

    const title = extractTitleFromLine(line);
    if (title.length < MIN_ITEM_LENGTH) continue;

    const status = inferStatusFromText(line, sectionStatus);
    const itemType = /\bregression\b/i.test(line)
      ? "regression"
      : /\bbug\b/i.test(line)
        ? "bug"
        : sectionType;

    items.push({
      title,
      excerpt: capExcerpt(`${sourceHeading}\n${cleanBulletText(line)}`),
      sourceFile,
      sourceHeading,
      itemType,
      status,
      externalKey: makeExternalKey(sourceFile, sourceHeading, title),
    });
  }

  if (items.length === 0 && section.content.length >= MIN_ITEM_LENGTH && section.content.length <= 800) {
    const title = capTitle(section.heading);
    if (title.length >= MIN_ITEM_LENGTH && normalizeHeading(title) !== "document") {
      items.push({
        title,
        excerpt: capExcerpt(section.content),
        sourceFile,
        sourceHeading,
        itemType: sectionType,
        status: inferStatusFromText(section.content, sectionStatus),
        externalKey: makeExternalKey(sourceFile, sourceHeading, title),
      });
    }
  }

  return items;
}

function parseSourceFile(sourceFile: string, content: string): ParsedCandidate[] {
  const sections = parseMarkdownSections(content);
  const allItems: ParsedCandidate[] = [];
  const seenKeys = new Set<string>();

  for (const section of sections) {
    if (section.content.length > 15000) continue;

    for (const item of extractItemsFromSection(section, sourceFile)) {
      if (seenKeys.has(item.externalKey)) continue;
      seenKeys.add(item.externalKey);
      allItems.push(item);
    }
  }

  return allItems;
}

async function isImportOnlyItem(itemId: string): Promise<boolean> {
  const activities = await prisma.devActivity.findMany({
    where: { devItemId: itemId },
    select: { action: true },
  });
  if (activities.length === 0) return true;
  return activities.every((activity) => IMPORT_ACTIONS.has(activity.action));
}

async function upsertSourceArtifact(
  devItemId: string,
  candidate: ParsedCandidate,
  importedAt: string,
): Promise<void> {
  const metadata = {
    source: "studioops_import",
    sourceFile: candidate.sourceFile,
    sourceHeading: candidate.sourceHeading,
    importedAt,
    externalKey: candidate.externalKey,
  };

  const artifacts = await prisma.devArtifact.findMany({
    where: { devItemId, artifactType: "note" },
  });
  const existing = artifacts.find((artifact) => {
    const meta = artifact.metadataJson as Record<string, unknown> | null;
    return meta?.source === "studioops_import";
  });

  if (existing) {
    await prisma.devArtifact.update({
      where: { id: existing.id },
      data: {
        content: candidate.excerpt,
        metadataJson: metadata as Prisma.InputJsonValue,
      },
    });
    return;
  }

  await prisma.devArtifact.create({
    data: {
      devItemId,
      artifactType: "note",
      content: candidate.excerpt,
      metadataJson: metadata as Prisma.InputJsonValue,
    },
  });
}

async function importCandidate(
  candidate: ParsedCandidate,
  projectId: string,
  importedAt: string,
  stats: ImportStats,
): Promise<void> {
  try {
    const byExternalKey = await prisma.devItem.findUnique({
      where: { externalKey: candidate.externalKey },
    });

    if (byExternalKey) {
      const importOnly = await isImportOnlyItem(byExternalKey.id);
      const summary = extractSummary(candidate.excerpt);

      if (importOnly) {
        await prisma.devItem.update({
          where: { id: byExternalKey.id },
          data: {
            title: candidate.title,
            rawText: candidate.excerpt,
            normalizedSummary: summary,
            itemType: candidate.itemType,
            status: candidate.status,
            suggestedBranchName: buildBranchName(candidate.itemType, candidate.title),
            suggestedCommand: buildImportSuggestedCommand(
              candidate.itemType,
              candidate.title,
              byExternalKey.id,
            ),
          },
        });
        stats.updated += 1;
        stats.items.push({
          action: "updated",
          externalKey: candidate.externalKey,
          title: candidate.title,
          itemId: byExternalKey.id,
        });
      } else {
        await prisma.devActivity.create({
          data: {
            devItemId: byExternalKey.id,
            action: "studioops_updated",
            note: `StudioOps import found updated source for "${candidate.sourceFile}" (${candidate.sourceHeading}). Preserved manual edits.`,
          },
        });
        stats.skipped += 1;
        stats.items.push({
          action: "skipped",
          externalKey: candidate.externalKey,
          title: candidate.title,
          itemId: byExternalKey.id,
          note: "Manually modified item preserved",
        });
      }

      await upsertSourceArtifact(byExternalKey.id, candidate, importedAt);
      return;
    }

    const byTitle = await prisma.devItem.findFirst({
      where: {
        projectId,
        title: { equals: candidate.title, mode: "insensitive" },
      },
    });

    if (byTitle) {
      stats.skipped += 1;
      stats.items.push({
        action: "skipped",
        externalKey: candidate.externalKey,
        title: candidate.title,
        itemId: byTitle.id,
        note: "Matching title already exists in StudioOps project",
      });
      return;
    }

    const summary = extractSummary(candidate.excerpt);
    const { duplicates, related } = await findMatches(candidate.title, summary);
    const allMatches = [...duplicates, ...related];

    const item = await prisma.devItem.create({
      data: {
        projectId,
        title: candidate.title,
        rawText: candidate.excerpt,
        normalizedSummary: summary,
        sourceType: "note",
        itemType: candidate.itemType,
        status: candidate.status,
        confidenceScore: 0.9,
        externalKey: candidate.externalKey,
        suggestedBranchName: buildBranchName(candidate.itemType, candidate.title),
        suggestedCommand: buildImportSuggestedCommand(candidate.itemType, candidate.title),
        artifacts: {
          create: {
            artifactType: "note",
            content: candidate.excerpt,
            metadataJson: {
              source: "studioops_import",
              sourceFile: candidate.sourceFile,
              sourceHeading: candidate.sourceHeading,
              importedAt,
              externalKey: candidate.externalKey,
            },
          },
        },
        activity: {
          create: {
            action: "studioops_import",
            note: `Imported from ${candidate.sourceFile} (${candidate.sourceHeading})`,
          },
        },
      },
    });

    await prisma.devItem.update({
      where: { id: item.id },
      data: {
        suggestedCommand: buildImportSuggestedCommand(
          candidate.itemType,
          candidate.title,
          item.id,
        ),
      },
    });

    if (allMatches.length > 0) {
      await persistMatches(item.id, allMatches);
      stats.matched += 1;
      stats.items.push({
        action: "matched",
        externalKey: candidate.externalKey,
        title: candidate.title,
        itemId: item.id,
        note: `${allMatches.length} similar item(s) linked`,
      });
    } else {
      stats.created += 1;
      stats.items.push({
        action: "created",
        externalKey: candidate.externalKey,
        title: candidate.title,
        itemId: item.id,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stats.errors.push({
      externalKey: candidate.externalKey,
      title: candidate.title,
      error: message,
    });
  }
}

function formatLogTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

async function main() {
  const repoPath = process.env.STUDIOOPS_REPO_PATH?.trim();
  if (!repoPath) {
    throw new Error("STUDIOOPS_REPO_PATH is not configured");
  }
  if (!existsSync(repoPath)) {
    throw new Error(`STUDIOOPS_REPO_PATH does not exist: ${repoPath}`);
  }

  const stats: ImportStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    matched: 0,
    missingFiles: [],
    errors: [],
    items: [],
  };

  const project = await prisma.project.upsert({
    where: { slug: PROJECT_SLUG },
    update: {
      name: "StudioOps",
      description: "Music studio operations and practice coaching platform.",
      status: "active",
    },
    create: {
      name: "StudioOps",
      slug: PROJECT_SLUG,
      description: "Music studio operations and practice coaching platform.",
      status: "active",
    },
  });

  const importedAt = new Date().toISOString();
  const candidates: ParsedCandidate[] = [];

  for (const sourceFile of SOURCE_FILES) {
    const absolutePath = join(repoPath, sourceFile);
    if (!existsSync(absolutePath)) {
      console.warn(`Missing file: ${sourceFile}`);
      stats.missingFiles.push(sourceFile);
      continue;
    }

    try {
      const content = readFileSync(absolutePath, "utf8");
      const relativePath = relative(repoPath, absolutePath).replace(/\\/g, "/");
      const parsed = parseSourceFile(relativePath, content);
      console.log(`Parsed ${parsed.length} candidate(s) from ${sourceFile}`);
      candidates.push(...parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stats.errors.push({ error: `Failed to parse ${sourceFile}: ${message}` });
      console.error(`Error parsing ${sourceFile}: ${message}`);
    }
  }

  for (const candidate of candidates) {
    await importCandidate(candidate, project.id, importedAt, stats);
  }

  const logDir = join(process.cwd(), "logs");
  mkdirSync(logDir, { recursive: true });
  const logPath = join(logDir, `import-studioops-${formatLogTimestamp(new Date())}.json`);
  writeFileSync(
    logPath,
    JSON.stringify(
      {
        importedAt,
        repoPath,
        summary: {
          created: stats.created,
          updated: stats.updated,
          skipped: stats.skipped,
          matched: stats.matched,
          missingFiles: stats.missingFiles,
          errors: stats.errors.length,
        },
        missingFiles: stats.missingFiles,
        errors: stats.errors,
        items: stats.items,
      },
      null,
      2,
    ),
  );

  console.log("");
  console.log("StudioOps import complete");
  console.log(`Created: ${stats.created}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Matched: ${stats.matched}`);
  console.log(`Missing files: ${stats.missingFiles.length}`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log(`Log: ${logPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
