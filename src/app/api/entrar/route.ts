import { NextResponse } from "next/server";

import { COOKIE_SESSAO, codigoConfigurado, criarSessao, iguais } from "@/lib/auth/sessao";

export async function POST(request: Request) {
  const esperado = codigoConfigurado();

  if (!esperado) {
    return NextResponse.json(
      { erro: "Nenhum código configurado no servidor (CUSTAS_CODIGO)." },
      { status: 503 }
    );
  }

  let codigo = "";
  try {
    const corpo = await request.json();
    codigo = String(corpo?.codigo ?? "");
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  if (!iguais(codigo, esperado)) {
    return NextResponse.json({ erro: "Código inválido." }, { status: 401 });
  }

  const { valor, maxAge } = await criarSessao();
  const resposta = NextResponse.json({ ok: true });

  resposta.cookies.set(COOKIE_SESSAO, valor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return resposta;
}
