import { extractSummary, extractTitle } from "@/lib/text";

const PREFIX_PATTERNS = [
  /^i\s+(want|think|noticed|feel|wonder|wish|had\s+an\s+idea\s+that)\s+/i,
  /^we\s+(need|should|want|could)\s+(to\s+)?/i,
  /^this\s+feels\s+(wrong|off)\s*[—–-]?\s*/i,
  /^i\s+noticed\s+(that\s+)?/i,
  /^what\s+if\s+/i,
];

export function extractIntent(text: string): string {
  let intent = text.trim();
  for (const pattern of PREFIX_PATTERNS) {
    intent = intent.replace(pattern, "");
  }
  intent = intent.replace(/^[.…]\s*/, "").trim();
  if (!intent) return text.trim();
  return intent.charAt(0).toUpperCase() + intent.slice(1);
}

export function deriveArchitecturalSummary(text: string): {
  title: string;
  summary: string;
  intent: string;
} {
  const intent = extractIntent(text);
  return {
    intent,
    title: extractTitle(intent),
    summary: extractSummary(intent),
  };
}
