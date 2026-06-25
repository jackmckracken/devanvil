"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import type { ArchitecturalMemoryHit } from "@/lib/workflow/types";

export default function MemorySearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectSlug = searchParams.get("project") ?? "studioops";
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<ArchitecturalMemoryHit[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setHits([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/memory?q=${encodeURIComponent(q)}&project=${projectSlug}`,
        );
        const data = await response.json();
        setHits(data.hits ?? []);
      } finally {
        setLoading(false);
      }
    },
    [projectSlug],
  );

  useEffect(() => {
    if (initialQuery) void search(initialQuery);
  }, [initialQuery, search]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/memory?project=${projectSlug}&q=${encodeURIComponent(query)}`);
    void search(query);
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <Link
            href={`/workspace?project=${projectSlug}`}
            className="text-sm text-orange-600 hover:underline"
          >
            ← Workspace
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">Architectural Memory</h1>
          <p className="mt-1 text-sm text-zinc-500">
            What conversations have we had? What did we decide? Why did we build this?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="artist experimentation, Bloom Runtime, Protected Domains..."
            className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {hits.length === 0 && query && !loading && (
          <p className="text-sm text-zinc-400">No memory hits for &ldquo;{query}&rdquo;</p>
        )}

        <ul className="space-y-3">
          {hits.map((hit) => (
            <li key={`${hit.source}-${hit.id}`}>
              <Link
                href={hit.href}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-orange-200"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                    {hit.source.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {Math.round(hit.relevance * 100)}% relevance
                  </span>
                </div>
                <p className="mt-2 font-medium text-zinc-900">{hit.title}</p>
                <p className="mt-1 text-sm text-zinc-500">{hit.snippet}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
