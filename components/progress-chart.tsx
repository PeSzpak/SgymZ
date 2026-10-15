"use client";

import { useState } from "react";

export interface Point {
  date: string;
  value: number;
  detail: string;
}

/** Linha única (carga máxima por treino) com toque/hover mostrando o valor */
export function ProgressChart({ points, unit = "kg" }: { points: Point[]; unit?: string }) {
  const [active, setActive] = useState<number | null>(points.length - 1);
  const W = 640;
  const H = 220;
  const pad = { l: 36, r: 16, t: 16, b: 28 };
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || Math.max(1, max * 0.2);
  const lo = Math.max(0, min - span * 0.25);
  const hi = max + span * 0.25;
  const x = (i: number) => pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const ticks = [lo, (lo + hi) / 2, hi];
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  const a = active !== null ? points[active] : null;
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <div>
      <div className="mb-2 h-12">
        {a && (
          <div className="animate-fade-in">
            <p className="font-display text-3xl leading-none">
              {a.value.toLocaleString("pt-BR")} {unit}
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              {new Date(a.date).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}: {a.detail}
            </p>
          </div>
        )}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        role="img"
        aria-label={`Evolução da carga: de ${values[0]} a ${values.at(-1)} ${unit}`}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - rect.left) / rect.width) * W;
          let best = 0;
          points.forEach((_, i) => Math.abs(x(i) - px) < Math.abs(x(best) - px) && (best = i));
          setActive(best);
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray="3 5" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {[0, points.length - 1].filter((v, i, arr) => arr.indexOf(v) === i).map((i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor={i === 0 && points.length > 1 ? "start" : "end"} fontSize="11" fill="var(--muted-foreground)">
            {fmtDate(points[i].date)}
          </text>
        ))}
        {active !== null && (
          <line x1={x(active)} x2={x(active)} y1={pad.t} y2={H - pad.b} stroke="var(--muted-foreground)" strokeOpacity=".4" />
        )}
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.value)}
            r={active === i ? 6 : 4}
            fill={active === i ? "var(--accent)" : "var(--card)"}
            stroke="var(--accent)"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
