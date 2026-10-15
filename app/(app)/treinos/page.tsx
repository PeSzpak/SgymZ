"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { useProfile } from "@/components/profile-gate";
import { PageHeader } from "@/components/app-shell";
import { NewProgramSheet } from "@/components/new-program-sheet";
import { listAssignedPrograms, setProgramActive, type AssignedProgram } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function ProgramsPage() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useProfile();
  const [programs, setPrograms] = useState<AssignedProgram[] | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => listAssignedPrograms(profile.id).then(setPrograms), [profile.id]);
  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (p: AssignedProgram) => {
    await setProgramActive(p.id, !p.is_active);
    toast(p.is_active ? "Programa pausado" : "Programa ativado");
    load();
  };

  return (
    <>
      <PageHeader
        title="Meus treinos"
        subtitle="Programas que você montou ou recebeu."
        action={
          <Button onClick={() => setCreating(true)} size="icon" aria-label="Novo programa" className="md:hidden">
            <Plus size={22} />
          </Button>
        }
      />
      <Button onClick={() => setCreating(true)} className="mb-5 hidden md:inline-flex">
        <Plus size={18} /> Novo programa
      </Button>

      {programs === null ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-theme-lg" />
          <Skeleton className="h-28 rounded-theme-lg" />
        </div>
      ) : programs.length === 0 ? (
        <EmptyState
          title="Monte seu primeiro programa"
          description="Comece de um modelo pronto (tem um focado em glúteos) ou do zero."
          action={<Button onClick={() => setCreating(true)}>Criar programa</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {programs.map((p) => {
            const exercises = p.program.workouts.reduce((n, w) => n + w.workout_exercises.length, 0);
            const mine = p.program.created_by === profile.id;
            return (
              <li key={p.id}>
                <Card className={cn("overflow-hidden", !p.is_active && "opacity-60")}>
                  <Link href={`/treinos/${p.program_id}`} className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap gap-1.5">
                        <Badge tone={mine ? "mint" : "accent"}>{mine ? "Criado por você" : "Do admin"}</Badge>
                        {!p.is_active && <Badge tone="muted">Pausado</Badge>}
                      </div>
                      <p className="truncate font-display text-2xl leading-tight">{p.program.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.program.workouts.length} {p.program.workouts.length === 1 ? "treino" : "treinos"},{" "}
                        {exercises} exercícios
                      </p>
                    </div>
                    <ChevronRight className="shrink-0 text-muted-foreground" />
                  </Link>
                  <div className="flex gap-1.5 overflow-x-auto border-t border-border px-4 py-2.5 no-scrollbar">
                    {p.program.workouts.map((w) => (
                      <span key={w.id} className="shrink-0 rounded-pill bg-muted px-2.5 py-1 text-xs font-semibold">
                        {w.name}
                      </span>
                    ))}
                    <button
                      onClick={() => toggle(p)}
                      className="ml-auto shrink-0 text-xs font-bold text-muted-foreground hover:text-accent"
                    >
                      {p.is_active ? "Pausar" : "Ativar"}
                    </button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <NewProgramSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(program) => {
          setCreating(false);
          toast("Programa criado!");
          router.push(`/treinos/${program.id}`);
        }}
      />
    </>
  );
}
