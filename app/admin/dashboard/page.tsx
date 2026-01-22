"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sparkles, Users, Dumbbell, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import type { User } from "@/types/database";

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!data?.is_admin) {
        router.push("/dashboard");
        return;
      }

      setUserData(data);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const toggleTheme = () => {
    const newTheme = theme === "batman" ? "hellokitty" : "batman";
    setTheme(newTheme);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-accent">SGYMZ Admin</h1>
            <p className="text-muted-foreground">👑 Olá, {userData?.full_name || "Admin"}!</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={toggleTheme} className="gap-2">
              {theme === "batman" ? (
                <><Sparkles size={20} />Hello Kitty</>
              ) : (
                <><Moon size={20} />Batman</>
              )}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut size={20} />Sair
            </Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-accent" size={24} />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription>Aprovar e gerenciar usuários do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: listagem, aprovação e edição de usuários.
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="text-accent" size={24} />
                Gerenciar Exercícios
              </CardTitle>
              <CardDescription>Criar e editar exercícios</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: CRUD completo de exercícios.
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-accent" size={24} />
                Programas de Treino
              </CardTitle>
              <CardDescription>Criar e atribuir programas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: criação e atribuição de programas de treino.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
              <CardDescription>Visão geral do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: dashboard com estatísticas gerais.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Alertas e pendências</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: central de notificações.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
              <CardDescription>Ajustes do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tema: <span className="font-medium text-accent">
                  {theme === "batman" ? "🦇 Batman" : "🎀 Hello Kitty"}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
