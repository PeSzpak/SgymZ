import { z } from "zod";

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .min(1, "Email é obrigatório"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema de validação para registro
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email("Email inválido")
    .min(1, "Email é obrigatório"),
  password: z
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  fullName: z
    .string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema de validação para exercício
 */
export const exerciseSchema = z.object({
  name: z.string().min(1, "Nome do exercício é obrigatório"),
  muscle_group: z.string().optional(),
  equipment: z.string().optional(),
  notes: z.string().optional(),
});

export type ExerciseFormData = z.infer<typeof exerciseSchema>;

/**
 * Schema de validação para programa de treino
 */
export const workoutProgramSchema = z.object({
  name: z.string().min(1, "Nome do programa é obrigatório"),
  description: z.string().optional(),
});

export type WorkoutProgramFormData = z.infer<typeof workoutProgramSchema>;

/**
 * Schema de validação para treino
 */
export const workoutSchema = z.object({
  name: z.string().min(1, "Nome do treino é obrigatório"),
  program_id: z.string().uuid("ID de programa inválido"),
});

export type WorkoutFormData = z.infer<typeof workoutSchema>;

/**
 * Schema de validação para exercício do treino
 */
export const workoutExerciseSchema = z.object({
  exercise_id: z.string().uuid("ID de exercício inválido"),
  warmup_sets: z.number().int().min(0).optional(),
  prep_sets: z.number().int().min(0).optional(),
  working_sets: z.number().int().min(1, "Deve ter pelo menos 1 série de trabalho"),
  reps: z.string().min(1, "Repetições são obrigatórias"),
  rest_time: z.string().min(1, "Tempo de descanso é obrigatório"),
  notes: z.string().optional(),
});

export type WorkoutExerciseFormData = z.infer<typeof workoutExerciseSchema>;

/**
 * Schema de validação para log de treino
 */
export const workoutLogSchema = z.object({
  workout_id: z.string().uuid("ID de treino inválido"),
  difficulty_rating: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export type WorkoutLogFormData = z.infer<typeof workoutLogSchema>;

/**
 * Schema de validação para log de exercício
 */
export const exerciseLogSchema = z.object({
  workout_log_id: z.string().uuid("ID de log de treino inválido"),
  workout_exercise_id: z.string().uuid("ID de exercício do treino inválido"),
  set_type: z.enum(["warmup", "prep", "working"]),
  set_number: z.number().int().min(1),
  weight: z.number().min(0),
  reps_completed: z.number().int().min(0),
  notes: z.string().optional(),
});

export type ExerciseLogFormData = z.infer<typeof exerciseLogSchema>;

/**
 * Schema de validação para solicitação de alteração
 */
export const changeRequestSchema = z.object({
  workout_id: z.string().uuid("ID de treino inválido").optional(),
  message: z.string().min(10, "Mensagem deve ter no mínimo 10 caracteres"),
});

export type ChangeRequestFormData = z.infer<typeof changeRequestSchema>;
