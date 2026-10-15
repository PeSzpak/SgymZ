"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { NewProgramSheet } from "@/components/new-program-sheet";
import { useProfile } from "@/components/profile-gate";
import { listAllPrograms } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";

type Row = Awaited<ReturnType<typeof listAllPrograms>>[number];

export default function AdminProgramsPage() {
  const router = useRouter();
  const toast = useToast();
  const { profile } = useProfile();
  const [programs, setPrograms] = useState<Row[] | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => listAllPrograms().then(setPrograms), []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Programas"
        subtitle="Monte aqui e atribua na página de cada aluno."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={18} /> <span className="hidden sm:inline">Novo programa</span>
          </Button>
        }
      />

      {programs === null ? (
        <Skeleton className="h-48 rounded-theme-lg" />
      ) : programs.length === 0 ? (
        <EmptyState
          title="Nenhum programa ainda"
          description="Comece de um modelo pronto e ajuste do seu jeito."
          action={<Button onClick={() => setCreating(true)}>Criar programa</Button>}
        />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {programs.map((p) => (
            <Link key={p.id} href={`/admin/programas/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent-soft">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.workouts[0]?.count ?? 0} treinos, {p.user_programs[0]?.count ?? 0} alunos
                </p>
              </div>
              {p.created_by !== profile.id && <Badge tone="mint">Do aluno</Badge>}
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}

      <NewProgramSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(program) => {
          setCreating(false);
          toast("Programa criado!");
          router.push(`/admin/programas/${program.id}`);
        }}
      />
    </>
  );
}
