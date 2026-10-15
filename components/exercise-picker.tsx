"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { createExercise, listExercises } from "@/lib/data";
import { MUSCLE_GROUPS } from "@/lib/workout-utils";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/types/database";

/** Busca na biblioteca e devolve o exercício escolhido (ou cria um novo na hora) */
export function ExercisePicker({
  open,
  onClose,
  onPick,
  alreadyIn = [],
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => Promise<void> | void;
  alreadyIn?: string[];
}) {
  const toast = useToast();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState(MUSCLE_GROUPS[0]);
  const [justAdded, setJustAdded] = useState<string[]>([]);

  useEffect(() => {
    if (open && !exercises) listExercises().then(setExercises);
    if (open) setJustAdded([]);
  }, [open, exercises]);

  const groups = useMemo(
    () => Array.from(new Set((exercises ?? []).map((e) => e.muscle_group).filter(Boolean))) as string[],
    [exercises]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return (exercises ?? []).filter(
      (e) =>
        (!group || e.muscle_group === group) &&
        (!q || e.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(q))
    );
  }, [exercises, query, group]);

  const pick = async (exercise: Exercise) => {
    setAdding(exercise.id);
    try {
      await onPick(exercise);
      setJustAdded((prev) => [...prev, exercise.id]);
    } finally {
      setAdding(null);
    }
  };

  const createAndPick = async () => {
    const name = query.trim();
    if (!name) return;
    try {
      const created = await createExercise({ name, muscle_group: newGroup, equipment: null, notes: null });
      setExercises((prev) => [...(prev ?? []), created]);
      setCreating(false);
      await pick(created);
      toast(`${name} criado e adicionado`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Não deu para criar o exercício", "error");
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Adicionar exercício">
      <div className="sticky top-0 z-10 -mx-5 space-y-3 bg-card px-5 pb-3">
        <div className="relative">
          <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar: agachamento, abdução..."
            className="pl-10"
          />
        </div>
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 no-scrollbar">
          {[null, ...groups].map((g) => (
            <button
              key={g ?? "all"}
              onClick={() => setGroup(g)}
              className={cn(
                "shrink-0 rounded-pill border px-3 py-1.5 text-xs font-bold transition-colors kitty:border-2",
                group === g
                  ? "border-accent bg-accent text-accent-foreground kitty:border-outline"
                  : "border-border text-muted-foreground"
              )}
            >
              {g ?? "Todos"}
            </button>
          ))}
        </div>
      </div>

      <ul className="divide-y divide-border">
        {filtered.map((e) => {
          const added = justAdded.includes(e.id) || alreadyIn.includes(e.id);
          return (
            <li key={e.id}>
              <button
                onClick={() => pick(e)}
                disabled={adding === e.id}
                className="flex w-full items-center gap-3 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[e.muscle_group, e.equipment].filter(Boolean).join(", ")}
                  </p>
                </div>
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-pill border transition-colors kitty:border-2",
                    added ? "border-accent bg-accent text-accent-foreground kitty:border-outline" : "border-border text-accent"
                  )}
                >
                  {added ? <Check size={17} className="animate-check" /> : <Plus size={17} />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {exercises && (
        <div className="mt-2 rounded-theme border border-dashed border-border p-4">
          {creating ? (
            <div className="space-y-3">
              <Field label="Nome do exercício">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: Glúteo no cabo" />
              </Field>
              <Field label="Grupo muscular">
                <Select value={newGroup} onChange={(e) => setNewGroup(e.target.value)}>
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </Select>
              </Field>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setCreating(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={createAndPick} disabled={!query.trim()}>
                  Criar e adicionar
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="w-full text-sm font-semibold text-muted-foreground">
              Não achou? <span className="text-accent">Criar {query.trim() ? `“${query.trim()}”` : "um exercício novo"}</span>
            </button>
          )}
        </div>
      )}

      <Button variant="secondary" className="sticky bottom-0 mt-4 w-full" onClick={onClose}>
        Pronto
      </Button>
    </Sheet>
  );
}
