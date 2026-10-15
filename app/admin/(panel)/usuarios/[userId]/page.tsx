"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useProfile } from "@/components/profile-gate";
import { HistoryView } from "@/components/history-view";
import {
  assignProgram,
  getUser,
  listAllPrograms,
  listAssignedPrograms,
  unassignProgram,
  updateUserAdmin,
  type AssignedProgram,
} from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type { User, WorkoutProgram } from "@/types/database";

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { profile } = useProfile();
  const toast = useToast();
  const [user, setUser] = useState<User | null | undefined>();
  const [assigned, setAssigned] = useState<AssignedProgram[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [toAssign, setToAssign] = useState("");

  const load = useCallback(async () => {
    const [u, a, p] = await Promise.all([getUser(userId), listAssignedPrograms(userId), listAllPrograms()]);
    setUser(u);
    setAssigned(a);
    setPrograms(p);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (user === undefined) return <PageLoader />;
  if (!user) return <p>Usuário não encontrado.</p>;

  const isSelf = user.id === profile.id;
  const available = programs.filter((p) => !assigned.some((a) => a.program_id === p.id));

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast(msg);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Algo deu errado", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/usuarios" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-accent">
          <ArrowLeft size={16} /> Alunos
        </Link>
        <h1 className="font-display text-4xl leading-none md:text-5xl">{user.full_name}</h1>
        <p className="mt-2 text-muted-foreground">
          {user.email}, desde {new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {user.is_admin && <Badge tone="mint">Admin</Badge>}
          <Badge tone="muted">Meta: {user.weekly_goal}x por semana</Badge>
        </div>
      </div>

      <section>
        <h2 className="mb-2.5 font-display text-2xl">Programas</h2>
        <Card className="divide-y divide-border">
          {assigned.length === 0 && <p className="p-4 text-sm text-muted-foreground">Nenhum programa atribuído.</p>}
          {assigned.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/admin/programas/${a.program_id}`} className="min-w-0 flex-1 hover:text-accent">
                <p className="truncate font-semibold">{a.program.name}</p>
                <p className="text-xs text-muted-foreground">
                  {a.program.created_by === user.id ? "Criado pelo aluno" : "Atribuído por você"}
                  {!a.is_active && ", pausado"}
                </p>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remover atribuição"
                onClick={() =>
                  confirm(`Tirar “${a.program.name}” de ${user.full_name}?`) &&
                  act(() => unassignProgram(a.id), "Programa removido do aluno")
                }
              >
                <X size={16} />
              </Button>
            </div>
          ))}
          <form
            className="flex gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (toAssign) act(() => assignProgram(user.id, toAssign), "Programa atribuído").then(() => setToAssign(""));
            }}
          >
            <Select value={toAssign} onChange={(e) => setToAssign(e.target.value)} aria-label="Programa para atribuir">
              <option value="">{available.length ? "Escolha um programa..." : "Todos os programas já atribuídos"}</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={!toAssign}>
              <Plus size={18} /> Atribuir
            </Button>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="mb-2.5 font-display text-2xl">Histórico</h2>
        <HistoryView userId={user.id} canDelete={isSelf} />
      </section>

      {!isSelf && (
        <section>
          <h2 className="mb-2.5 font-display text-2xl">Acesso</h2>
          <Card className="flex flex-wrap gap-2 p-4">
            {user.status !== "approved" ? (
              <Button onClick={() => act(() => updateUserAdmin(user.id, { status: "approved" }), "Acesso liberado")}>
                Liberar acesso
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() =>
                  confirm(`Bloquear o acesso de ${user.full_name}?`) &&
                  act(() => updateUserAdmin(user.id, { status: "rejected" }), "Acesso bloqueado")
                }
              >
                Bloquear acesso
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() =>
                confirm(user.is_admin ? `Tirar o admin de ${user.full_name}?` : `Tornar ${user.full_name} admin?`) &&
                act(
                  () => updateUserAdmin(user.id, { is_admin: !user.is_admin }),
                  user.is_admin ? "Agora é aluno" : "Agora é admin"
                )
              }
            >
              {user.is_admin ? "Tirar admin" : "Tornar admin"}
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}
