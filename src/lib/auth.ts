import { NextRequest } from "next/server";
import { verifyIngestBearerToken } from "@/lib/ingest-keys";

export {
  clearSessionCookieOptions,
  createSessionToken,
  createSignedStateToken,
  isUiAuthenticated,
  sessionCookieOptions,
  verifySessionToken,
  verifySignedStateToken,
} from "@/lib/auth-session";

export async function verifyIngestToken(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const token = authHeader.slice("Bearer ".length).trim();
  return verifyIngestBearerToken(token);
}
