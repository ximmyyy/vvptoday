import { createClient } from "@/lib/supabase/server";
import { GoalMeta, GoalVideo } from "@/components/GoalCard";
import type { Goal, Round } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Winnaars | Goal van de Maand | VV Pernis" };

export default async function Archive() {
  const supabase = await createClient();
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, winner:goals!rounds_winner_fk(*, goal_videos(*))")
    .eq("published", true)
    .not("winner_goal_id", "is", null)
    .order("starts_at", { ascending: false })
    .returns<(Round & { winner: Goal })[]>();

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <p className="font-caps text-orange text-base">Hall of Fame</p>
      <h1 className="font-display mb-8 text-5xl sm:text-7xl">Winnaars</h1>
      {!rounds?.length ? (
        <p className="text-muted">Nog geen winnaars. Stem mee en bepaal wie de eerste wordt!</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {rounds.map((r) => (
            <article key={r.id} className="space-y-3 rounded-2xl bg-card p-3">
              <p className="font-caps px-1 text-lg text-orange">🏆 {r.title}</p>
              <GoalVideo goal={r.winner} />
              <div className="px-1 pb-1"><GoalMeta goal={r.winner} /></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
