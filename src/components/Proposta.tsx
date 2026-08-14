"use client";

// ============================================================
// PROPOSTA — o documento que vai ao cliente.
// Fica oculto na tela e é o único bloco impresso (ver globals.css).
// Espelha a aba `Proposta` da planilha.
// ============================================================

import type { Bem, Via } from "@/lib/calculo/tipos";
import { moeda } from "./ui";

const ESCRITORIO = {
  nome: "EDMILSON LOPES JUNIOR",
  oab: "OAB/SP 294.775",
  telefone: "(17) 99703-5758",
  cidade: "São João das Duas Pontes/SP",
};

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
  observacoes,
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
  observacoes: string;
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

  return (
    <article className="area-impressao mt-8 hidden text-[13px] leading-relaxed text-black print:block">
      <h1 className="mb-6 text-center text-base font-bold tracking-wide uppercase">
        Proposta de Prestação de Serviço
      </h1>

      <p>{textoAbertura}</p>
      <p className="my-3 text-center text-sm font-bold uppercase">{cliente || "—"}</p>

      {bens.some((b) => b.descricao || b.valorVenal > 0) && (
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
              {bens
                .filter((b) => b.descricao || b.valorVenal > 0)
                .map((b, i) => (
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
          <p className="mt-6 mb-2 font-semibold">
            Serviços que estão INCLUSOS nesta proposta:
          </p>
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
      <ul className="mt-2 space-y-1">
        <li>
          Entrada de {entradaPercentual}% do valor da proposta — {moeda(entrada)}
        </li>
        <li>
          Saldo de {moeda(saldo)} em até {parcelas}x de {moeda(saldo / parcelas)}
        </li>
        <li>
          Serviço realizado via:{" "}
          <strong>{via === "judicial" ? "JUDICIAL" : "CARTÓRIO (EXTRAJUDICIAL)"}</strong>
        </li>
      </ul>

      {observacoes && (
        <p className="mt-4">
          <strong>OBS:</strong> {observacoes}
        </p>
      )}

      <p className="mt-8 text-right text-[11px] italic">
        Proposta válida por {validadeDias} dias.
      </p>

      <p className="mt-10">
        {ESCRITORIO.cidade}, {hoje}.
      </p>

      <div className="mt-12">
        <div className="w-64 border-t border-black pt-1.5">
          <p className="font-bold">{ESCRITORIO.nome}</p>
          <p>{ESCRITORIO.oab}</p>
          <p>Tel. {ESCRITORIO.telefone}</p>
        </div>
      </div>
    </article>
  );
}
