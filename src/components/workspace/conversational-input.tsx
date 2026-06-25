"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WORKFLOW_COMMANDS } from "@/lib/workflow/commands";
import type { WorkflowCommand } from "@/generated/prisma/client";

type ConversationalInputProps = {
  projectSlug: string;
  onResult?: (intakeId: string) => void;
};

export function ConversationalInput({ projectSlug, onResult }: ConversationalInputProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteFilter, setPaletteFilter] = useState("");
  const [selectedCommand, setSelectedCommand] = useState<WorkflowCommand | null>(null);

  const filteredCommands = WORKFLOW_COMMANDS.filter(
    (cmd) =>
      cmd.slash.includes(paletteFilter.toLowerCase()) ||
      cmd.label.toLowerCase().includes(paletteFilter.toLowerCase()),
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          projectSlug,
          ...(selectedCommand ? { command: selectedCommand } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Workflow failed");

      setText("");
      setSelectedCommand(null);

      if (onResult) {
        onResult(data.intakeId);
      } else {
        router.push(`/workspace/${data.intakeId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [text, loading, projectSlug, selectedCommand, onResult, router]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (paletteOpen && e.key === "Escape") {
      setPaletteOpen(false);
      return;
    }

    if (paletteOpen && e.key === "Enter" && filteredCommands.length > 0) {
      e.preventDefault();
      selectCommand(filteredCommands[0]!.id);
      return;
    }

    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  function handleChange(value: string) {
    setText(value);

    if (value === "/" || (value.endsWith("\n/") && !value.includes("\n/\n"))) {
      setPaletteOpen(true);
      setPaletteFilter("");
      return;
    }

    if (paletteOpen && value.startsWith("/")) {
      const firstLine = value.split("\n")[0] ?? "";
      setPaletteFilter(firstLine.slice(1));
    } else {
      setPaletteOpen(false);
    }
  }

  function selectCommand(commandId: WorkflowCommand) {
    const cmd = WORKFLOW_COMMANDS.find((c) => c.id === commandId);
    if (!cmd) return;

    setSelectedCommand(commandId);
    setPaletteOpen(false);

    const body = text.replace(/^\/[^\n]*\n?/, "").trim();
    setText(body ? `${cmd.slash}\n${body}` : `${cmd.slash}\n`);
    textareaRef.current?.focus();
  }

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  return (
    <div className="relative">
      {selectedCommand && (
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
            {WORKFLOW_COMMANDS.find((c) => c.id === selectedCommand)?.slash}
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedCommand(null);
              setText(text.replace(/^\/[^\n]*\n?/, ""));
            }}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            clear
          </button>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture an idea... (type / for commands)"
          rows={4}
          className="w-full resize-none rounded-xl bg-transparent px-4 py-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          disabled={loading}
        />

        <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2">
          <div className="flex gap-2">
            {WORKFLOW_COMMANDS.map((cmd) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => selectCommand(cmd.id)}
                className="rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                title={cmd.description}
              >
                {cmd.slash}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading || !text.trim()}
            className="rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-40"
          >
            {loading ? "Thinking..." : "Submit"}
          </button>
        </div>
      </div>

      {paletteOpen && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <p className="border-b border-zinc-100 px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Commands
          </p>
          <ul>
            {filteredCommands.map((cmd) => (
              <li key={cmd.id}>
                <button
                  type="button"
                  onClick={() => selectCommand(cmd.id)}
                  className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left hover:bg-orange-50"
                >
                  <span className="text-sm font-medium text-zinc-900">{cmd.slash}</span>
                  <span className="text-xs text-zinc-500">{cmd.description}</span>
                </button>
              </li>
            ))}
            {filteredCommands.length === 0 && (
              <li className="px-3 py-2 text-sm text-zinc-400">No matching commands</li>
            )}
          </ul>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
