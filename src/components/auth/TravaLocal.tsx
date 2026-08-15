"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { abrirTrava, codigoConfere, travaAberta } from "@/lib/auth/trava";
import {
  carregarParametrizacao,
  gravarParametrizacao,
  type Parametrizacao,
} from "@/lib/parametrizacao/modelo";

/**
 * Pede o código validador cadastrado na Parametrização antes de liberar o
 * sistema. A liberação vale enquanto a aba estiver aberta.
 */
export function TravaLocal({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<"verificando" | "bloqueado" | "liberado">("verificando");
  const [config, setConfig] = useState<Parametrizacao | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    const atual = carregarParametrizacao();
    setConfig(atual);
    setEstado(!atual.acesso.codigoHash || travaAberta() ? "liberado" : "bloqueado");
  }, []);

  async function validar(e: React.FormEvent) {
    e.preventDefault();
    if (await codigoConfere(codigo, config?.acesso.codigoHash ?? "")) {
      abrirTrava();
      setEstado("liberado");
      return;
    }
    setErro("Código inválido.");
    setCodigo("");
  }

  if (estado === "verificando") return null;
  if (estado === "liberado") return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4">
      <div className="w-full max-w-xs">
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
            <span className="h-px w-8 bg-dourado" />
            <p className="text-xs font-semibold tracking-[0.2em] text-marinho uppercase">Custas</p>
            <span className="h-px w-8 bg-dourado" />
          </div>
        </div>

        {recuperando && config ? (
          <Recuperacao
            config={config}
            aoVoltar={() => setRecuperando(false)}
            aoRedefinir={() => {
              abrirTrava();
              setEstado("liberado");
            }}
          />
        ) : (
          <>
            <form onSubmit={validar} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-center text-sm font-medium text-marinho">
                  Código validador
                </span>
                <input
                  type="password"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value);
                    setErro("");
                  }}
                  required
                  autoFocus
                  autoComplete="off"
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-borda px-4 py-3 text-center text-lg tracking-[0.3em] outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/20"
                />
              </label>

              {erro && <p className="text-center text-sm text-erro">{erro}</p>}

              <button
                type="submit"
                disabled={!codigo}
                className="w-full rounded-lg bg-marinho py-2.5 font-medium text-white transition hover:bg-marinho-700 disabled:opacity-50"
              >
                Entrar
              </button>
            </form>

            <button
              onClick={() => setRecuperando(true)}
              className="mt-4 w-full text-center text-xs text-texto-suave underline underline-offset-2 transition hover:text-marinho"
            >
              Esqueci o código
            </button>
          </>
        )}

        <p className="mt-8 text-center text-xs text-texto-suave">Acesso restrito ao escritório.</p>
      </div>
    </div>
  );
}

/**
 * Recuperação sem servidor.
 *
 * O código não pode ser reenviado: só o hash fica guardado, e não há
 * backend para disparar e-mail. O que se pode fazer é redefinir, e a
 * conferência é o e-mail cadastrado no escritório.
 */
function Recuperacao({
  config,
  aoVoltar,
  aoRedefinir,
}: {
  config: Parametrizacao;
  aoVoltar: () => void;
  aoRedefinir: () => void;
}) {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");

  function redefinir(e: React.FormEvent) {
    e.preventDefault();

    const informado = email.trim().toLowerCase();
    if (informado !== config.escritorio.email.trim().toLowerCase()) {
      setErro("E-mail não confere com o cadastrado no escritório.");
      return;
    }

    gravarParametrizacao({ ...config, acesso: { codigoHash: "" } });
    aoRedefinir();
  }

  return (
    <form onSubmit={redefinir} className="space-y-4">
      <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-texto-suave">
        O código não fica salvo — só a impressão digital dele. Por isso não há como reenviá-lo.
        Confirme o e-mail do escritório para <strong className="text-texto">redefinir</strong> e
        cadastrar um novo.
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-marinho">E-mail do escritório</span>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErro("");
          }}
          required
          autoFocus
          placeholder="seu@email.com"
          className="w-full rounded-lg border border-borda px-4 py-2.5 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/20"
        />
      </label>

      {erro && <p className="text-center text-sm text-erro">{erro}</p>}

      <button
        type="submit"
        disabled={!email}
        className="w-full rounded-lg bg-marinho py-2.5 font-medium text-white transition hover:bg-marinho-700 disabled:opacity-50"
      >
        Redefinir código
      </button>

      <button
        type="button"
        onClick={aoVoltar}
        className="w-full text-center text-xs text-texto-suave underline underline-offset-2 transition hover:text-marinho"
      >
        Voltar
      </button>
    </form>
  );
}
