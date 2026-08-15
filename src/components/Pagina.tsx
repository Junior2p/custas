"use client";

import type { ReactNode } from "react";

export function Pagina({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <header className="sem-impressao mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-marinho">{titulo}</h1>
          {descricao && <p className="mt-0.5 text-sm text-texto-suave">{descricao}</p>}
        </div>
        {acao}
      </header>

      <div className="space-y-5">{children}</div>
    </div>
  );
}
