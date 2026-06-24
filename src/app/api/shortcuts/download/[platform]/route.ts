import { NextRequest, NextResponse } from "next/server";
import { getShortcutConfig } from "@/lib/shortcuts/config";
import { buildShortcutPlist } from "@/lib/shortcuts/workflow";

type Platform = "ios" | "macos";

function resolvePlatform(value: string): Platform | null {
  if (value === "ios") return "ios";
  if (value === "macos" || value === "mac") return "macos";
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform: rawPlatform } = await params;
  const platform = resolvePlatform(rawPlatform);

  if (!platform) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }

  const config = getShortcutConfig(request.url);
  const plist = buildShortcutPlist(platform, config.apiUrl);
  const filename =
    platform === "ios" ? "devanvil-ios.shortcut" : "devanvil-macos.shortcut";

  return new NextResponse(plist, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
