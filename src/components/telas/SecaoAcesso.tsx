"use client";

import { ShieldCheck } from "lucide-react";

import { Secao } from "../ui";

/**
 * Status do acesso. O login é validado no servidor — não há nada para
 * cadastrar aqui: as credenciais vivem em variáveis de ambiente, fora
 * do código e fora do navegador.
 */
export function SecaoAcesso() {
  return (
    <Secao
      titulo="Acesso"
      descricao="Login exigido antes de a página carregar."
      acao={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-marinho-50 px-2.5 py-1 text-[11px] font-medium text-marinho">
          <ShieldCheck size={13} /> Validado no servidor
        </span>
      }
    >
      <div className="space-y-2 rounded-lg bg-slate-50 px-4 py-3 text-xs text-texto-suave">
        <p>
          O usuário e a senha ficam em <strong className="text-texto">variáveis de ambiente</strong>{" "}
          no painel da Vercel — nunca no código, no repositório ou no navegador. A sessão dura 12
          horas e vem de um cookie assinado, que não pode ser forjado.
        </p>
        <p>
          Para trocar as credenciais, atualize{" "}
          <code className="rounded bg-white px-1 py-0.5">CUSTAS_USUARIO</code> e{" "}
          <code className="rounded bg-white px-1 py-0.5">CUSTAS_SENHA</code> na Vercel e publique de
          novo. Trocar a senha encerra as sessões em aberto.
        </p>
        <p>
          O botão <strong className="text-texto">Sair</strong>, no rodapé do menu, encerra a sessão
          neste navegador.
        </p>
      </div>
    </Secao>
  );
}
