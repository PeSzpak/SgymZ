import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeMark } from "@/components/theme-mark";

export function PageLoader({ label = "Carregando" }: { label?: string }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <ThemeMark className="h-10 w-14 animate-signal text-accent" />
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Loader2 size={16} className="animate-spin" /> {label}
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-theme-lg border-2 border-dashed border-border px-6 py-10 text-center",
        className
      )}
    >
      <ThemeMark className="h-9 w-12 text-accent/70" />
      <div className="space-y-1">
        <p className="font-display text-xl">{title}</p>
        {description && <p className="mx-auto max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-theme bg-muted", className)} />;
}

/** Anel de progresso (usado no timer de descanso e na meta semanal) */
export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  className,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
