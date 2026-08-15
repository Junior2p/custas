"use client";

// ============================================================
// Proposta das ações patrimoniais (inventário, escritura, usucapião…),
// no mesmo layout dos demais documentos.
// ============================================================

import type { Bem, Via } from "@/lib/calculo/tipos";
import type { DadosEscritorio } from "@/lib/parametrizacao/modelo";
import { moeda } from "../ui";
import { Documento, Texto, Titulo } from "./Documento";

export function DocumentoProposta({
  titulo,
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
  titulo: string;
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
  const entrada = (total * entradaPercentual) / 100;
  const saldo = total - entrada;
  const inclusos = itens.filter((i) => i.incluso);
  const naoInclusos = itens.filter((i) => !i.incluso);
  const bensListados = bens.filter((b) => b.descricao || b.valorVenal > 0);

  return (
    <Documento
      titulo={titulo}
      escritorio={escritorio}
      rodape={
        <p className="mt-8 text-right text-[11px] italic">
          Proposta válida por {validadeDias} dias.
        </p>
      }
    >
      <Texto conteudo={textoAbertura} />
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
          <Titulo>Serviços inclusos nesta proposta</Titulo>
          <ul className="space-y-1">
            {inclusos.map((i) => (
              <li key={i.descricao}>✅ &nbsp;{i.descricao}</li>
            ))}
          </ul>
        </>
      )}

      {naoInclusos.length > 0 && (
        <>
          <Titulo>Serviços NÃO inclusos</Titulo>
          <ul className="space-y-1">
            {naoInclusos.map((i) => (
              <li key={i.descricao}>❌ &nbsp;{i.descricao}</li>
            ))}
          </ul>
        </>
      )}

      <Titulo>Valor total e forma de pagamento</Titulo>
      <p className="text-lg font-bold">{moeda(total)}</p>

      {formaPagamento.trim() ? (
        <Texto conteudo={formaPagamento} className="mt-2" />
      ) : (
        <ul className="mt-2 space-y-1">
          <li>
            • Entrada de {entradaPercentual}% do valor da proposta — {moeda(entrada)}
          </li>
          {saldo > 0 && (
            <li>
              • Saldo de {moeda(saldo)} em até {parcelas}x de {moeda(saldo / parcelas)}
            </li>
          )}
        </ul>
      )}

      <p className="mt-2">
        Serviço realizado via:{" "}
        <strong>{via === "judicial" ? "JUDICIAL" : "CARTÓRIO (EXTRAJUDICIAL)"}</strong>
      </p>

      {observacoes.trim() && (
        <>
          <Titulo>Observações</Titulo>
          <Texto conteudo={observacoes} />
        </>
      )}
    </Documento>
  );
}
