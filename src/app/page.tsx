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
        kicker="Goal van de Maand"
        title="Binnenkort"
        sub={upcoming ? `Stemmen opent op ${formatDateTime(upcoming.starts_at)}.` : "De volgende stemronde wordt binnenkort aangekondigd."}
      />
    );
  }

  const phase = roundPhase(current, now);
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("round_id", current.id)
    .order("sort_order")
    .order("created_at")
    .returns<Goal[]>();

  if (phase === "finished") {
    const { data } = await supabase.rpc("round_results", { p_round: current.id });
    const results = (data ?? []) as ResultRow[];
    return (
      <>
        <Hero kicker="Goal van de Maand" title={current.title} sub="De stemmen zijn geteld!" />
        <div className="mx-auto max-w-6xl px-4 pb-16">
          <Results goals={goals ?? []} results={results ?? []} winnerId={current.winner_goal_id!} />
        </div>
      </>
    );
  }

  return (
    <>
      <Hero
        kicker="Stem op de Goal van de Maand"
        title={current.title}
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

function Hero({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <p className="font-display text-accent text-lg">{kicker}</p>
      <h1 className="font-display text-5xl sm:text-7xl">{title}</h1>
      <p className="mt-3 max-w-xl text-muted">{sub}</p>
    </section>
  );
}
