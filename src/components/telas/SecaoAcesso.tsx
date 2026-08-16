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
        <div>
          <p className="mb-1.5">
            <strong className="text-texto">Para trocar o usuário ou a senha</strong>, na pasta do
            projeto (<code className="rounded bg-white px-1 py-0.5">~/Documents/GitHub/Custas</code>
            ), rodar na ordem — trocando <code className="rounded bg-white px-1 py-0.5">SENHA</code>{" "}
            por <code className="rounded bg-white px-1 py-0.5">USUARIO</code> conforme o caso:
          </p>
          <pre className="overflow-x-auto rounded bg-white px-3 py-2 text-[11px] leading-relaxed text-texto">
{`npx vercel env rm CUSTAS_SENHA production --yes --scope elj
npx vercel env add CUSTAS_SENHA production --scope elj
npx vercel --prod --yes --scope elj`}
          </pre>
          <p className="mt-1.5">
            O terminal pede o valor sem exibi-lo. <strong className="text-texto">O último
            comando é obrigatório</strong>: sem publicar de novo, a credencial antiga continua
            valendo. Trocar a senha encerra as sessões em aberto.
          </p>
          <p className="mt-1.5">
            Pelo painel: Vercel → projeto <em>custas</em> → Settings → Environment Variables →
            Edit, e depois Deployments → Redeploy.
          </p>
        </div>
        <p>
          O botão <strong className="text-texto">Sair</strong>, no rodapé do menu, encerra a sessão
          neste navegador.
        </p>
      </div>
    </Secao>
  );
}
