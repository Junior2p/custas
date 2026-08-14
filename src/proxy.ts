import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseConfigurado } from "@/lib/supabase/config";

// Next 16 renomeou a convenção: o antigo `middleware.ts` agora é `proxy.ts`.
export async function proxy(request: NextRequest) {
  // Sem Supabase provisionado não há como autenticar: o app roda em modo
  // simulação, aberto. Ver src/lib/supabase/config.ts.
  if (!supabaseConfigurado) return NextResponse.next({ request });

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Já autenticado não fica na tela de login.
  if (pathname.startsWith("/auth")) {
    if (user) return NextResponse.redirect(new URL("/", request.url));
    return resposta;
  }

  if (!user) return NextResponse.redirect(new URL("/auth/login", request.url));

  return resposta;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
