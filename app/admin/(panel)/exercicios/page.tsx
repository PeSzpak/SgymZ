"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { createExercise, deleteExercise, listExercises, updateExercise } from "@/lib/data";
import { MUSCLE_GROUPS } from "@/lib/workout-utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import type { Exercise } from "@/types/database";

type Form = { id?: string; name: string; muscle_group: string; equipment: string; notes: string };
const EMPTY: Form = { name: "", muscle_group: MUSCLE_GROUPS[0], equipment: "", notes: "" };

export default function ExercisesPage() {
  const toast = useToast();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => listExercises().then(setExercises), []);
  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<string, Exercise[]>();
    (exercises ?? [])
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .forEach((e) => {
        const g = e.muscle_group || "Outros";
        map.set(g, [...(map.get(g) ?? []), e]);
      });
    return [...map.entries()];
  }, [exercises, query]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form?.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      muscle_group: form.muscle_group || null,
      equipment: form.equipment.trim() || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (form.id) await updateExercise(form.id, payload);
      else await createExercise(payload);
      toast(form.id ? "Exercício salvo" : "Exercício criado");
      setForm(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Exercícios"
        subtitle={`${exercises?.length ?? "..."} na biblioteca, compartilhada com todos.`}
        action={
          <Button onClick={() => setForm(EMPTY)}>
            <Plus size={18} /> <span className="hidden sm:inline">Novo exercício</span>
          </Button>
        }
      />

      <div className="relative mb-5">
        <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar exercício" className="pl-10" />
      </div>

      {exercises === null ? (
        <Skeleton className="h-80 rounded-theme-lg" />
      ) : (
        <div className="space-y-5">
          {grouped.map(([group, items]) => (
            <section key={group}>
              <h2 className="mb-2 font-display text-xl">{group}</h2>
              <Card className="divide-y divide-border overflow-hidden">
                {items.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() =>
                      setForm({
                        id: ex.id,
                        name: ex.name,
                        muscle_group: ex.muscle_group ?? "",
                        equipment: ex.equipment ?? "",
                        notes: ex.notes ?? "",
                      })
                    }
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent-soft"
                  >
                    <span className="min-w-0 flex-1 truncate font-semibold">{ex.name}</span>
                    {ex.equipment && <Badge tone="muted">{ex.equipment}</Badge>}
                  </button>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      <Sheet open={!!form} onClose={() => setForm(null)} title={form?.id ? "Editar exercício" : "Novo exercício"}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Nome">
              <Input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Grupo muscular">
                <Select value={form.muscle_group} onChange={(e) => setForm({ ...form, muscle_group: e.target.value })}>
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Equipamento">
                <Input
                  value={form.equipment}
                  onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                  placeholder="Halter, polia..."
                />
              </Field>
            </div>
            <Field label="Dicas de execução (opcional)">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              {form.id && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  onClick={async () => {
                    if (!confirm("Apagar este exercício? Ele sai de todos os treinos que o usam.")) return;
                    try {
                      await deleteExercise(form.id!);
                      toast("Exercício apagado");
                      setForm(null);
                      load();
                    } catch (err) {
                      toast(err instanceof Error ? err.message : "Erro", "error");
                    }
                  }}
                >
                  Apagar
                </Button>
              )}
              <Button type="submit" className="flex-1" loading={saving}>
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Sheet>
    </>
  );
}
