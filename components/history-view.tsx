"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { deleteLog, listLogs } from "@/lib/data";
import { dayKey, formatDuration, formatKg, relativeDay, totalVolume } from "@/lib/workout-utils";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { ThemeMark } from "@/components/theme-mark";
import { ProgressChart } from "@/components/progress-chart";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { WorkoutLog } from "@/types/database";

const DIFFICULTY = ["", "Leve", "Tranquilo", "No ponto", "Puxado", "Destruidor"];

/** Histórico + evolução. Usado pela aluna e pelo admin (somente leitura) */
export function HistoryView({ userId, canDelete = true }: { userId: string; canDelete?: boolean }) {
  const toast = useToast();
  const [logs, setLogs] = useState<WorkoutLog[] | null>(null);
  const [tab, setTab] = useState<"treinos" | "evolucao">("treinos");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<WorkoutLog | null>(null);

  const load = useCallback(() => listLogs(userId, 500).then(setLogs), [userId]);
  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, WorkoutLog[]>();
    (logs ?? []).forEach((l) => {
      const k = dayKey(l.completed_at);
      map.set(k, [...(map.get(k) ?? []), l]);
    });
    return map;
  }, [logs]);

  const calendar = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
    ];
  }, [month]);

  const monthLogs = (logs ?? []).filter(
    (l) => new Date(l.completed_at).getMonth() === month.getMonth() && new Date(l.completed_at).getFullYear() === month.getFullYear()
  );

  if (logs === null)
    return (
      <div className="space-y-3">
        <Skeleton className="h-72 rounded-theme-lg" />
        <Skeleton className="h-20 rounded-theme-lg" />
      </div>
    );

  if (logs.length === 0)
    return (
      <EmptyState
        title="Nenhum treino registrado"
        description="Quando um treino for finalizado, ele aparece aqui com cargas e séries."
      />
    );

  return (
    <div className="space-y-5">
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: "treinos", label: "Treinos" },
          { value: "evolucao", label: "Evolução" },
        ]}
      />

      {tab === "treinos" ? (
        <>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Mês anterior"
                onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              >
                <ChevronLeft size={18} />
              </Button>
              <p className="font-display text-xl capitalize">
                {month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </p>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Próximo mês"
                onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              >
                <ChevronRight size={18} />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                <span key={i} className="pb-1">
                  {d}
                </span>
              ))}
              {calendar.map((d, i) => {
                if (!d) return <span key={i} />;
                const dayLogs = byDay.get(dayKey(d));
                const today = dayKey(d) === dayKey(new Date());
                return (
                  <button
                    key={i}
                    disabled={!dayLogs}
                    onClick={() => dayLogs && setSelected(dayLogs[0])}
                    className={cn(
                      "relative grid aspect-square place-items-center rounded-pill text-sm font-semibold",
                      dayLogs
                        ? "bg-accent text-accent-foreground kitty:border-2 kitty:border-outline"
                        : "text-foreground/70",
                      today && !dayLogs && "ring-2 ring-accent/50"
                    )}
                    aria-label={`${d.getDate()}${dayLogs ? `: ${dayLogs.map((l) => l.workout_name).join(", ")}` : ""}`}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-sm font-semibold text-muted-foreground">
              {monthLogs.length} {monthLogs.length === 1 ? "treino" : "treinos"} neste mês
            </p>
          </Card>

          <ul className="space-y-2.5">
            {logs.slice(0, 60).map((l) => (
              <li key={l.id}>
                <button onClick={() => setSelected(l)} className="w-full text-left">
                  <Card className="flex items-center gap-3 p-4 transition-colors hover:border-accent">
                    <div className="w-14 shrink-0 text-center">
                      <p className="font-display text-2xl leading-none">{new Date(l.completed_at).getDate()}</p>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        {new Date(l.completed_at).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{l.workout_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(l.duration_seconds)}, {formatKg(Math.round(totalVolume(l)))}
                      </p>
                    </div>
                    {l.difficulty_rating && (
                      <span className="flex text-accent" aria-label={DIFFICULTY[l.difficulty_rating]}>
                        {Array.from({ length: l.difficulty_rating }, (_, i) => (
                          <ThemeMark key={i} className="-ml-1 h-3 w-4" />
                        ))}
                      </span>
                    )}
                  </Card>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <Evolution logs={logs} />
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.workout_name}>
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {relativeDay(selected.completed_at)},{" "}
              {new Date(selected.completed_at).toLocaleString("pt-BR", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
              . {formatDuration(selected.duration_seconds)}
              {selected.difficulty_rating ? `, ${DIFFICULTY[selected.difficulty_rating].toLowerCase()}` : ""}.
            </p>
            {selected.notes && <p className="rounded-theme bg-accent-soft p-3 text-sm font-semibold">{selected.notes}</p>}
            {Object.entries(
              (selected.exercise_logs ?? [])
                .slice()
                .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
                .reduce<Record<string, typeof selected.exercise_logs>>((acc, s) => {
                  (acc[s.exercise_name] ??= []).push(s);
                  return acc;
                }, {})
            ).map(([name, sets]) => (
              <div key={name}>
                <p className="mb-1.5 font-semibold">{name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {sets!.map((s) => (
                    <span
                      key={s.id}
                      className={cn(
                        "rounded-pill px-2.5 py-1 text-xs font-bold tabular-nums",
                        s.set_type === "working" ? "bg-accent-soft text-accent" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {Number(s.weight)}kg × {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {canDelete && (
              <Button
                variant="ghost"
                className="w-full text-danger hover:bg-danger/10 hover:text-danger"
                onClick={async () => {
                  if (!confirm("Apagar este treino do histórico?")) return;
                  await deleteLog(selected.id);
                  setSelected(null);
                  toast("Treino apagado do histórico");
                  load();
                }}
              >
                <Trash2 size={16} /> Apagar do histórico
              </Button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Evolution({ logs }: { logs: WorkoutLog[] }) {
  const exercises = useMemo(() => {
    const count = new Map<string, number>();
    logs.forEach((l) =>
      new Set((l.exercise_logs ?? []).filter((s) => s.set_type === "working").map((s) => s.exercise_name)).forEach((n) =>
        count.set(n, (count.get(n) ?? 0) + 1)
      )
    );
    return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [logs]);
  const [exercise, setExercise] = useState(exercises[0] ?? "");

  const points = useMemo(
    () =>
      logs
        .slice()
        .reverse()
        .map((l) => {
          const sets = (l.exercise_logs ?? []).filter((s) => s.exercise_name === exercise && s.set_type === "working");
          if (!sets.length) return null;
          const best = sets.reduce((a, b) => (Number(b.weight) > Number(a.weight) || (Number(b.weight) === Number(a.weight) && b.reps > a.reps) ? b : a));
          return {
            date: l.completed_at,
            value: Number(best.weight),
            detail: sets.map((s) => `${Number(s.weight)}×${s.reps}`).join(", "),
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null),
    [logs, exercise]
  );

  if (!exercises.length) return <EmptyState title="Ainda sem dados de carga" />;

  const first = points[0]?.value ?? 0;
  const best = Math.max(...points.map((p) => p.value));
  const lastV = points.at(-1)?.value ?? 0;

  return (
    <div className="space-y-4">
      <Select value={exercise} onChange={(e) => setExercise(e.target.value)} aria-label="Exercício">
        {exercises.map((n) => (
          <option key={n}>{n}</option>
        ))}
      </Select>

      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "recorde", value: formatKg(best) },
          { label: "atual", value: formatKg(lastV) },
          {
            label: "desde o início",
            value: `${lastV - first >= 0 ? "+" : ""}${(lastV - first).toLocaleString("pt-BR")} kg`,
          },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <p className="font-display text-2xl leading-tight">{s.value}</p>
            <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <p className="mb-1 text-sm font-semibold text-muted-foreground">Maior carga em cada treino</p>
        {points.length > 1 ? (
          <ProgressChart key={exercise} points={points} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Faça este exercício mais uma vez para ver a linha de evolução.
          </p>
        )}
      </Card>
    </div>
  );
}
