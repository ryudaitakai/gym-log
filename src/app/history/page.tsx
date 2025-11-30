// app/history/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import {
  fetchEntriesByUser,
  updateWorkoutEntry,
  deleteWorkoutEntry,
} from "@/features/workout/services";
import { groupByDate } from "@/features/workout/utils";
import { WorkoutEntry, DailySummary } from "@/features/workout/types";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function History() {
  const router = useRouter();

  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // 編集用 state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState("");
  const [editWeight, setEditWeight] = useState<number | "">("");
  const [editReps, setEditReps] = useState<number | "">("");
  const [editSetNumber, setEditSetNumber] = useState<number | "">("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // 削除中 state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // 認証チェック（UI層）
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Error getting user:", error);
      }

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);

      try {
        // アプリケーション層：ユーザーのエントリ取得
        const userEntries = await fetchEntriesByUser(user.id);
        setEntries(userEntries);

        // ドメイン層：日別サマリに変換
        setDailySummaries(groupByDate(userEntries));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setAuthChecking(false);
      }
    };

    init();
  }, [router]);

  // 🔓 ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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

  // 編集保存（サービス層経由）
  const saveEdit = async () => {
    if (!editingId || !userId) return;
    if (
      !editExercise ||
      editWeight === "" ||
      editReps === "" ||
      editSetNumber === ""
    ) {
      alert("すべての項目を入力してください。");
      return;
    }

    const id = editingId;
    setSavingId(id);

    const payload = {
      userId,
      id,
      exercise: editExercise,
      weight: Number(editWeight),
      reps: Number(editReps),
      setNumber: Number(editSetNumber),
    };

    try {
      await updateWorkoutEntry(payload);

      const updatedEntries = entries.map((e) =>
        e.id === id
          ? {
              ...e,
              exercise: payload.exercise,
              weight: payload.weight,
              reps: payload.reps,
              set_number: payload.setNumber,
            }
          : e
      );

      setEntries(updatedEntries);
      setDailySummaries(groupByDate(updatedEntries));
      cancelEdit();
    } catch (error) {
      console.error(error);
      alert("更新に失敗しました。");
    } finally {
      setSavingId(null);
    }
  };

  // 削除（サービス層経由）
  const handleDelete = async (entry: WorkoutEntry) => {
    if (!userId) return;

    const ok = window.confirm(
      `本当に削除しますか？\n${entry.date} ${entry.exercise} ${entry.weight}kg × ${entry.reps}回`
    );
    if (!ok) return;

    setDeletingId(entry.id);

    try {
      await deleteWorkoutEntry({ userId, id: entry.id });

      const updatedEntries = entries.filter((e) => e.id !== entry.id);
      setEntries(updatedEntries);
      setDailySummaries(groupByDate(updatedEntries));

      if (editingId === entry.id) {
        cancelEdit();
      }
    } catch (error) {
      console.error(error);
      alert("削除に失敗しました。");
    } finally {
      setDeletingId(null);
    }
  };

  // 📈 グラフ用データ（古い日付 → 新しい日付）
  const chartData = [...dailySummaries]
    .slice()
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .map((day) => ({
      date: day.date,
      totalVolume: day.totalVolume,
    }));

  // 認証確認中
  if (authChecking) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <p>認証確認中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-lg font-bold">
            Gym Log
          </Link>
          <div className="flex items-center gap-3">
            {userEmail && (
              <span className="text-xs text-slate-300">{userEmail}</span>
            )}
            <nav className="space-x-4 text-sm">
              <Link href="/" className="hover:text-sky-400">
                Home
              </Link>
              <span className="text-sky-400">History</span>
            </nav>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-300 hover:text-slate-100 border border-slate-600 rounded px-2 py-1 ml-1"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-center">
          過去のトレーニング履歴
        </h1>

        {/* 📈 日別総ボリュームグラフ */}
        <section className="mb-6 bg-slate-800 rounded-xl p-4 shadow">
          <h2 className="text-lg font-semibold mb-3">
            日別総ボリュームの推移
          </h2>
          {chartData.length === 0 ? (
            <p className="text-slate-400 text-sm">
              まだグラフを表示するためのデータがありません。
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#cbd5f5" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#cbd5f5" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      border: "1px solid #334155",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalVolume"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

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
                {/* 日付 & ボリューム */}
                <div className="flex justify-between items-baseline mb-2">
                  <div className="font-semibold text-lg">{day.date}</div>
                  <div className="text-right">
                    <div className="text-sm text-slate-300">総ボリューム</div>
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
                          className="bg-slate-900/40 rounded-lg px-3 py-2 space-y-2"
                        >
                          <div className="grid grid-cols-4 gap-2">
                            <div className="col-span-2">
                              <label className="block text-xs mb-1">種目</label>
                              <input
                                className="w-full rounded-md px-2 py-1 bg-slate-700 border border-slate-600 text-xs"
                                value={editExercise}
                                onChange={(e) =>
                                  setEditExercise(e.target.value)
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-xs mb-1">重量</label>
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

                            <div>
                              <label className="block text-xs mb-1">回数</label>
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

                            <div>
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

                    return (
                      <li
                        key={s.id}
                        className="flex justify-between items-center text-slate-200"
                      >
                        <div>
                          <div className="font-semibold">{s.exercise}</div>
                          <div className="text-slate-300 text-xs">
                            {s.set_number}セット目
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-slate-300 text-sm">
                            {s.weight}kg × {s.reps}回
                          </div>

                          <div className="mt-1 flex gap-2 justify-end text-xs">
                            <button
                              onClick={() => startEdit(s)}
                              className="text-sky-400 hover:text-sky-300 underline"
                            >
                              編集
                            </button>

                            <button
                              onClick={() => handleDelete(s)}
                              disabled={deletingId === s.id}
                              className="text-red-400 hover:text-red-300 underline disabled:opacity-60"
                            >
                              {deletingId === s.id ? "削除中..." : "削除"}
                            </button>
                          </div>
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
