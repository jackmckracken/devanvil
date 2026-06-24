import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div>
          <Link href="/focus" className="text-xl font-bold tracking-tight text-zinc-900">
            Dev<span className="text-orange-600">Anvil</span>
          </Link>
          <p className="text-sm text-zinc-500">Capture. Classify. Queue. Build.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/focus" className="text-sm font-medium text-orange-600 hover:text-orange-700">
            Focus
          </Link>
          <Link href="/next" className="text-sm text-zinc-600 hover:text-zinc-900">
            Next
          </Link>
          <Link href="/backlog" className="text-sm text-zinc-600 hover:text-zinc-900">
            Backlog
          </Link>
          <Link href="/queue" className="text-sm text-zinc-600 hover:text-zinc-900">
            Queue
          </Link>
          <Link href="/curation" className="text-sm text-zinc-600 hover:text-zinc-900">
            Curation
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
