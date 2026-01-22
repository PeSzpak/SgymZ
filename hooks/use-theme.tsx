"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ThemePreference } from "@/types/database";

interface ThemeContextType {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("batman");
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const loadTheme = async () => {
      try {
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

  const applyTheme = (newTheme: ThemePreference) => {
    if (newTheme === "hellokitty") {
      document.documentElement.setAttribute("data-theme", "hellokitty");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const setTheme = async (newTheme: ThemePreference) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("users")
          .update({ theme_preference: newTheme })
          .eq("id", user.id);

        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    } catch (error) {
      console.error("Erro ao atualizar tema:", error);
      throw error;
    }
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
