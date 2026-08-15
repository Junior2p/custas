"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginForm({ configurado }: { configurado: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      if (!resposta.ok) {
        const dados = await resposta.json().catch(() => ({}));
        setErro(dados.erro ?? "Não foi possível entrar.");
        setCarregando(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente de novo.");
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo-escritorio.png"
            alt="Edmilson Lopes Junior"
            width={420}
            height={158}
            priority
            unoptimized
            className="mx-auto h-20 w-auto"
          />
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-dourado" />
            <p className="text-xs font-semibold tracking-[0.2em] text-marinho uppercase">Custas</p>
            <span className="h-px w-10 bg-dourado" />
          </div>
          <p className="mt-2 text-xs text-texto-suave">
            Custas processuais, escrituração e honorários
          </p>
        </div>

        {!configurado ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-alerta">
            <p className="font-medium">Acesso ainda não configurado.</p>
            <p className="mt-1 text-xs">
              Defina a variável de ambiente <code>CUSTAS_SENHA</code> no painel da Vercel e
              publique de novo. Enquanto ela não existir, o sistema fica bloqueado.
            </p>
          </div>
        ) : (
          <form onSubmit={entrar} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-marinho">E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-borda px-4 py-2.5 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/20"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-marinho">Senha</span>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-borda px-4 py-2.5 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/20"
              />
            </label>

            {erro && (
              <p className="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-erro">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full rounded-lg bg-marinho py-2.5 font-medium text-white transition hover:bg-marinho-700 disabled:opacity-60"
            >
              {carregando ? "Verificando..." : "Entrar"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-texto-suave">Acesso restrito ao escritório.</p>
      </div>
    </div>
  );
}
