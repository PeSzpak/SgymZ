"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Painel que sobe de baixo no celular e vira modal centralizado no desktop */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button
        aria-label="Fechar"
        className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-[2px] kitty:bg-[#3b2a33]/40"
        onClick={onClose}
      />
      <div
        className={cn(
          "surface animate-sheet-up sm:animate-pop-in relative flex max-h-[88dvh] w-full flex-col rounded-b-none sm:max-w-lg sm:rounded-b-theme-lg",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="font-display text-2xl leading-none">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-pill p-2 text-muted-foreground hover:bg-accent-soft hover:text-accent"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body
  );
}
