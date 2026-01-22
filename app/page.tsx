"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Shield, User, Dumbbell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";

export default function HomePage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [hoveredCard, setHoveredCard] = useState<"user" | "admin" | null>(null);

  const handleUserClick = () => {
    // Define tema Hello Kitty
    setTheme("hellokitty");
    // Pequeno delay para garantir que o tema seja aplicado antes de navegar
    setTimeout(() => {
      router.push("/login");
    }, 50);
  };

  const handleAdminClick = () => {
    // Define tema Batman
    setTheme("batman");
    // Pequeno delay para garantir que o tema seja aplicado antes de navegar
    setTimeout(() => {
      router.push("/admin/login");
    }, 50);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradiente animado */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background/95 to-accent/20 animate-gradient" />
      
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-accent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Logo e título principal */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dumbbell size={48} className="text-accent animate-bounce" />
            <h1 className="text-6xl md:text-7xl font-black text-accent drop-shadow-2xl">
              SGYMZ
            </h1>
            <Sparkles size={48} className="text-accent animate-pulse" />
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground font-medium">
            Sistema de Gerenciamento de Treinos
          </p>
          <p className="text-sm md:text-base text-muted-foreground/70 mt-2">
            Escolha como deseja acessar o sistema
          </p>
        </div>

        {/* Cards de escolha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">
          {/* Card Usuário - Hello Kitty */}
          <Card
            className={`relative overflow-hidden backdrop-blur-sm bg-card/95 border-2 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl group ${
              hoveredCard === "user" ? "border-pink-400 shadow-pink-500/50 shadow-2xl" : "border-border hover:border-pink-300"
            }`}
            onMouseEnter={() => setHoveredCard("user")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={handleUserClick}
          >
            {/* Background decorativo */}
            <div className="absolute inset-0 bg-linear-to-br from-pink-500/10 via-transparent to-pink-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="space-y-4 relative z-10">
              <div className="flex justify-center">
                <div className="relative w-32 h-32 transform group-hover:scale-110 transition-transform duration-500">
                  <Image
                    src="/hellokitty-logo.png"
                    alt="Hello Kitty"
                    fill
                    className="object-contain drop-shadow-xl animate-in zoom-in duration-700"
                  />
                  <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-xl animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-center text-pink-400">
                Sou Usuário
              </CardTitle>
              <CardDescription className="text-center text-base">
                Acesse seus treinos personalizados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-400" />
                  <span>Visualize seus programas de treino</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-400" />
                  <span>Registre seus progressos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-400" />
                  <span>Tema Hello Kitty fofo</span>
                </div>
              </div>
              <Button
                className="w-full h-14 text-lg gap-3 bg-pink-500 hover:bg-pink-600 text-white shadow-lg hover:shadow-pink-500/50 transition-all"
              >
                <User size={24} />
                Entrar como Usuário
              </Button>
            </CardContent>
          </Card>

          {/* Card Admin - Batman */}
          <Card
            className={`relative overflow-hidden backdrop-blur-sm bg-card/95 border-2 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:shadow-2xl group ${
              hoveredCard === "admin" ? "border-yellow-400 shadow-yellow-500/50 shadow-2xl" : "border-border hover:border-yellow-300"
            }`}
            onMouseEnter={() => setHoveredCard("admin")}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={handleAdminClick}
          >
            {/* Background decorativo */}
            <div className="absolute inset-0 bg-linear-to-br from-yellow-500/10 via-transparent to-yellow-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="space-y-4 relative z-10">
              <div className="flex justify-center">
                <div className="relative w-32 h-32 transform group-hover:scale-110 transition-transform duration-500">
                  <Image
                    src="/batmanlogo.png"
                    alt="Batman"
                    fill
                    className="object-contain drop-shadow-xl animate-in zoom-in duration-700"
                  />
                  <div className="absolute -top-3 -right-3 bg-yellow-400 text-black rounded-full p-3 shadow-xl animate-bounce">
                    <Shield size={28} />
                  </div>
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-center text-yellow-400">
                Sou Administrador
              </CardTitle>
              <CardDescription className="text-center text-base">
                Gerencie usuários e programas de treino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Crie e edite programas de treino</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Gerencie alunos e aprovações</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span>Tema Batman épico</span>
                </div>
              </div>
              <Button
                className="w-full h-14 text-lg gap-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-lg hover:shadow-yellow-500/50 transition-all"
              >
                <Shield size={24} />
                Entrar como Admin
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom duration-1000 delay-300">
          <p>© 2026 SGYMZ - Sistema de Gerenciamento de Treinos</p>
          <p className="mt-1">Desenvolvido com 💪 para transformar treinos</p>
        </div>
      </div>
    </div>
  );
}
