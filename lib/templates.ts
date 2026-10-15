import { addWorkout, addWorkoutExercise, createProgram, listExercises } from "@/lib/data";
import type { WorkoutProgram } from "@/types/database";

type T = [name: string, sets: number, reps: string, rest: number, warmup?: number];

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  workouts: { name: string; exercises: T[] }[];
}

// Os nomes batem com a biblioteca padrão do supabase/setup.sql
export const TEMPLATES: ProgramTemplate[] = [
  {
    id: "gluteos-abc",
    name: "Glúteos & Pernas ABC",
    description: "3x por semana, foco em glúteos, com um dia de superiores.",
    workouts: [
      {
        name: "A: Glúteos",
        exercises: [
          ["Elevação pélvica", 4, "8-12", 120, 2],
          ["Agachamento búlgaro", 3, "10-12", 90],
          ["Cadeira abdutora", 4, "15-20", 60],
          ["Glúteo na polia (coice)", 3, "12-15", 60],
          ["Stiff", 3, "10-12", 90],
        ],
      },
      {
        name: "B: Superiores e abdômen",
        exercises: [
          ["Puxada frontal", 4, "10-12", 90, 1],
          ["Remada baixa", 3, "10-12", 90],
          ["Desenvolvimento com halteres", 3, "10-12", 90],
          ["Elevação lateral", 3, "12-15", 60],
          ["Tríceps na polia", 3, "12-15", 60],
          ["Prancha", 3, "30s", 45],
        ],
      },
      {
        name: "C: Quadríceps e posterior",
        exercises: [
          ["Agachamento livre", 4, "8-10", 120, 2],
          ["Leg press 45°", 3, "10-12", 90],
          ["Cadeira extensora", 3, "12-15", 60],
          ["Mesa flexora", 3, "10-12", 60],
          ["Passada andando", 3, "12 cada perna", 90],
          ["Panturrilha em pé", 4, "15-20", 45],
        ],
      },
    ],
  },
  {
    id: "superior-inferior",
    name: "Superior / Inferior",
    description: "4x por semana alternando superiores e inferiores.",
    workouts: [
      {
        name: "A: Inferiores",
        exercises: [
          ["Agachamento livre", 4, "6-10", 150, 2],
          ["Levantamento terra romeno", 3, "8-10", 120],
          ["Leg press 45°", 3, "10-12", 90],
          ["Cadeira flexora", 3, "12-15", 60],
          ["Panturrilha sentada", 4, "15", 45],
        ],
      },
      {
        name: "B: Superiores",
        exercises: [
          ["Supino reto", 4, "6-10", 150, 2],
          ["Remada curvada", 4, "8-10", 120],
          ["Desenvolvimento com halteres", 3, "10-12", 90],
          ["Pulldown", 3, "12", 60],
          ["Rosca alternada", 3, "10-12", 60],
          ["Tríceps francês", 3, "10-12", 60],
        ],
      },
    ],
  },
  {
    id: "full-body",
    name: "Corpo todo para começar",
    description: "2 ou 3x por semana. Ótimo para voltar a treinar.",
    workouts: [
      {
        name: "Corpo todo",
        exercises: [
          ["Leg press 45°", 3, "12", 90, 1],
          ["Puxada frontal", 3, "12", 90],
          ["Elevação pélvica", 3, "12", 90],
          ["Supino inclinado com halteres", 3, "12", 90],
          ["Cadeira abdutora", 3, "15", 60],
          ["Abdominal supra", 3, "15", 45],
        ],
      },
    ],
  },
];

export async function createFromTemplate(template: ProgramTemplate, name?: string): Promise<WorkoutProgram> {
  const library = await listExercises();
  const byName = new Map(library.map((e) => [e.name.toLowerCase(), e.id]));
  const program = await createProgram(name || template.name, template.description);
  for (const [wi, w] of template.workouts.entries()) {
    const workout = await addWorkout(program.id, w.name, wi);
    let order = 0;
    for (const [exName, sets, reps, rest, warmup = 0] of w.exercises) {
      const id = byName.get(exName.toLowerCase());
      if (!id) continue;
      await addWorkoutExercise(workout.id, id, order++, {
        working_sets: sets,
        reps,
        rest_seconds: rest,
        warmup_sets: warmup,
      });
    }
  }
  return program;
}
