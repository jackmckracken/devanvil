"use client";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="text-sm text-zinc-500 hover:text-zinc-800"
      onClick={async () => {
        await fetch("/api/auth/login", { method: "DELETE" });
        window.location.href = "/login";
      }}
    >
      Sign out
    </button>
  );
}
