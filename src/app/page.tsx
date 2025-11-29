// app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";


type TrainingSet = {
  id: number;
  exercise: string;
  weight: number;
  reps: number;
  setNumber: number;
};

export default function Home() {
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [exercise, setExercise] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [setNumber, setSetNumber] = useState<number | "">("");
  const [sets, setSets] = useState<TrainingSet[]>([]);
  const [nextId, setNextId] = useState(1);

    const handleAddSet = async () => {
      if (!date) {
        alert("日付を入力してください");
        return;
      }
    if (!exercise || weight === "" || reps === "" || setNumber === "") {
      alert("種目名・重量・回数・セット数を全部入力してね！");
      return;
    }

    const currentDate = date;

    // ① まずローカルの state に追加（画面の即時反映用）
    const newSet: TrainingSet = {
      id: nextId,
      exercise,
      weight: Number(weight),
      reps: Number(reps),
      setNumber: Number(setNumber),
    };

    setSets((prev) => [...prev, newSet]);
    setNextId((prev) => prev + 1);

    // 入力欄リセット（UX的に先にリセットしちゃう）
    setWeight("");
    setReps("");
    setSetNumber("");

    // ② Supabase に INSERT
    const { error } = await supabase.from("workout_entries").insert([
      {
        date: date,
        exercise: exercise,
        weight: Number(weight),
        reps: Number(reps),
        set_number: Number(setNumber),
        // user_id は今は null のままでOK（あとで認証つけるなら使う）
      },
    ]);

    if (error) {
      console.error(error);
      alert("DBへの保存に失敗しました… コンソールを確認してください");
      // ここで本当はローカルの state からも取り消したいが、今回は簡略化
    }
  };


  const totalVolume = sets.reduce(
    (sum, s) => sum + s.weight * s.reps,
    0
  );

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          今日の筋トレ記録（Gym Log）
        </h1>

        {/* 入力フォーム */}
        <section className="mb-8 bg-slate-800 rounded-xl p-4 shadow">
          <h2 className="text-xl font-semibold mb-3">セットを追加</h2>

          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">種目名</label>
              <input
                className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600 focus:outline-none focus:ring focus:border-sky-500"
                placeholder="例: ベンチプレス"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">日付</label>
              <input
                type="date"
                className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600 focus:outline-none focus:ring focus:border-sky-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1">重量 (kg)</label>
                <input
                  type="number"
                  className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600 focus:outline-none focus:ring focus:border-sky-500"
                  value={weight}
                  onChange={(e) =>
                    setWeight(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">回数</label>
                <input
                  type="number"
                  className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600 focus:outline-none focus:ring focus:border-sky-500"
                  value={reps}
                  onChange={(e) =>
                    setReps(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-sm mb-1">セット数</label>
                <input
                  type="number"
                  className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600 focus:outline-none focus:ring focus:border-sky-500"
                  value={setNumber}
                  onChange={(e) =>
                    setSetNumber(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                />
              </div>
            </div>

            <button
              className="w-full mt-2 py-2 rounded-md bg-sky-500 hover:bg-sky-400 font-semibold"
              onClick={handleAddSet}
            >
              セットを追加
            </button>
          </div>
        </section>

        <Link href="/history" className="underline text-sky-400 block text-center mt-6">
          過去の履歴を見る
        </Link>

      </div>
    </main>
  );
}
