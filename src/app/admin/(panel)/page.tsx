import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createRound } from "../actions";
import { formatDateTime, isoToAmsterdamLocal, phaseLabel, roundPhase } from "@/lib/rounds";
import type { Round } from "@/lib/types";

const MONTHS = ["Januari","Februari","Maart","April","Mei","Juni","Juli","Augustus","September","Oktober","November","December"];

export default async function AdminHome() {
  const supabase = await createClient();
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, goals(count)")
    .order("starts_at", { ascending: false })
    .returns<(Round & { goals: { count: number }[] })[]>();

  // Voorstel: ronde over vorige maand, stemmen van nu t/m over 7 dagen
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defaultTitle = `${MONTHS[prev.getMonth()]} ${prev.getFullYear()}`;
  const start = isoToAmsterdamLocal(now.toISOString()).slice(0, 14) + "00";
  const end = isoToAmsterdamLocal(new Date(now.getTime() + 7 * 864e5).toISOString()).slice(0, 11) + "23:59";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <section>
        <h2 className="font-display mb-4 text-3xl">Stemrondes</h2>
        {!rounds?.length && <p className="text-muted">Nog geen rondes. Maak er rechts een aan.</p>}
        <ul className="space-y-3">
          {rounds?.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/rondes/${r.id}`} className="flex items-center justify-between gap-4 rounded-xl bg-card p-4 hover:ring-2 hover:ring-accent">
                <div>
                  <p className="font-semibold">{r.title}</p>
                  <p className="text-sm text-muted">
                    {formatDateTime(r.starts_at)} – {formatDateTime(r.ends_at)} · {r.goals[0]?.count ?? 0} goals
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  {phaseLabel[roundPhase(r)]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="h-fit rounded-2xl bg-card p-5">
        <h2 className="font-display mb-4 text-2xl">Nieuwe ronde</h2>
        <form action={createRound} className="space-y-4">
          <div>
            <label className="label" htmlFor="title">Titel</label>
            <input id="title" name="title" required defaultValue={defaultTitle} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="starts_at">Stemmen opent</label>
            <input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={start} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="ends_at">Stemmen sluit</label>
            <input id="ends_at" name="ends_at" type="datetime-local" required defaultValue={end} className="input" />
          </div>
          <button className="btn-accent w-full">Aanmaken</button>
        </form>
      </section>
    </div>
  );
}
