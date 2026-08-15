"use client";

import { Plus, Printer, Trash2 } from "lucide-react";

import { BotaoSalvar } from "../BotaoSalvar";
import { EtapasPatrimoniais } from "../Etapas";
import { imprimirDocumento } from "@/lib/imprimir";
import { useCustas } from "../Contexto";
import { Pagina } from "../Pagina";
import { DocumentoProposta } from "../documentos/DocumentoProposta";
import { Botao, Campo, Numero, Secao, Texto, moeda } from "../ui";

export function PropostaTela() {
  const { cotacao: o, via, resultado, totalProposta, parametrizacao, atualizar } =
    useCustas();

  const entrada = (totalProposta * o.entrada) / 100;
  const saldo = totalProposta - entrada;

  return (
    <Pagina
      titulo="Proposta"
      descricao="O documento que vai ao cliente."
      acao={
        <div className="flex items-center gap-2">
          <BotaoSalvar />
          <Botao onClick={imprimirDocumento}>
            <Printer size={16} /> Imprimir / PDF
          </Botao>
        </div>
      }
      topo={<EtapasPatrimoniais />}
    >
      <Secao titulo="Valor">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Apurado">
            <div className="rounded-lg border border-borda bg-slate-50 px-3 py-2 text-right text-sm tabular-nums">
              {moeda(resultado.total)}
            </div>
          </Campo>
          <Campo rotulo="Valor da proposta" dica="0 = usar o apurado">
            <Numero moeda valor={o.valorNegociado} aoMudar={(v) => atualizar({ valorNegociado: v })} />
          </Campo>
          <Campo rotulo="Diferença">
            <div
              className={`rounded-lg border border-borda px-3 py-2 text-right text-sm tabular-nums ${
                totalProposta < resultado.total ? "text-erro" : "text-positivo"
              }`}
            >
              {totalProposta === resultado.total
                ? "—"
                : moeda(totalProposta - resultado.total)}
            </div>
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Condições de pagamento"
        descricao="Variam caso a caso. O texto livre substitui as parcelas automáticas, se preenchido."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Entrada (%)">
            <Numero valor={o.entrada} aoMudar={(v) => atualizar({ entrada: v })} />
          </Campo>
          <Campo rotulo="Parcelas do saldo">
            <Numero
              valor={o.parcelas}
              aoMudar={(v) => atualizar({ parcelas: Math.max(1, Math.round(v)) })}
            />
          </Campo>
          <Campo rotulo="Validade (dias)">
            <Numero
              valor={o.validadeDias}
              aoMudar={(v) => atualizar({ validadeDias: Math.max(1, Math.round(v)) })}
            />
          </Campo>
        </div>

        <div className="mt-4 rounded-lg bg-marinho-50 px-4 py-3 text-sm text-marinho">
          Entrada de {o.entrada}% — <strong>{moeda(entrada)}</strong> · saldo de{" "}
          <strong>{moeda(saldo)}</strong> em {o.parcelas}x de{" "}
          <strong>{moeda(saldo / o.parcelas)}</strong>
        </div>

        <Campo
          rotulo="Forma de pagamento (texto livre)"
          dica="Preenchido, aparece na proposta no lugar da entrada e das parcelas."
          className="mt-4"
        >
          <textarea
            value={o.formaPagamento}
            onChange={(e) => atualizar({ formaPagamento: e.target.value })}
            rows={3}
            placeholder="Ex.: R$ 5.000,00 na assinatura e o saldo após a lavratura da escritura."
            className="w-full rounded-lg border border-borda bg-white px-3 py-2 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
          />
        </Campo>
      </Secao>

      <Secao
        titulo="O que está incluso"
        acao={
          <Botao
            variante="secundario"
            onClick={() =>
              atualizar({
                itensProposta: [...o.itensProposta, { descricao: "Novo item", incluso: true }],
              })
            }
          >
            <Plus size={15} /> Item
          </Botao>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {o.itensProposta.map((item, i) => (
            <div key={`item-${i}`} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.incluso}
                onChange={(e) =>
                  atualizar({
                    itensProposta: o.itensProposta.map((x, j) =>
                      j === i ? { ...x, incluso: e.target.checked } : x
                    ),
                  })
                }
                className="h-4 w-4 shrink-0 accent-[var(--marinho)]"
                title={item.incluso ? "Incluso" : "Não incluso"}
              />
              <Texto
                value={item.descricao}
                onChange={(e) =>
                  atualizar({
                    itensProposta: o.itensProposta.map((x, j) =>
                      j === i ? { ...x, descricao: e.target.value } : x
                    ),
                  })
                }
              />
              <Botao
                variante="fantasma"
                onClick={() =>
                  atualizar({ itensProposta: o.itensProposta.filter((_, j) => j !== i) })
                }
                aria-label="Remover item"
              >
                <Trash2 size={15} />
              </Botao>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-texto-suave">
          Marcado sai como ✅ (incluso); desmarcado, como ❌ (não incluso).
        </p>
      </Secao>

      <Secao
        titulo="Textos do documento"
        descricao="Revise antes de imprimir — sai no PDF exatamente como estiver aqui."
      >
        <div className="space-y-4">
          <Campo rotulo="Título">
            <Texto
              value={o.tituloProposta}
              onChange={(e) => atualizar({ tituloProposta: e.target.value })}
            />
          </Campo>

          <Campo rotulo="Abertura">
            <textarea
              value={o.textoAbertura}
              onChange={(e) => atualizar({ textoAbertura: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-borda bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
            />
          </Campo>

          <Campo rotulo="Observações">
            <textarea
              value={o.observacoes}
              onChange={(e) => atualizar({ observacoes: e.target.value })}
              rows={3}
              placeholder="Ex.: IPTU em aberto dos dois imóveis."
              className="w-full rounded-lg border border-borda bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
            />
          </Campo>
        </div>
      </Secao>

      <DocumentoProposta
        titulo={o.tituloProposta}
        cliente={o.cliente}
        textoAbertura={o.textoAbertura}
        via={via}
        bens={o.bens}
        itens={o.itensProposta}
        total={totalProposta}
        entradaPercentual={o.entrada}
        parcelas={o.parcelas}
        validadeDias={o.validadeDias}
        formaPagamento={o.formaPagamento}
        observacoes={o.observacoes}
        escritorio={parametrizacao.escritorio}
      />
    </Pagina>
  );
}
