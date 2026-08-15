"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCustas } from "./Contexto";

/**
 * Etapas da cotação patrimonial. A proposta é o fim do fluxo — fica aqui,
 * dentro do tipo de ação, e não solta no menu principal.
 */
const ETAPAS = [
  { href: "/", rotulo: "Apuração" },
  { href: "/herdeiros", rotulo: "Herdeiros e quinhões" },
  { href: "/proposta", rotulo: "Proposta" },
];

export function EtapasPatrimoniais() {
  const caminho = usePathname();
  const { servico } = useCustas();

  // Serviço sem partilha não tem por que mostrar a etapa de quinhões.
  const etapas = ETAPAS.filter((e) => e.href !== "/herdeiros" || servico.temPartilha);

  return (
    <nav className="sem-impressao flex gap-1 rounded-lg border border-borda bg-superficie p-1">
      {etapas.map(({ href, rotulo }, i) => {
        const ativa = caminho === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
              ativa
                ? "bg-marinho text-white"
                : "text-texto-suave hover:bg-marinho-50 hover:text-marinho"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                ativa ? "bg-white/20" : "bg-slate-100"
              }`}
            >
              {i + 1}
            </span>
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
