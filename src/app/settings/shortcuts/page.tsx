import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { getShortcutConfig } from "@/lib/shortcuts/config";

export default function ShortcutsSettingsPage() {
  const config = getShortcutConfig();

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppHeader />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <Link
            href="/settings"
            className="text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            ← Settings
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">Shortcuts</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Download preconfigured shortcuts. Enter your ingest API key once —
            shortcuts store it locally and fetch config at runtime.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">iPhone Shortcut</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Capture ideas from anywhere. Appears in the iOS Share Sheet for
            text, URLs, notes, voice transcripts, screenshots, and rich text.
          </p>
          <a
            href="/api/shortcuts/download/ios"
            className="mt-4 inline-flex rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Download Shortcut
          </a>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Mac Shortcut</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Send selected text, links, notes, Finder files, Safari pages, and
            clipboard contents to DevAnvil as a Quick Action.
          </p>
          <a
            href="/api/shortcuts/download/macos"
            className="mt-4 inline-flex rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Download Shortcut
          </a>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Setup</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-600">
            <li>
              Create an ingest key in{" "}
              <Link href="/settings" className="text-orange-600 hover:text-orange-700">
                Settings
              </Link>
              .
            </li>
            <li>Download the shortcut for your device.</li>
            <li>Open the shortcut and enter your API key when prompted.</li>
            <li>Share content from any app — it lands in your DevAnvil queue.</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900">Runtime Config</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Shortcuts verify configuration from{" "}
            <code className="rounded bg-zinc-100 px-1">GET /api/shortcuts/config</code>{" "}
            so project defaults and API URL can change without rebuilding.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs text-zinc-100">
            {JSON.stringify(config, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  );
}
