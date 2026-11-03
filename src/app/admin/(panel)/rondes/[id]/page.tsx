import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteGoal, deleteGoalVideo, deleteRound, setWinner, updateGoal, updateGoalVideo, updateRound } from "@/app/admin/actions";
import { isoToAmsterdamLocal, phaseLabel, roundPhase } from "@/lib/rounds";
import { AddAngle, UploadGoal } from "@/components/UploadGoal";
import { GoalPlayer } from "@/components/GoalPlayer";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { Goal, ResultRow, Round } from "@/lib/types";

export default async function RoundAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: round } = await supabase.from("rounds").select("*").eq("id", id).single<Round>();
  if (!round) notFound();

  const [{ data: goals }, { data: results }] = await Promise.all([
    supabase.from("goals").select("*, goal_videos(*)").eq("round_id", id).order("sort_order").order("created_at").returns<Goal[]>(),
    supabase.rpc("round_results", { p_round: id }) as unknown as Promise<{ data: ResultRow[] | null }>,
  ]);
  const phase = roundPhase(round);
  const res = new Map((results ?? []).map((r) => [r.goal_id, r]));
  const totalConfirmed = (results ?? []).reduce((a, r) => a + Number(r.confirmed), 0);
  const totalPending = (results ?? []).reduce((a, r) => a + Number(r.pending), 0);
  const ranked = [...(goals ?? [])].sort(
    (a, b) => Number(res.get(b.id)?.confirmed ?? 0) - Number(res.get(a.id)?.confirmed ?? 0),
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="text-sm text-muted hover:text-ink">← Alle rondes</Link>
        <h1 className="font-display text-4xl">{round.title}</h1>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">{phaseLabel[phase]}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Instellingen */}
        <section className="rounded-2xl bg-card p-5">
          <h2 className="font-display mb-4 text-2xl">Instellingen</h2>
          <form action={updateRound} className="space-y-4">
            <input type="hidden" name="id" value={round.id} />
            <div>
              <label className="label" htmlFor="title">Titel</label>
              <input id="title" name="title" defaultValue={round.title} required className="input" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="starts_at">Stemmen opent</label>
                <input id="starts_at" name="starts_at" type="datetime-local" required className="input"
                  defaultValue={isoToAmsterdamLocal(round.starts_at)} />
              </div>
              <div>
                <label className="label" htmlFor="ends_at">Stemmen sluit</label>
                <input id="ends_at" name="ends_at" type="datetime-local" required className="input"
                  defaultValue={isoToAmsterdamLocal(round.ends_at)} />
              </div>
            </div>
            <label className="flex items-center gap-3">
              <input type="checkbox" name="published" defaultChecked={round.published} className="h-5 w-5 accent-[var(--club-accent)]" />
              <span>Gepubliceerd (zichtbaar voor supporters)</span>
            </label>
            <button className="btn-accent">Opslaan</button>
          </form>
        </section>

        {/* Live stemmen */}
        <section className="rounded-2xl bg-card p-5">
          <h2 className="font-display mb-1 text-2xl">Stemmen (alleen zichtbaar voor jou)</h2>
          <p className="mb-4 text-sm text-muted">
            {totalConfirmed} bevestigd · {totalPending} wachten op bevestiging via e-mail
          </p>
          {ranked.length === 0 && <p className="text-muted">Nog geen goals.</p>}
          <ol className="space-y-2">
            {ranked.map((g, i) => {
              const c = Number(res.get(g.id)?.confirmed ?? 0);
              const pct = totalConfirmed ? Math.round((c / totalConfirmed) * 100) : 0;
              const isWinner = round.winner_goal_id === g.id;
              return (
                <li key={g.id} className={`rounded-lg p-3 ${isWinner ? "bg-accent/20 ring-2 ring-accent" : "bg-black/20"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{i + 1}. {g.player_name} {isWinner && "🏆"}</span>
                    <span className="text-sm text-muted">{c} ({pct}%)</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  {!isWinner && (
                    <form action={setWinner} className="mt-2">
                      <input type="hidden" name="round_id" value={round.id} />
                      <input type="hidden" name="goal_id" value={g.id} />
                      <ConfirmButton
                        className="text-xs font-semibold text-accent hover:underline"
                        message={`${g.player_name} als winnaar aanwijzen? De uitslag wordt dan direct openbaar.`}
                      >
                        Wijs aan als winnaar
                      </ConfirmButton>
                    </form>
                  )}
                </li>
              );
            })}
          </ol>
          {round.winner_goal_id && (
            <form action={setWinner} className="mt-4">
              <input type="hidden" name="round_id" value={round.id} />
              <button className="text-xs text-muted hover:underline">Winnaar intrekken (uitslag weer verbergen)</button>
            </form>
          )}
          {phase === "open" && (
            <p className="mt-4 text-xs text-muted">Tip: wijs de winnaar pas aan na sluiting; daarmee wordt de uitslag openbaar.</p>
          )}
        </section>
      </div>

      {/* Goals */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <h2 className="font-display mb-4 text-2xl">Genomineerde goals ({goals?.length ?? 0})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {goals?.map((g) => {
              const videos = [...g.goal_videos].sort((a, b) => a.sort_order - b.sort_order);
              return (
                <div key={g.id} className="space-y-4 rounded-xl bg-card p-3">
                  <GoalPlayer goal={g} />

                  {/* Camerahoeken */}
                  <div className="space-y-2">
                    <p className="label !mb-0">Camerahoeken ({videos.length})</p>
                    {videos.map((v) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <form action={updateGoalVideo} className="flex flex-1 items-center gap-2">
                          <input type="hidden" name="id" value={v.id} />
                          <input type="hidden" name="round_id" value={round.id} />
                          <input name="label" defaultValue={v.label} required className="input !py-1 text-sm" aria-label="Naam camerahoek" />
                          <input name="sort_order" type="number" defaultValue={v.sort_order} className="input !w-14 !py-1 text-sm" aria-label="Volgorde" />
                          <button className="btn-ghost !px-2 !py-1 text-xs">Opslaan</button>
                        </form>
                        {videos.length > 1 && (
                          <form action={deleteGoalVideo}>
                            <input type="hidden" name="id" value={v.id} />
                            <input type="hidden" name="round_id" value={round.id} />
                            <ConfirmButton className="text-xs text-red-300 hover:underline" message={`Camerahoek "${v.label}" verwijderen?`}>
                              ✕
                            </ConfirmButton>
                          </form>
                        )}
                      </div>
                    ))}
                    <AddAngle roundId={round.id} goalId={g.id} />
                  </div>

                  {/* Gegevens */}
                  <form action={updateGoal} className="space-y-2 border-t border-white/10 pt-3">
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="round_id" value={round.id} />
                    <input name="player_name" defaultValue={g.player_name} required className="input !py-1.5 text-sm" placeholder="Speler" />
                    <div className="grid grid-cols-2 gap-2">
                      <input name="team" defaultValue={g.team ?? ""} className="input !py-1.5 text-sm" placeholder="Team" />
                      <input name="match_date" type="date" defaultValue={g.match_date ?? ""} className="input !py-1.5 text-sm" />
                    </div>
                    <input name="opponent" defaultValue={g.opponent ?? ""} className="input !py-1.5 text-sm" placeholder="Tegenstander" />
                    <input name="description" defaultValue={g.description ?? ""} className="input !py-1.5 text-sm" placeholder="Omschrijving" />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted" htmlFor={`so-${g.id}`}>Volgorde</label>
                      <input id={`so-${g.id}`} name="sort_order" type="number" defaultValue={g.sort_order} className="input !w-16 !py-1 text-sm" />
                      <button className="btn-ghost !px-3 !py-1.5 text-sm">Opslaan</button>
                    </div>
                  </form>
                  <form action={deleteGoal}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="round_id" value={round.id} />
                    <ConfirmButton className="text-xs text-red-300 hover:underline"
                      message={`Goal van ${g.player_name} verwijderen (met alle camerahoeken)? Stemmen op deze goal vervallen ook.`}>
                      Goal verwijderen
                    </ConfirmButton>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
        <section className="h-fit rounded-2xl bg-card p-5">
          <h2 className="font-display mb-4 text-2xl">Goal uploaden</h2>
          <UploadGoal roundId={round.id} />
        </section>
      </div>

      <section className="border-t border-white/10 pt-6">
        <form action={deleteRound}>
          <input type="hidden" name="id" value={round.id} />
          <ConfirmButton className="btn-danger" message="Deze hele ronde inclusief video's en stemmen verwijderen? Dit kan niet ongedaan worden.">
            Ronde verwijderen
          </ConfirmButton>
        </form>
      </section>
    </div>
  );
}
