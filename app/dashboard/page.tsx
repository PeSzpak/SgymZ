"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import type { User } from "@/types/database";

export default function UserDashboard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data?.is_admin) {
        router.push("/admin/dashboard");
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
            <h1 className="text-4xl font-bold text-accent">SGYMZ</h1>
            <p className="text-muted-foreground">Olá, {userData?.full_name || "Usuário"}!</p>
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
          <Card>
            <CardHeader>
              <CardTitle>Bem-vindo!</CardTitle>
              <CardDescription>Seu perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Status: <span className="font-medium text-accent"> Aprovado</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Tema: <span className="font-medium text-accent">
                  {theme === "batman" ? "🦇 Batman" : "🎀 Hello Kitty"}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Seus Treinos</CardTitle>
              <CardDescription>Programas de treino ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: visualização e execução de treinos.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
              <CardDescription>Seus treinos realizados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Em breve: histórico de treinos e progresso.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
