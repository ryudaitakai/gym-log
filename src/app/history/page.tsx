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

export default function History() {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
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

      setEntries(data as WorkoutEntry[]);
      setLoading(false);
    };

    fetchEntries();
  }, []);

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
        ) : entries.length === 0 ? (
          <p className="text-slate-400">
            まだDBにトレーニング記録がありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="bg-slate-800 rounded-lg p-4 flex justify-between"
              >
                <div>
                  <div className="font-semibold">
                    {e.date} / {e.exercise}
                  </div>
                  <div className="text-sm text-slate-300">
                    {e.weight}kg × {e.reps}回（{e.set_number}セット目）
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
