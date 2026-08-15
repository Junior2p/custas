"use client";

// ============================================================
// LAYOUT ÚNICO DOS DOCUMENTOS
// Cabeçalho com o logo, título, corpo e assinatura. Todo documento
// que vai ao cliente — proposta patrimonial, extrato de honorários,
// proposta de ingresso — passa por aqui.
// ============================================================

import Image from "next/image";
import type { ReactNode } from "react";

import type { DadosEscritorio } from "@/lib/parametrizacao/modelo";

export function Documento({
  titulo,
  subtitulo,
  escritorio,
  children,
  rodape,
}: {
  titulo: string;
  subtitulo?: string;
  escritorio: DadosEscritorio;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="area-impressao mt-8 hidden text-[13px] leading-relaxed text-black print:block">
      <header className="mb-7 text-center">
        <Image
          src="/logo-escritorio.png"
          alt={escritorio.nome}
          width={420}
          height={158}
          unoptimized
          priority
          className="mx-auto h-24 w-auto"
        />
      </header>

      <h1 className="text-center text-base font-bold tracking-wide uppercase">{titulo}</h1>
      {subtitulo && (
        <p className="mt-1 text-center text-[11px] text-black/70">{subtitulo}</p>
      )}

      <div className="mt-6">{children}</div>

      {rodape}

      <p className="mt-10">
        {escritorio.cidade}, {hoje}.
      </p>

      <div className="mt-12">
        <div className="w-72 border-t border-black pt-1.5">
          <p className="font-bold uppercase">{escritorio.nome}</p>
          <p>{escritorio.oab}</p>
          <p>Tel. {escritorio.telefone}</p>
        </div>
      </div>
    </article>
  );
}

/** Bloco "rótulo: valor" usado nos cabeçalhos de dados do documento. */
export function Ficha({ itens }: { itens: [string, string][] }) {
  return (
    <table className="mb-5 w-full border-collapse">
      <tbody>
        {itens
          .filter(([, valor]) => valor)
          .map(([rotulo, valor]) => (
            <tr key={rotulo} className="border-b border-black/10">
              <td className="w-52 py-1 font-semibold">{rotulo}</td>
              <td className="py-1">{valor}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

/** Parágrafos a partir de texto livre, respeitando as quebras de linha. */
export function Texto({ conteudo, className = "" }: { conteudo: string; className?: string }) {
  if (!conteudo.trim()) return null;
  return (
    <div className={`space-y-1 whitespace-pre-line ${className}`}>{conteudo.trim()}</div>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  return <p className="mt-6 mb-2 font-semibold uppercase">{children}</p>;
}
