// app/history/page.tsx

import Link from "next/link";

type WorkoutHistory = {
  date: string;
  totalVolume: number;
};

const dummyData: WorkoutHistory[] = [
  { date: "2024-01-10", totalVolume: 8000 },
  { date: "2024-01-11", totalVolume: 9200 },
  { date: "2024-01-12", totalVolume: 7600 },
];

export default function History() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">過去のトレーニング履歴</h1>

      <section className="space-y-4">
        {dummyData.map((item) => (
          <div
            key={item.date}
            className="bg-slate-800 rounded-lg p-4 flex justify-between"
          >
            <div>{item.date}</div>
            <div className="font-bold">{item.totalVolume} kg</div>
          </div>
        ))}
      </section>

        <Link href="/" className="underline text-sky-400 block mb-4">
            ← ホームに戻る
        </Link>

    </main>
  );
}
