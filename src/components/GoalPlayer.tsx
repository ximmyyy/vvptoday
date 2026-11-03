"use client";

import { useState } from "react";
import { videoUrl } from "@/lib/rounds";
import type { Goal } from "@/lib/types";

/** Liggende videospeler (16:9) met knoppen om tussen camerahoeken te wisselen. */
export function GoalPlayer({ goal, badge }: { goal: Goal; badge?: string }) {
  const videos = [...goal.goal_videos].sort((a, b) => a.sort_order - b.sort_order);
  const [active, setActive] = useState(0);
  const current = videos[active];

  return (
    <div className="space-y-2">
      <div className="relative">
        {badge && (
          <span className="font-caps absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-0.5 text-sm text-white backdrop-blur">
            {badge}
          </span>
        )}
        {current ? (
          <video
            key={current.id}
            className="aspect-video w-full rounded-xl bg-black object-contain"
            src={`${videoUrl(current.video_path)}#t=0.1`}
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="grid aspect-video w-full place-items-center rounded-xl bg-black text-sm text-muted">
            Geen video
          </div>
        )}
      </div>
      {videos.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Camerahoek">
          {videos.map((v, i) => (
            <button
              key={v.id}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={`font-caps rounded-full px-3 py-1 text-sm transition ${
                i === active ? "bg-blue text-white" : "bg-white/10 text-muted hover:bg-white/20"
              }`}
            >
              🎥 {v.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
