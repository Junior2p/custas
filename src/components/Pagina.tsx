"use client";

import type { ReactNode } from "react";

/**
 * Moldura das telas. O cabeçalho — título, total e a barra de gestão —
 * fica congelado no topo: ao rolar uma cotação longa, o valor apurado e
 * os botões continuam à vista.
 */
export function Pagina({
  titulo,
  descricao,
  acao,
  topo,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  /** Conteúdo que acompanha o cabeçalho congelado (ex.: barra de cotações). */
  topo?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-12">
      <div className="sem-impressao sticky top-0 z-20 -mx-5 border-b border-borda bg-pagina/95 px-5 pt-5 pb-4 backdrop-blur">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-marinho">{titulo}</h1>
            {descricao && <p className="mt-0.5 text-sm text-texto-suave">{descricao}</p>}
          </div>
          {acao}
        </header>

        {topo && <div className="mt-4">{topo}</div>}
      </div>

      <div className="space-y-5 pt-5">{children}</div>
    </div>
  );
}
