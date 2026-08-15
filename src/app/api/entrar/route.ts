import { NextResponse } from "next/server";

import {
  COOKIE_SESSAO,
  criarSessao,
  emailConfigurado,
  iguais,
  senhaConfigurada,
} from "@/lib/auth/sessao";

export async function POST(request: Request) {
  const senhaEsperada = senhaConfigurada();

  if (!senhaEsperada) {
    return NextResponse.json(
      { erro: "Nenhuma senha configurada no servidor (CUSTAS_SENHA)." },
      { status: 503 }
    );
  }

  let email = "";
  let senha = "";
  try {
    const corpo = await request.json();
    email = String(corpo?.email ?? "").trim().toLowerCase();
    senha = String(corpo?.senha ?? "");
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  // Sempre confere as duas coisas, para o tempo de resposta não denunciar
  // qual delas estava errada.
  const emailOk = iguais(email, emailConfigurado());
  const senhaOk = iguais(senha, senhaEsperada);

  if (!emailOk || !senhaOk) {
    return NextResponse.json({ erro: "E-mail ou senha incorretos." }, { status: 401 });
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
