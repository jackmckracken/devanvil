import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

const PRIMARY_NAV = [
  { href: "/principles", label: "Principles" },
  { href: "/research", label: "Research" },
  { href: "/focus", label: "Focus" },
  { href: "/workspace", label: "Workspace" },
  { href: "/investments", label: "Investments" },
  { href: "/reviews", label: "Reviews" },
  { href: "/backlog", label: "Backlog" },
] as const;

const SECONDARY_NAV = [
  { href: "/inbox", label: "Inbox" },
  { href: "/queue", label: "Queue" },
  { href: "/curation", label: "Curation" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div>
          <Link href="/principles" className="text-xl font-bold tracking-tight text-zinc-900">
            Dev<span className="text-orange-600">Anvil</span>
          </Link>
          <p className="text-sm text-zinc-500">Executive Operating System</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          {PRIMARY_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-zinc-600 hover:text-zinc-900"
            >
              {label}
            </Link>
          ))}
          <span className="hidden text-zinc-300 sm:inline">|</span>
          {SECONDARY_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hidden text-sm text-zinc-400 hover:text-zinc-600 sm:inline"
            >
              {label}
            </Link>
          ))}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
