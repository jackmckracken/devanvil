import type { PrismaClient } from "@/generated/prisma/client";
import { buildClusters } from "@/lib/curation/clusterer";
import { findDuplicateGroups } from "@/lib/curation/duplicate-grouper";
import {
  extractImportMetadata,
  hasManualEdits,
  isImportOnlyActivity,
} from "@/lib/curation/import-utils";
import { classifyJunk, scoreItemQuality } from "@/lib/curation/junk-classifier";
import { normalizeTitle } from "@/lib/curation/title-normalizer";
import type {
  Cluster,
  CurationItem,
  CurationReport,
  DuplicateGroup,
} from "@/lib/curation/types";

export type RunCurationOptions = {
  projectSlug: string;
  dryRun: boolean;
  prisma: PrismaClient;
};

export type RunCurationResult = {
  report: CurationReport;
  logPath: string;
};

type EnrichedItem = CurationItem & {
  _junkVerdict: ReturnType<typeof classifyJunk>;
  _manualEdits: boolean;
};

async function loadProjectItems(
  prisma: PrismaClient,
  projectSlug: string,
): Promise<EnrichedItem[]> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectSlug}`);
  }

  const rows = await prisma.devItem.findMany({
    where: { projectId: project.id },
    include: {
      artifacts: {
        where: { artifactType: "note" },
        select: { metadataJson: true },
        take: 1,
      },
      activity: {
        select: { action: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => {
    const importMeta = extractImportMetadata(row.artifacts[0]?.metadataJson);
    const importOnly = isImportOnlyActivity(row.activity);
    const junkVerdict = classifyJunk(row.title, row.rawText);

    return {
      id: row.id,
      title: row.title,
      rawText: row.rawText,
      normalizedSummary: row.normalizedSummary,
      itemType: row.itemType,
      status: row.status,
      externalKey: row.externalKey,
      curationState: row.curationState,
      qualityScore: row.qualityScore ?? scoreItemQuality(row.title, row.rawText, junkVerdict),
      importOnly,
      sourceFile: importMeta.sourceFile,
      sourceHeading: importMeta.sourceHeading,
      _junkVerdict: junkVerdict,
      _manualEdits: hasManualEdits(row.activity),
    };
  });
}

function stripInternal(items: EnrichedItem[]): CurationItem[] {
  return items.map((item) => {
    const { _junkVerdict: _jv, _manualEdits: _me, ...rest } = item;
    void _jv;
    void _me;
    return rest;
  });
}

async function optionallyEnhanceWithLlm(
  duplicateGroups: DuplicateGroup[],
): Promise<DuplicateGroup[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || duplicateGroups.length === 0) return duplicateGroups;

  return duplicateGroups;
}

export async function runCuration(
  options: RunCurationOptions,
): Promise<RunCurationResult> {
  const { projectSlug, dryRun, prisma } = options;
  const runAt = new Date().toISOString();
  const enriched = await loadProjectItems(prisma, projectSlug);
  const items = stripInternal(enriched);

  const report: CurationReport = {
    runAt,
    projectSlug,
    dryRun,
    totalScanned: items.length,
    junkArchived: 0,
    renamed: 0,
    duplicateGroups: [],
    clusters: [],
    errors: [],
    manualReview: [],
    junkCandidates: [],
    renameCandidates: [],
  };

  for (const item of enriched) {
    if (item._junkVerdict.isJunk) {
      report.junkCandidates.push({
        id: item.id,
        title: item.title,
        reason: item._junkVerdict.reason,
      });

      const protectedItem = item._manualEdits && !item.importOnly;

      if (protectedItem) {
        report.manualReview.push({
          itemId: item.id,
          title: item.title,
          reason: `Junk candidate but protected (${item._junkVerdict.reason})`,
        });
        continue;
      }

      if (!dryRun) {
        try {
          await prisma.devItem.update({
            where: { id: item.id },
            data: {
              status: "archived",
              curationState: "archive_junk",
              curationReason: item._junkVerdict.reason,
              qualityScore: item.qualityScore,
              activity: {
                create: {
                  action: "curation_junk_archived",
                  note: `Archived as junk: ${item._junkVerdict.reason}`,
                },
              },
            },
          });
          report.junkArchived += 1;
        } catch (error) {
          report.errors.push({
            itemId: item.id,
            title: item.title,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    } else if (item.curationState === "unreviewed") {
      const quality = scoreItemQuality(item.title, item.rawText, item._junkVerdict);

      if (!dryRun) {
        await prisma.devItem.update({
          where: { id: item.id },
          data: {
            qualityScore: quality,
            curationState: "keep",
            curationReason: "actionable backlog item",
          },
        });
      }
    }
  }

  const activeEnriched = enriched.filter((item) => !item._junkVerdict.isJunk);

  for (const item of activeEnriched) {
    if (item._junkVerdict.isJunk) continue;

    const normalization = normalizeTitle(item.title);
    if (!normalization.changed) continue;

    const normalizedJunk = classifyJunk(normalization.normalized);
    if (normalizedJunk.isJunk) continue;

    report.renameCandidates.push({
      id: item.id,
      from: normalization.original,
      to: normalization.normalized,
      reason: normalization.reason,
    });

    const canRename = item.importOnly && !item._manualEdits;

    if (!canRename) {
      report.manualReview.push({
        itemId: item.id,
        title: item.title,
        reason: `Rename suggested: "${normalization.normalized}" (${normalization.reason})`,
      });
      continue;
    }

    if (!dryRun) {
      try {
        await prisma.devItem.update({
          where: { id: item.id },
          data: {
            title: normalization.normalized,
            curationReason: normalization.reason,
            activity: {
              create: {
                action: "curation_renamed",
                note: `Renamed from "${normalization.original}"`,
              },
            },
          },
        });
        report.renamed += 1;
      } catch (error) {
        report.errors.push({
          itemId: item.id,
          title: item.title,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const activeItems = stripInternal(
    activeEnriched.filter((item) => !item._junkVerdict.isJunk),
  );

  report.duplicateGroups = await optionallyEnhanceWithLlm(
    findDuplicateGroups(activeItems),
  );

  for (const group of report.duplicateGroups) {
    if (!dryRun) {
      try {
        const canonicalItem = activeItems.find((i) => i.id === group.canonicalId);
        const canonicalNormalization = canonicalItem
          ? normalizeTitle(canonicalItem.title)
          : null;
        const canonicalTitle =
          canonicalNormalization?.changed && canonicalNormalization.normalized
            ? canonicalNormalization.normalized
            : group.canonicalTitle;

        await prisma.devItem.update({
          where: { id: group.canonicalId },
          data: {
            ...(canonicalNormalization?.changed
              ? { title: canonicalTitle }
              : {}),
            curationState: "canonical",
            canonicalItemId: null,
            curationReason: "canonical duplicate group representative",
            activity: {
              create: {
                action: "curation_canonical",
                note: `Marked canonical for ${group.members.length} related item(s)`,
              },
            },
          },
        });

        for (const member of group.members) {
          await prisma.devItem.update({
            where: { id: member.id },
            data: {
              curationState: member.curationState,
              canonicalItemId: group.canonicalId,
              ...(member.curationState === "duplicate"
                ? {
                    duplicateOfId: group.canonicalId,
                    status: "duplicate" as const,
                  }
                : {}),
              curationReason: `Similar to canonical: ${group.canonicalTitle}`,
              activity: {
                create: {
                  action: "curation_duplicate",
                  note: `Linked to canonical "${group.canonicalTitle}" (${member.similarity})`,
                },
              },
            },
          });
        }
      } catch (error) {
        report.errors.push({
          itemId: group.canonicalId,
          title: group.canonicalTitle,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  report.clusters = buildClusters(activeItems, report.duplicateGroups);

  const { mkdirSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");

  const pad = (value: number) => String(value).padStart(2, "0");
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const logDir = join(process.cwd(), "logs");
  mkdirSync(logDir, { recursive: true });
  const logPath = join(logDir, `curation-${stamp}.json`);
  writeFileSync(logPath, JSON.stringify(report, null, 2));

  return { report, logPath };
}

export function printCurationSummary(report: CurationReport, logPath: string): void {
  console.log("");
  console.log(`Curation ${report.dryRun ? "dry run" : "apply"} — ${report.projectSlug}`);
  console.log(`Total scanned: ${report.totalScanned}`);
  console.log(`Junk candidates: ${report.junkCandidates.length}`);
  if (!report.dryRun) {
    console.log(`Junk archived: ${report.junkArchived}`);
    console.log(`Renamed: ${report.renamed}`);
  }
  console.log(`Rename candidates: ${report.renameCandidates.length}`);
  console.log(`Duplicate groups: ${report.duplicateGroups.length}`);
  console.log(`Clusters: ${report.clusters.length}`);
  console.log(`Manual review: ${report.manualReview.length}`);
  console.log(`Errors: ${report.errors.length}`);
  console.log(`Report: ${logPath}`);
  console.log("");

  if (report.junkCandidates.length > 0) {
    console.log("--- Junk to archive ---");
    for (const junk of report.junkCandidates.slice(0, 30)) {
      console.log(`  [${junk.id.slice(0, 8)}] ${junk.title} — ${junk.reason}`);
    }
    if (report.junkCandidates.length > 30) {
      console.log(`  ... and ${report.junkCandidates.length - 30} more`);
    }
    console.log("");
  }

  if (report.renameCandidates.length > 0) {
    console.log("--- Title renames ---");
    for (const rename of report.renameCandidates.slice(0, 20)) {
      console.log(`  "${rename.from}" → "${rename.to}"`);
    }
    if (report.renameCandidates.length > 20) {
      console.log(`  ... and ${report.renameCandidates.length - 20} more`);
    }
    console.log("");
  }

  if (report.duplicateGroups.length > 0) {
    console.log("--- Duplicate groups ---");
    for (const group of report.duplicateGroups.slice(0, 15)) {
      console.log(`  Canonical: ${group.canonicalTitle}`);
      for (const member of group.members) {
        console.log(`    - [${member.curationState}] ${member.title} (${member.similarity})`);
      }
    }
    console.log("");
  }

  if (report.clusters.length > 0) {
    console.log("--- Clusters ---");
    for (const cluster of report.clusters.slice(0, 15)) {
      console.log(`  ${cluster.name} (${cluster.itemIds.length} items)`);
    }
    console.log("");
  }

  if (report.manualReview.length > 0) {
    console.log("--- Manual review ---");
    for (const item of report.manualReview.slice(0, 15)) {
      console.log(`  [${item.itemId.slice(0, 8)}] ${item.title}: ${item.reason}`);
    }
    console.log("");
  }
}

export type { Cluster };
