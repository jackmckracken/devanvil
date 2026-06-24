"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PromoteClusterButton({
  projectSlug,
  clusterName,
  itemIds,
}: {
  projectSlug: string;
  clusterName: string;
  itemIds: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function promote() {
    setLoading(true);
    try {
      const res = await fetch("/api/initiatives/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectSlug,
          title: clusterName,
          itemIds,
          status: "proposed",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/initiatives/${data.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={promote}
      disabled={loading}
      className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
    >
      {loading ? "Promoting…" : "Promote to Initiative"}
    </button>
  );
}
