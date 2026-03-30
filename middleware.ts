import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const protectedPrefixes = [
    "/profile",
    "/cart",
    "/checkout",
    "/order",
    "/ai-chat",
    "/pharmacy/dashboard",
    "/pharmacy/inventory",
    "/pharmacy/profile",
    "/courier/dashboard",
    "/admin",
  ];
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const authPages = [
    "/login",
    "/register",
    "/register-pharmacy",
    "/register-courier",
  ];
  if (user && authPages.includes(path)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
