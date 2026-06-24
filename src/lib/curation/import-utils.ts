const IMPORT_ACTIONS = new Set([
  "studioops_import",
  "studioops_updated",
  "curation_junk_archived",
  "curation_renamed",
  "curation_duplicate",
  "curation_canonical",
  "curation_keep",
]);

const MANUAL_ACTION_PREFIXES = ["status:", "updated"];

export function isImportOnlyActivity(
  activities: Array<{ action: string }>,
): boolean {
  if (activities.length === 0) return true;
  return activities.every(
    (activity) =>
      IMPORT_ACTIONS.has(activity.action) ||
      activity.action.startsWith("curation_"),
  );
}

export function hasManualEdits(
  activities: Array<{ action: string }>,
): boolean {
  return activities.some(
    (activity) =>
      MANUAL_ACTION_PREFIXES.some((prefix) => activity.action.startsWith(prefix)) &&
      !activity.action.startsWith("status:archived"),
  );
}

export type ImportMetadata = {
  sourceFile?: string;
  sourceHeading?: string;
};

export function extractImportMetadata(
  metadataJson: unknown,
): ImportMetadata {
  if (!metadataJson || typeof metadataJson !== "object") return {};
  const meta = metadataJson as Record<string, unknown>;
  return {
    sourceFile: typeof meta.sourceFile === "string" ? meta.sourceFile : undefined,
    sourceHeading:
      typeof meta.sourceHeading === "string" ? meta.sourceHeading : undefined,
  };
}
