// features/workout/utils.ts

import { WorkoutEntry, DailySummary } from "./types";

// 日別に集計して DailySummary に変換するドメインロジック
export function groupByDate(entries: WorkoutEntry[]): DailySummary[] {
  const map = new Map<string, WorkoutEntry[]>();

  for (const e of entries) {
    if (!map.has(e.date)) map.set(e.date, []);
    map.get(e.date)!.push(e);
  }

  const summaries: DailySummary[] = [];

  for (const [date, sets] of map.entries()) {
    const totalVolume = sets.reduce(
      (sum, s) => sum + s.weight * s.reps,
      0
    );

    summaries.push({
      date,
      totalVolume,
      sets,
    });
  }

  // 新しい日付が上に来るようにソート
  summaries.sort((a, b) => (a.date < b.date ? 1 : -1));

  return summaries;
}
