import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  exchangeGitHubCode,
  fetchGitHubUser,
  getGitHubOAuthCallbackUrl,
  getGitHubOAuthConfig,
  isGitHubUserAuthorized,
  verifyGitHubOAuthState,
} from "@/lib/github-oauth";

function loginErrorRedirect(request: NextRequest, error: string): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: NextRequest) {
  const config = getGitHubOAuthConfig();
  if (!config) {
    return loginErrorRedirect(request, "oauth_not_configured");
  }

  const { searchParams } = request.nextUrl;
  const oauthError = searchParams.get("error");
  if (oauthError) {
    return loginErrorRedirect(request, oauthError);
  }

  const code = searchParams.get("code");
  if (!code) {
    return loginErrorRedirect(request, "missing_code");
  }

  const nextPath = await verifyGitHubOAuthState(searchParams.get("state"));
  if (!nextPath) {
    return loginErrorRedirect(request, "invalid_state");
  }

  try {
    const redirectUri = getGitHubOAuthCallbackUrl(request.url);
    const accessToken = await exchangeGitHubCode({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri,
    });
    const user = await fetchGitHubUser(accessToken);
    const authorized = await isGitHubUserAuthorized(accessToken, user.login);
    if (!authorized) {
      return loginErrorRedirect(request, "unauthorized");
    }

    const sessionToken = await createSessionToken();
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    response.cookies.set(sessionCookieOptions(sessionToken));
    return response;
  } catch {
    return loginErrorRedirect(request, "oauth_failed");
  }
}
