"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError("");
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError("Email ou senha incorretos.");
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("is_admin, status")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        setError("Erro ao carregar dados do usuário.");
        return;
      }

      if (!userData.is_admin) {
        setError("Você não tem permissão de administrador. Use o login de usuário.");
        await supabase.auth.signOut();
        return;
      }

      if (userData.status === "rejected") {
        setError("Sua conta foi rejeitada.");
        await supabase.auth.signOut();
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-accent/50">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-2">
            <Shield className="text-accent" size={48} />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-accent">Login Admin</CardTitle>
          <CardDescription className="text-center">Acesso restrito a administradores</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm rounded bg-red-500/10 border border-red-500 text-red-500">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@email.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" {...register("password")} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? "Entrando..." : (<><Shield size={20} />Entrar como Admin</>)}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              É novo admin?{" "}
              <Link href="/admin/register" className="text-accent hover:underline font-medium">Cadastre-se</Link>
            </p>
            <p className="text-sm text-center text-muted-foreground">
              <Link href="/" className="text-accent hover:underline font-medium">← Voltar</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
