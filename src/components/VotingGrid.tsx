"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitVote, type VoteState } from "@/app/actions";
import { GoalMeta, GoalVideo } from "./GoalCard";
import type { Goal } from "@/lib/types";

export function VotingGrid({ goals, canVote }: { goals: Goal[]; canVote: boolean }) {
  const [selected, setSelected] = useState<Goal | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {goals.map((g, i) => (
          <article key={g.id} className="flex flex-col gap-3 rounded-2xl bg-card p-3">
            <GoalVideo goal={g} badge={`#${i + 1}`} />
            <div className="flex flex-1 flex-col justify-between gap-3 px-1 pb-1">
              <GoalMeta goal={g} />
              {canVote && (
                <button className="btn-accent w-full" onClick={() => setSelected(g)}>
                  Stem op deze goal
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {selected && <VoteDialog goal={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function VoteDialog({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const [state, action, pending] = useActionState<VoteState, FormData>(submitVote, { status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-black/70 p-4 sm:place-items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {state.status === "ok" ? (
          <div className="space-y-4 text-center">
            <div className="text-5xl">📩</div>
            <h2 className="font-display text-4xl">Bijna klaar!</h2>
            <p>{state.message}</p>
            <button className="btn-ghost w-full" onClick={onClose}>Sluiten</button>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <div>
              <p className="font-caps text-sm text-muted">Je stemt op</p>
              <h2 className="font-display text-4xl">{goal.player_name}</h2>
            </div>
            <input type="hidden" name="goalId" value={goal.id} />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div>
              <label htmlFor="email" className="label">Je e-mailadres</label>
              <input
                ref={inputRef}
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="naam@voorbeeld.nl"
                className="input"
              />
              <p className="mt-2 text-xs text-muted">
                Je krijgt een mail met een bevestigingslink. Eén stem per e-mailadres per maand.
              </p>
            </div>
            {state.status === "error" && (
              <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{state.message}</p>
            )}
            <div className="flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={onClose}>Annuleren</button>
              <button type="submit" className="btn-accent flex-1" disabled={pending}>
                {pending ? "Versturen…" : "Stem!"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
