#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getShortcutConfig } from "../src/lib/shortcuts/config";
import { buildShortcutJson, buildShortcutPlist } from "../src/lib/shortcuts/workflow";

const config = getShortcutConfig();
const outDir = join(process.cwd(), "public", "shortcuts");
mkdirSync(outDir, { recursive: true });

for (const platform of ["ios", "macos"] as const) {
  const json = buildShortcutJson(platform, config.apiUrl);
  const plist = buildShortcutPlist(platform, config.apiUrl);
  const basename = platform === "ios" ? "devanvil-ios" : "devanvil-macos";

  writeFileSync(join(outDir, `${basename}.json`), `${JSON.stringify(json, null, 2)}\n`);
  writeFileSync(join(outDir, `${basename}.shortcut`), plist);
}

console.log(`Generated shortcuts in ${outDir}`);
