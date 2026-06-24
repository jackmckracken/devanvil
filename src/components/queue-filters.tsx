"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  ITEM_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/types";

type Project = {
  slug: string;
  name: string;
};

export function QueueFilters({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/queue?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  return (
    <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-5">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Search</span>
        <input
          type="search"
          defaultValue={searchParams.get("search") ?? ""}
          placeholder="Title or text..."
          className="rounded-lg border border-zinc-300 px-3 py-2"
          onChange={(event) => updateFilter("search", event.target.value)}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Project</span>
        <select
          defaultValue={searchParams.get("project") ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2"
          onChange={(event) => updateFilter("project", event.target.value)}
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.slug} value={project.slug}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Type</span>
        <select
          defaultValue={searchParams.get("itemType") ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2"
          onChange={(event) => updateFilter("itemType", event.target.value)}
        >
          <option value="">All types</option>
          {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Status</span>
        <select
          defaultValue={searchParams.get("status") ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2"
          onChange={(event) => updateFilter("status", event.target.value)}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Priority</span>
        <select
          defaultValue={searchParams.get("priority") ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2"
          onChange={(event) => updateFilter("priority", event.target.value)}
        >
          <option value="">All priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {isPending ? (
        <p className="text-xs text-zinc-500 md:col-span-5">Updating filters...</p>
      ) : null}
    </div>
  );
}
