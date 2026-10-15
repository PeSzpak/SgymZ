"use client";

import { CalendarHeart, Dumbbell, Home, UserRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProfileGate } from "@/components/profile-gate";

const nav = [
  { href: "/dashboard", label: "Hoje", icon: Home },
  { href: "/treinos", label: "Treinos", icon: Dumbbell },
  { href: "/historico", label: "Histórico", icon: CalendarHeart },
  { href: "/perfil", label: "Perfil", icon: UserRound },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileGate>
      <AppShell nav={nav} brand="SGYMZ" homeHref="/dashboard">
        {children}
      </AppShell>
    </ProfileGate>
  );
}
