// app/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type WorkoutEntry = {
  id: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  set_number: number;
};

type DailySummary = {
  date: string;
  totalVolume: number;
  sets: WorkoutEntry[];
};

export default function History() {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const { data, error } = await supabase
        .from("workout_entries")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      const typed = (data ?? []) as WorkoutEntry[];
      setEntries(typed);
      setDailySummaries(groupByDate(typed));
      setLoading(false);
    };

    fetchEntries();
  }, []);

  const groupByDate = (entries: WorkoutEntry[]): DailySummary[] => {
    const map = new Map<string, WorkoutEntry[]>();

    for (const e of entries) {
      const key = e.date; // "YYYY-MM-DD"
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(e);
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

    // 日付降順にソート
    summaries.sort((a, b) => (a.date < b.date ? 1 : -1));

    return summaries;
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 px-4 py-8">
      <div className="max-w-xl mx-auto">
        <Link
          href="/"
          className="text-sky-400 underline text-sm block mb-4"
        >
          ← ホームに戻る
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-center">
          過去のトレーニング履歴
        </h1>

        {loading ? (
          <p className="text-slate-400">読み込み中...</p>
        ) : dailySummaries.length === 0 ? (
          <p className="text-slate-400">
            まだDBにトレーニング記録がありません。
          </p>
        ) : (
          <div className="space-y-4">
            {dailySummaries.map((day) => (
              <div
                key={day.date}
                className="bg-slate-800 rounded-xl p-4 shadow"
              >
                {/* 日付 & 総ボリューム */}
                <div className="flex justify-between items-baseline mb-2">
                  <div className="font-semibold text-lg">
                    {day.date}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">
                      総ボリューム
                    </div>
                    <div className="text-2xl font-bold">
                      {day.totalVolume} kg
                    </div>
                  </div>
                </div>

                {/* その日のセット詳細 */}
                <ul className="mt-2 space-y-1 text-sm">
                  {day.sets.map((s) => (
                    <li
                      key={s.id}
                      className="flex justify-between text-slate-200"
                    >
                      <div>
                        <span className="font-semibold">
                          {s.exercise}
                        </span>
                        <span className="ml-1 text-slate-300">
                          {s.set_number}セット目
                        </span>
                      </div>
                      <div className="text-right text-slate-300">
                        {s.weight}kg × {s.reps}回
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
