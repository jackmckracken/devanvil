export type ShortcutConfig = {
  apiUrl: string;
  defaultProject: string;
  version: string;
  product: string;
};

export function getPublicApiUrl(requestUrl?: string): string {
  const configured = process.env.DEVANVIL_PUBLIC_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}//${url.host}`;
  }

  return "http://localhost:3000";
}

export function getShortcutConfig(requestUrl?: string): ShortcutConfig {
  return {
    apiUrl: getPublicApiUrl(requestUrl),
    defaultProject:
      process.env.DEVANVIL_DEFAULT_PROJECT?.trim() || "studioops",
    version: "1",
    product: "devanvil",
  };
}
