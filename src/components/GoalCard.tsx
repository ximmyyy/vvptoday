export { GoalPlayer as GoalVideo } from "./GoalPlayer";
import { formatDate } from "@/lib/rounds";
import type { Goal } from "@/lib/types";

export function GoalMeta({ goal }: { goal: Goal }) {
  const sub = [goal.team, goal.opponent && `vs ${goal.opponent}`, goal.match_date && formatDate(goal.match_date)]
    .filter(Boolean)
    .join(" · ");
  return (
    <div>
      <h3 className="font-display text-3xl">{goal.player_name}</h3>
      {sub && <p className="font-caps mt-1 text-sm text-muted">{sub}</p>}
      {goal.description && <p className="mt-1 text-sm">{goal.description}</p>}
    </div>
  );
}
