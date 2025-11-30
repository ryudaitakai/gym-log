// features/workout/types.ts

export type WorkoutEntry = {
  id: string;
  user_id: string;
  date: string;        // "YYYY-MM-DD"
  exercise: string;
  weight: number;
  reps: number;
  set_number: number;
};

export type DailySummary = {
  date: string;
  totalVolume: number;
  sets: WorkoutEntry[];
};
