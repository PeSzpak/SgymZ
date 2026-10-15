"use client";

import { useTheme } from "@/hooks/use-theme";
import { ThemeMark } from "@/components/theme-mark";
import { cn } from "@/lib/utils";

/** Alterna entre Batman e Hello Kitty */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "batman" ? "Hello Kitty" : "Batman";
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Mudar para o tema ${next}`}
      title={`Mudar para o tema ${next}`}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-pill border border-border text-accent transition-transform hover:scale-105 active:scale-95 kitty:border-2 kitty:border-outline kitty:bg-card",
        className
      )}
    >
      <ThemeMark className="h-4 w-6" />
    </button>
  );
}
