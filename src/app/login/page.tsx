// app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessage("Email と Password を入力してください。");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("サインアップに成功しました。ログイン中です。");
        router.push("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.message ?? "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 shadow">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {mode === "login" ? "ログイン" : "新規登録"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600 focus:outline-none focus:ring focus:border-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-md px-3 py-2 bg-slate-700 border border-slate-600 focus:outline-none focus:ring focus:border-sky-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 rounded-md bg-sky-500 hover:bg-sky-400 font-semibold disabled:opacity-60"
          >
            {loading
              ? "処理中..."
              : mode === "login"
              ? "ログイン"
              : "サインアップ"}
          </button>
        </form>

        {message && (
          <p className="mt-3 text-xs text-slate-200 whitespace-pre-line">
            {message}
          </p>
        )}

        <div className="mt-4 text-center text-xs text-slate-300">
          {mode === "login" ? (
            <>
              アカウントがないですか？{" "}
              <button
                className="text-sky-400 underline"
                onClick={() => setMode("signup")}
              >
                新規登録する
              </button>
            </>
          ) : (
            <>
              すでにアカウントがありますか？{" "}
              <button
                className="text-sky-400 underline"
                onClick={() => setMode("login")}
              >
                ログインする
              </button>
            </>
          )}
        </div>

        <div className="mt-4 text-center text-xs">
          <Link href="/" className="text-slate-400 underline">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
