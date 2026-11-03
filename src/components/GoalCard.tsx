import { formatDate, videoUrl } from "@/lib/rounds";
import type { Goal } from "@/lib/types";

export function GoalVideo({ goal }: { goal: Goal }) {
  return (
    <video
      className="aspect-[9/16] w-full rounded-xl bg-black object-cover"
      src={`${videoUrl(goal.video_path)}#t=0.1`}
      controls
      playsInline
      preload="metadata"
    />
  );
}

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
