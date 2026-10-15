"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/data";
import { useTheme } from "@/hooks/use-theme";
import { PageLoader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import type { User } from "@/types/database";

interface ProfileContextType {
  profile: User;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

/** Garante sessão + perfil carregado antes de mostrar as páginas internas */
export function ProfileGate({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [profile, setProfile] = useState<User | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const p = await getProfile();
      if (!p) {
        router.replace(requireAdmin ? "/admin/login" : "/login");
        return;
      }
      if (p.status !== "approved") {
        setProblem(
          p.status === "pending"
            ? "Sua conta está aguardando aprovação do administrador."
            : "Seu acesso foi bloqueado pelo administrador."
        );
        return;
      }
      if (requireAdmin && !p.is_admin) {
        router.replace("/dashboard");
        return;
      }
      setProfile(p);
      setTheme(p.theme_preference, { persist: false });
    } catch {
      setProblem("Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.");
    }
  }, [router, requireAdmin, setTheme]);

  useEffect(() => {
    load();
  }, [load]);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }, [router]);

  if (problem) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="max-w-xs font-display text-2xl">{problem}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => location.reload()}>
            Tentar de novo
          </Button>
          <Button variant="ghost" onClick={signOut}>
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return <PageLoader />;

  return (
    <ProfileContext.Provider
      value={{
        profile,
        signOut,
        refreshProfile: async () => {
          const p = await getProfile();
          if (p) setProfile(p);
        },
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile deve ser usado dentro de ProfileGate");
  return ctx;
}
