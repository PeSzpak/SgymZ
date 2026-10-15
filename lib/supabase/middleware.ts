import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Cliente Supabase para uso em Middleware
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Atualizar sessão do usuário
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const authRoutes = ["/login", "/register", "/admin/login", "/admin/register"];
  const isAuthRoute = authRoutes.includes(path);
  const isPublic = path === "/" || isAuthRoute || path === "/manifest.webmanifest";

  // Sem sessão em rota protegida: vai para o login certo (admin ou aluna)
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = path.startsWith("/admin") ? "/admin/login" : "/login";
    return NextResponse.redirect(url);
  }

  // Já logado abrindo login/cadastro: segue direto para o painel
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = path.startsWith("/admin") ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
