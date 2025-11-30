// features/workout/services.ts

import { supabase } from "@/lib/supabaseClient";
import { WorkoutEntry } from "./types";

// 指定ユーザーの全ワークアウト取得
export async function fetchEntriesByUser(userId: string): Promise<WorkoutEntry[]> {
  const { data, error } = await supabase
    .from("workout_entries")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Failed to fetch workout entries", error);
    throw error;
  }

  return (data ?? []) as WorkoutEntry[];
}

// ワークアウト1件追加
export async function addWorkoutEntry(input: {
  userId: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  setNumber: number;
}): Promise<void> {
  const { userId, date, exercise, weight, reps, setNumber } = input;

  const { error } = await supabase.from("workout_entries").insert([
    {
      user_id: userId,
      date,
      exercise,
      weight,
      reps,
      set_number: setNumber,
    },
  ]);

  if (error) {
    console.error("Failed to add workout entry", error);
    throw error;
  }
}

// ワークアウト更新
export async function updateWorkoutEntry(input: {
  userId: string;
  id: string;
  exercise: string;
  weight: number;
  reps: number;
  setNumber: number;
}): Promise<void> {
  const { userId, id, exercise, weight, reps, setNumber } = input;

  const { error } = await supabase
    .from("workout_entries")
    .update({
      exercise,
      weight,
      reps,
      set_number: setNumber,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update workout entry", error);
    throw error;
  }
}

// ワークアウト削除
export async function deleteWorkoutEntry(input: {
  userId: string;
  id: string;
}): Promise<void> {
  const { userId, id } = input;

  const { error } = await supabase
    .from("workout_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete workout entry", error);
    throw error;
  }
}

// 今日のエントリだけ取得（Home から使用）
export async function fetchTodayEntries(
  userId: string,
  date: string
): Promise<WorkoutEntry[]> {
  const { data, error } = await supabase
    .from("workout_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("set_number", { ascending: true });

  if (error) {
    console.error("Failed to fetch today entries", error);
    throw error;
  }

  return (data ?? []) as WorkoutEntry[];
}
