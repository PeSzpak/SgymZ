"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { listUsers } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import type { User } from "@/types/database";

const STATUS = {
  approved: { label: "Ativo", tone: "success" },
  pending: { label: "Aguardando", tone: "accent" },
  rejected: { label: "Bloqueado", tone: "danger" },
} as const;

export default function UsersPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const load = useCallback(() => listUsers().then(setUsers), []);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Alunos" subtitle="Toque em alguém para atribuir programas e ver o histórico." />
      {users === null ? (
        <Skeleton className="h-60 rounded-theme-lg" />
      ) : users.length === 0 ? (
        <EmptyState title="Ninguém cadastrado ainda" />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {users.map((u) => (
            <Link key={u.id} href={`/admin/usuarios/${u.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-accent-soft">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-accent-soft font-display text-lg text-accent">
                {u.full_name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.full_name}</p>
                <p className="truncate text-sm text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                {u.is_admin && <Badge tone="mint">Admin</Badge>}
                <Badge tone={STATUS[u.status].tone}>{STATUS[u.status].label}</Badge>
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
