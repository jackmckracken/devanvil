import { NextRequest, NextResponse } from "next/server";
import { getShortcutConfig } from "@/lib/shortcuts/config";

export async function GET(request: NextRequest) {
  return NextResponse.json(getShortcutConfig(request.url));
}
