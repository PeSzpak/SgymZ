// Tipos de enums do banco de dados
export type UserStatus = "pending" | "approved" | "rejected";
export type ThemePreference = "batman" | "hellokitty";
export type NotificationType =
  | "new_user"
  | "program_assigned"
  | "program_updated"
  | "change_request";
export type SetType = "warmup" | "prep" | "working";
export type ChangeRequestStatus = "pending" | "resolved";

// Tipo do usuário estendido
export interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  status: UserStatus;
  created_at: string;
  theme_preference: ThemePreference;
}

// Tipo de exercício
export interface Exercise {
  id: string;
  name: string;
  muscle_group?: string;
  equipment?: string;
  notes?: string;
  created_by: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Tipo de programa de treino
export interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Tipo de treino individual
export interface Workout {
  id: string;
  program_id: string;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Tipo de exercício dentro de um treino
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_index: number;
  warmup_sets?: number;
  prep_sets?: number;
  working_sets?: number;
  reps: string;
  rest_time: string;
  notes?: string;
  created_at: string;
  exercise?: Exercise; // Para joins
}

// Tipo de atribuição de programa
export interface UserProgram {
  id: string;
  user_id: string;
  program_id: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
  program?: WorkoutProgram; // Para joins
}

// Tipo de log de treino
export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  completed_at: string;
  difficulty_rating: number;
  notes?: string;
  created_at: string;
  workout?: Workout; // Para joins
}

// Tipo de log de exercício
export interface ExerciseLog {
  id: string;
  workout_log_id: string;
  workout_exercise_id: string;
  set_type: SetType;
  set_number: number;
  weight: number;
  reps_completed: number;
  notes?: string;
}

// Tipo de notificação
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

// Tipo de solicitação de alteração
export interface ChangeRequest {
  id: string;
  user_id: string;
  workout_id?: string;
  message: string;
  status: ChangeRequestStatus;
  created_at: string;
  resolved_at?: string;
  user?: User; // Para joins
  workout?: Workout; // Para joins
}
