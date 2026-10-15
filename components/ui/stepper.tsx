"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Campo numérico com botões de − e + (bom para usar com a mão suada na academia) */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  label,
  className,
  compact = false,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  label: string;
  className?: string;
  compact?: boolean;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round((Number.isFinite(n) ? n : 0) * 100) / 100));
  const btn = cn(
    "flex shrink-0 items-center justify-center text-muted-foreground hover:bg-accent-soft hover:text-accent active:scale-90",
    compact ? "w-8" : "w-11"
  );

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-theme border border-border bg-input kitty:border-2",
        compact ? "h-11" : "h-12",
        className
      )}
    >
      <button type="button" aria-label={`Diminuir ${label}`} onClick={() => onChange(clamp(value - step))} className={btn}>
        <Minus size={compact ? 15 : 18} />
      </button>
      <label className="flex min-w-0 flex-1 items-center justify-center">
        <span className="sr-only">{label}</span>
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(clamp(Number(e.target.value.replace(",", "."))))}
          onFocus={(e) => e.target.select()}
          className={cn(
            "w-full min-w-0 bg-transparent text-center font-bold tabular-nums outline-none",
            compact ? "text-base" : "text-lg"
          )}
        />
        {suffix && <span className="pr-1 text-[11px] font-semibold text-muted-foreground">{suffix}</span>}
      </label>
      <button type="button" aria-label={`Aumentar ${label}`} onClick={() => onChange(clamp(value + step))} className={btn}>
        <Plus size={compact ? 15 : 18} />
      </button>
    </div>
  );
}
