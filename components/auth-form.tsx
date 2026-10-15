"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "@/lib/validations/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { AuthBackground } from "@/components/auth-background";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/hooks/use-theme";

type Mode = "login" | "register";
type Audience = "user" | "admin";

const copy = {
  user: {
    login: { title: "Bora treinar?", subtitle: "Entre para ver o treino de hoje.", cta: "Entrar" },
    register: { title: "Criar sua conta", subtitle: "Leva menos de um minuto.", cta: "Criar conta" },
  },
  admin: {
    login: { title: "Painel do admin", subtitle: "Monte programas e acompanhe os alunos.", cta: "Entrar no painel" },
    register: {
      title: "Cadastro de admin",
      subtitle: "O primeiro cadastro do sistema vira admin. Os seguintes precisam ser promovidos.",
      cta: "Criar conta de admin",
    },
  },
};

function translateAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Email ou senha incorretos.";
  if (/email not confirmed/i.test(message))
    return "Confirme seu email pelo link que enviamos antes de entrar.";
  if (/already registered|already exists/i.test(message)) return "Este email já tem conta. Faça login.";
  if (/rate limit/i.test(message)) return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  if (/failed to fetch|network/i.test(message)) return "Sem conexão com o servidor. Verifique sua internet.";
  return message;
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} className="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Esconder senha" : "Mostrar senha"}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-pill p-2 text-muted-foreground hover:text-accent"
      >
        {show ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  );
}

export function AuthForm({ mode, audience }: { mode: Mode; audience: Audience }) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<{ text: string; href?: string; cta?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";
  const text = copy[audience][mode];
  const base = audience === "admin" ? "/admin" : "";

  const form = useForm<RegisterFormData | LoginFormData>({
    resolver: zodResolver(isRegister ? registerSchema : loginSchema),
  });
  const errors = form.formState.errors as Partial<Record<keyof RegisterFormData, { message?: string }>>;

  const routeAfterAuth = async (userId: string) => {
    const supabase = createClient();
    const { data: profile } = await supabase
      .from("users")
      .select("is_admin, status, theme_preference")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();
      setError("Sua conta existe, mas o perfil não foi criado. Rode o supabase/setup.sql e tente de novo.");
      return;
    }
    if (profile.status === "rejected") {
      await supabase.auth.signOut();
      setError("Seu acesso foi bloqueado pelo administrador.");
      return;
    }
    if (profile.status === "pending") {
      await supabase.auth.signOut();
      setError("Sua conta está aguardando aprovação do administrador.");
      return;
    }

    setTheme(profile.theme_preference, { persist: false });

    if (audience === "admin" && !profile.is_admin) {
      setNotice({
        text: isRegister
          ? "Conta criada como aluno. Peça a um admin para te promover no painel."
          : "Esta conta não é de admin. Você pode usar a área de treinos normalmente.",
        href: "/dashboard",
        cta: "Ir para meus treinos",
      });
      return;
    }

    router.replace(audience === "admin" ? "/admin/dashboard" : "/dashboard");
    router.refresh();
  };

  const onSubmit = async (values: RegisterFormData | LoginFormData) => {
    setLoading(true);
    setError("");
    setNotice(null);
    const supabase = createClient();
    try {
      if (isRegister) {
        const v = values as RegisterFormData;
        const { data, error } = await supabase.auth.signUp({
          email: v.email.trim(),
          password: v.password,
          options: {
            data: { full_name: v.fullName.trim(), theme_preference: audience === "admin" ? "batman" : "hellokitty" },
          },
        });
        if (error) return setError(translateAuthError(error.message));
        if (!data.session) {
          setNotice({ text: "Conta criada! Enviamos um link de confirmação para o seu email. Depois é só entrar." });
          return;
        }
        await routeAfterAuth(data.session.user.id);
      } else {
        const v = values as LoginFormData;
        const { data, error } = await supabase.auth.signInWithPassword({ email: v.email.trim(), password: v.password });
        if (error) return setError(translateAuthError(error.message));
        await routeAfterAuth(data.user.id);
      }
    } catch (e) {
      setError(translateAuthError(e instanceof Error ? e.message : "Erro inesperado."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthBackground />
      <div className="flex min-h-dvh flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-pill bg-card/80 px-3 py-2 text-sm font-semibold backdrop-blur kitty:border-2 kitty:border-outline"
          >
            <ArrowLeft size={16} /> Início
          </Link>
          <ThemeToggle className="bg-card/80 backdrop-blur" />
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="surface animate-pop-in w-full max-w-sm p-6 sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="relative h-12 w-16 shrink-0">
                <Image
                  src="/batmanlogo.png"
                  alt=""
                  fill
                  sizes="64px"
                  className="logo-bat object-contain kitty:hidden"
                  priority
                />
                <Image
                  src="/hellokitty-logo.png"
                  alt=""
                  fill
                  sizes="64px"
                  className="logo-kitty hidden object-contain kitty:block"
                  priority
                />
              </div>
              <div>
                <h1 className="font-display text-3xl leading-none">{text.title}</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{text.subtitle}</p>
              </div>
            </div>

            {notice ? (
              <div className="space-y-4 text-center">
                <MailCheck className="mx-auto text-accent" size={40} />
                <p className="font-semibold">{notice.text}</p>
                <Button
                  className="w-full"
                  onClick={() => (notice.href ? router.replace(notice.href) : router.replace(`${base}/login`))}
                >
                  {notice.cta ?? "Ir para o login"}
                </Button>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {error && (
                  <div
                    role="alert"
                    className="animate-fade-in rounded-theme border border-danger/40 bg-danger/10 px-3.5 py-3 text-sm font-semibold text-danger"
                  >
                    {error}
                  </div>
                )}

                {isRegister && (
                  <Field label="Como quer ser chamada(o)?" htmlFor="fullName" error={errors.fullName?.message}>
                    <Input
                      id="fullName"
                      autoComplete="name"
                      placeholder="Seu nome"
                      {...form.register("fullName" as never)}
                    />
                  </Field>
                )}

                <Field label="Email" htmlFor="email" error={errors.email?.message}>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    {...form.register("email")}
                  />
                </Field>

                <Field label="Senha" htmlFor="password" error={errors.password?.message}>
                  <PasswordInput
                    id="password"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    placeholder="Mínimo de 6 caracteres"
                    {...form.register("password")}
                  />
                </Field>

                {isRegister && (
                  <Field label="Repita a senha" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                    <PasswordInput
                      id="confirmPassword"
                      autoComplete="new-password"
                      {...form.register("confirmPassword" as never)}
                    />
                  </Field>
                )}

                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  {text.cta}
                </Button>

                <p className="pt-1 text-center text-sm text-muted-foreground">
                  {isRegister ? "Já tem conta? " : "Primeira vez aqui? "}
                  <Link
                    href={`${base}/${isRegister ? "login" : "register"}`}
                    className="font-bold text-accent hover:underline"
                  >
                    {isRegister ? "Entrar" : "Criar conta"}
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
