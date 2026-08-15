"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";

import type { Bem, LinhaCusto, ResultadoCalculo, Via } from "@/lib/calculo/tipos";
import { bemVazio } from "@/lib/orcamento/modelo";
import { useCustas } from "../Contexto";
import { BarraOrcamentos } from "../BarraOrcamentos";
import { BotaoSalvar } from "../BotaoSalvar";
import { Pagina } from "../Pagina";
import { Botao, Campo, Interruptor, Numero, Secao, Selecao, Texto, moeda, percentual } from "../ui";
import { SERVICOS } from "@/lib/dados/servicos";
import { aplicarServico } from "@/lib/orcamento/modelo";

export function Apuracao() {
  const {
    cotacao: o,
    servico,
    via,
    judicial,
    extrajudicial,
    resultado,
    apresentacao,
    parametrizacao,
    atualizar,
    trocarCotacao,
  } = useCustas();

  const alterarBem = (id: string, campos: Partial<Bem>) =>
    atualizar({ bens: o.bens.map((b) => (b.id === id ? { ...b, ...campos } : b)) });

  const ajustar = (chave: string, ajuste: { valor?: number; incluso?: boolean } | null) => {
    const ajustes = { ...o.ajustes };
    if (ajuste === null) delete ajustes[chave];
    else ajustes[chave] = { ...ajustes[chave], ...ajuste };
    atualizar({ ajustes });
  };

  return (
    <Pagina
      titulo="Ações Patrimoniais"
      descricao={`${servico.nome} · cotação ${o.numero}`}
      acao={
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-texto-suave">Total apurado</p>
            <p className="text-2xl font-semibold tabular-nums text-marinho">
              {moeda(resultado.total)}
            </p>
          </div>
          <BotaoSalvar />
        </div>
      }
      topo={!apresentacao ? <BarraOrcamentos /> : undefined}
    >

      {/* ---------------- serviço e cliente ---------------- */}
      <Secao titulo="Serviço e cliente">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Tipo de serviço">
            <Selecao
              value={o.tipoServico}
              onChange={(e) => trocarCotacao(aplicarServico(o, e.target.value))}
            >
              {SERVICOS.map((sv) => (
                <option key={sv.chave} value={sv.chave}>
                  {sv.nome}
                </option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Cliente" className="sm:col-span-2">
            <Texto
              value={o.cliente}
              onChange={(e) => atualizar({ cliente: e.target.value })}
              placeholder="Nome do cliente / do espólio"
            />
          </Campo>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {servico.temHerdeiros && (
            <Campo
              rotulo="Quantidade de herdeiros"
              dica="Define as certidões pessoais e o valor por herdeiro."
            >
              <Numero
                valor={o.qtdHerdeiros}
                aoMudar={(v) => atualizar({ qtdHerdeiros: Math.max(0, Math.round(v)) })}
              />
            </Campo>
          )}

          {servico.nomeImposto && (
            <>
              <Campo rotulo={`Alíquota do ${servico.nomeImposto} (%)`}>
                <Numero
                  valor={o.aliquotaImposto ?? servico.impostoAliquota}
                  aoMudar={(v) => atualizar({ aliquotaImposto: v })}
                />
              </Campo>
              <div className="flex items-end pb-2">
                <Interruptor
                  rotulo={`Multa de ${o.parametros.multaPercentual}%`}
                  dica="Recolhimento em atraso"
                  ativo={o.aplicarMulta}
                  aoMudar={(v) => atualizar({ aplicarMulta: v })}
                />
              </div>
            </>
          )}
        </div>

        {o.bens.filter((b) => b.valorVenal > 0).length > 1 && (
          <div className="mt-4 border-t border-borda pt-4">
            <Interruptor
              rotulo="Custas de cartório bem a bem"
              dica="Por padrão a escritura é um ato só: a faixa sai da soma dos bens. Ligue quando os atos forem separados. O registro no SRI é sempre por imóvel, independente disto."
              ativo={o.parametros.notasPorBem}
              aoMudar={(v) =>
                atualizar({ parametros: { ...o.parametros, notasPorBem: v } })
              }
            />
          </div>
        )}

        {servico.observacao && !apresentacao && (
          <p className="mt-4 rounded-lg bg-marinho-50 px-3 py-2 text-xs text-marinho">
            {servico.observacao}
          </p>
        )}
      </Secao>

      {/* ---------------- bens ---------------- */}
      <Secao
        titulo="Bens"
        descricao="Valor venal e a fração que entra na transmissão."
        acao={
          <Botao variante="secundario" onClick={() => atualizar({ bens: [...o.bens, bemVazio()] })}>
            <Plus size={15} /> Bem
          </Botao>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-borda text-left text-xs text-texto-suave">
                <th className="pb-2 font-medium">Descrição</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 text-right font-medium">Valor venal</th>
                <th className="pb-2 text-right font-medium">% transmitido</th>
                <th className="pb-2 text-right font-medium">Certidões</th>
                <th className="pb-2 text-center font-medium">Registrar</th>
                <th className="pb-2 text-right font-medium">Transmitido</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {o.bens.map((bem) => (
                <tr key={bem.id} className="border-b border-borda/60">
                  <td className="py-2 pr-2">
                    <Texto
                      value={bem.descricao}
                      onChange={(e) => alterarBem(bem.id, { descricao: e.target.value })}
                      placeholder="Ex.: Imóvel Rural 24 alq."
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Selecao
                      value={bem.tipo}
                      onChange={(e) => alterarBem(bem.id, { tipo: e.target.value as Bem["tipo"] })}
                    >
                      <option value="imovel">Imóvel</option>
                      <option value="veiculo">Veículo</option>
                      <option value="outro">Outro</option>
                    </Selecao>
                  </td>
                  <td className="w-36 py-2 pr-2">
                    <Numero
                      moeda
                      valor={bem.valorVenal}
                      aoMudar={(v) => alterarBem(bem.id, { valorVenal: v })}
                    />
                  </td>
                  <td className="w-24 py-2 pr-2">
                    <Numero
                      valor={Number((bem.percentual * 100).toFixed(4))}
                      aoMudar={(v) => alterarBem(bem.id, { percentual: v / 100 })}
                    />
                  </td>
                  <td className="w-20 py-2 pr-2">
                    <Numero
                      valor={bem.qtdCertidoes}
                      aoMudar={(v) => alterarBem(bem.id, { qtdCertidoes: Math.max(0, v) })}
                    />
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="checkbox"
                      checked={bem.registrar}
                      disabled={bem.tipo !== "imovel"}
                      onChange={(e) => alterarBem(bem.id, { registrar: e.target.checked })}
                      className="h-4 w-4 accent-[var(--marinho)]"
                    />
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums text-texto-suave">
                    {moeda(bem.valorVenal * bem.percentual)}
                  </td>
                  <td className="py-2 text-right">
                    <Botao
                      variante="fantasma"
                      onClick={() => atualizar({ bens: o.bens.filter((b) => b.id !== bem.id) })}
                      aria-label="Remover bem"
                    >
                      <Trash2 size={15} />
                    </Botao>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="text-sm font-medium">
                <td className="pt-3" colSpan={6}>
                  Total
                </td>
                <td className="pt-3 text-right tabular-nums text-marinho">
                  {moeda(resultado.bases.totalTransmitido)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Secao>

      {/* ---------------- honorários (bastidor) ---------------- */}
      {!apresentacao && servico.catalogo.some((i) => i.chave === "honorarios") && (
        <Secao titulo="Honorários" descricao="Não aparece para o cliente no modo apresentação.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Como calcular">
              <Selecao
                value={o.honorariosModo}
                onChange={(e) =>
                  atualizar({ honorariosModo: e.target.value as typeof o.honorariosModo })
                }
              >
                <option value="fixo">Valor fixo</option>
                <option value="tabela">Tabela OAB</option>
                <option value="percentual">% sobre o valor do bem</option>
                <option value="percentual_custos">% sobre os custos (embutido)</option>
              </Selecao>
            </Campo>

            {o.honorariosModo === "fixo" && (
              <Campo rotulo="Valor">
                <Numero
                  moeda
                  valor={o.honorariosValor}
                  aoMudar={(v) => atualizar({ honorariosValor: v })}
                />
              </Campo>
            )}
            {o.honorariosModo === "percentual" && (
              <Campo rotulo="Percentual sobre o valor transmitido (%)">
                <Numero
                  valor={o.honorariosPercentual}
                  aoMudar={(v) => atualizar({ honorariosPercentual: v })}
                />
              </Campo>
            )}
            {o.honorariosModo === "percentual_custos" && (
              <Campo rotulo="Percentual sobre os custos (%)" dica="Embutido no valor do serviço.">
                <Numero
                  valor={o.honorariosPercentualCustos}
                  aoMudar={(v) => atualizar({ honorariosPercentualCustos: v })}
                />
              </Campo>
            )}
            {o.honorariosModo === "tabela" && (
              <Campo rotulo="Ação">
                <Selecao value={o.acaoOab} onChange={(e) => atualizar({ acaoOab: e.target.value })}>
                  {parametrizacao.tabelaOab.map((a) => (
                    <option key={a.acao} value={a.acao}>
                      {a.acao} — {percentual(a.percentual)} · mín. {moeda(a.valorMinimo)}
                    </option>
                  ))}
                </Selecao>
              </Campo>
            )}
          </div>
        </Secao>
      )}

      {/* ---------------- resultado ---------------- */}
      <Secao
        titulo="Composição"
        descricao={
          servico.vias.length > 1
            ? "As duas vias lado a lado. Qualquer valor pode ser ajustado à mão."
            : "Qualquer valor pode ser ajustado à mão."
        }
      >
        <div className={`grid gap-5 ${servico.vias.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {servico.vias.map((viaAtual: Via) => (
            <QuadroVia
              key={viaAtual}
              via={viaAtual}
              resultado={viaAtual === "judicial" ? judicial : extrajudicial}
              selecionada={via === viaAtual}
              mostrarSeletor={servico.vias.length > 1}
              mostrarMemoria={!apresentacao}
              qtdHerdeiros={servico.temHerdeiros ? o.qtdHerdeiros : 0}
              ajustes={o.ajustes}
              aoSelecionar={() => atualizar({ viaEscolhida: viaAtual })}
              aoAjustar={ajustar}
            />
          ))}
        </div>
      </Secao>
    </Pagina>
  );
}

function QuadroVia({
  via,
  resultado,
  selecionada,
  mostrarSeletor,
  mostrarMemoria,
  qtdHerdeiros,
  ajustes,
  aoSelecionar,
  aoAjustar,
}: {
  via: Via;
  resultado: ResultadoCalculo;
  selecionada: boolean;
  mostrarSeletor: boolean;
  mostrarMemoria: boolean;
  qtdHerdeiros: number;
  ajustes: Record<string, { valor?: number; incluso?: boolean }>;
  aoSelecionar: () => void;
  aoAjustar: (chave: string, ajuste: { valor?: number; incluso?: boolean } | null) => void;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition ${
        selecionada ? "border-marinho bg-marinho-50/40" : "border-borda"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-marinho">
          {via === "judicial" ? "Judicial" : "Cartório (extrajudicial)"}
        </h3>
        {mostrarSeletor && (
          <label className="flex items-center gap-1.5 text-xs text-texto-suave">
            <input
              type="radio"
              name="via"
              checked={selecionada}
              onChange={aoSelecionar}
              className="accent-[var(--marinho)]"
            />
            usar na proposta
          </label>
        )}
      </div>

      <table className="w-full text-sm">
        <tbody>
          {resultado.linhas.map((l) => (
            <LinhaEditavel
              key={`${via}-${l.chave}`}
              linha={l}
              mostrarMemoria={mostrarMemoria}
              ajustada={ajustes[l.chave]?.valor !== undefined}
              aoAjustar={aoAjustar}
            />
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold text-marinho">
            <td className="pt-2.5">TOTAL</td>
            <td className="pt-2.5 pr-9 text-right tabular-nums">{moeda(resultado.total)}</td>
          </tr>
          <tr className="text-xs text-texto-suave">
            <td className="pt-1">Sem o registro</td>
            <td className="pt-1 pr-9 text-right tabular-nums">
              {moeda(resultado.totalSemRegistro)}
            </td>
          </tr>
          {qtdHerdeiros > 0 && (
            <tr className="text-xs text-texto-suave">
              <td className="pt-1">Por herdeiro ({qtdHerdeiros})</td>
              <td className="pt-1 pr-9 text-right tabular-nums">
                {moeda(resultado.total / qtdHerdeiros)}
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

function LinhaEditavel({
  linha,
  mostrarMemoria,
  ajustada,
  aoAjustar,
}: {
  linha: LinhaCusto;
  mostrarMemoria: boolean;
  ajustada: boolean;
  aoAjustar: (chave: string, ajuste: { valor?: number; incluso?: boolean } | null) => void;
}) {
  return (
    <tr className={`border-b border-borda/50 ${linha.incluso ? "" : "opacity-40"}`}>
      <td className="py-1.5 pr-2">
        <span className="block">{linha.nome}</span>
        {mostrarMemoria && (
          <span className="block text-[11px] text-texto-suave">{linha.memoria}</span>
        )}
      </td>
      <td className="w-40 py-1.5">
        <div className="flex items-center gap-1">
          <Numero
            moeda
            valor={linha.valor}
            aoMudar={(v) => aoAjustar(linha.chave, { valor: v })}
            className={`py-1 text-sm ${ajustada ? "border-dourado bg-dourado-50" : "border-transparent bg-transparent hover:border-borda hover:bg-white"}`}
            title={ajustada ? "Valor ajustado à mão" : "Clique para ajustar"}
          />
          <button
            onClick={() => aoAjustar(linha.chave, ajustada ? null : { valor: 0 })}
            title={ajustada ? "Voltar ao valor calculado" : "Zerar esta linha"}
            className="shrink-0 rounded p-1 text-texto-suave transition hover:bg-slate-100 hover:text-texto"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
