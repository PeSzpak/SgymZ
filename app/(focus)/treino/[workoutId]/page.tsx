"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Minus, Plus, SkipForward, TrendingUp, X } from "lucide-react";
import { useProfile } from "@/components/profile-gate";
import { getWorkout, lastSetsByExercise, saveWorkoutLog, type SessionSet } from "@/lib/data";
import { formatClock, formatDuration, formatKg, formatRest } from "@/lib/workout-utils";
import { setsSummary } from "@/components/program-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { Sheet } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/input";
import { EmptyState, PageLoader, ProgressRing } from "@/components/ui/misc";
import { ThemeMark } from "@/components/theme-mark";
import { Confetti } from "@/components/confetti";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ExerciseLog, SetType, WorkoutExercise, WorkoutProgram, WorkoutWithExercises } from "@/types/database";

interface SetState {
  type: SetType;
  number: number;
  weight: number;
  reps: number;
  done: boolean;
}

interface Draft {
  startedAt: string;
  sets: Record<string, SetState[]>;
}

const SET_LABEL: Record<SetType, string> = { warmup: "A", prep: "P", working: "" };
const SET_NAME: Record<SetType, string> = { warmup: "Aquecimento", prep: "Preparação", working: "Válida" };

function parseReps(reps: string) {
  const nums = reps.match(/\d+/g)?.map(Number) ?? [];
  return nums.length ? Math.max(...nums) : 10;
}

function buildSets(we: WorkoutExercise, last: ExerciseLog[] = []): SetState[] {
  const list: SetState[] = [];
  const add = (type: SetType, count: number) => {
    for (let i = 1; i <= count; i++) {
      const prev = last.find((l) => l.set_type === type && l.set_number === i) ?? last.filter((l) => l.set_type === type).at(-1);
      list.push({
        type,
        number: i,
        weight: prev ? Number(prev.weight) : 0,
        reps: prev ? prev.reps : parseReps(we.reps),
        done: false,
      });
    }
  };
  add("warmup", we.warmup_sets);
  add("prep", we.prep_sets);
  add("working", we.working_sets);
  return list;
}

/** Bipe curto no fim do descanso (sem arquivos de áudio) */
function beep() {
  try {
    const ctx = new AudioContext();
    [0, 0.18, 0.36].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = t === 0.36 ? 1175 : 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.16);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {}
}

export default function WorkoutSessionPage({ params }: { params: Promise<{ workoutId: string }> }) {
  const { workoutId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { profile } = useProfile();
  const draftKey = `sgymz-session-${profile.id}-${workoutId}`;

  const [workout, setWorkout] = useState<(WorkoutWithExercises & { program: WorkoutProgram }) | null | undefined>();
  const [last, setLast] = useState<Record<string, ExerciseLog[]>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [rest, setRest] = useState<{ endsAt: number; total: number; label: string } | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState<{ duration: number; sets: number; volume: number; improved: string[] } | null>(
    null
  );

  // Carrega treino + últimas cargas, e retoma o rascunho salvo se existir
  useEffect(() => {
    (async () => {
      const w = await getWorkout(workoutId);
      setWorkout(w);
      if (!w) return;
      const lastSets = await lastSetsByExercise(
        profile.id,
        w.workout_exercises.map((we) => we.exercise_id)
      );
      setLast(lastSets);

      let saved: Draft | null = null;
      try {
        saved = JSON.parse(localStorage.getItem(draftKey) ?? "null");
      } catch {}
      const fresh: Draft = {
        startedAt: new Date().toISOString(),
        sets: Object.fromEntries(w.workout_exercises.map((we) => [we.id, buildSets(we, lastSets[we.exercise_id])])),
      };
      // Rascunho antigo (mais de 12h) é descartado
      const usable = saved && Date.now() - +new Date(saved.startedAt) < 12 * 3600_000;
      if (usable && saved) {
        for (const we of w.workout_exercises) saved.sets[we.id] ??= fresh.sets[we.id];
        setDraft(saved);
        toast("Continuando de onde você parou");
      } else {
        setDraft(fresh);
      }
      setOpenId(w.workout_exercises[0]?.id ?? null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId, profile.id]);

  useEffect(() => {
    if (draft && !summary) {
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {}
    }
  }, [draft, draftKey, summary]);

  // Relógio
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  // Fim do descanso: vibra e apita
  const restLeft = rest ? Math.max(0, (rest.endsAt - now) / 1000) : 0;
  const restFired = useRef(false);
  useEffect(() => {
    if (!rest) {
      restFired.current = false;
      return;
    }
    if (restLeft <= 0 && !restFired.current) {
      restFired.current = true;
      navigator.vibrate?.([200, 100, 200]);
      beep();
      setTimeout(() => setRest(null), 1500);
    }
  }, [rest, restLeft]);

  // Mantém a tela acesa durante o treino
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = () =>
      navigator.wakeLock
        ?.request("screen")
        .then((l) => (lock = l))
        .catch(() => {});
    request();
    const onVisible = () => document.visibilityState === "visible" && request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  const exercises = workout?.workout_exercises ?? [];
  const allSets = draft ? Object.values(draft.sets).flat() : [];
  const doneCount = allSets.filter((s) => s.done).length;
  const elapsed = draft ? (now - +new Date(draft.startedAt)) / 1000 : 0;

  const updateSet = useCallback((weId: string, index: number, patch: Partial<SetState>) => {
    setDraft((d) => {
      if (!d) return d;
      const sets = [...d.sets[weId]];
      const prev = sets[index];
      sets[index] = { ...prev, ...patch };
      // Mudou a carga de uma série válida? Leva junto para as próximas ainda não feitas
      if (patch.weight !== undefined && prev.type === "working") {
        for (let i = index + 1; i < sets.length; i++) {
          if (sets[i].type === "working" && !sets[i].done && sets[i].weight === prev.weight) {
            sets[i] = { ...sets[i], weight: patch.weight };
          }
        }
      }
      return { ...d, sets: { ...d.sets, [weId]: sets } };
    });
  }, []);

  const toggleDone = (we: WorkoutExercise, index: number) => {
    const set = draft!.sets[we.id][index];
    const done = !set.done;
    updateSet(we.id, index, { done });
    if (!done) return;

    const sets = draft!.sets[we.id];
    const remaining = sets.filter((s, i) => i !== index && !s.done).length;
    const restSeconds = set.type === "working" ? we.rest_seconds : Math.min(60, Math.round(we.rest_seconds / 2));
    if (remaining > 0) {
      if (restSeconds > 0)
        setRest({ endsAt: Date.now() + restSeconds * 1000, total: restSeconds, label: we.exercise?.name ?? "" });
    } else {
      // Exercício concluído: abre o próximo pendente
      const idx = exercises.findIndex((e) => e.id === we.id);
      const nextEx = exercises.slice(idx + 1).concat(exercises.slice(0, idx)).find((e) =>
        draft!.sets[e.id].some((s) => !s.done)
      );
      setOpenId(nextEx?.id ?? null);
      if (restSeconds > 0 && nextEx)
        setRest({ endsAt: Date.now() + restSeconds * 1000, total: restSeconds, label: nextEx.exercise?.name ?? "" });
    }
  };

  const addSet = (we: WorkoutExercise) =>
    setDraft((d) => {
      if (!d) return d;
      const sets = d.sets[we.id];
      const lastWorking = sets.filter((s) => s.type === "working").at(-1);
      return {
        ...d,
        sets: {
          ...d.sets,
          [we.id]: [
            ...sets,
            {
              type: "working",
              number: (lastWorking?.number ?? 0) + 1,
              weight: lastWorking?.weight ?? 0,
              reps: lastWorking?.reps ?? parseReps(we.reps),
              done: false,
            },
          ],
        },
      };
    });

  const removeLastSet = (we: WorkoutExercise) =>
    setDraft((d) => {
      if (!d) return d;
      const sets = d.sets[we.id];
      if (sets.length <= 1 || sets.at(-1)!.done) return d;
      return { ...d, sets: { ...d.sets, [we.id]: sets.slice(0, -1) } };
    });

  const save = async (difficulty: number | null, notes: string) => {
    if (!workout || !draft) return;
    const sets: SessionSet[] = exercises.flatMap((we) =>
      draft.sets[we.id]
        .filter((s) => s.done)
        .map((s) => ({
          workout_exercise_id: we.id,
          exercise_id: we.exercise_id,
          exercise_name: we.exercise?.name ?? "Exercício",
          set_type: s.type,
          set_number: s.number,
          weight: s.weight,
          reps: s.reps,
        }))
    );
    const duration = Math.round(elapsed);
    await saveWorkoutLog({
      userId: profile.id,
      workoutId: workout.id,
      programId: workout.program_id,
      workoutName: workout.name,
      startedAt: draft.startedAt,
      durationSeconds: duration,
      difficulty,
      notes,
      sets,
    });
    try {
      localStorage.removeItem(draftKey);
    } catch {}

    const improved = exercises
      .filter((we) => {
        const before = Math.max(0, ...(last[we.exercise_id] ?? []).filter((s) => s.set_type === "working").map((s) => Number(s.weight)));
        const nowMax = Math.max(0, ...sets.filter((s) => s.workout_exercise_id === we.id && s.set_type === "working").map((s) => s.weight));
        return before > 0 && nowMax > before;
      })
      .map((we) => we.exercise?.name ?? "");
    setRest(null);
    setFinishing(false);
    setSummary({
      duration,
      sets: sets.filter((s) => s.set_type === "working").length,
      volume: sets.filter((s) => s.set_type === "working").reduce((n, s) => n + s.weight * s.reps, 0),
      improved,
    });
  };

  const quit = () => {
    if (doneCount === 0) {
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      router.back();
      return;
    }
    if (confirm("Sair do treino? Seu progresso fica salvo neste aparelho e você pode continuar depois.")) router.back();
  };

  if (workout === undefined || (workout && !draft)) return <PageLoader label="Preparando treino" />;
  if (workout === null)
    return (
      <div className="p-6">
        <EmptyState
          title="Treino não encontrado"
          action={
            <Link href="/dashboard" className={buttonVariants()}>
              Voltar ao início
            </Link>
          }
        />
      </div>
    );

  if (summary) return <SessionSummary summary={summary} workoutName={workout.name} />;

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-40">
      {/* Topo */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur kitty:border-b-2 kitty:border-outline/10">
        <div className="flex h-16 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={quit} aria-label="Sair do treino">
            <X size={22} />
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-display text-xl leading-none">{workout.name}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground tabular-nums">{formatClock(elapsed)} de treino</p>
          </div>
          <Button size="sm" onClick={() => setFinishing(true)} disabled={doneCount === 0}>
            Finalizar
          </Button>
        </div>
        <div className="-mx-4 h-1 bg-muted">
          <div
            className="h-full bg-accent transition-[width] duration-500"
            style={{ width: `${allSets.length ? (doneCount / allSets.length) * 100 : 0}%` }}
          />
        </div>
      </header>

      {/* Exercícios */}
      <ol className="space-y-3 px-4 pt-4">
        {exercises.map((we, exIndex) => {
          const sets = draft!.sets[we.id];
          const done = sets.filter((s) => s.done).length;
          const complete = done === sets.length;
          const open = openId === we.id;
          const prev = last[we.exercise_id];
          return (
            <li key={we.id}>
              <Card className={cn("overflow-hidden transition-colors", open && "border-accent kitty:border-outline", complete && !open && "opacity-70")}>
                <button
                  onClick={() => setOpenId(open ? null : we.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                  aria-expanded={open}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-pill font-display text-lg",
                      complete ? "bg-accent text-accent-foreground" : "bg-accent-soft text-accent"
                    )}
                  >
                    {complete ? <Check size={20} strokeWidth={3} /> : exIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{we.exercise?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {setsSummary(we)}, descanso {formatRest(we.rest_seconds)}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-muted-foreground">
                    {done}/{sets.length}
                  </span>
                  <ChevronDown size={18} className={cn("shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                </button>

                {open && (
                  <div className="animate-fade-in space-y-2 px-3 pb-4">
                    {we.notes && (
                      <p className="mx-1 rounded-theme bg-accent-soft px-3 py-2 text-sm font-semibold text-accent">{we.notes}</p>
                    )}
                    {prev && (
                      <p className="mx-1 text-xs text-muted-foreground">
                        Última vez:{" "}
                        {prev
                          .filter((s) => s.set_type === "working")
                          .map((s) => `${Number(s.weight)}kg × ${s.reps}`)
                          .join(", ")}
                      </p>
                    )}

                    <div className="grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2 px-1 pt-1 text-[11px] font-bold text-muted-foreground">
                      <span>Série</span>
                      <span className="text-center">Carga (kg)</span>
                      <span className="text-center">Reps</span>
                      <span />
                    </div>

                    {sets.map((s, i) => (
                      <div
                        key={i}
                        className={cn(
                          "grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2 rounded-theme px-1 py-1 transition-colors",
                          s.done && "bg-accent-soft"
                        )}
                      >
                        <span
                          title={SET_NAME[s.type]}
                          className={cn(
                            "text-center font-display text-lg",
                            s.type === "working" ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {SET_LABEL[s.type]}
                          {s.number}
                        </span>
                        <Stepper
                          compact
                          label={`carga da série ${s.number}`}
                          value={s.weight}
                          step={s.weight >= 20 ? 2 : 1}
                          max={999}
                          onChange={(v) => updateSet(we.id, i, { weight: v })}
                        />
                        <Stepper
                          compact
                          label={`repetições da série ${s.number}`}
                          value={s.reps}
                          max={200}
                          onChange={(v) => updateSet(we.id, i, { reps: Math.round(v) })}
                        />
                        <button
                          onClick={() => toggleDone(we, i)}
                          aria-label={s.done ? "Desmarcar série" : "Marcar série como feita"}
                          aria-pressed={s.done}
                          className={cn(
                            "grid h-11 w-11 place-items-center rounded-pill border-2 transition-colors",
                            s.done
                              ? "animate-check border-accent bg-accent text-accent-foreground kitty:border-outline"
                              : "border-border text-muted-foreground hover:border-accent hover:text-accent"
                          )}
                        >
                          <Check size={20} strokeWidth={3} />
                        </button>
                      </div>
                    ))}

                    <div className="flex justify-between px-1 pt-1">
                      <button
                        onClick={() => removeLastSet(we)}
                        className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-accent"
                      >
                        <Minus size={14} /> Tirar série
                      </button>
                      <button
                        onClick={() => addSet(we)}
                        className="flex items-center gap-1 text-xs font-bold text-accent"
                      >
                        <Plus size={14} /> Série extra
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      {doneCount > 0 && doneCount === allSets.length && (
        <div className="px-4 pt-5">
          <Button size="lg" className="w-full" onClick={() => setFinishing(true)}>
            Tudo feito! Finalizar treino
          </Button>
        </div>
      )}

      {/* Timer de descanso */}
      {rest && (
        <div className="pb-safe animate-sheet-up fixed inset-x-0 bottom-0 z-30">
          <div className="surface surface-highlight mx-auto flex max-w-2xl items-center gap-4 rounded-b-none p-4">
            <ProgressRing value={restLeft / rest.total} size={84} stroke={8}>
              <span className="font-display text-2xl tabular-nums">{restLeft > 0 ? formatClock(restLeft) : "Vai!"}</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl leading-tight">{restLeft > 0 ? "Descansando" : "Bora pra próxima!"}</p>
              <p className="truncate text-sm text-muted-foreground">A seguir: {rest.label}</p>
              <div className="mt-2 flex gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setRest((r) => r && { ...r, endsAt: Math.max(Date.now(), r.endsAt - 15000) })}
                >
                  −15s
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setRest((r) => r && { ...r, endsAt: r.endsAt + 15000, total: r.total + 15 })}>
                  +15s
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setRest(null)}>
                  <SkipForward size={15} /> Pular
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FinishSheet
        open={finishing}
        onClose={() => setFinishing(false)}
        doneCount={doneCount}
        total={allSets.length}
        elapsed={elapsed}
        onSave={async (difficulty, notes) => {
          try {
            await save(difficulty, notes);
          } catch (e) {
            toast(e instanceof Error ? e.message : "Não deu para salvar. Tente de novo.", "error");
          }
        }}
      />
    </div>
  );
}

function FinishSheet({
  open,
  onClose,
  doneCount,
  total,
  elapsed,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  doneCount: number;
  total: number;
  elapsed: number;
  onSave: (difficulty: number | null, notes: string) => Promise<void>;
}) {
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const labels = ["Leve", "Tranquilo", "No ponto", "Puxado", "Destruidor"];

  return (
    <Sheet open={open} onClose={onClose} title="Finalizar treino">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-theme bg-muted p-3 text-center">
            <p className="font-display text-3xl">{formatDuration(elapsed)}</p>
            <p className="text-xs font-semibold text-muted-foreground">duração</p>
          </div>
          <div className="rounded-theme bg-muted p-3 text-center">
            <p className="font-display text-3xl">
              {doneCount}
              <span className="text-lg text-muted-foreground">/{total}</span>
            </p>
            <p className="text-xs font-semibold text-muted-foreground">séries feitas</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Como foi o treino?</p>
          <div className="flex justify-between gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setDifficulty(n === difficulty ? null : n)}
                aria-label={labels[n - 1]}
                aria-pressed={difficulty !== null && n <= difficulty}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-theme py-2 transition-colors",
                  difficulty !== null && n <= difficulty ? "text-accent" : "text-muted-foreground/40"
                )}
              >
                <ThemeMark className={cn("h-7 w-10 transition-transform", difficulty === n && "scale-125")} />
              </button>
            ))}
          </div>
          <p className="mt-1 h-5 text-center text-sm font-bold text-accent">{difficulty ? labels[difficulty - 1] : ""}</p>
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotações (opcional): senti o glúteo, aumentar carga no leg..."
          className="min-h-20"
        />

        {doneCount < total && (
          <p className="text-center text-sm text-muted-foreground">
            Faltaram {total - doneCount} séries. Só as marcadas serão salvas.
          </p>
        )}

        <Button
          size="lg"
          className="w-full"
          loading={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(difficulty, notes);
            setSaving(false);
          }}
        >
          Salvar treino
        </Button>
      </div>
    </Sheet>
  );
}

function SessionSummary({
  summary,
  workoutName,
}: {
  summary: { duration: number; sets: number; volume: number; improved: string[] };
  workoutName: string;
}) {
  useEffect(() => {
    navigator.vibrate?.(80);
  }, []);
  const stats = useMemo(
    () => [
      { label: "duração", value: formatDuration(summary.duration) },
      { label: "séries válidas", value: String(summary.sets) },
      { label: "volume total", value: formatKg(Math.round(summary.volume)) },
    ],
    [summary]
  );

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <Confetti active />
      <ThemeMark className="animate-pop-in h-16 w-24 text-accent" />
      <div>
        <h1 className="font-display text-5xl leading-none">Treino concluído!</h1>
        <p className="mt-2 text-muted-foreground">{workoutName} salvo no seu histórico.</p>
      </div>
      <div className="grid w-full grid-cols-3 gap-2">
        {stats.map((s) => (
          <Card key={s.label} className="p-3">
            <p className="font-display text-2xl leading-tight">{s.value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>
      {summary.improved.length > 0 && (
        <Card highlight className="w-full p-4 text-left">
          <p className="mb-2 flex items-center gap-2 font-display text-xl text-accent">
            <TrendingUp size={20} /> Subiu carga em
          </p>
          <ul className="space-y-1 text-sm font-semibold">
            {summary.improved.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </Card>
      )}
      <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        Voltar ao início
      </Link>
    </div>
  );
}
