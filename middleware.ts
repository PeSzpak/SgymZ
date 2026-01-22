import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  
  const publicRoutes = ["/", "/login", "/register", "/admin/login", "/admin/register"];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  
  if (isPublicRoute) {
    return response;
  }
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
