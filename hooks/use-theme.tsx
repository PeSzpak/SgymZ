"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ThemePreference } from "@/types/database";

interface ThemeContextType {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference, options?: { persist?: boolean }) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = "preferred-theme";

function applyTheme(theme: ThemePreference) {
  if (theme === "hellokitty") {
    document.documentElement.setAttribute("data-theme", "hellokitty");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "hellokitty" ? "#fff0f4" : "#0e0f12");
}

function isTheme(value: unknown): value is ThemePreference {
  return value === "batman" || value === "hellokitty";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("batman");

  // O script no <head> já aplicou o tema salvo; aqui só sincronizamos o estado
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isTheme(saved)) {
        setThemeState(saved);
        applyTheme(saved);
      }
    } catch {
      // armazenamento indisponível (aba privada): segue com o padrão
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && isTheme(e.newValue)) {
        setThemeState(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((next: ThemePreference, options?: { persist?: boolean }) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}

    if (options?.persist === false) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      supabase.from("users").update({ theme_preference: next }).eq("id", session.user.id).then();
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "batman" ? "hellokitty" : "batman");
  }, [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  return context;
}
