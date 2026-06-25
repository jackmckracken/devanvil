"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isTrivialResearchCapture } from "@/lib/capture/research-heuristics";
import type { CaptureView } from "@/lib/capture/types";

type InboxListProps = {
  captures: CaptureView[];
  projectSlug: string;
};

type PromotionAction = "architect" | "bug" | "audit" | "research" | "discard";

export function InboxList({ captures, projectSlug }: InboxListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<PromotionAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function promote(captureId: string, action: PromotionAction) {
    setLoadingId(captureId);
    setLoadingAction(action);
    setError(null);

    try {
      if (action === "discard") {
        const response = await fetch(`/api/capture/${captureId}/discard`, { method: "POST" });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Failed to discard");
        }
        router.refresh();
        return;
      }

      const response = await fetch(`/api/capture/${captureId}/${action}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? `Failed to promote to ${action}`);

      if (action === "architect") {
        router.push(`/architect/${data.id}`);
      } else if (action === "audit") {
        router.push(`/audit/${data.id}`);
      } else if (action === "bug") {
        router.push(`/queue/${data.workItemId}`);
      } else if (action === "research") {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingId(null);
      setLoadingAction(null);
    }
  }

  if (captures.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
        <p className="text-sm text-zinc-500">Inbox is empty.</p>
        <p className="mt-1 text-sm text-zinc-400">
          Capture ideas from the{" "}
          <a href={`/workspace?project=${projectSlug}`} className="text-orange-600 hover:underline">
            workspace
          </a>{" "}
          — no classification required.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white shadow-sm">
        {captures.map((capture) => {
          const busy = loadingId === capture.id;
          const showResearch = isTrivialResearchCapture(capture.rawText);

          return (
            <li key={capture.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap text-sm text-zinc-900">{capture.rawText}</p>
                  <p className="mt-2 text-xs text-zinc-400">
                    {capture.sourceType} · {formatRelative(capture.createdAt)}
                  </p>
                  {capture.suggestedMode && (
                    <p className="mt-2 text-xs text-violet-600">
                      Suggestion: {capture.suggestedMode.mode} — {capture.suggestedMode.reason}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <PromoteButton
                    label="Architect"
                    tone="violet"
                    busy={busy && loadingAction === "architect"}
                    disabled={busy}
                    onClick={() => void promote(capture.id, "architect")}
                  />
                  <PromoteButton
                    label="Bug"
                    tone="red"
                    busy={busy && loadingAction === "bug"}
                    disabled={busy}
                    onClick={() => void promote(capture.id, "bug")}
                  />
                  <PromoteButton
                    label="Audit"
                    tone="amber"
                    busy={busy && loadingAction === "audit"}
                    disabled={busy}
                    onClick={() => void promote(capture.id, "audit")}
                  />
                  {showResearch && (
                    <PromoteButton
                      label="Research"
                      tone="zinc"
                      busy={busy && loadingAction === "research"}
                      disabled={busy}
                      onClick={() => void promote(capture.id, "research")}
                    />
                  )}
                  <PromoteButton
                    label="Discard"
                    tone="outline"
                    busy={busy && loadingAction === "discard"}
                    disabled={busy}
                    onClick={() => void promote(capture.id, "discard")}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PromoteButton({
  label,
  tone,
  busy,
  disabled,
  onClick,
}: {
  label: string;
  tone: "violet" | "red" | "amber" | "zinc" | "outline";
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const styles = {
    violet: "bg-violet-600 text-white hover:bg-violet-700",
    red: "bg-red-600 text-white hover:bg-red-700",
    amber: "bg-amber-600 text-white hover:bg-amber-700",
    zinc: "bg-zinc-600 text-white hover:bg-zinc-700",
    outline: "border border-zinc-200 text-zinc-600 hover:bg-zinc-50",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${styles[tone]}`}
    >
      {busy ? "..." : label}
    </button>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
