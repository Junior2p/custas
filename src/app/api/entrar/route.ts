import { NextResponse } from "next/server";

import {
  COOKIE_SESSAO,
  credenciaisConfiguradas,
  criarSessao,
  iguais,
  senhaConfigurada,
  usuarioConfigurado,
} from "@/lib/auth/sessao";

export async function POST(request: Request) {
  if (!credenciaisConfiguradas()) {
    return NextResponse.json(
      { erro: "Acesso não configurado no servidor (CUSTAS_USUARIO e CUSTAS_SENHA)." },
      { status: 503 }
    );
  }

  let usuario = "";
  let senha = "";
  try {
    const corpo = await request.json();
    usuario = String(corpo?.usuario ?? "").trim().toLowerCase();
    senha = String(corpo?.senha ?? "");
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  // Confere sempre os dois, para o tempo de resposta não denunciar
  // qual deles estava errado.
  const usuarioOk = iguais(usuario, usuarioConfigurado());
  const senhaOk = iguais(senha, senhaConfigurada());

  if (!usuarioOk || !senhaOk) {
    return NextResponse.json({ erro: "Usuário ou senha incorretos." }, { status: 401 });
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
