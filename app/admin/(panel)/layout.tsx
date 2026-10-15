"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Dumbbell, LayoutGrid, ListChecks, MessageSquareHeart, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProfileGate } from "@/components/profile-gate";
import { countPendingRequests } from "@/lib/data";

function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    countPendingRequests().then(setPending).catch(() => {});
  }, [pathname]);

  const nav = [
    { href: "/admin/dashboard", label: "Painel", icon: LayoutGrid },
    { href: "/admin/usuarios", label: "Alunos", icon: Users },
    { href: "/admin/programas", label: "Programas", icon: ListChecks },
    { href: "/admin/exercicios", label: "Exercícios", icon: Dumbbell },
    { href: "/admin/pedidos", label: "Pedidos", icon: MessageSquareHeart, badge: pending },
  ];

  return (
    <AppShell nav={nav} brand="SGYMZ Admin" homeHref="/admin/dashboard">
      {children}
    </AppShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileGate requireAdmin>
      <AdminNav>{children}</AdminNav>
    </ProfileGate>
  );
}
