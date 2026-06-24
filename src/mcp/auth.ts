export function requireMcpToken(): void {
  const token = process.env.DEVANVIL_MCP_TOKEN;
  if (!token || token.trim().length === 0) {
    throw new Error(
      "DEVANVIL_MCP_TOKEN is not configured. Set it in your environment before starting the MCP server.",
    );
  }
}
