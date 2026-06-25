import { Suspense } from "react";
import MemorySearch from "./memory-search";

export default function MemoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400">Loading...</div>}>
      <MemorySearch />
    </Suspense>
  );
}
