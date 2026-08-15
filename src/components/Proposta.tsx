"use client";

// ============================================================
// PROPOSTA — o documento que vai ao cliente.
// Fica oculto na tela e é o único bloco impresso (ver globals.css).
// ============================================================

import Image from "next/image";

import type { Bem, Via } from "@/lib/calculo/tipos";
import type { DadosEscritorio } from "@/lib/parametrizacao/modelo";
import { moeda } from "./ui";

export function Proposta({
  cliente,
  textoAbertura,
  via,
  bens,
  itens,
  total,
  entradaPercentual,
  parcelas,
  validadeDias,
  formaPagamento,
  observacoes,
  escritorio,
}: {
  cliente: string;
  textoAbertura: string;
  via: Via;
  bens: Bem[];
  itens: { descricao: string; incluso: boolean }[];
  total: number;
  entradaPercentual: number;
  parcelas: number;
  validadeDias: number;
  formaPagamento: string;
  observacoes: string;
  escritorio: DadosEscritorio;
}) {
  const hoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const entrada = (total * entradaPercentual) / 100;
  const saldo = total - entrada;
  const inclusos = itens.filter((i) => i.incluso);
  const naoInclusos = itens.filter((i) => !i.incluso);
  const bensListados = bens.filter((b) => b.descricao || b.valorVenal > 0);

  return (
    <article className="area-impressao mt-8 hidden text-[13px] leading-relaxed text-black print:block">
      <header className="mb-8 text-center">
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

      <h1 className="mb-6 text-center text-base font-bold tracking-wide uppercase">
        Proposta de Prestação de Serviço
      </h1>

      <p>{textoAbertura}</p>
      <p className="my-3 text-center text-sm font-bold uppercase">{cliente || "—"}</p>

      {bensListados.length > 0 && (
        <>
          <p className="mt-5 mb-2">Abaixo estão elencados os bens objeto do serviço:</p>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-black/40 text-left text-[11px] uppercase">
                <th className="py-1.5 font-semibold">Bens</th>
                <th className="py-1.5 text-right font-semibold">Valor venal</th>
              </tr>
            </thead>
            <tbody>
              {bensListados.map((b, i) => (
                <tr key={`${b.descricao}-${i}`} className="border-b border-black/15">
                  <td className="py-1.5">{b.descricao || "—"}</td>
                  <td className="py-1.5 text-right tabular-nums">{moeda(b.valorVenal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {inclusos.length > 0 && (
        <>
          <p className="mt-6 mb-2 font-semibold">Serviços que estão INCLUSOS nesta proposta:</p>
          <ul className="space-y-1">
            {inclusos.map((i) => (
              <li key={i.descricao}>✅ &nbsp;{i.descricao}</li>
            ))}
          </ul>
        </>
      )}

      {naoInclusos.length > 0 && (
        <>
          <p className="mt-5 mb-2 font-semibold">
            Serviços que NÃO estão inclusos nesta proposta:
          </p>
          <ul className="space-y-1">
            {naoInclusos.map((i) => (
              <li key={i.descricao}>❌ &nbsp;{i.descricao}</li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 mb-2 font-semibold uppercase">
        Valor total da proposta e forma de pagamento:
      </p>
      <p className="text-lg font-bold">{moeda(total)}</p>

      {formaPagamento.trim() ? (
        <p className="mt-2 whitespace-pre-line">{formaPagamento}</p>
      ) : (
        <ul className="mt-2 space-y-1">
          <li>
            Entrada de {entradaPercentual}% do valor da proposta — {moeda(entrada)}
          </li>
          {saldo > 0 && (
            <li>
              Saldo de {moeda(saldo)} em até {parcelas}x de {moeda(saldo / parcelas)}
            </li>
          )}
        </ul>
      )}

      <p className="mt-2">
        Serviço realizado via:{" "}
        <strong>{via === "judicial" ? "JUDICIAL" : "CARTÓRIO (EXTRAJUDICIAL)"}</strong>
      </p>

      {observacoes && (
        <p className="mt-4">
          <strong>OBS:</strong> {observacoes}
        </p>
      )}

      <p className="mt-8 text-right text-[11px] italic">
        Proposta válida por {validadeDias} dias.
      </p>

      <p className="mt-10">
        {escritorio.cidade}, {hoje}.
      </p>

      <div className="mt-12">
        <div className="w-64 border-t border-black pt-1.5">
          <p className="font-bold uppercase">{escritorio.nome}</p>
          <p>{escritorio.oab}</p>
          <p>Tel. {escritorio.telefone}</p>
        </div>
      </div>
    </article>
  );
}
