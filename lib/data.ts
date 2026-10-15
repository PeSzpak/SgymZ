import { createClient } from "@/lib/supabase/client";
import type {
  ChangeRequest,
  Exercise,
  ExerciseLog,
  ProgramWithWorkouts,
  User,
  UserProgram,
  Workout,
  WorkoutExercise,
  WorkoutLog,
  WorkoutProgram,
  WorkoutWithExercises,
} from "@/types/database";

const db = () => createClient();

function must<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

const PROGRAM_SELECT =
  "*, workouts(*, workout_exercises(*, exercise:exercises(*)))";

function sortProgram(program: ProgramWithWorkouts): ProgramWithWorkouts {
  program.workouts?.sort((a, b) => a.order_index - b.order_index);
  program.workouts?.forEach((w) => w.workout_exercises?.sort((a, b) => a.order_index - b.order_index));
  return program;
}

// ---------- Perfil ----------

export async function getProfile(): Promise<User | null> {
  const supabase = db();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  const { data } = await supabase.from("users").select("*").eq("id", session.user.id).maybeSingle();
  return data as User | null;
}

export async function updateProfile(id: string, patch: Partial<Pick<User, "full_name" | "weekly_goal">>) {
  must(await db().from("users").update(patch).eq("id", id));
}

// ---------- Programas ----------

export interface AssignedProgram extends UserProgram {
  program: ProgramWithWorkouts;
}

export async function listAssignedPrograms(userId: string): Promise<AssignedProgram[]> {
  const rows = must(
    await db()
      .from("user_programs")
      .select(`*, program:workout_programs(${PROGRAM_SELECT})`)
      .eq("user_id", userId)
      .order("assigned_at", { ascending: false })
  ) as AssignedProgram[];
  return rows.filter((r) => r.program).map((r) => ({ ...r, program: sortProgram(r.program) }));
}

export async function listAllPrograms(): Promise<(WorkoutProgram & { workouts: { count: number }[]; user_programs: { count: number }[] })[]> {
  return must(
    await db()
      .from("workout_programs")
      .select("*, workouts(count), user_programs(count)")
      .order("updated_at", { ascending: false })
  );
}

export async function getProgram(id: string): Promise<ProgramWithWorkouts | null> {
  const data = must(await db().from("workout_programs").select(PROGRAM_SELECT).eq("id", id).maybeSingle());
  return data ? sortProgram(data as ProgramWithWorkouts) : null;
}

export async function createProgram(name: string, description?: string): Promise<WorkoutProgram> {
  const supabase = db();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return must(
    await supabase
      .from("workout_programs")
      .insert({ name, description: description || null, created_by: session?.user.id })
      .select()
      .single()
  );
}

export async function updateProgram(id: string, patch: Partial<Pick<WorkoutProgram, "name" | "description">>) {
  must(await db().from("workout_programs").update(patch).eq("id", id));
}

export async function deleteProgram(id: string) {
  must(await db().from("workout_programs").delete().eq("id", id));
}

export async function setProgramActive(userProgramId: string, isActive: boolean) {
  must(await db().from("user_programs").update({ is_active: isActive }).eq("id", userProgramId));
}

export async function assignProgram(userId: string, programId: string) {
  must(
    await db()
      .from("user_programs")
      .upsert({ user_id: userId, program_id: programId, is_active: true }, { onConflict: "user_id,program_id" })
  );
}

export async function unassignProgram(userProgramId: string) {
  must(await db().from("user_programs").delete().eq("id", userProgramId));
}

/** Copia um programa (com treinos e exercícios). Útil para a aluna personalizar um programa atribuído. */
export async function duplicateProgram(source: ProgramWithWorkouts, name: string): Promise<WorkoutProgram> {
  const program = await createProgram(name, source.description ?? undefined);
  for (const w of source.workouts) {
    const workout = await addWorkout(program.id, w.name, w.order_index);
    if (w.workout_exercises.length) {
      must(
        await db()
          .from("workout_exercises")
          .insert(
            w.workout_exercises.map((we) => ({
              workout_id: workout.id,
              exercise_id: we.exercise_id,
              order_index: we.order_index,
              warmup_sets: we.warmup_sets,
              prep_sets: we.prep_sets,
              working_sets: we.working_sets,
              reps: we.reps,
              rest_seconds: we.rest_seconds,
              notes: we.notes,
            }))
          )
      );
    }
  }
  return program;
}

// ---------- Treinos (A, B, C...) ----------

export async function addWorkout(programId: string, name: string, orderIndex: number): Promise<WorkoutWithExercises> {
  const w = must<Workout>(
    await db().from("workouts").insert({ program_id: programId, name, order_index: orderIndex }).select().single()
  );
  return { ...w, workout_exercises: [] };
}

export async function renameWorkout(id: string, name: string) {
  must(await db().from("workouts").update({ name }).eq("id", id));
}

export async function deleteWorkout(id: string) {
  must(await db().from("workouts").delete().eq("id", id));
}

export async function reorderRows(table: "workouts" | "workout_exercises", ids: string[]) {
  const supabase = db();
  await Promise.all(ids.map((id, i) => supabase.from(table).update({ order_index: i }).eq("id", id)));
}

export async function getWorkout(id: string): Promise<(WorkoutWithExercises & { program: WorkoutProgram }) | null> {
  const data = must(
    await db()
      .from("workouts")
      .select("*, program:workout_programs(*), workout_exercises(*, exercise:exercises(*))")
      .eq("id", id)
      .maybeSingle()
  ) as (WorkoutWithExercises & { program: WorkoutProgram }) | null;
  data?.workout_exercises.sort((a, b) => a.order_index - b.order_index);
  return data;
}

// ---------- Exercícios dentro do treino ----------

export type WorkoutExerciseInput = Pick<
  WorkoutExercise,
  "warmup_sets" | "prep_sets" | "working_sets" | "reps" | "rest_seconds" | "notes"
>;

export async function addWorkoutExercise(
  workoutId: string,
  exerciseId: string,
  orderIndex: number,
  params: Partial<WorkoutExerciseInput> = {}
): Promise<WorkoutExercise> {
  return must(
    await db()
      .from("workout_exercises")
      .insert({ workout_id: workoutId, exercise_id: exerciseId, order_index: orderIndex, ...params })
      .select("*, exercise:exercises(*)")
      .single()
  );
}

export async function updateWorkoutExercise(id: string, patch: Partial<WorkoutExerciseInput>) {
  must(await db().from("workout_exercises").update(patch).eq("id", id));
}

export async function deleteWorkoutExercise(id: string) {
  must(await db().from("workout_exercises").delete().eq("id", id));
}

// ---------- Biblioteca de exercícios ----------

export async function listExercises(): Promise<Exercise[]> {
  return must(await db().from("exercises").select("*").order("muscle_group").order("name"));
}

export async function createExercise(input: Pick<Exercise, "name" | "muscle_group" | "equipment" | "notes">) {
  const supabase = db();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return must(
    await supabase
      .from("exercises")
      .insert({ ...input, created_by: session?.user.id })
      .select()
      .single()
  ) as Exercise;
}

export async function updateExercise(id: string, patch: Partial<Pick<Exercise, "name" | "muscle_group" | "equipment" | "notes">>) {
  must(await db().from("exercises").update(patch).eq("id", id));
}

export async function deleteExercise(id: string) {
  must(await db().from("exercises").delete().eq("id", id));
}

// ---------- Histórico ----------

export async function listLogs(userId: string, limit = 200): Promise<WorkoutLog[]> {
  return must(
    await db()
      .from("workout_logs")
      .select("*, exercise_logs(*)")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(limit)
  );
}

export async function deleteLog(id: string) {
  must(await db().from("workout_logs").delete().eq("id", id));
}

/** Últimas séries feitas de cada exercício (para já preencher carga e repetições) */
export async function lastSetsByExercise(userId: string, exerciseIds: string[]): Promise<Record<string, ExerciseLog[]>> {
  if (!exerciseIds.length) return {};
  const rows = must(
    await db()
      .from("exercise_logs")
      .select("*, workout_log:workout_logs!inner(user_id, completed_at)")
      .in("exercise_id", exerciseIds)
      .eq("workout_log.user_id", userId)
      .order("created_at", { ascending: false })
      .limit(400)
  ) as (ExerciseLog & { workout_log: { completed_at: string } })[];

  const result: Record<string, ExerciseLog[]> = {};
  const lastLogOf: Record<string, string> = {};
  for (const row of rows) {
    if (!row.exercise_id) continue;
    lastLogOf[row.exercise_id] ??= row.workout_log_id;
    if (lastLogOf[row.exercise_id] !== row.workout_log_id) continue;
    (result[row.exercise_id] ??= []).push(row);
  }
  Object.values(result).forEach((sets) => sets.sort((a, b) => a.set_number - b.set_number));
  return result;
}

export interface SessionSet {
  workout_exercise_id: string;
  exercise_id: string;
  exercise_name: string;
  set_type: "warmup" | "prep" | "working";
  set_number: number;
  weight: number;
  reps: number;
}

export async function saveWorkoutLog(input: {
  userId: string;
  workoutId: string;
  programId: string;
  workoutName: string;
  startedAt: string;
  durationSeconds: number;
  difficulty: number | null;
  notes: string;
  sets: SessionSet[];
}): Promise<WorkoutLog> {
  const supabase = db();
  const log = must(
    await supabase
      .from("workout_logs")
      .insert({
        user_id: input.userId,
        workout_id: input.workoutId,
        program_id: input.programId,
        workout_name: input.workoutName,
        started_at: input.startedAt,
        duration_seconds: input.durationSeconds,
        difficulty_rating: input.difficulty,
        notes: input.notes || null,
      })
      .select()
      .single()
  ) as WorkoutLog;

  if (input.sets.length) {
    const { error } = await supabase
      .from("exercise_logs")
      .insert(input.sets.map((s) => ({ ...s, workout_log_id: log.id })));
    if (error) {
      await supabase.from("workout_logs").delete().eq("id", log.id);
      throw new Error(error.message);
    }
  }
  return log;
}

// ---------- Usuários (admin) ----------

export async function listUsers(): Promise<User[]> {
  return must(await db().from("users").select("*").order("created_at", { ascending: true }));
}

export async function updateUserAdmin(id: string, patch: Partial<Pick<User, "status" | "is_admin">>) {
  must(await db().from("users").update(patch).eq("id", id));
}

export async function getUser(id: string): Promise<User | null> {
  return must(await db().from("users").select("*").eq("id", id).maybeSingle());
}

// ---------- Pedidos de ajuste ----------

export async function listChangeRequests(opts: { userId?: string } = {}): Promise<ChangeRequest[]> {
  let q = db()
    .from("change_requests")
    .select("*, user:users!change_requests_user_id_fkey(full_name, email), workout:workouts(name)")
    .order("created_at", { ascending: false });
  if (opts.userId) q = q.eq("user_id", opts.userId);
  return must(await q);
}

export async function createChangeRequest(userId: string, message: string, workoutId?: string | null) {
  must(await db().from("change_requests").insert({ user_id: userId, message, workout_id: workoutId || null }));
}

export async function resolveChangeRequest(id: string, response: string) {
  must(
    await db()
      .from("change_requests")
      .update({ status: "resolved", admin_response: response || null, resolved_at: new Date().toISOString() })
      .eq("id", id)
  );
}

export async function countPendingRequests(): Promise<number> {
  const { count } = await db()
    .from("change_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}
