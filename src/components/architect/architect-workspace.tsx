"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import type { ArchitectAnalysis, ArchitectSessionView } from "@/lib/architect/types";
import { ArchitectMentalModelCanvas } from "@/components/architect/architect-mental-model-canvas";
import { modelOverallConfidence } from "@/lib/architect/mental-model";

export function ArchitectWorkspace({ initialSession }: { initialSession: ArchitectSessionView }) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const analysis = session.analysis;
  const isActive = session.status === "active";

  const sendMessage = useCallback(async () => {
    const trimmed = reply.trim();
    if (!trimmed || loading || !isActive) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/architect/${session.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed");
      setSession(data as ArchitectSessionView);
      setReply("");
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [reply, loading, isActive, session.id]);

  async function createInitiative() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/architect/${session.id}/create-initiative`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed");
      router.push(`/initiatives/${data.initiativeId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setLoading(false);
    }
  }

  async function discard() {
    await fetch(`/api/architect/${session.id}/discard`, { method: "POST" });
    router.push(`/workspace?project=${session.projectSlug}`);
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/workspace?project=${session.projectSlug}`}
            className="text-sm text-orange-600 hover:underline"
          >
            ← Workspace
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Architect</h1>
          <p className="text-sm text-zinc-500">
            Watch the architecture become visible — the model is the artifact.
          </p>
          {session.captureId && (
            <p className="mt-1 text-xs text-zinc-400">
              From capture ·{" "}
              <Link href={`/inbox?project=${session.projectSlug}`} className="text-orange-600 hover:underline">
                view inbox
              </Link>
            </p>
          )}
        </div>
        {session.status === "initiative_created" && session.initiativeId && (
          <Link
            href={`/initiatives/${session.initiativeId}`}
            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800"
          >
            Initiative created →
          </Link>
        )}
      </header>

      <div className="grid flex-1 gap-4 lg:grid-cols-12">
        {/* Narrow chat — temporary; model is primary */}
        <section className="flex max-h-[28rem] flex-col rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-3 lg:max-h-none">
          <h2 className="border-b border-zinc-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Refine Model
          </h2>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[32rem] lg:max-h-none">
            {session.messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === "architect"
                    ? "bg-violet-50 text-violet-900"
                    : "bg-zinc-100 text-zinc-800"
                }`}
              >
                <p className="mb-1 text-xs font-medium opacity-60">
                  {msg.role === "architect" ? "Architect" : "You"}
                </p>
                {msg.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {isActive && (
            <div className="border-t border-zinc-100 p-3">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Challenge the model (⌘↵)"
                rows={2}
                className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={loading || !reply.trim()}
                className="mt-2 w-full rounded-lg bg-violet-600 py-1.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
              >
                {loading ? "Synthesizing..." : "Refine model"}
              </button>
            </div>
          )}
        </section>

        {/* Primary: living mental model */}
        <section className="overflow-y-auto rounded-xl border border-violet-200 bg-white shadow-sm lg:col-span-6">
          <h2 className="border-b border-violet-100 bg-violet-50/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-violet-600">
            Mental Model
          </h2>
          <div className="p-5">
            {analysis?.mentalModel ? (
              <ArchitectMentalModelCanvas model={analysis.mentalModel} />
            ) : (
              <p className="text-sm text-zinc-400">Constructing mental model...</p>
            )}
          </div>
        </section>

        {/* Right: Context */}
        <section className="space-y-4 overflow-y-auto lg:col-span-3">
          {analysis && (
            <>
              <ContextPanel title="Related Memory">
                {analysis.relatedMemory.length === 0 ? (
                  <EmptyContext>No related memory</EmptyContext>
                ) : (
                  analysis.relatedMemory.slice(0, 5).map((hit) => (
                    <Link
                      key={`${hit.source}-${hit.id}`}
                      href={hit.href}
                      className="block rounded p-2 text-sm hover:bg-zinc-50"
                    >
                      <p className="font-medium text-zinc-800">{hit.title}</p>
                      <p className="text-xs text-zinc-400 line-clamp-2">{hit.snippet}</p>
                    </Link>
                  ))
                )}
              </ContextPanel>

              <ContextPanel title="Protected Domains">
                {analysis.affectedProtectedDomains.length === 0 ? (
                  <EmptyContext>No governed domains detected</EmptyContext>
                ) : (
                  analysis.affectedProtectedDomains.map((d) => (
                    <Link
                      key={d.domain.slug}
                      href={`/protected-domains/${d.domain.slug}`}
                      className="block rounded p-2 text-sm hover:bg-zinc-50"
                    >
                      <p className="font-medium text-zinc-800">{d.domain.name}</p>
                      <p className="text-xs text-zinc-400">
                        {d.domain.protectionLevel} · {d.risk} risk
                      </p>
                    </Link>
                  ))
                )}
              </ContextPanel>

              <ContextPanel title="Related Initiatives">
                {analysis.relatedInitiatives.length === 0 ? (
                  <EmptyContext>No related initiatives</EmptyContext>
                ) : (
                  analysis.relatedInitiatives.map((init) => (
                    <Link
                      key={init.id ?? init.title}
                      href={init.id ? `/initiatives/${init.id}` : "#"}
                      className="block rounded p-2 text-sm hover:bg-zinc-50"
                    >
                      <p className="font-medium text-zinc-800">{init.title}</p>
                    </Link>
                  ))
                )}
              </ContextPanel>

              <ContextPanel title="Architectural Records">
                {analysis.relatedRecords.length === 0 ? (
                  <EmptyContext>No records loaded</EmptyContext>
                ) : (
                  analysis.relatedRecords.map((r) => (
                    <div key={`${r.kind}-${r.title}`} className="rounded p-2 text-sm">
                      <p className="font-medium text-zinc-800">{r.title}</p>
                      <p className="text-xs text-zinc-400">{r.kind}</p>
                    </div>
                  ))
                )}
              </ContextPanel>
            </>
          )}
        </section>
      </div>

      {/* Bottom: Suggestions & Actions */}
      {analysis && isActive && (
        <footer className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold uppercase text-zinc-400">
                Suggested Initiative
              </h3>
              <p className="mt-1 font-medium text-zinc-900">
                {analysis.suggestedInitiative.title}
              </p>
              <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                {analysis.suggestedInitiative.description}
              </p>
              <p className="mt-1 text-xs text-violet-600">
                Model confidence{" "}
                {analysis.mentalModel ? modelOverallConfidence(analysis.mentalModel) : analysis.confidence}%
                {" · "}snapshot from architecture
              </p>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase text-zinc-400">Suggested Epics</h3>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {analysis.suggestedEpics.map((epic) => (
                  <li
                    key={epic}
                    className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700"
                  >
                    {epic}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => void createInitiative()}
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Create Initiative
              </button>
              <button
                type="button"
                onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
              >
                Continue Architecting
              </button>
              <button
                type="button"
                onClick={() => void discard()}
                className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-600"
              >
                Discard
              </button>
            </div>
          </div>
        </footer>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function ContextPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <h3 className="border-b border-zinc-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {title}
      </h3>
      <div className="p-2">{children}</div>
    </div>
  );
}

function EmptyContext({ children }: { children: React.ReactNode }) {
  return <p className="p-2 text-xs text-zinc-400">{children}</p>;
}
