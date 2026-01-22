"use client";

import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";

export function AuthBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`auth-background ${theme === "batman" ? "batman-bg" : "hellokitty-bg"}`} />
  );
}
