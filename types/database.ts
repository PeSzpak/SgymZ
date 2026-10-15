// Tipos espelhando supabase/setup.sql
export type UserStatus = "pending" | "approved" | "rejected";
export type ThemePreference = "batman" | "hellokitty";
export type SetType = "warmup" | "prep" | "working";
export type ChangeRequestStatus = "pending" | "resolved";

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  status: UserStatus;
  theme_preference: ThemePreference;
  weekly_goal: number;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  notes: string | null;
  created_by: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  program_id: string;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  warmup_sets: number;
  prep_sets: number;
  working_sets: number;
  reps: string;
  rest_seconds: number;
  notes: string | null;
  created_at: string;
  exercise?: Exercise;
}

export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
  program?: WorkoutProgram;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string | null;
  program_id: string | null;
  workout_name: string;
  started_at: string | null;
  completed_at: string;
  duration_seconds: number | null;
  difficulty_rating: number | null;
  notes: string | null;
  created_at: string;
  exercise_logs?: ExerciseLog[];
}

export interface ExerciseLog {
  id: string;
  workout_log_id: string;
  workout_exercise_id: string | null;
  exercise_id: string | null;
  exercise_name: string;
  set_type: SetType;
  set_number: number;
  weight: number;
  reps: number;
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  user_id: string;
  workout_id: string | null;
  message: string;
  status: ChangeRequestStatus;
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
  user?: Pick<User, "full_name" | "email">;
  workout?: Pick<Workout, "name"> | null;
}

/** Treino com os exercícios já ordenados */
export interface WorkoutWithExercises extends Workout {
  workout_exercises: WorkoutExercise[];
}

/** Programa completo, como o editor e a tela de treino usam */
export interface ProgramWithWorkouts extends WorkoutProgram {
  workouts: WorkoutWithExercises[];
}
