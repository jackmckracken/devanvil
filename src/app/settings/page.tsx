import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { IngestKeysManager } from "@/components/ingest-keys-manager";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <p className="text-sm font-medium text-orange-600">Settings</p>
          <h1 className="text-2xl font-bold text-zinc-900">DevAnvil Setup</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Manage ingest keys and shortcut distribution for capture from iOS
            and macOS.
          </p>
        </div>

        <IngestKeysManager />

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Shortcuts</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Download preconfigured shortcuts that prompt for your API key on
            first launch.
          </p>
          <Link
            href="/settings/shortcuts"
            className="mt-4 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Go to Shortcuts
          </Link>
        </div>
      </main>
    </div>
  );
}
