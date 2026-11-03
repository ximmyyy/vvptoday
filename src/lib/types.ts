export type Round = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  published: boolean;
  winner_goal_id: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  round_id: string;
  player_name: string;
  team: string | null;
  opponent: string | null;
  match_date: string | null;
  description: string | null;
  sort_order: number;
  goal_videos: GoalVideo[];
};

export type GoalVideo = {
  id: string;
  goal_id: string;
  label: string;
  video_path: string;
  sort_order: number;
};

export type ResultRow = { goal_id: string; confirmed: number; pending: number };
