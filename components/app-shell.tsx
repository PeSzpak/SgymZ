"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { ThemeMark } from "@/components/theme-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

/** Moldura das páginas internas: topo fixo + navegação inferior no celular / lateral no desktop */
export function AppShell({
  nav,
  brand,
  homeHref,
  children,
}: {
  nav: NavItem[];
  brand: string;
  homeHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === homeHref ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-dvh md:pl-60">
      <div className="app-backdrop" />

      {/* Lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card/80 p-4 backdrop-blur md:flex kitty:border-r-2 kitty:border-outline">
        <Link href={homeHref} className="mb-8 flex items-center gap-2 px-2 pt-2 text-accent">
          <ThemeMark className="h-6 w-9" />
          <span className="font-display text-2xl leading-none">{brand}</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-pill px-3 py-2.5 text-[15px] font-semibold transition-colors",
                isActive(item.href)
                  ? "bg-accent text-accent-foreground kitty:border-2 kitty:border-outline"
                  : "text-muted-foreground hover:bg-accent-soft hover:text-foreground"
              )}
            >
              <item.icon size={19} />
              <span className="flex-1">{item.label}</span>
              {!!item.badge && (
                <span className="rounded-pill bg-danger px-1.5 text-xs font-bold text-white">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </aside>

      {/* Topo (celular) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden kitty:border-b-2 kitty:border-outline/10">
        <Link href={homeHref} className="flex h-14 items-center gap-2 text-accent">
          <ThemeMark className="h-5 w-8" />
          <span className="font-display text-xl leading-none">{brand}</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pt-5 pb-28 md:px-8 md:pt-10 md:pb-12">{children}</main>

      {/* Navegação inferior (celular) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur md:hidden kitty:border-t-2 kitty:border-outline">
        <div className="mx-auto flex max-w-md">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition-colors",
                  active ? "text-accent" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-12 place-items-center rounded-pill transition-colors",
                    active && "bg-accent-soft"
                  )}
                >
                  <item.icon size={21} strokeWidth={active ? 2.4 : 2} />
                </span>
                {item.label}
                {!!item.badge && (
                  <span className="absolute top-1.5 right-[calc(50%-22px)] h-2.5 w-2.5 rounded-full bg-danger" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Título de página padrão */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-4xl leading-none md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
