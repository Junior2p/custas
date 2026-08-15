"use client";

import { Copy, FilePlus2, Plus, Printer, Save, Trash2 } from "lucide-react";

import {
  atoVazio,
  custoVazio,
  mesesDesde,
  novoId,
  proximoNumero,
  rotuloAcao,
  totaisAcao,
  valorComReducao,
  valorDoAto,
  aplicarTipoDocumento,
  acaoNova,
  type AcaoJudicial,
  type TipoDocumento,
} from "@/lib/acao/modelo";
import { excluirAcao } from "@/lib/acao/armazenamento";
import { useCustas } from "../Contexto";
import { DocumentoAcao } from "../documentos/DocumentoAcao";
import { Pagina } from "../Pagina";
import { Botao, Campo, Numero, Secao, Selecao, Texto, moeda } from "../ui";

export function AcoesJudiciais() {
  const {
    acao: a,
    acoes,
    apresentacao,
    parametrizacao,
    atualizarAcao,
    trocarAcao,
    trocarListaAcoes,
    salvarAcao,
  } = useCustas();

  const t = totaisAcao(a);
  const ehExtrato = a.tipoDocumento === "extrato";
  const salva = acoes.some((x) => x.id === a.id);

  const alterarAto = (id: string, campos: Partial<(typeof a.atos)[number]>) =>
    atualizarAcao({ atos: a.atos.map((x) => (x.id === id ? { ...x, ...campos } : x)) });

  const alterarCusto = (id: string, campos: Partial<(typeof a.custosExtras)[number]>) =>
    atualizarAcao({
      custosExtras: a.custosExtras.map((x) => (x.id === id ? { ...x, ...campos } : x)),
    });

  function excluir() {
    if (!confirm(`Excluir ${rotuloAcao(a)}?`)) return;
    const restante = excluirAcao(a.id);
    trocarListaAcoes(restante);
    trocarAcao(restante[0] ?? acaoNova(restante, a.tipoDocumento));
  }

  return (
    <Pagina
      titulo="Ações judiciais"
      descricao={`${ehExtrato ? "Extrato de honorários" : "Proposta de ingresso"} · ${a.numero}`}
      acao={
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-texto-suave">
              {ehExtrato ? "Total geral" : "Desembolso inicial"}
            </p>
            <p className="text-2xl font-semibold tabular-nums text-marinho">
              {moeda(ehExtrato ? t.totalExtrato : t.totalIngresso)}
            </p>
          </div>
          <Botao onClick={() => window.print()}>
            <Printer size={16} /> Imprimir
          </Botao>
        </div>
      }
    >
      {/* ---------------- gestão ---------------- */}
      {!apresentacao && (
        <div className="rounded-xl border border-borda bg-superficie px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Selecao
              value={salva ? a.id : ""}
              onChange={(e) => {
                const alvo = acoes.find((x) => x.id === e.target.value);
                if (alvo) trocarAcao(alvo);
              }}
              className="max-w-xs flex-1"
              aria-label="Documento"
            >
              {!salva && <option value="">{rotuloAcao(a)} — não salvo</option>}
              {acoes.map((x) => (
                <option key={x.id} value={x.id}>
                  {rotuloAcao(x)}
                </option>
              ))}
            </Selecao>

            <Botao onClick={salvarAcao}>
              <Save size={15} /> Salvar
            </Botao>
            <Botao
              variante="secundario"
              onClick={() => trocarAcao(acaoNova(acoes, a.tipoDocumento))}
            >
              <FilePlus2 size={15} /> Novo
            </Botao>
            <Botao
              variante="secundario"
              onClick={() => {
                const agora = new Date().toISOString();
                trocarAcao({
                  ...a,
                  id: novoId(),
                  numero: proximoNumero(acoes),
                  cliente: a.cliente ? `${a.cliente} (cópia)` : "",
                  criadoEm: agora,
                  atualizadoEm: agora,
                });
              }}
            >
              <Copy size={15} /> Duplicar
            </Botao>
            {salva && (
              <Botao variante="fantasma" onClick={excluir} title="Excluir">
                <Trash2 size={15} />
              </Botao>
            )}
          </div>
          <p className="mt-2 text-[11px] text-texto-suave">
            {acoes.length} documento(s) salvos neste navegador.
          </p>
        </div>
      )}

      {/* ---------------- dados ---------------- */}
      <Secao titulo="Dados do processo">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Tipo de documento">
            <Selecao
              value={a.tipoDocumento}
              onChange={(e) =>
                trocarAcao(aplicarTipoDocumento(a, e.target.value as TipoDocumento))
              }
            >
              <option value="proposta">Proposta de ingresso / defesa</option>
              <option value="extrato">Extrato de honorários (processo em curso)</option>
            </Selecao>
          </Campo>
          <Campo rotulo="Cliente" className="sm:col-span-2">
            <Texto
              value={a.cliente}
              onChange={(e) => atualizarAcao({ cliente: e.target.value })}
              placeholder="Nome do cliente"
            />
          </Campo>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Ação">
            <Texto
              value={a.acao}
              onChange={(e) => atualizarAcao({ acao: e.target.value })}
              placeholder="Ex.: Ação de cobrança"
            />
          </Campo>
          <Campo rotulo="Processo">
            <Texto
              value={a.processo}
              onChange={(e) => atualizarAcao({ processo: e.target.value })}
              placeholder="0000000-00.0000.0.00.0000"
            />
          </Campo>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Valor da causa">
            <Numero moeda valor={a.valorCausa} aoMudar={(v) => atualizarAcao({ valorCausa: v })} />
          </Campo>
          <Campo rotulo="Data de distribuição">
            <input
              type="date"
              value={a.dataDistribuicao}
              onChange={(e) =>
                atualizarAcao({
                  dataDistribuicao: e.target.value,
                  tempoAtuacaoMeses: mesesDesde(e.target.value),
                })
              }
              className="w-full rounded-lg border border-borda bg-white px-3 py-2 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
            />
          </Campo>
          <Campo rotulo="Tempo de atuação (meses)" dica="Calculado pela distribuição; editável.">
            <Numero
              valor={a.tempoAtuacaoMeses}
              aoMudar={(v) => atualizarAcao({ tempoAtuacaoMeses: Math.max(0, Math.round(v)) })}
            />
          </Campo>
        </div>
      </Secao>

      {/* ---------------- extrato: atos processuais ---------------- */}
      {ehExtrato && (
        <Secao
          titulo="Atos processuais"
          descricao="Piso da Tabela OAB/SP ajustado pela complexidade de cada ato."
          acao={
            <Botao
              variante="secundario"
              onClick={() => atualizarAcao({ atos: [...a.atos, atoVazio()] })}
            >
              <Plus size={15} /> Ato
            </Botao>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-xs text-texto-suave">
                  <th className="pb-2 font-medium">Ato processual</th>
                  <th className="pb-2 text-right font-medium">Mínimo OAB</th>
                  <th className="pb-2 text-right font-medium">Complexidade %</th>
                  <th className="pb-2 text-right font-medium">Com redução</th>
                  <th className="pb-2 text-right font-medium">Êxito %</th>
                  <th className="pb-2 text-right font-medium">Valor final</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {a.atos.map((ato) => (
                  <tr key={ato.id} className="border-b border-borda/60">
                    <td className="py-2 pr-2">
                      <Texto
                        value={ato.descricao}
                        onChange={(e) => alterarAto(ato.id, { descricao: e.target.value })}
                        placeholder="Ex.: Contestação"
                      />
                    </td>
                    <td className="w-36 py-2 pr-2">
                      <Numero
                        moeda
                        valor={ato.valorMinimo}
                        aoMudar={(v) => alterarAto(ato.id, { valorMinimo: v })}
                      />
                    </td>
                    <td className="w-24 py-2 pr-2">
                      <Numero
                        valor={ato.complexidade}
                        aoMudar={(v) => alterarAto(ato.id, { complexidade: v })}
                      />
                    </td>
                    <td className="py-2 pr-2 text-right tabular-nums text-texto-suave">
                      {moeda(valorComReducao(ato))}
                    </td>
                    <td className="w-20 py-2 pr-2">
                      <Numero
                        valor={ato.exito}
                        aoMudar={(v) => alterarAto(ato.id, { exito: v })}
                      />
                    </td>
                    <td className="py-2 pr-2 text-right font-medium tabular-nums">
                      {moeda(valorDoAto(ato))}
                    </td>
                    <td className="py-2 text-right">
                      <Botao
                        variante="fantasma"
                        onClick={() =>
                          atualizarAcao({ atos: a.atos.filter((x) => x.id !== ato.id) })
                        }
                        aria-label="Remover ato"
                      >
                        <Trash2 size={15} />
                      </Botao>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold text-marinho">
                  <td className="pt-3" colSpan={5}>
                    Subtotal honorários
                  </td>
                  <td className="pt-3 text-right tabular-nums">{moeda(t.honorariosAtos)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Secao>
      )}

      {/* ---------------- proposta: honorários e custas ---------------- */}
      {!ehExtrato && (
        <Secao titulo="Honorários e custas">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo rotulo="Honorários iniciais" dica="Para protocolar a ação.">
              <Numero
                moeda
                valor={a.honorariosIniciais}
                aoMudar={(v) => atualizarAcao({ honorariosIniciais: v })}
              />
            </Campo>
            <Campo rotulo="Êxito (%)" dica="Sobre o que for efetivamente recebido.">
              <Numero
                valor={a.percentualExito}
                aoMudar={(v) => atualizarAcao({ percentualExito: v })}
              />
            </Campo>
            <Campo rotulo="Taxa judiciária (%)" dica="Em regra 1,5% do valor da causa.">
              <Numero
                valor={a.percentualCustas}
                aoMudar={(v) => atualizarAcao({ percentualCustas: v })}
              />
            </Campo>
          </div>

          <div className="mt-4 rounded-lg bg-marinho-50 px-4 py-3 text-sm text-marinho">
            Honorários iniciais <strong>{moeda(a.honorariosIniciais)}</strong> + taxa judiciária{" "}
            <strong>{moeda(t.custas)}</strong>
            {t.extras > 0 && (
              <>
                {" "}
                + outras despesas <strong>{moeda(t.extras)}</strong>
              </>
            )}{" "}
            = <strong>{moeda(t.totalIngresso)}</strong> de desembolso inicial.
          </div>
        </Secao>
      )}

      {/* ---------------- despesas com terceiros ---------------- */}
      <Secao
        titulo={ehExtrato ? "Custos com terceiros" : "Outras despesas"}
        acao={
          <Botao
            variante="secundario"
            onClick={() => atualizarAcao({ custosExtras: [...a.custosExtras, custoVazio()] })}
          >
            <Plus size={15} /> Despesa
          </Botao>
        }
      >
        {a.custosExtras.length === 0 ? (
          <p className="text-sm text-texto-suave">Nenhuma despesa lançada.</p>
        ) : (
          <div className="space-y-2">
            {a.custosExtras.map((c) => (
              <div key={c.id} className="grid grid-cols-[1fr_160px_40px] items-center gap-2">
                <Texto
                  value={c.descricao}
                  onChange={(e) => alterarCusto(c.id, { descricao: e.target.value })}
                  placeholder="Ex.: Defesa oral — sessão de julgamento (TJ/SP)"
                />
                <Numero
                  moeda
                  valor={c.valor}
                  aoMudar={(v) => alterarCusto(c.id, { valor: v })}
                />
                <Botao
                  variante="fantasma"
                  onClick={() =>
                    atualizarAcao({ custosExtras: a.custosExtras.filter((x) => x.id !== c.id) })
                  }
                  aria-label="Remover despesa"
                >
                  <Trash2 size={15} />
                </Botao>
              </div>
            ))}
          </div>
        )}
      </Secao>

      {/* ---------------- textos do documento ---------------- */}
      <Secao
        titulo="Textos do documento"
        descricao="Revise antes de imprimir — tudo aqui sai no PDF exatamente como estiver."
      >
        <div className="space-y-4">
          <Campo rotulo="Título">
            <Texto value={a.titulo} onChange={(e) => atualizarAcao({ titulo: e.target.value })} />
          </Campo>

          <AreaTexto
            rotulo={ehExtrato ? "Subtítulo" : "Abertura"}
            valor={a.textoAbertura}
            aoMudar={(v) => atualizarAcao({ textoAbertura: v })}
            linhas={2}
          />

          {!ehExtrato && (
            <>
              <AreaTexto
                rotulo="Honorários — texto complementar"
                valor={a.textoHonorarios}
                aoMudar={(v) => atualizarAcao({ textoHonorarios: v })}
              />
              <AreaTexto
                rotulo="Custas processuais"
                valor={a.textoCustas}
                aoMudar={(v) => atualizarAcao({ textoCustas: v })}
                linhas={5}
              />
              <AreaTexto
                rotulo="Sobre os riscos"
                valor={a.textoRiscos}
                aoMudar={(v) => atualizarAcao({ textoRiscos: v })}
                linhas={5}
              />
            </>
          )}

          <AreaTexto
            rotulo="Observações"
            valor={a.observacoes}
            aoMudar={(v) => atualizarAcao({ observacoes: v })}
            linhas={4}
          />
        </div>
      </Secao>

      <DocumentoAcao acao={a} escritorio={parametrizacao.escritorio} />
    </Pagina>
  );
}

function AreaTexto({
  rotulo,
  valor,
  aoMudar,
  linhas = 3,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  linhas?: number;
}) {
  return (
    <Campo rotulo={rotulo}>
      <textarea
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        rows={linhas}
        className="w-full rounded-lg border border-borda bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
      />
    </Campo>
  );
}
