import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_SESSAO, exigeAcesso, sessaoValida } from "@/lib/auth/sessao";

// Next 16 renomeou a convenção: o antigo `middleware.ts` agora é `proxy.ts`.
export async function proxy(request: NextRequest) {
  // Em desenvolvimento, sem credenciais configuradas, o app abre direto.
  // Em produção `exigeAcesso()` é sempre verdadeiro: sem login não passa.
  if (!exigeAcesso()) return NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  // As rotas de validação precisam ficar acessíveis.
  if (pathname.startsWith("/api/entrar") || pathname.startsWith("/api/sair")) {
    return NextResponse.next({ request });
  }

  const autenticado = await sessaoValida(request.cookies.get(COOKIE_SESSAO)?.value);

  if (pathname.startsWith("/auth")) {
    if (autenticado) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next({ request });
  }

  if (!autenticado) return NextResponse.redirect(new URL("/auth/login", request.url));

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
