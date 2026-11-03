"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmVote, type ConfirmState } from "@/app/actions";

// Bevestigen gaat via een knop (POST) zodat link-scanners in mailprogramma's
// niet automatisch een stem bevestigen.
export function ConfirmForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(confirmVote, { status: "idle" });

  if (state.status !== "idle") {
    return (
      <div className="space-y-6">
        <p className={state.status === "ok" ? "text-lg" : "text-red-300"}>{state.message}</p>
        <Link href="/" className="btn-ghost">Terug naar de goals</Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-muted">Klik op de knop om je stem definitief te maken.</p>
      <button className="btn-accent w-full text-lg" disabled={pending}>
        {pending ? "Bezig…" : "Bevestig mijn stem ✅"}
      </button>
    </form>
  );
}
