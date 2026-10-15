"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Dumbbell } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useProfile } from "@/components/profile-gate";
import { createClient } from "@/lib/supabase/client";
import { listChangeRequests, listUsers } from "@/lib/data";
import { firstName, relativeDay } from "@/lib/workout-utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { ChangeRequest, User, WorkoutLog } from "@/types/database";

export default function AdminDashboard() {
  const { profile } = useProfile();
  const [users, setUsers] = useState<User[] | null>(null);
  const [recent, setRecent] = useState<(WorkoutLog & { user: { full_name: string } })[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [weekAgo] = useState(() => Date.now() - 7 * 86400000);

  useEffect(() => {
    listUsers().then(setUsers);
    listChangeRequests().then((r) => setRequests(r.filter((x) => x.status === "pending")));
    createClient()
      .from("workout_logs")
      .select("*, user:users(full_name)")
      .order("completed_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setRecent((data as typeof recent) ?? []));
  }, []);

  const students = (users ?? []).filter((u) => !u.is_admin);
  const activeThisWeek = new Set(recent.filter((l) => +new Date(l.completed_at) > weekAgo).map((l) => l.user_id)).size;

  const stats = [
    { label: "alunos", value: students.length, href: "/admin/usuarios" },
    { label: "treinaram nos últimos 7 dias", value: activeThisWeek, href: "/admin/usuarios" },
    { label: "pedidos esperando resposta", value: requests.length, href: "/admin/pedidos" },
  ];

  return (
    <>
      <PageHeader title={`Olá, ${firstName(profile.full_name)}`} subtitle="O que está acontecendo com seus alunos." />

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-4 transition-colors hover:border-accent">
              {users === null ? (
                <Skeleton className="h-9 w-12" />
              ) : (
                <p className="font-display text-4xl leading-none text-accent">{s.value}</p>
              )}
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      {requests.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-2.5 font-display text-2xl">Pedidos novos</h2>
          <ul className="space-y-2">
            {requests.slice(0, 3).map((r) => (
              <li key={r.id}>
                <Link href="/admin/pedidos">
                  <Card className="flex items-center gap-3 p-4 hover:border-accent">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {r.user?.full_name}
                        {r.workout?.name && <span className="font-normal text-muted-foreground">, sobre {r.workout.name}</span>}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">{r.message}</p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-7">
        <h2 className="mb-2.5 font-display text-2xl">Treinos recentes</h2>
        {recent.length === 0 ? (
          <p className="rounded-theme border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum treino finalizado ainda. Assim que alguém terminar um treino, ele aparece aqui.
          </p>
        ) : (
          <Card className="divide-y divide-border">
            {recent.map((l) => (
              <Link key={l.id} href={`/admin/usuarios/${l.user_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{l.user?.full_name}</p>
                  <p className="truncate text-sm text-muted-foreground">{l.workout_name}</p>
                </div>
                <Badge tone="muted">{relativeDay(l.completed_at)}</Badge>
              </Link>
            ))}
          </Card>
        )}
      </section>

      <div className="mt-7 grid gap-2 sm:grid-cols-2">
        <Link href="/admin/programas" className={cn(buttonVariants(), "w-full")}>
          Montar um programa
        </Link>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
          <Dumbbell size={18} /> Meus próprios treinos
        </Link>
      </div>
    </>
  );
}
