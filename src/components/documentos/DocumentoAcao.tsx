"use client";

import { totaisAcao, valorComReducao, valorDoAto, type AcaoJudicial } from "@/lib/acao/modelo";
import type { DadosEscritorio } from "@/lib/parametrizacao/modelo";
import { moeda, percentual } from "../ui";
import { Documento, Ficha, Texto, Titulo } from "./Documento";

export function DocumentoAcao({
  acao: a,
  escritorio,
}: {
  acao: AcaoJudicial;
  escritorio: DadosEscritorio;
}) {
  const t = totaisAcao(a);
  const ehExtrato = a.tipoDocumento === "extrato";

  const dataBr = a.dataDistribuicao
    ? new Date(`${a.dataDistribuicao}T12:00:00`).toLocaleDateString("pt-BR")
    : "";

  return (
    <Documento
      titulo={a.titulo}
      subtitulo={ehExtrato ? a.textoAbertura : undefined}
      escritorio={escritorio}
    >
      <Ficha
        itens={[
          ["Cliente:", a.cliente],
          ["Ação:", a.acao],
          ["Processo:", a.processo],
          ["Valor da Causa:", a.valorCausa > 0 ? moeda(a.valorCausa) : ""],
          ["Data de Distribuição:", dataBr],
          [
            "Tempo de Atuação Profissional:",
            a.tempoAtuacaoMeses > 0 ? `${a.tempoAtuacaoMeses} meses` : "",
          ],
        ]}
      />

      {ehExtrato ? (
        <>
          <Titulo>Honorários contratuais por ato processual</Titulo>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-black/40 text-left text-[10px] uppercase">
                <th className="py-1.5 font-semibold">Ato processual</th>
                <th className="py-1.5 text-right font-semibold">Mínimo OAB/SP</th>
                <th className="py-1.5 text-right font-semibold">Complexidade</th>
                <th className="py-1.5 text-right font-semibold">Com redução</th>
                <th className="py-1.5 text-right font-semibold">Êxito</th>
                <th className="py-1.5 text-right font-semibold">Valor final</th>
              </tr>
            </thead>
            <tbody>
              {a.atos.map((ato) => (
                <tr key={ato.id} className="border-b border-black/15">
                  <td className="py-1.5 pr-2">{ato.descricao || "—"}</td>
                  <td className="py-1.5 text-right tabular-nums">{moeda(ato.valorMinimo)}</td>
                  <td className="py-1.5 text-right tabular-nums">{ato.complexidade}%</td>
                  <td className="py-1.5 text-right tabular-nums">{moeda(valorComReducao(ato))}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {ato.exito > 0 ? `+${ato.exito}%` : "—"}
                  </td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">
                    {moeda(valorDoAto(ato))}
                  </td>
                </tr>
              ))}
              <tr className="border-b border-black/30">
                <td className="py-1.5 font-semibold" colSpan={5}>
                  Subtotal honorários
                </td>
                <td className="py-1.5 text-right font-semibold tabular-nums">
                  {moeda(t.honorariosAtos)}
                </td>
              </tr>

              {a.custosExtras.map((c) => (
                <tr key={c.id} className="border-b border-black/15">
                  <td className="py-1.5" colSpan={5}>
                    {c.descricao || "Custos com terceiros"}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{moeda(c.valor)}</td>
                </tr>
              ))}

              <tr className="border-y-2 border-black">
                <td className="py-2 font-bold uppercase" colSpan={5}>
                  Total geral
                </td>
                <td className="py-2 text-right font-bold tabular-nums">{moeda(t.totalExtrato)}</td>
              </tr>
            </tbody>
          </table>
        </>
      ) : (
        <>
          <Texto conteudo={a.textoAbertura} />

          <Titulo>Honorários</Titulo>
          <ul className="space-y-1">
            <li>
              • {moeda(a.honorariosIniciais)} para protocolar a ação;
            </li>
            <li>
              • {percentual(a.percentualExito, 0)} sobre o valor que eventualmente conseguirmos
              com o êxito da ação (seja por acordo ou decisão judicial favorável).
            </li>
          </ul>
          <Texto conteudo={a.textoHonorarios} className="mt-2" />

          <Titulo>Custas processuais</Titulo>
          <Texto conteudo={a.textoCustas} />
          {a.valorCausa > 0 && (
            <p className="mt-2">
              Sobre o valor da causa de <strong>{moeda(a.valorCausa)}</strong>, a taxa judiciária
              de {percentual(a.percentualCustas)} corresponde a{" "}
              <strong>{moeda(t.custas)}</strong>.
            </p>
          )}

          {a.custosExtras.length > 0 && (
            <ul className="mt-2 space-y-1">
              {a.custosExtras.map((c) => (
                <li key={c.id}>
                  • {c.descricao || "Outras despesas"}: {moeda(c.valor)}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 font-semibold">
            Desembolso inicial estimado: {moeda(t.totalIngresso)}
          </p>

          {a.textoRiscos.trim() && (
            <>
              <Titulo>Sobre os riscos</Titulo>
              <Texto conteudo={a.textoRiscos} />
            </>
          )}
        </>
      )}

      {a.observacoes.trim() && (
        <>
          <Titulo>Observações</Titulo>
          <Texto conteudo={a.observacoes} />
        </>
      )}
    </Documento>
  );
}
