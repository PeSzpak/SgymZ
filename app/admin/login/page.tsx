"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthBackground } from "@/components/auth-background";
import { useTheme } from "@/hooks/use-theme";

export default function AdminLoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
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
    <>
      <AuthBackground />
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 shadow-2xl border-2 border-accent/50">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Image 
                  src={theme === "batman" ? "/batmanlogo.png" : "/hellokitty-logo.png"}
                  alt="SGYMZ Admin Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
                <div className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full p-2">
                  <Shield size={20} />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center text-accent">
              Login Admin
            </CardTitle>
            <CardDescription className="text-center text-lg">
              Acesso restrito a administradores
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm rounded-lg bg-red-500/10 border-2 border-red-500 text-red-500 animate-in fade-in duration-300">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@email.com" 
                  className="h-12 text-base"
                  {...register("email")} 
                />
                {errors.email && (
                  <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">Senha</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="h-12 text-base pr-12"
                    {...register("password")} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold gap-2 shadow-lg hover:shadow-xl transition-all" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    Entrar como Admin
                  </>
                )}
              </Button>
              <div className="w-full border-t border-border pt-4 space-y-2">
                <p className="text-sm text-center text-muted-foreground">
                  É novo admin?{" "}
                  <Link href="/admin/register" className="text-accent hover:underline font-semibold">
                    Cadastre-se
                  </Link>
                </p>
                <p className="text-sm text-center text-muted-foreground">
                  <Link href="/" className="text-accent hover:underline font-semibold">
                    ← Voltar à página inicial
                  </Link>
                </p>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
}
