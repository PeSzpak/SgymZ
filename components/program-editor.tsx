"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  MessageSquareHeart,
  Pencil,
  Play,
  Plus,
  Trash2,
} from "lucide-react";
import {
  addWorkout,
  addWorkoutExercise,
  createChangeRequest,
  deleteProgram,
  deleteWorkout,
  deleteWorkoutExercise,
  duplicateProgram,
  getProgram,
  renameWorkout,
  reorderRows,
  updateProgram,
  updateWorkoutExercise,
  type WorkoutExerciseInput,
} from "@/lib/data";
import { formatRest } from "@/lib/workout-utils";
import { useProfile } from "@/components/profile-gate";
import { ExercisePicker } from "@/components/exercise-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageLoader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ProgramWithWorkouts, WorkoutExercise } from "@/types/database";

const REST_PRESETS = [30, 45, 60, 90, 120, 180];

export function setsSummary(we: Pick<WorkoutExercise, "warmup_sets" | "prep_sets" | "working_sets" | "reps">) {
  const parts = [];
  if (we.warmup_sets) parts.push(`${we.warmup_sets} aquec.`);
  if (we.prep_sets) parts.push(`${we.prep_sets} prep.`);
  parts.push(`${we.working_sets} × ${we.reps}`);
  return parts.join(" + ");
}

/** Editor de programa usado pela aluna (/treinos/[id]) e pelo admin (/admin/programas/[id]) */
export function ProgramEditor({
  programId,
  backHref,
  aside,
}: {
  programId: string;
  backHref: string;
  aside?: React.ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useProfile();
  const [program, setProgram] = useState<ProgramWithWorkouts | null | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingEx, setEditingEx] = useState<WorkoutExercise | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = useCallback(async () => {
    const p = await getProgram(programId);
    setProgram(p);
    setSelectedId((cur) => (cur && p?.workouts.some((w) => w.id === cur) ? cur : (p?.workouts[0]?.id ?? null)));
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  if (program === undefined) return <PageLoader />;
  if (program === null)
    return (
      <EmptyState
        title="Programa não encontrado"
        description="Ele pode ter sido apagado."
        action={
          <Link href={backHref} className={buttonVariants()}>
            Voltar
          </Link>
        }
      />
    );

  const canEdit = profile.is_admin || program.created_by === profile.id;
  const workout = program.workouts.find((w) => w.id === selectedId) ?? null;

  const run = async (fn: () => Promise<unknown>, success?: string) => {
    try {
      await fn();
      await load();
      if (success) toast(success);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Algo deu errado", "error");
    }
  };

  const nextWorkoutName = () => {
    const letter = String.fromCharCode(65 + program.workouts.length);
    return `Treino ${letter}`;
  };

  const handleAddWorkout = () =>
    run(async () => {
      const w = await addWorkout(program.id, nextWorkoutName(), program.workouts.length);
      setSelectedId(w.id);
    });

  const move = (ids: string[], index: number, dir: -1 | 1) => {
    const next = [...ids];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    return next;
  };

  const handleDuplicate = () =>
    run(async () => {
      const copy = await duplicateProgram(program, `${program.name} (minha versão)`);
      router.push(`/treinos/${copy.id}`);
    }, "Cópia criada. Agora é só editar!");

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div>
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-accent"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-4xl leading-none md:text-5xl">{program.name}</h1>
            {program.description && <p className="mt-2 text-muted-foreground">{program.description}</p>}
          </div>
          {canEdit && (
            <Button variant="ghost" size="icon" aria-label="Editar nome do programa" onClick={() => setInfoOpen(true)}>
              <Pencil size={18} />
            </Button>
          )}
        </div>
        {!canEdit && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="muted">Montado pelo admin</Badge>
            <Button size="sm" variant="secondary" onClick={handleDuplicate}>
              <Copy size={15} /> Fazer minha cópia para editar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRequestOpen(true)}>
              <MessageSquareHeart size={15} /> Pedir ajuste
            </Button>
          </div>
        )}
      </div>

      {aside}

      {/* Abas dos treinos */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar md:mx-0 md:px-0">
        {program.workouts.map((w) => (
          <button
            key={w.id}
            onClick={() => setSelectedId(w.id)}
            className={cn(
              "shrink-0 rounded-pill border px-4 py-2 text-sm font-bold transition-colors kitty:border-2",
              w.id === selectedId
                ? "border-accent bg-accent text-accent-foreground kitty:border-outline"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {w.name}
            <span className="ml-1.5 opacity-70">{w.workout_exercises.length}</span>
          </button>
        ))}
        {canEdit && (
          <button
            onClick={handleAddWorkout}
            className="flex shrink-0 items-center gap-1 rounded-pill border border-dashed border-accent px-4 py-2 text-sm font-bold text-accent kitty:border-2"
          >
            <Plus size={16} /> Treino
          </button>
        )}
      </div>

      {!workout ? (
        <EmptyState
          title="Crie o primeiro treino"
          description="Divida o programa em treinos (A, B, C...) e adicione os exercícios de cada um."
          action={canEdit && <Button onClick={handleAddWorkout}>Criar Treino A</Button>}
        />
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-2xl">{workout.name}</h2>
            <div className="flex gap-1">
              {workout.workout_exercises.length > 0 && (
                <Link href={`/treino/${workout.id}`} className={buttonVariants({ size: "sm" })}>
                  <Play size={15} fill="currentColor" /> Treinar
                </Link>
              )}
              {canEdit && (
                <>
                  <Button variant="ghost" size="icon-sm" aria-label="Renomear treino" onClick={() => setRenaming(workout.name)}>
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Apagar treino"
                    onClick={() =>
                      confirm(`Apagar ${workout.name} e seus exercícios?`) &&
                      run(() => deleteWorkout(workout.id), `${workout.name} apagado`)
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>

          {workout.workout_exercises.length === 0 && (
            <p className="rounded-theme border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {canEdit ? "Nenhum exercício ainda. Toque em “Adicionar exercício”." : "Nenhum exercício neste treino."}
            </p>
          )}

          <ol className="space-y-2.5">
            {workout.workout_exercises.map((we, i) => (
              <li key={we.id}>
                <Card className="flex items-center gap-3 p-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-accent-soft font-display text-lg text-accent">
                    {i + 1}
                  </span>
                  <button
                    className="min-w-0 flex-1 text-left disabled:cursor-default"
                    onClick={() => setEditingEx(we)}
                    disabled={!canEdit}
                  >
                    <p className="truncate font-semibold">{we.exercise?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {setsSummary(we)}, descanso {formatRest(we.rest_seconds)}
                    </p>
                    {we.notes && <p className="mt-0.5 truncate text-xs text-accent">{we.notes}</p>}
                  </button>
                  {canEdit && (
                    <div className="flex flex-col">
                      <button
                        aria-label="Mover para cima"
                        disabled={i === 0}
                        onClick={() =>
                          run(() =>
                            reorderRows(
                              "workout_exercises",
                              move(workout.workout_exercises.map((x) => x.id), i, -1)
                            )
                          )
                        }
                        className="rounded p-1 text-muted-foreground hover:text-accent disabled:opacity-25"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        aria-label="Mover para baixo"
                        disabled={i === workout.workout_exercises.length - 1}
                        onClick={() =>
                          run(() =>
                            reorderRows(
                              "workout_exercises",
                              move(workout.workout_exercises.map((x) => x.id), i, 1)
                            )
                          )
                        }
                        className="rounded p-1 text-muted-foreground hover:text-accent disabled:opacity-25"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ol>

          {canEdit && (
            <Button variant="outline" className="w-full" onClick={() => setPickerOpen(true)}>
              <Plus size={18} /> Adicionar exercício
            </Button>
          )}
        </section>
      )}

      {canEdit && (
        <div className="pt-6">
          <Button
            variant="ghost"
            className="w-full text-danger hover:bg-danger/10 hover:text-danger"
            onClick={async () => {
              if (!confirm(`Apagar o programa “${program.name}”? O histórico de treinos continua salvo.`)) return;
              try {
                await deleteProgram(program.id);
                toast("Programa apagado");
                router.push(backHref);
              } catch (e) {
                toast(e instanceof Error ? e.message : "Não deu para apagar", "error");
              }
            }}
          >
            <Trash2 size={16} /> Apagar programa
          </Button>
        </div>
      )}

      {/* Folhas de edição */}
      {workout && (
        <ExercisePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          alreadyIn={workout.workout_exercises.map((we) => we.exercise_id)}
          onPick={async (exercise) => {
            try {
              const count = program.workouts.find((w) => w.id === workout.id)?.workout_exercises.length ?? 0;
              const created = await addWorkoutExercise(workout.id, exercise.id, count);
              setProgram((p) =>
                p && {
                  ...p,
                  workouts: p.workouts.map((w) =>
                    w.id === workout.id ? { ...w, workout_exercises: [...w.workout_exercises, created] } : w
                  ),
                }
              );
            } catch (e) {
              toast(e instanceof Error ? e.message : "Não deu para adicionar", "error");
            }
          }}
        />
      )}

      <ExerciseParamsSheet
        key={editingEx?.id ?? "none"}
        item={editingEx}
        onClose={() => setEditingEx(null)}
        onSave={(patch) => run(() => updateWorkoutExercise(editingEx!.id, patch), "Exercício atualizado").then(() => setEditingEx(null))}
        onDelete={() =>
          run(() => deleteWorkoutExercise(editingEx!.id), "Exercício removido").then(() => setEditingEx(null))
        }
      />

      <ProgramInfoSheet
        key={infoOpen ? "open" : "closed"}
        open={infoOpen}
        name={program.name}
        description={program.description ?? ""}
        onClose={() => setInfoOpen(false)}
        onSave={(name, description) =>
          run(() => updateProgram(program.id, { name, description: description || null }), "Programa salvo").then(() =>
            setInfoOpen(false)
          )
        }
      />

      <Sheet open={renaming !== null} onClose={() => setRenaming(null)} title="Renomear treino">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!workout || !renaming?.trim()) return;
            run(() => renameWorkout(workout.id, renaming.trim())).then(() => setRenaming(null));
          }}
        >
          <Field label="Nome" hint="Ex.: Treino A, Glúteos e posterior, Superiores">
            <Input autoFocus value={renaming ?? ""} onChange={(e) => setRenaming(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full">
            Salvar nome
          </Button>
        </form>
      </Sheet>

      <ChangeRequestSheet
        key={requestOpen ? "open" : "closed"}
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        workoutName={workout?.name}
        onSend={(message) =>
          createChangeRequest(profile.id, message, workout?.id)
            .then(() => {
              toast("Pedido enviado para o admin");
              setRequestOpen(false);
            })
            .catch((e) => toast(e.message, "error"))
        }
      />
    </div>
  );
}

function ExerciseParamsSheet({
  item,
  onClose,
  onSave,
  onDelete,
}: {
  item: WorkoutExercise | null;
  onClose: () => void;
  onSave: (patch: WorkoutExerciseInput) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState<WorkoutExerciseInput | null>(() =>
    item
      ? {
          warmup_sets: item.warmup_sets,
          prep_sets: item.prep_sets,
          working_sets: item.working_sets,
          reps: item.reps,
          rest_seconds: item.rest_seconds,
          notes: item.notes ?? "",
        }
      : null
  );

  if (!item || !form) return null;
  const set = <K extends keyof WorkoutExerciseInput>(k: K, v: WorkoutExerciseInput[K]) =>
    setForm((f) => f && { ...f, [k]: v });

  return (
    <Sheet open onClose={onClose} title={item.exercise?.name ?? "Exercício"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...form, reps: form.reps.trim() || "10", notes: form.notes?.trim() || null });
        }}
      >
        <div className="grid grid-cols-3 gap-2.5">
          <Field label="Aquecimento">
            <Stepper label="séries de aquecimento" value={form.warmup_sets} onChange={(v) => set("warmup_sets", v)} max={10} />
          </Field>
          <Field label="Preparação">
            <Stepper label="séries de preparação" value={form.prep_sets} onChange={(v) => set("prep_sets", v)} max={10} />
          </Field>
          <Field label="Válidas">
            <Stepper label="séries válidas" value={form.working_sets} onChange={(v) => set("working_sets", v)} min={1} max={12} />
          </Field>
        </div>

        <Field label="Repetições" hint="Pode ser faixa ou tempo: 8-12, 15, até a falha, 30s">
          <Input value={form.reps} onChange={(e) => set("reps", e.target.value)} />
        </Field>

        <Field label={`Descanso: ${formatRest(form.rest_seconds)}`}>
          <div className="flex flex-wrap gap-1.5">
            {REST_PRESETS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => set("rest_seconds", s)}
                className={cn(
                  "rounded-pill border px-3.5 py-2 text-sm font-bold kitty:border-2",
                  form.rest_seconds === s
                    ? "border-accent bg-accent text-accent-foreground kitty:border-outline"
                    : "border-border text-muted-foreground"
                )}
              >
                {formatRest(s)}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Observações" hint="Aparece durante o treino. Ex.: pausa de 2s em cima, pegada aberta">
          <Textarea value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} className="min-h-20" />
        </Field>

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => confirm("Tirar este exercício do treino?") && onDelete()}
          >
            <Trash2 size={16} /> Remover
          </Button>
          <Button type="submit" className="flex-1">
            Salvar
          </Button>
        </div>
      </form>
    </Sheet>
  );
}

function ProgramInfoSheet({
  open,
  name,
  description,
  onClose,
  onSave,
}: {
  open: boolean;
  name: string;
  description: string;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}) {
  const [n, setN] = useState(name);
  const [d, setD] = useState(description);

  return (
    <Sheet open={open} onClose={onClose} title="Editar programa">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (n.trim()) onSave(n.trim(), d.trim());
        }}
      >
        <Field label="Nome">
          <Input value={n} onChange={(e) => setN(e.target.value)} />
        </Field>
        <Field label="Descrição (opcional)">
          <Textarea value={d} onChange={(e) => setD(e.target.value)} placeholder="Objetivo, frequência, observações..." />
        </Field>
        <Button type="submit" className="w-full">
          Salvar
        </Button>
      </form>
    </Sheet>
  );
}

export function ChangeRequestSheet({
  open,
  onClose,
  onSend,
  workoutName,
}: {
  open: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void> | void;
  workoutName?: string;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title="Pedir ajuste">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (message.trim().length < 5) return;
          setSending(true);
          await onSend(message.trim());
          setSending(false);
        }}
      >
        <p className="text-sm text-muted-foreground">
          {workoutName ? `Sobre o ${workoutName}. ` : ""}Conte o que quer mudar: trocar exercício, aumentar carga,
          dor em algum movimento...
        </p>
        <Textarea
          autoFocus
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex.: a cadeira abdutora está sempre ocupada, dá pra trocar por abdução na polia?"
        />
        <Button type="submit" className="w-full" loading={sending} disabled={message.trim().length < 5}>
          Enviar pedido
        </Button>
      </form>
    </Sheet>
  );
}
