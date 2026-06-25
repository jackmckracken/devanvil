import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div>
          <Link href="/workspace" className="text-xl font-bold tracking-tight text-zinc-900">
            Dev<span className="text-orange-600">Anvil</span>
          </Link>
          <p className="text-sm text-zinc-500">Architectural Operating System</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/inbox" className="text-sm font-medium text-orange-600 hover:text-orange-700">
            Inbox
          </Link>
          <Link href="/workspace" className="text-sm text-zinc-600 hover:text-zinc-900">
            Workspace
          </Link>
          <Link href="/investments" className="text-sm text-emerald-600 hover:text-emerald-700">
            Investments
          </Link>
          <Link href="/focus" className="text-sm text-zinc-600 hover:text-zinc-900">
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
          <Link href="/protected-domains" className="text-sm text-zinc-600 hover:text-zinc-900">
            Domains
          </Link>
          <Link href="/settings" className="text-sm text-zinc-600 hover:text-zinc-900">
            Settings
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
