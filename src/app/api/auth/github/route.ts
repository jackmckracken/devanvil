import { NextRequest, NextResponse } from "next/server";
import {
  buildGitHubAuthorizeUrl,
  createGitHubOAuthState,
  getGitHubOAuthCallbackUrl,
  getGitHubOAuthConfig,
  getGitHubOAuthScopes,
} from "@/lib/github-oauth";

export async function GET(request: NextRequest) {
  const config = getGitHubOAuthConfig();
  if (!config) {
    return NextResponse.json(
      { error: "GitHub OAuth is not configured" },
      { status: 503 },
    );
  }

  const requestedNext = request.nextUrl.searchParams.get("next") ?? "/queue";
  const nextPath =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/queue";

  const state = await createGitHubOAuthState(nextPath);
  const redirectUri = getGitHubOAuthCallbackUrl(request.url);
  const authorizeUrl = buildGitHubAuthorizeUrl({
    clientId: config.clientId,
    redirectUri,
    state,
    scopes: getGitHubOAuthScopes(),
  });

  return NextResponse.redirect(authorizeUrl);
}
