"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import type { ThemePreference } from "@/types/database";

export default function HomePage() {
  const router = useRouter();
  const { setTheme } = useTheme();

  // Quem já está logado vai direto para os treinos
  useEffect(() => {
    createClient()
      .auth.getSession()
      .then(({ data: { session } }) => session && router.replace("/dashboard"));
  }, [router]);

  const enter = (theme: ThemePreference, href: string) => {
    setTheme(theme, { persist: false });
    router.push(href);
  };

  return (
    <main className="relative grid min-h-dvh grid-rows-2 md:grid-cols-2 md:grid-rows-1">
      {/* Porta Hello Kitty */}
      <button
        onClick={() => enter("hellokitty", "/login")}
        className="group relative flex flex-col items-center justify-center gap-5 overflow-hidden bg-[#ffd9e4] px-6 pt-[env(safe-area-inset-top)] text-[#3b2a33] outline-none focus-visible:ring-4 focus-visible:ring-[#ff5c93] focus-visible:ring-inset"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(255 92 147 / .25) 2px, transparent 2.2px), radial-gradient(circle, rgb(155 221 196 / .35) 2px, transparent 2.2px)",
          backgroundSize: "34px 34px",
          backgroundPosition: "0 0, 17px 17px",
        }}
      >
        <div className="relative h-28 w-36 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 md:h-40 md:w-52">
          <Image src="/hellokitty-logo.png" alt="" fill sizes="208px" className="logo-kitty object-contain" priority />
        </div>
        <div className="text-center">
          <p className="font-[family-name:var(--font-fredoka)] text-4xl font-semibold md:text-5xl">Vim treinar</p>
          <p className="mt-1 font-[family-name:var(--font-nunito)] font-semibold text-[#8c6b7a]">
            Treino do dia, séries e progresso
          </p>
        </div>
        <span className="rounded-full border-2 border-[#3b2a33] bg-[#ff5c93] px-7 py-3 font-[family-name:var(--font-nunito)] font-extrabold text-white shadow-[4px_4px_0_#3b2a33] transition-transform group-active:translate-y-0.5">
          Entrar
        </span>
      </button>

      {/* Porta Batman */}
      <button
        onClick={() => enter("batman", "/admin/login")}
        className="group relative flex flex-col items-center justify-center gap-5 overflow-hidden bg-[#0e0f12] px-6 pb-[env(safe-area-inset-bottom)] text-[#eceae4] outline-none focus-visible:ring-4 focus-visible:ring-[#f2c230] focus-visible:ring-inset"
        style={{ backgroundImage: "radial-gradient(600px 300px at 50% 0%, rgb(242 194 48 / .14), transparent 70%)" }}
      >
        <div className="relative h-24 w-36 transition-transform duration-300 group-hover:scale-110 md:h-36 md:w-52">
          <Image
            src="/batmanlogo.png"
            alt=""
            fill
            sizes="208px"
            className="logo-bat object-contain"
            priority
          />
        </div>
        <div className="text-center">
          <p className="font-[family-name:var(--font-barlow-condensed)] text-4xl font-bold uppercase tracking-wide md:text-5xl">
            Painel do admin
          </p>
          <p className="mt-1 font-[family-name:var(--font-barlow)] text-[#8a93a3]">Monte programas e acompanhe os alunos</p>
        </div>
        <span
          className="bg-[#f2c230] px-7 py-3 font-[family-name:var(--font-barlow-condensed)] text-lg font-bold uppercase tracking-wide text-[#0e0f12] transition-colors group-hover:bg-[#ffd54a]"
          style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}
        >
          Entrar
        </span>
      </button>

      {/* Marca no encontro das duas metades */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center md:inset-y-0 md:top-0 md:translate-y-0 md:items-center">
        <span className="rounded-full border-2 border-[#3b2a33] bg-[#fffdf8] px-5 py-1.5 font-[family-name:var(--font-fredoka)] text-xl font-bold tracking-wide text-[#3b2a33] shadow-[3px_3px_0_#0e0f12]">
          SGYMZ
        </span>
      </div>
    </main>
  );
}
