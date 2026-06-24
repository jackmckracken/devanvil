import { getPublicApiUrl } from "@/lib/shortcuts/config";
import { createSignedStateToken, verifySignedStateToken } from "@/lib/auth-session";

const OAUTH_STATE_PREFIX = "github-oauth";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type GitHubOAuthConfig = {
  clientId: string;
  clientSecret: string;
};

export type GitHubUser = {
  login: string;
  id: number;
  name: string | null;
};

export function getGitHubOAuthConfig(): GitHubOAuthConfig | null {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function getGitHubOAuthCallbackUrl(requestUrl: string): string {
  return `${getPublicApiUrl(requestUrl)}/api/auth/github/callback`;
}

export function getAllowedGitHubUsers(): Set<string> {
  const raw = process.env.GITHUB_OAUTH_ALLOWED_USERS ?? "";
  return new Set(
    raw
      .split(",")
      .map((username) => username.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function getAllowedGitHubOrg(): string | null {
  const org = process.env.GITHUB_OAUTH_ALLOWED_ORG?.trim();
  return org || null;
}

export function getGitHubOAuthScopes(): string {
  return getAllowedGitHubOrg() ? "read:user read:org" : "read:user";
}

export function isGitHubUserAllowlisted(login: string): boolean {
  const allowed = getAllowedGitHubUsers();
  if (allowed.size === 0) return false;
  return allowed.has(login.toLowerCase());
}

export async function createGitHubOAuthState(nextPath: string): Promise<string> {
  return createSignedStateToken(OAUTH_STATE_PREFIX, nextPath, OAUTH_STATE_TTL_MS);
}

export async function verifyGitHubOAuthState(
  state: string | null,
): Promise<string | null> {
  if (!state) return null;
  const nextPath = await verifySignedStateToken(state, OAUTH_STATE_PREFIX);
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null;
  }
  return nextPath;
}

export function buildGitHubAuthorizeUrl(options: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes: string;
}): string {
  const params = new URLSearchParams({
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    scope: options.scopes,
    state: options.state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(options: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      code: options.code,
      redirect_uri: options.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub token exchange failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "Missing access token");
  }

  return payload.access_token;
}

export async function fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub user lookup failed (${response.status})`);
  }

  const payload = (await response.json()) as GitHubUser;
  if (!payload.login) {
    throw new Error("GitHub user response missing login");
  }

  return payload;
}

export async function isGitHubOrgMember(
  accessToken: string,
  org: string,
  login: string,
): Promise<boolean> {
  const response = await fetch(
    `https://api.github.com/orgs/${encodeURIComponent(org)}/members/${encodeURIComponent(login)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  return response.status === 204;
}

export async function isGitHubUserAuthorized(
  accessToken: string,
  login: string,
): Promise<boolean> {
  if (isGitHubUserAllowlisted(login)) return true;

  const org = getAllowedGitHubOrg();
  if (!org) return false;

  return isGitHubOrgMember(accessToken, org, login);
}
