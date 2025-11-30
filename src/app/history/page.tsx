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

  // 編集用のstate
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState("");
  const [editWeight, setEditWeight] = useState<number | "">("");
  const [editReps, setEditReps] = useState<number | "">("");
  const [editSetNumber, setEditSetNumber] = useState<number | "">("");
  const [savingId, setSavingId] = useState<string | null>(null);

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
      const key = e.date;
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

    summaries.sort((a, b) => (a.date < b.date ? 1 : -1));

    return summaries;
  };

  // 編集開始
  const startEdit = (entry: WorkoutEntry) => {
    setEditingId(entry.id);
    setEditExercise(entry.exercise);
    setEditWeight(entry.weight);
    setEditReps(entry.reps);
    setEditSetNumber(entry.set_number);
  };

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingId(null);
    setEditExercise("");
    setEditWeight("");
    setEditReps("");
    setEditSetNumber("");
  };

  // 保存処理
  const saveEdit = async () => {
    if (!editingId) return;
    if (
      !editExercise ||
      editWeight === "" ||
      editReps === "" ||
      editSetNumber === ""
    ) {
      alert("種目名・重量・回数・セット数をすべて入力してください。");
      return;
    }

    const id = editingId;
    setSavingId(id);

    const updated = {
      exercise: editExercise,
      weight: Number(editWeight),
      reps: Number(editReps),
      set_number: Number(editSetNumber),
    };

    const { error } = await supabase
      .from("workout_entries")
      .update(updated)
      .eq("id", id);

    setSavingId(null);

    if (error) {
      console.error(error);
      alert("更新に失敗しました。");
      return;
    }

    // ローカルのentriesも更新
    const newEntries = entries.map((e) =>
      e.id === id ? { ...e, ...updated } : e
    );
    setEntries(newEntries);
    setDailySummaries(groupByDate(newEntries));

    cancelEdit();
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      {/* ヘッダー */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-lg font-bold">
            Gym Log
          </Link>
          <nav className="space-x-4 text-sm">
            <Link href="/" className="hover:text-sky-400">
              Today
            </Link>
            <span className="text-sky-400">History</span>
          </nav>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="max-w-xl mx-auto px-4 py-8">
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
                  {day.sets.map((s) => {
                    const isEditing = s.id === editingId;

                    if (isEditing) {
                      return (
                        <li
                          key={s.id}
                          className="flex flex-col gap-2 bg-slate-900/40 rounded-lg px-3 py-2"
                        >
                          <div className="flex justify-between gap-2">
                            <div className="flex-1">
                              <label className="block text-xs mb-1">
                                種目
                              </label>
                              <input
                                className="w-full rounded-md px-2 py-1 bg-slate-700 border border-slate-600 text-xs"
                                value={editExercise}
                                onChange={(e) =>
                                  setEditExercise(e.target.value)
                                }
                              />
                            </div>
                            <div className="w-20">
                              <label className="block text-xs mb-1">
                                重量
                              </label>
                              <input
                                type="number"
                                className="w-full rounded-md px-2 py-1 bg-slate-700 border border-slate-600 text-xs"
                                value={editWeight}
                                onChange={(e) =>
                                  setEditWeight(
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                            <div className="w-20">
                              <label className="block text-xs mb-1">
                                回数
                              </label>
                              <input
                                type="number"
                                className="w-full rounded-md px-2 py-1 bg-slate-700 border border-slate-600 text-xs"
                                value={editReps}
                                onChange={(e) =>
                                  setEditReps(
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-xs mb-1">
                                セット
                              </label>
                              <input
                                type="number"
                                className="w-full rounded-md px-2 py-1 bg-slate-700 border border-slate-600 text-xs"
                                value={editSetNumber}
                                onChange={(e) =>
                                  setEditSetNumber(
                                    e.target.value === ""
                                      ? ""
                                      : Number(e.target.value)
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 text-xs">
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1 rounded-md border border-slate-600 hover:bg-slate-700"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={saveEdit}
                              disabled={savingId === s.id}
                              className="px-3 py-1 rounded-md bg-sky-500 hover:bg-sky-400 disabled:opacity-60"
                            >
                              {savingId === s.id ? "保存中..." : "保存"}
                            </button>
                          </div>
                        </li>
                      );
                    }

                    // 通常表示モード
                    return (
                      <li
                        key={s.id}
                        className="flex justify-between items-center text-slate-200"
                      >
                        <div>
                          <div className="font-semibold">
                            {s.exercise}
                          </div>
                          <div className="text-slate-300 text-xs">
                            {s.set_number}セット目
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-300 text-sm">
                            {s.weight}kg × {s.reps}回
                          </div>
                          <button
                            onClick={() => startEdit(s)}
                            className="mt-1 text-xs text-sky-400 hover:text-sky-300 underline"
                          >
                            編集
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
