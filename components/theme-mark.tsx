import { cn } from "@/lib/utils";

/** Símbolo do tema: morcego no Batman, laço no Hello Kitty (troca só por CSS, sem piscar) */
export function ThemeMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-block", className)} aria-hidden>
      <svg viewBox="0 0 100 60" className="h-full w-full kitty:hidden" fill="currentColor">
        <path d="M50 14c-2 0-3.2-4.6-4.4-9.2-.6 3.2-1.4 6.4-3 8.4C35 9.6 22 6.6 8 12c8 3.4 12 9.6 11.2 17.4 5.6-3.2 12.4-2.8 16.4 1.6 3.6 4 4.6 10.6 2 17 5-1.6 9.8 1 12.4 7 2.6-6 7.4-8.6 12.4-7-2.6-6.4-1.6-13 2-17 4-4.4 10.8-4.8 16.4-1.6C80 21.6 84 15.4 92 12c-14-5.4-27-2.4-34.6 1.2-1.6-2-2.4-5.2-3-8.4C53.2 9.4 52 14 50 14Z" />
      </svg>
      <svg viewBox="0 0 100 60" className="hidden h-full w-full kitty:block" fill="currentColor">
        <path d="M44 22C36 10 18 2 9 8 2 13 3 34 8 44c6 11 24 10 36-2Z" />
        <path d="M56 22c8-12 26-20 35-14 7 5 6 26 1 36-6 11-24 10-36-2Z" />
        <rect x="40" y="18" width="20" height="26" rx="9" />
        <path d="M22 18c5 0 10 4 13 9" stroke="#fff" strokeOpacity=".5" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </span>
  );
}
