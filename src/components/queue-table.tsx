import Link from "next/link";
import type { DevItem, Project } from "@/generated/prisma/client";
import { PriorityBadge, StatusBadge, TypeBadge } from "@/components/badges";

type QueueItem = DevItem & {
  project: Pick<Project, "name" | "slug">;
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function QueueTable({ items }: { items: QueueItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
        No items in the queue yet. Share an idea to DevAnvil to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Title</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Project</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Type</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Status</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Priority</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-700">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link
                  href={`/queue/${item.id}`}
                  className="font-medium text-zinc-900 hover:text-orange-700"
                >
                  {item.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-zinc-600">{item.project.name}</td>
              <td className="px-4 py-3">
                <TypeBadge type={item.itemType} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">
                <PriorityBadge priority={item.priority} />
              </td>
              <td className="px-4 py-3 text-zinc-500">{formatDate(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
