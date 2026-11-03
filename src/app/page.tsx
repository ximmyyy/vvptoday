import { createClient } from "@/lib/supabase/server";
import { formatDateTime, roundPhase } from "@/lib/rounds";
import { VotingGrid } from "@/components/VotingGrid";
import { Results } from "@/components/Results";
import type { Goal, ResultRow, Round } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("published", true)
    .order("starts_at", { ascending: false })
    .returns<Round[]>();

  const now = new Date();
  const current = rounds?.find((r) => new Date(r.starts_at) <= now);
  const upcoming = rounds?.filter((r) => new Date(r.starts_at) > now).at(-1);

  if (!current) {
    return (
      <Hero
        heading="Binnenkort."
        line="Goal van de Maand"
        sub={upcoming ? `Stemmen opent op ${formatDateTime(upcoming.starts_at)}.` : "De volgende stemronde wordt binnenkort aangekondigd."}
      />
    );
  }

  const phase = roundPhase(current, now);
  const { data: goals } = await supabase
    .from("goals")
    .select("*, goal_videos(*)")
    .eq("round_id", current.id)
    .order("sort_order")
    .order("created_at")
    .returns<Goal[]>();

  if (phase === "finished") {
    const { data } = await supabase.rpc("round_results", { p_round: current.id });
    const results = (data ?? []) as ResultRow[];
    return (
      <>
        <Hero line={`${current.title} · De stemmen zijn geteld`} sub="Bedankt aan iedereen die heeft gestemd!" />
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <Results goals={goals ?? []} results={results ?? []} winnerId={current.winner_goal_id!} />
        </div>
      </>
    );
  }

  return (
    <>
      <Hero
        line={`V.V. Pernis · ${current.title}`}
        sub={
          phase === "open"
            ? `Kies jouw favoriet! Stemmen kan tot ${formatDateTime(current.ends_at)}.`
            : "De stemming is gesloten. De winnaar wordt binnenkort bekendgemaakt!"
        }
      />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        {goals?.length ? (
          <VotingGrid goals={goals} canVote={phase === "open"} />
        ) : (
          <p className="text-center text-muted">Nog geen goals toegevoegd.</p>
        )}
      </div>
    </>
  );
}

function Hero({ heading = "Goal van de Maand.", line, sub }: { heading?: string; line: string; sub: string }) {
  return (
    <section className="relative overflow-hidden">
      {/* oranje-blauwe banen zoals op het shirt */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-10 flex h-[140%] rotate-12 gap-3 opacity-60 sm:right-16 sm:opacity-80">
        <div className="w-6 bg-orange sm:w-10" />
        <div className="w-6 bg-blue sm:w-10" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <h1 className="font-display max-w-3xl text-6xl sm:text-8xl">{heading}</h1>
        <p className="font-caps mt-4 text-lg sm:text-xl">{line}</p>
        <p className="mt-2 max-w-xl text-muted">{sub}</p>
      </div>
    </section>
  );
}
