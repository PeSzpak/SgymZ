"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Play, Shield, Timer, Trophy } from "lucide-react";
import { useProfile } from "@/components/profile-gate";
import { listAssignedPrograms, listLogs, type AssignedProgram } from "@/lib/data";
import {
  dayKey,
  firstName,
  formatDuration,
  greeting,
  nextWorkoutOf,
  relativeDay,
  startOfWeek,
  totalVolume,
  weekStreak,
} from "@/lib/workout-utils";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ProgressRing, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { WorkoutLog } from "@/types/database";

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];

export default function TodayPage() {
  const { profile } = useProfile();
  const [programs, setPrograms] = useState<AssignedProgram[] | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    Promise.all([listAssignedPrograms(profile.id), listLogs(profile.id, 120)]).then(([p, l]) => {
      setPrograms(p);
      setLogs(l);
    });
  }, [profile.id]);

  const active = useMemo(() => (programs ?? []).filter((p) => p.is_active), [programs]);

  // Programa em uso = o do último treino feito; senão o mais recente atribuído
  const current = useMemo(() => {
    const lastProgramId = logs.find((l) => active.some((p) => p.program_id === l.program_id))?.program_id;
    return active.find((p) => p.program_id === lastProgramId) ?? active[0];
  }, [active, logs]);

  const next = current ? nextWorkoutOf(current.program, logs) : null;

  const week = useMemo(() => {
    const start = startOfWeek();
    const done = new Set(logs.filter((l) => new Date(l.completed_at) >= start).map((l) => dayKey(l.completed_at)));
    const days = WEEKDAYS.map((label, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return { label, done: done.has(dayKey(d)), today: dayKey(d) === dayKey(new Date()) };
    });
    return { days, count: logs.filter((l) => new Date(l.completed_at) >= start).length };
  }, [logs]);

  const streak = weekStreak(logs, profile.weekly_goal);
  const trainedToday = logs[0] && dayKey(logs[0].completed_at) === dayKey(new Date());
  const lastLog = logs[0];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-muted-foreground capitalize">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="mt-1 font-display text-4xl leading-none md:text-5xl">
          {greeting()}, {firstName(profile.full_name)}
        </h1>
      </div>

      {/* Treino de hoje */}
      {programs === null ? (
        <Skeleton className="h-52 rounded-theme-lg" />
      ) : next && current ? (
        <Card highlight className="overflow-hidden p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted-foreground">
                {trainedToday ? "Treino de hoje feito! Próximo da fila:" : "Seu treino de hoje"}
              </p>
              <h2 className="mt-1 font-display text-3xl leading-tight text-accent">{next.name}</h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">{current.program.name}</p>
            </div>
            <Badge tone="mint" className="mt-1">
              {next.workout_exercises.length} exercícios
            </Badge>
          </div>

          <ul className="my-4 flex flex-wrap gap-1.5">
            {next.workout_exercises.slice(0, 6).map((we) => (
              <li
                key={we.id}
                className="rounded-pill bg-muted px-2.5 py-1 text-xs font-semibold text-foreground/80 kitty:bg-background-2"
              >
                {we.exercise?.name}
              </li>
            ))}
            {next.workout_exercises.length > 6 && (
              <li className="px-1 py-1 text-xs font-semibold text-muted-foreground">
                +{next.workout_exercises.length - 6}
              </li>
            )}
          </ul>

          <Link href={`/treino/${next.id}`} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
            <Play size={20} fill="currentColor" /> Começar treino
          </Link>

          {current.program.workouts.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {current.program.workouts
                .filter((w) => w.id !== next.id && w.workout_exercises.length)
                .map((w) => (
                  <Link
                    key={w.id}
                    href={`/treino/${w.id}`}
                    className="shrink-0 rounded-pill border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-accent hover:text-accent kitty:border-2"
                  >
                    Fazer {w.name}
                  </Link>
                ))}
            </div>
          )}
        </Card>
      ) : (
        <EmptyState
          title={active.length ? "Seu programa ainda está vazio" : "Nenhum treino por aqui ainda"}
          description={
            active.length
              ? "Adicione exercícios aos treinos do programa para começar."
              : "Monte seu primeiro programa ou peça um para o seu admin."
          }
          action={
            <Link href="/treinos" className={buttonVariants()}>
              {active.length ? "Abrir meus treinos" : "Montar meu treino"}
            </Link>
          }
        />
      )}

      {/* Semana */}
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <Card className="flex flex-col items-center justify-center p-4">
          <ProgressRing value={week.count / profile.weekly_goal} size={92} stroke={9}>
            <div className="text-center leading-none">
              <span className="font-display text-3xl">{week.count}</span>
              <span className="text-sm text-muted-foreground">/{profile.weekly_goal}</span>
            </div>
          </ProgressRing>
          <p className="mt-2 text-xs font-bold text-muted-foreground">meta da semana</p>
        </Card>

        <Card className="flex flex-col justify-between gap-3 p-4">
          <div className="flex justify-between">
            {week.days.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className={cn("text-[11px] font-bold", d.today ? "text-accent" : "text-muted-foreground")}>
                  {d.label}
                </span>
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-pill border text-accent-foreground transition-colors",
                    d.done
                      ? "border-accent bg-accent kitty:border-outline kitty:border-2"
                      : d.today
                        ? "border-dashed border-accent"
                        : "border-border"
                  )}
                >
                  {d.done && <Flame size={15} fill="currentColor" />}
                </span>
              </div>
            ))}
          </div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Trophy size={16} className="text-accent" />
            {streak > 0
              ? `${streak} ${streak === 1 ? "semana" : "semanas"} seguidas batendo a meta`
              : week.count >= profile.weekly_goal
                ? "Meta da semana batida!"
                : `Faltam ${profile.weekly_goal - week.count} treinos para a meta`}
          </p>
        </Card>
      </div>

      {/* Último treino */}
      {lastLog && (
        <Link href="/historico" className="block">
          <Card className="flex items-center gap-4 p-4 transition-colors hover:border-accent">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-theme bg-accent-soft text-accent">
              <Timer size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-muted-foreground">Último treino: {relativeDay(lastLog.completed_at).toLowerCase()}</p>
              <p className="truncate font-semibold">{lastLog.workout_name}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-bold">{formatDuration(lastLog.duration_seconds)}</p>
              <p className="text-muted-foreground">{Math.round(totalVolume(lastLog)).toLocaleString("pt-BR")} kg</p>
            </div>
          </Card>
        </Link>
      )}

      {profile.is_admin && (
        <Link href="/admin/dashboard" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
          <Shield size={18} /> Abrir painel do admin
        </Link>
      )}
    </div>
  );
}
