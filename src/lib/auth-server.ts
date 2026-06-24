import { cookies } from "next/headers";
import {
  createSessionToken,
  isUiAuthenticated,
  sessionCookieOptions,
} from "@/lib/auth";

export async function getAuthenticatedSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("devanvil_session")?.value;
  return isUiAuthenticated(token);
}

export async function setAuthenticatedSession(): Promise<void> {
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions(token));
}
