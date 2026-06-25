const TRIVIAL_RESEARCH_PATTERNS = [
  /^https?:\/\//i,
  /^see\s+/i,
  /^read\s+/i,
  /^reference\b/i,
  /^note:\s*/i,
  /^todo:\s*research/i,
  /^bookmark\b/i,
];

export function isTrivialResearchCapture(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 120 && TRIVIAL_RESEARCH_PATTERNS.some((p) => p.test(trimmed))) {
    return true;
  }
  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return true;
  }
  return false;
}
