"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Shield, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useProfile } from "@/components/profile-gate";
import { useTheme } from "@/hooks/use-theme";
import { listChangeRequests, updateProfile } from "@/lib/data";
import { relativeDay } from "@/lib/workout-utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ChangeRequest, ThemePreference } from "@/types/database";

const THEMES: { id: ThemePreference; name: string; logo: string; colors: string[] }[] = [
  { id: "hellokitty", name: "Hello Kitty", logo: "/hellokitty-logo.png", colors: ["#fff0f4", "#ff5c93", "#9bddc4"] },
  { id: "batman", name: "Batman", logo: "/batmanlogo.png", colors: ["#0e0f12", "#f2c230", "#8a93a3"] },
];

export default function ProfilePage() {
  const { profile, refreshProfile, signOut } = useProfile();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [name, setName] = useState(profile.full_name);
  const [goal, setGoal] = useState(profile.weekly_goal);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);

  useEffect(() => {
    listChangeRequests({ userId: profile.id }).then(setRequests).catch(() => {});
  }, [profile.id]);

  const dirty = name.trim() !== profile.full_name || goal !== profile.weekly_goal;

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile(profile.id, { full_name: name.trim(), weekly_goal: goal });
      await refreshProfile();
      toast("Perfil salvo");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Não deu para salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Perfil" subtitle={profile.email} />

      <div className="space-y-5">
        <section>
          <h2 className="mb-2.5 font-display text-2xl">Tema</h2>
          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                className={cn(
                  "surface flex flex-col items-center gap-2 p-4 transition-transform active:scale-[.98]",
                  theme === t.id ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : "opacity-80"
                )}
              >
                <div className="grid h-16 w-full place-items-center rounded-theme" style={{ background: t.colors[0] }}>
                  <div className="relative h-12 w-16">
                    <Image
                      src={t.logo}
                      alt=""
                      fill
                      sizes="64px"
                      className={cn("object-contain", t.id === "hellokitty" ? "logo-kitty" : "logo-bat")}
                    />
                  </div>
                </div>
                <span className="font-semibold">{t.name}</span>
                <span className="flex gap-1">
                  {t.colors.map((c) => (
                    <span key={c} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: c }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </section>

        <Card className="space-y-4 p-5">
          <Field label="Nome">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Meta de treinos por semana" hint="Usada no anel da tela inicial e na sequência de semanas.">
            <Stepper label="meta semanal" value={goal} min={1} max={7} onChange={setGoal} className="max-w-48" />
          </Field>
          <Button onClick={save} disabled={!dirty || name.trim().length < 2} loading={saving}>
            Salvar alterações
          </Button>
        </Card>

        {requests.length > 0 && (
          <section>
            <h2 className="mb-2.5 font-display text-2xl">Meus pedidos de ajuste</h2>
            <ul className="space-y-2.5">
              {requests.map((r) => (
                <li key={r.id}>
                  <Card className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={r.status === "resolved" ? "success" : "accent"}>
                        {r.status === "resolved" ? "Respondido" : "Aguardando"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{relativeDay(r.created_at)}</span>
                    </div>
                    <p className="text-sm">{r.message}</p>
                    {r.admin_response && (
                      <p className="rounded-theme bg-accent-soft p-3 text-sm font-semibold">{r.admin_response}</p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Card className="flex gap-3 p-4">
          <Smartphone className="mt-0.5 shrink-0 text-accent" size={20} />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Use como app no celular:</span> no Safari, toque em
            Compartilhar e depois em “Adicionar à Tela de Início”. No Chrome, menu ⋮ e “Instalar app”.
          </p>
        </Card>

        <div className="flex flex-col gap-2">
          {profile.is_admin && (
            <Link href="/admin/dashboard" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>
              <Shield size={18} /> Painel do admin
            </Link>
          )}
          <Button variant="ghost" className="w-full" onClick={signOut}>
            <LogOut size={18} /> Sair da conta
          </Button>
        </div>
      </div>
    </>
  );
}
