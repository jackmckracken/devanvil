"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type IngestKeySummary = {
  id: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export function IngestKeysManager() {
  const [keys, setKeys] = useState<IngestKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/ingest-keys");
    if (!response.ok) {
      setError("Failed to load ingest keys");
      setLoading(false);
      return;
    }
    const data = (await response.json()) as { keys: IngestKeySummary[] };
    setKeys(data.keys);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    setCopied(false);

    const response = await fetch("/api/ingest-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "DevAnvil Ingest Key" }),
    });

    setCreating(false);

    if (!response.ok) {
      setError("Failed to create ingest key");
      return;
    }

    const data = (await response.json()) as {
      key: IngestKeySummary;
      rawKey: string;
    };
    setNewKey(data.rawKey);
    await loadKeys();
  }

  async function handleRevoke(id: string) {
    setError(null);
    const response = await fetch(`/api/ingest-keys/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Failed to revoke key");
      return;
    }
    if (newKey) setNewKey(null);
    await loadKeys();
  }

  async function handleCopy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
  }

  const activeKeys = keys.filter((key) => !key.revokedAt);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              DevAnvil Ingest Keys
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Personal API keys for iOS and macOS shortcuts. Keys are stored
              hashed — copy a new key immediately after creation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Key"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {newKey ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">
              Copy your new ingest key now. It will not be shown again.
            </p>
            <code className="mt-2 block overflow-x-auto rounded-lg bg-white px-3 py-2 text-sm text-zinc-800">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="mt-3 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              {copied ? "Copied" : "Copy Key"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Active Keys
        </h3>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading keys...</p>
        ) : activeKeys.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No active ingest keys. Create one to use with shortcuts.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-100">
            {activeKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-zinc-900">{key.label}</p>
                  <p className="text-sm text-zinc-500">
                    {key.keyPrefix}••••••••
                    {key.lastUsedAt
                      ? ` · Last used ${new Date(key.lastUsedAt).toLocaleString()}`
                      : " · Never used"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRevoke(key.id)}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        Next:{" "}
        <Link
          href="/settings/shortcuts"
          className="font-medium text-orange-600 hover:text-orange-700"
        >
          Download iOS and macOS shortcuts
        </Link>
      </p>
    </div>
  );
}
