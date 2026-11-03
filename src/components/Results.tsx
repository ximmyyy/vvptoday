import { GoalMeta, GoalVideo } from "./GoalCard";
import type { Goal, ResultRow } from "@/lib/types";

export function Results({ goals, results, winnerId }: { goals: Goal[]; results: ResultRow[]; winnerId: string }) {
  const counts = new Map(results.map((r) => [r.goal_id, Number(r.confirmed)]));
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  const winner = goals.find((g) => g.id === winnerId);
  const ranked = [...goals].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));

  return (
    <div className="space-y-10">
      {winner && (
        <section className="grid items-center gap-6 rounded-3xl bg-gradient-to-br from-club to-card p-5 sm:grid-cols-[minmax(0,320px)_1fr] sm:p-8">
          <GoalVideo goal={winner} />
          <div className="space-y-3">
            <p className="font-display text-accent text-xl">🏆 Winnaar</p>
            <GoalMeta goal={winner} />
            <p className="text-muted">
              {Math.round(((counts.get(winner.id) ?? 0) / total) * 100)}% van de stemmen
            </p>
          </div>
        </section>
      )}
      <section>
        <h2 className="font-display mb-4 text-2xl">Uitslag</h2>
        <ol className="space-y-3">
          {ranked.map((g, i) => {
            const pct = Math.round(((counts.get(g.id) ?? 0) / total) * 100);
            return (
              <li key={g.id} className="rounded-xl bg-card p-4">
                <div className="mb-2 flex justify-between gap-4">
                  <span className="font-semibold">{i + 1}. {g.player_name}</span>
                  <span className="text-muted">{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
