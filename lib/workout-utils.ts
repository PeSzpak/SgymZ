import type { ProgramWithWorkouts, WorkoutLog, WorkoutWithExercises } from "@/types/database";

/** Próximo treino da rotação (A → B → C → A...) com base no último registro */
export function nextWorkoutOf(program: ProgramWithWorkouts, logs: WorkoutLog[]): WorkoutWithExercises | null {
  const workouts = program.workouts.filter((w) => w.workout_exercises.length > 0);
  if (!workouts.length) return null;
  const last = logs.find((l) => l.program_id === program.id && workouts.some((w) => w.id === l.workout_id));
  if (!last) return workouts[0];
  const i = workouts.findIndex((w) => w.id === last.workout_id);
  return workouts[(i + 1) % workouts.length];
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // segunda = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export function dayKey(date: Date | string) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Semanas seguidas batendo a meta (a semana atual conta se já bateu) */
export function weekStreak(logs: WorkoutLog[], weeklyGoal: number) {
  const counts = new Map<string, number>();
  for (const l of logs) {
    const k = dayKey(startOfWeek(new Date(l.completed_at)));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let streak = 0;
  const cursor = startOfWeek();
  if ((counts.get(dayKey(cursor)) ?? 0) >= weeklyGoal) streak++;
  cursor.setDate(cursor.getDate() - 7);
  while ((counts.get(dayKey(cursor)) ?? 0) >= weeklyGoal) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export function totalVolume(log: WorkoutLog) {
  return (log.exercise_logs ?? [])
    .filter((s) => s.set_type === "working")
    .reduce((sum, s) => sum + Number(s.weight) * s.reps, 0);
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatKg(n: number) {
  return `${Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} kg`;
}

export function formatRest(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}min${s}s` : `${m} min`;
}

export function relativeDay(date: string) {
  const d = new Date(date);
  const today = new Date();
  const diff = Math.round((+new Date(dayKey(today)) - +new Date(dayKey(d))) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff < 7) return d.toLocaleDateString("pt-BR", { weekday: "long" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function firstName(fullName?: string | null) {
  return (fullName ?? "").trim().split(/\s+/)[0] || "você";
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export const MUSCLE_GROUPS = [
  "Glúteos",
  "Quadríceps",
  "Posterior",
  "Adutores",
  "Panturrilha",
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Abdômen",
  "Cardio",
];

export const SET_TYPE_LABEL = { warmup: "Aquecimento", prep: "Preparação", working: "Válida" } as const;
