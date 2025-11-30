// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

type WorkoutEntry = {
  id: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  set_number: number;
};

export default function Home() {
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [setNumber, setSetNumber] = useState<number | "">("");

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const router = useRouter();

  // 今日の記録一覧
  const [todayEntries, setTodayEntries] = useState<WorkoutEntry[]>([]);
  const [loadingToday, setLoadingToday] = useState(true);

  // 🔐 認証チェック → TODAYの記録取得
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);

      await loadTodayEntries(user.id);
      setAuthChecking(false);
    };

    init();
  }, [router]);

  // 今日の記録を Supabase から取得
  const loadTodayEntries = async (uid: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setLoadingToday(true);

    const { data, error } = await supabase
      .from("workout_entries")
      .select("*")
      .eq("user_id", uid)
      .eq("date", today)
      .order("set_number", { ascending: true });

    if (error) console.error(error);

    setTodayEntries((data ?? []) as WorkoutEntry[]);
    setLoadingToday(false);
  };

  // セット追加
  const handleAddSet = async () => {
    if (!userId) return router.push("/login");

    if (!exercise || weight === "" || reps === "" || setNumber === "") {
      alert("すべての項目を入力してね！");
      return;
    }

    const entry = {
      user_id: userId,
      date,
      exercise,
      weight: Number(weight),
      reps: Number(reps),
      set_number: Number(setNumber),
    };

    const { error } = await supabase.from("workout_entries").insert([entry]);

    if (error) {
      alert("保存に失敗しました");
      return;
    }

    // 入力リセット
    setExercise("");
    setWeight("");
    setReps("");
    setSetNumber("");

    // 今日の記録を再取得
    await loadTodayEntries(userId);
  };

  // 今日の総ボリューム
  const todayTotalVolume = todayEntries.reduce(
    (sum, s) => sum + s.weight * s.reps,
    0
  );

  if (authChecking) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 flex justify-center items-center">
        認証確認中...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      {/* ヘッダー */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-lg font-bold">Gym Log</div>
          <div className="flex items-center gap-3">
            {userEmail && <span className="text-xs text-slate-300">{userEmail}</span>}
            <nav className="space-x-4 text-sm">
              <Link href="/" className="text-sky-400">Home</Link>
              <Link href="/history" className="hover:text-sky-400">History</Link>
            </nav>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="text-xs text-slate-300 hover:text-slate-100 border border-slate-600 rounded px-2 py-1 ml-1"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">今日の筋トレ記録</h1>

        {/* 入力フォーム */}
        <section className="mb-8 bg-slate-800 rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold mb-3">セットを追加</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">種目名</label>
              <input
                className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                placeholder="重量"
                className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600"
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <input
                type="number"
                placeholder="回数"
                className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600"
                value={reps}
                onChange={(e) =>
                  setReps(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <input
                type="number"
                placeholder="セット目"
                className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600"
                value={setNumber}
                onChange={(e) =>
                  setSetNumber(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>

            <button
              onClick={handleAddSet}
              className="w-full mt-2 py-2 rounded-md bg-sky-500 hover:bg-sky-400 font-semibold"
            >
              追加
            </button>
          </div>
        </section>

        {/* 今日の総ボリューム */}
        <section className="mb-6">
          <div className="bg-slate-800 rounded-xl p-4 flex justify-between items-center">
            <span className="font-semibold">今日の総ボリューム</span>
            <span className="text-2xl font-bold">{todayTotalVolume} kg</span>
          </div>
        </section>

        {/* 今日の記録一覧 */}
        <section>
          <h2 className="text-xl font-semibold mb-3">今日の記録</h2>
          {loadingToday ? (
            <p className="text-slate-400">読み込み中...</p>
          ) : todayEntries.length === 0 ? (
            <p className="text-slate-400">まだ記録がありません。</p>
          ) : (
            <ul className="space-y-2">
              {todayEntries.map((s) => (
                <li
                  key={s.id}
                  className="bg-slate-800 rounded-lg px-3 py-2 flex justify-between text-sm"
                >
                  <div>
                    <div className="font-semibold">{s.exercise}</div>
                    <div className="text-slate-300">
                      {s.weight}kg × {s.reps}回（{s.set_number}セット目）
                    </div>
                  </div>
                  <div className="text-right text-slate-300">
                    {s.weight * s.reps} kg
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
