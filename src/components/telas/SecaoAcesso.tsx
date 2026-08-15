"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck, ShieldOff } from "lucide-react";

import { fecharTrava, hashCodigo } from "@/lib/auth/trava";
import { useCustas } from "../Contexto";
import { Botao, Campo, Secao } from "../ui";

/**
 * Cadastro do código validador. Só o hash é guardado — o código em si
 * não fica em lugar nenhum, nem no arquivo exportado.
 */
export function SecaoAcesso() {
  const { parametrizacao: p, atualizarParametrizacao } = useCustas();

  const [codigo, setCodigo] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");

  const protegido = Boolean(p.acesso.codigoHash);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setAviso("");

    const limpo = codigo.trim();
    if (limpo.length < 4) {
      setErro("Use ao menos 4 caracteres.");
      return;
    }
    if (limpo !== confirmacao.trim()) {
      setErro("A confirmação não confere.");
      return;
    }

    atualizarParametrizacao({ ...p, acesso: { codigoHash: await hashCodigo(limpo) } });
    setCodigo("");
    setConfirmacao("");
    setAviso("Código cadastrado. Será pedido na próxima vez que o sistema abrir.");
  }

  function remover() {
    if (!confirm("Remover o código? O sistema passa a abrir sem pedir nada.")) return;
    atualizarParametrizacao({ ...p, acesso: { codigoHash: "" } });
    fecharTrava();
    setAviso("Código removido.");
  }

  return (
    <Secao
      titulo="Acesso"
      descricao="Código pedido ao abrir o sistema."
      acao={
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            protegido ? "bg-marinho-50 text-marinho" : "bg-amber-50 text-alerta"
          }`}
        >
          {protegido ? <ShieldCheck size={13} /> : <ShieldOff size={13} />}
          {protegido ? "Protegido" : "Sem código"}
        </span>
      }
    >
      <form onSubmit={cadastrar} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Campo rotulo={protegido ? "Novo código" : "Código validador"}>
          <input
            type="password"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-borda px-3 py-2 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
          />
        </Campo>
        <Campo rotulo="Repita o código">
          <input
            type="password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-borda px-3 py-2 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
          />
        </Campo>
        <div className="flex gap-2 pb-0.5">
          <Botao type="submit" disabled={!codigo || !confirmacao}>
            <KeyRound size={15} /> {protegido ? "Alterar" : "Cadastrar"}
          </Botao>
          {protegido && (
            <Botao type="button" variante="secundario" onClick={remover}>
              Remover
            </Botao>
          )}
        </div>
      </form>

      {erro && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-erro">{erro}</p>}
      {aviso && (
        <p className="mt-3 rounded-lg bg-marinho-50 px-3 py-2 text-xs text-marinho">{aviso}</p>
      )}

      <div className="mt-5 space-y-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-texto-suave">
        <p>
          <strong className="text-texto">Só o hash do código é guardado</strong> — o código em si
          não fica salvo em lugar nenhum, e não vai junto no arquivo exportado.
        </p>
        <p>
          Esta é uma <strong className="text-texto">trava de conveniência</strong>: ela roda no
          navegador e evita que alguém abra o sistema por engano, mas quem entende de tecnologia
          consegue contorná-la. Como as cotações ficam gravadas em cada navegador, não há dado de
          cliente no servidor ao alcance de terceiros.
        </p>
        <p>
          <strong className="text-texto">Esqueceu o código?</strong> Na tela de entrada há
          &ldquo;Esqueci o código&rdquo;: confirmando o e-mail cadastrado abaixo (
          <strong className="text-texto">{p.escritorio.email}</strong>) o código é redefinido e
          você cadastra outro. Não há como reenviá-lo — o sistema guarda apenas a impressão
          digital, nunca o código.
        </p>
        <p>
          Para uma barreira que não se contorna, defina a variável{" "}
          <code className="rounded bg-white px-1 py-0.5">CUSTAS_CODIGO</code> no painel da Vercel —
          aí a validação passa a ser feita no servidor, antes de a página carregar.
        </p>
      </div>
    </Secao>
  );
}
