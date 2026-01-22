"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ThemePreference } from "@/types/database";

interface ThemeContextType {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("batman");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Função para aplicar tema no DOM
  const applyTheme = (newTheme: ThemePreference) => {
    if (newTheme === "hellokitty") {
      document.documentElement.setAttribute("data-theme", "hellokitty");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  // Carrega tema inicial
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Primeiro tenta carregar do localStorage (para usuários não logados)
        const preferredTheme = localStorage.getItem("preferred-theme") as ThemePreference | null;
        
        if (preferredTheme && (preferredTheme === "batman" || preferredTheme === "hellokitty")) {
          setThemeState(preferredTheme);
          applyTheme(preferredTheme);
        }

        // Depois tenta carregar do banco de dados (para usuários logados)
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data } = await supabase
            .from("users")
            .select("theme_preference")
            .eq("id", user.id)
            .single();

          if (data?.theme_preference) {
            setThemeState(data.theme_preference);
            applyTheme(data.theme_preference);
            localStorage.setItem("preferred-theme", data.theme_preference);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar tema:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [supabase]);

  // Escuta mudanças no localStorage (para detectar mudanças de outras abas/páginas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "preferred-theme" && e.newValue) {
        const newTheme = e.newValue as ThemePreference;
        if (newTheme === "batman" || newTheme === "hellokitty") {
          setThemeState(newTheme);
          applyTheme(newTheme);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Função para mudar tema (síncrona e assíncrona)
  const setTheme = (newTheme: ThemePreference) => {
    // Atualiza imediatamente no estado e DOM
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("preferred-theme", newTheme);

    // Atualiza no banco de forma assíncrona (sem bloquear)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from("users")
          .update({ theme_preference: newTheme })
          .eq("id", user.id)
          .then(({ error }) => {
            if (error) {
              console.error("Erro ao atualizar tema no banco:", error);
            }
          });
      }
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
}
