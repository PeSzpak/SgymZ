"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { listChangeRequests, resolveChangeRequest } from "@/lib/data";
import { relativeDay } from "@/lib/workout-utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type { ChangeRequest } from "@/types/database";

export default function RequestsPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<ChangeRequest[] | null>(null);
  const [filter, setFilter] = useState<"pending" | "resolved">("pending");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const load = useCallback(() => listChangeRequests().then(setRequests), []);
  useEffect(() => {
    load();
  }, [load]);

  const shown = (requests ?? []).filter((r) => r.status === filter);

  return (
    <>
      <PageHeader title="Pedidos" subtitle="Ajustes que os alunos pediram nos treinos." />
      <Segmented
        className="mb-5"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "pending", label: "Esperando" },
          { value: "resolved", label: "Respondidos" },
        ]}
      />
      {requests === null ? (
        <Skeleton className="h-40 rounded-theme-lg" />
      ) : shown.length === 0 ? (
        <EmptyState title={filter === "pending" ? "Nenhum pedido esperando" : "Nenhum pedido respondido ainda"} />
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id}>
              <Card className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/admin/usuarios/${r.user_id}`} className="font-bold hover:text-accent">
                      {r.user?.full_name}
                    </Link>
                    {r.workout?.name && <p className="text-sm text-muted-foreground">Sobre o {r.workout.name}</p>}
                  </div>
                  <Badge tone="muted">{relativeDay(r.created_at)}</Badge>
                </div>
                <p>{r.message}</p>
                {r.status === "resolved" ? (
                  r.admin_response && <p className="rounded-theme bg-accent-soft p-3 text-sm font-semibold">{r.admin_response}</p>
                ) : (
                  <form
                    className="space-y-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await resolveChangeRequest(r.id, answers[r.id]?.trim() ?? "");
                        toast("Pedido respondido");
                        load();
                      } catch (err) {
                        toast(err instanceof Error ? err.message : "Erro", "error");
                      }
                    }}
                  >
                    <Textarea
                      className="min-h-20"
                      placeholder="Resposta (opcional): troquei pela abdução na polia!"
                      value={answers[r.id] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [r.id]: e.target.value }))}
                    />
                    <Button type="submit" size="sm">
                      Marcar como resolvido
                    </Button>
                  </form>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
