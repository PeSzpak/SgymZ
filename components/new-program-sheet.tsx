"use client";

import { useState } from "react";
import { FilePlus2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createProgram } from "@/lib/data";
import { TEMPLATES, createFromTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";
import type { WorkoutProgram } from "@/types/database";

/** Criar programa em branco ou a partir de um modelo pronto */
export function NewProgramSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (program: WorkoutProgram) => void;
}) {
  const toast = useToast();
  const [templateId, setTemplateId] = useState<string>("blank");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const template = TEMPLATES.find((t) => t.id === templateId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || template?.name;
    if (!finalName) return;
    setSaving(true);
    try {
      const program = template ? await createFromTemplate(template, finalName) : await createProgram(finalName);
      onCreated(program);
      setName("");
      setTemplateId("blank");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não deu para criar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Novo programa">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Começar de</p>
          <button
            type="button"
            onClick={() => setTemplateId("blank")}
            className={cn(
              "flex w-full items-center gap-3 rounded-theme border p-3 text-left kitty:border-2",
              templateId === "blank" ? "border-accent bg-accent-soft" : "border-border"
            )}
          >
            <FilePlus2 size={20} className="text-accent" />
            <span className="font-semibold">Em branco</span>
          </button>
          {TEMPLATES.map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={cn(
                "w-full rounded-theme border p-3 text-left kitty:border-2",
                templateId === t.id ? "border-accent bg-accent-soft" : "border-border"
              )}
            >
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <p className="mt-1 text-xs font-semibold text-accent">{t.workouts.map((w) => w.name.split(":")[0]).join(" / ")}</p>
            </button>
          ))}
        </div>

        <Field label="Nome do programa">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={template?.name ?? "Ex.: Projeto verão"} />
        </Field>

        <Button type="submit" className="w-full" loading={saving} disabled={!name.trim() && !template}>
          Criar programa
        </Button>
      </form>
    </Sheet>
  );
}
