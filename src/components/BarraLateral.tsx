"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Calculator, Eye, EyeOff, Gavel, Settings2, Table2 } from "lucide-react";

import BotaoSair from "./auth/BotaoSair";
import { useCustas } from "./Contexto";
import { moeda } from "./ui";

// As etapas de cada tipo (apuração → herdeiros → proposta) ficam dentro
// da própria tela, em `Etapas.tsx` — o menu guarda só os tipos de ação.
const ITENS = [
  { href: "/", rotulo: "Ações Patrimoniais", icone: Calculator, interno: false },
  { href: "/acoes", rotulo: "Ações Judiciais", icone: Gavel, interno: false },
  { href: "/parametrizacao", rotulo: "Parametrização", icone: Settings2, interno: true },
  { href: "/tabelas", rotulo: "Tabelas de cartório", icone: Table2, interno: true },
];

export function BarraLateral({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();
  const { apresentacao, alternarApresentacao, cotacao, temAlteracoes, totalProposta } =
    useCustas();

  // Em apresentação some tudo que é bastidor: parametrização e tabelas.
  const itens = ITENS.filter((i) => !apresentacao || !i.interno);

  return (
    <div className="flex min-h-screen">
      <aside className="sem-impressao sticky top-0 flex h-screen w-16 shrink-0 flex-col justify-between border-r border-borda bg-superficie py-4 lg:w-60">
        <div>
          <div className="mb-6 flex items-center gap-2.5 px-3 lg:px-5">
            <Image
              src="/jr-monograma.png"
              alt=""
              width={26}
              height={32}
              unoptimized
              className="h-7 w-auto shrink-0"
            />
            <span className="hidden text-sm font-semibold text-marinho lg:inline">Custas</span>
          </div>

          <nav className="space-y-0.5 px-2 lg:px-3">
            {itens.map(({ href, rotulo, icone: Icone }) => {
              const ativo =
                href === "/"
                  ? ["/", "/herdeiros", "/proposta"].includes(caminho)
                  : caminho === href;
              return (
                <Link
                  key={href}
                  href={href}
                  title={rotulo}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    ativo
                      ? "bg-marinho text-white"
                      : "text-texto-suave hover:bg-marinho-50 hover:text-marinho"
                  }`}
                >
                  <Icone size={18} className="shrink-0" />
                  <span className="hidden lg:inline">{rotulo}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 px-2 lg:px-3">
          <div className="hidden rounded-lg bg-marinho-50 px-3 py-2.5 lg:block">
            <p className="text-[11px] text-texto-suave">Cotação {cotacao.numero}</p>
            <p className="truncate text-xs font-medium text-marinho">
              {cotacao.cliente.trim() || "sem cliente"}
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-marinho">
              {moeda(totalProposta)}
            </p>
            {temAlteracoes && (
              <p className="mt-1 text-[11px] text-alerta">alterações não salvas</p>
            )}
          </div>

          <button
            onClick={alternarApresentacao}
            title={
              apresentacao
                ? "Sair do modo apresentação"
                : "Esconder bastidores para compartilhar a tela"
            }
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
              apresentacao
                ? "bg-dourado text-marinho hover:brightness-105"
                : "border border-borda text-texto-suave hover:bg-slate-50"
            }`}
          >
            {apresentacao ? <EyeOff size={15} /> : <Eye size={15} />}
            <span className="hidden lg:inline">
              {apresentacao ? "Sair da apresentação" : "Apresentação"}
            </span>
          </button>

          <BotaoSair />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
