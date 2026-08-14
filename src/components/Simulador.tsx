"use client";

// ============================================================
// SIMULADOR — a tela de trabalho da cotação.
// As cotações são gravadas no navegador (localStorage) e podem ser
// exportadas/importadas em arquivo, sem depender de banco.
// O cálculo vem de src/lib/calculo, com as tabelas de 2025.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import { buscarAcao } from "@/lib/calculo/honorarios";
import { calcularOrcamento } from "@/lib/calculo/orcamento";
import { calcularPartilha, type Herdeiro } from "@/lib/calculo/partilha";
import type { Bem, ConfigHonorarios, ContextoCalculo, Via } from "@/lib/calculo/tipos";
import { TABELA_NOTAS_2025, TABELA_SRI_2025, TABELA_OAB } from "@/lib/dados/tabelas-2025";
import {
  CAMPOS_PARAMETROS,
  FAIXAS_CUSTAS_JUDICIAIS,
  PARAMETROS_PADRAO,
} from "@/lib/dados/padroes";
import { SERVICOS, servicoPorChave } from "@/lib/dados/servicos";
import { listar, salvar as gravarCotacao } from "@/lib/orcamento/armazenamento";
import {
  aplicarServico,
  bemVazio,
  novoId,
  orcamentoNovo,
  proximoNumero,
  type Orcamento,
} from "@/lib/orcamento/modelo";
import { BarraOrcamentos } from "./BarraOrcamentos";
import { Proposta } from "./Proposta";
import { Botao, Campo, Interruptor, Numero, Secao, Selecao, Texto, moeda, percentual } from "./ui";

export function Simulador({ apresentacao }: { apresentacao: boolean }) {
  const [lista, setLista] = useState<Orcamento[]>([]);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [referencia, setReferencia] = useState("");

  // Monta só no cliente: numeração e datas dependem do relógio local,
  // e o localStorage não existe no servidor.
  useEffect(() => {
    const salvos = listar();
    const inicial = salvos[0] ?? orcamentoNovo(salvos);
    setLista(salvos);
    setOrcamento(inicial);
    setReferencia(JSON.stringify(inicial));
  }, []);

  if (!orcamento) {
    return (
      <p className="mx-auto max-w-6xl px-4 py-20 text-center text-sm text-texto-suave">
        Carregando…
      </p>
    );
  }

  return (
    <Cotacao
      key={orcamento.id}
      orcamento={orcamento}
      lista={lista}
      referencia={referencia}
      apresentacao={apresentacao}
      setOrcamento={setOrcamento}
      setLista={setLista}
      setReferencia={setReferencia}
    />
  );
}

function Cotacao({
  orcamento: o,
  lista,
  referencia,
  apresentacao,
  setOrcamento,
  setLista,
  setReferencia,
}: {
  orcamento: Orcamento;
  lista: Orcamento[];
  referencia: string;
  apresentacao: boolean;
  setOrcamento: (o: Orcamento) => void;
  setLista: (l: Orcamento[]) => void;
  setReferencia: (r: string) => void;
}) {
  const [verDetalhamento, setVerDetalhamento] = useState(false);
  const atualizar = (campos: Partial<Orcamento>) => setOrcamento({ ...o, ...campos });

  const servico = servicoPorChave(o.tipoServico);
  const via = servico.vias.includes(o.viaEscolhida) ? o.viaEscolhida : servico.vias[0];
  const qtdHerdeiros = o.herdeiros.filter((h) => h.tipo === "herdeiro").length;
  const impostoAliquota = o.aliquotaImposto ?? servico.impostoAliquota;
  const temAlteracoes = JSON.stringify(o) !== referencia;

  // ---------- cálculo ----------
  const honorarios: ConfigHonorarios = useMemo(() => {
    if (o.honorariosModo === "fixo") return { modo: "fixo", valor: o.honorariosValor };
    if (o.honorariosModo === "percentual")
      return { modo: "percentual", percentual: o.honorariosPercentual };
    if (o.honorariosModo === "percentual_custos")
      return { modo: "percentual_custos", percentual: o.honorariosPercentualCustos };
    const acao = buscarAcao(TABELA_OAB, o.acaoOab) ?? TABELA_OAB[0];
    return { modo: "tabela", percentual: acao.percentual, valorMinimo: acao.valorMinimo };
  }, [
    o.honorariosModo,
    o.honorariosValor,
    o.honorariosPercentual,
    o.honorariosPercentualCustos,
    o.acaoOab,
  ]);

  const contextoBase = useMemo(
    (): Omit<ContextoCalculo, "via"> => ({
      bens: o.bens,
      qtdHerdeiros: servico.temHerdeiros ? qtdHerdeiros : 0,
      parametros: { ...o.parametros, impostoAliquota },
      aplicarMulta: o.aplicarMulta,
      honorarios,
      tabelaNotas: TABELA_NOTAS_2025,
      tabelaSri: TABELA_SRI_2025,
      faixasCustasJudiciais: o.faixasCustas,
      catalogo: servico.catalogo,
    }),
    [
      o.bens,
      o.parametros,
      o.aplicarMulta,
      o.faixasCustas,
      servico,
      qtdHerdeiros,
      impostoAliquota,
      honorarios,
    ]
  );

  const judicial = useMemo(
    () => calcularOrcamento({ ...contextoBase, via: "judicial" }),
    [contextoBase]
  );
  const extrajudicial = useMemo(
    () => calcularOrcamento({ ...contextoBase, via: "extrajudicial" }),
    [contextoBase]
  );

  const resultado = via === "judicial" ? judicial : extrajudicial;
  const totalProposta = o.valorNegociado > 0 ? o.valorNegociado : resultado.total;

  const partilha = useMemo(
    () =>
      calcularPartilha(o.bens, o.herdeiros, {
        rateioCustos: o.rateio,
        custoTotal: totalProposta,
      }),
    [o.bens, o.herdeiros, o.rateio, totalProposta]
  );

  // ---------- cotações ----------
  function trocarPara(registro: Orcamento) {
    setOrcamento(registro);
    setReferencia(JSON.stringify(registro));
  }

  function guardar() {
    const nova = gravarCotacao(o);
    setLista(nova);
    const gravado = nova.find((x) => x.id === o.id)!;
    setOrcamento(gravado);
    setReferencia(JSON.stringify(gravado));
  }

  function abrir(id: string) {
    const alvo = lista.find((x) => x.id === id);
    if (!alvo) return;
    if (temAlteracoes && !confirm("Há alterações não salvas. Abrir outra cotação mesmo assim?"))
      return;
    trocarPara(alvo);
  }

  function duplicar() {
    const agora = new Date().toISOString();
    trocarPara({
      ...o,
      id: novoId(),
      numero: proximoNumero(lista),
      cliente: o.cliente ? `${o.cliente} (cópia)` : "",
      status: "rascunho",
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  // ---------- listas ----------
  const alterarBem = (id: string, campos: Partial<Bem>) =>
    atualizar({ bens: o.bens.map((b) => (b.id === id ? { ...b, ...campos } : b)) });

  const alterarHerdeiro = (id: string, campos: Partial<Herdeiro>) =>
    atualizar({ herdeiros: o.herdeiros.map((h) => (h.id === id ? { ...h, ...campos } : h)) });

  function distribuirIgualmente() {
    const sucessores = o.herdeiros.filter((h) => h.tipo === "herdeiro");
    if (!sucessores.length) return;
    const fatia = 1 / sucessores.length;
    atualizar({
      herdeiros: o.herdeiros.map((h) => (h.tipo === "herdeiro" ? { ...h, percentual: fatia } : h)),
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5 pb-10">
      <div className="sem-impressao space-y-5">
        {!apresentacao && (
          <BarraOrcamentos
            lista={lista}
            atual={o}
            temAlteracoes={temAlteracoes}
            aoAbrir={abrir}
            aoNovo={() => trocarPara(orcamentoNovo(lista, o.tipoServico))}
            aoSalvar={guardar}
            aoDuplicar={duplicar}
            aoTrocarLista={(nova, selecionar) => {
              setLista(nova);
              trocarPara(selecionar ?? orcamentoNovo(nova));
            }}
          />
        )}

        {/* ---------------- serviço e cliente ---------------- */}
        <Secao
          titulo="Serviço e cliente"
          acao={
            <span className="text-xs text-texto-suave">
              Cotação <strong className="text-marinho">{o.numero}</strong>
            </span>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo rotulo="Tipo de serviço">
              <Selecao
                value={o.tipoServico}
                onChange={(e) => setOrcamento(aplicarServico(o, e.target.value))}
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
            <Botao
              variante="secundario"
              onClick={() => atualizar({ bens: [...o.bens, bemVazio()] })}
            >
              <Plus size={15} /> Bem
            </Botao>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-borda text-left text-xs text-texto-suave">
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 text-right font-medium">Valor venal</th>
                  <th className="pb-2 text-right font-medium">% transmitido</th>
                  <th className="pb-2 text-right font-medium">Certidões</th>
                  <th className="pb-2 text-center font-medium">Registrar</th>
                  <th className="pb-2 text-right font-medium">Valor transmitido</th>
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
                        onChange={(e) =>
                          alterarBem(bem.id, { tipo: e.target.value as Bem["tipo"] })
                        }
                      >
                        <option value="imovel">Imóvel</option>
                        <option value="veiculo">Veículo</option>
                        <option value="outro">Outro</option>
                      </Selecao>
                    </td>
                    <td className="w-36 py-2 pr-2">
                      <Numero
                        valor={bem.valorVenal}
                        aoMudar={(v) => alterarBem(bem.id, { valorVenal: v })}
                      />
                    </td>
                    <td className="w-28 py-2 pr-2">
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

        {/* ---------------- herdeiros ---------------- */}
        {servico.temHerdeiros && (
          <Secao
            titulo="Herdeiros e quinhões"
            descricao="O percentual do meeiro(a) incide sobre o valor venal; o dos herdeiros, sobre o monte partilhável."
            acao={
              <div className="flex gap-2">
                <Botao variante="secundario" onClick={distribuirIgualmente}>
                  Dividir igual
                </Botao>
                <Botao
                  variante="secundario"
                  onClick={() =>
                    atualizar({
                      herdeiros: [
                        ...o.herdeiros,
                        {
                          id: novoId(),
                          nome: `Herdeiro ${qtdHerdeiros + 1}`,
                          tipo: "herdeiro",
                          percentual: 0,
                        },
                      ],
                    })
                  }
                >
                  <Plus size={15} /> Herdeiro
                </Botao>
              </div>
            }
          >
            <div className="space-y-2">
              {o.herdeiros.map((h) => (
                <div
                  key={h.id}
                  className="grid grid-cols-[1fr_140px_110px_1fr_40px] items-center gap-2"
                >
                  <Texto
                    value={h.nome}
                    onChange={(e) => alterarHerdeiro(h.id, { nome: e.target.value })}
                  />
                  <Selecao
                    value={h.tipo}
                    onChange={(e) =>
                      alterarHerdeiro(h.id, { tipo: e.target.value as Herdeiro["tipo"] })
                    }
                  >
                    <option value="meeiro">Meeiro(a)</option>
                    <option value="herdeiro">Herdeiro(a)</option>
                  </Selecao>
                  <Numero
                    valor={Number((h.percentual * 100).toFixed(4))}
                    aoMudar={(v) => alterarHerdeiro(h.id, { percentual: v / 100 })}
                  />
                  <span className="text-sm tabular-nums text-texto-suave">
                    {moeda(partilha.porHerdeiro.find((p) => p.herdeiroId === h.id)?.valor ?? 0)}
                  </span>
                  <Botao
                    variante="fantasma"
                    onClick={() =>
                      atualizar({ herdeiros: o.herdeiros.filter((x) => x.id !== h.id) })
                    }
                    aria-label="Remover"
                  >
                    <Trash2 size={15} />
                  </Botao>
                </div>
              ))}
            </div>

            {partilha.inconsistencias.length > 0 && (
              <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-alerta">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <div>
                  {partilha.inconsistencias.map((m) => (
                    <p key={m}>{m}</p>
                  ))}
                </div>
              </div>
            )}
          </Secao>
        )}

        {/* ---------------- honorários e condições (uso interno) ---------------- */}
        {!apresentacao && (
          <div className="grid gap-5 lg:grid-cols-2">
            {servico.catalogo.some((i) => i.chave === "honorarios") && (
              <Secao titulo="Honorários">
                <div className="space-y-4">
                  <Campo rotulo="Como calcular">
                    <Selecao
                      value={o.honorariosModo}
                      onChange={(e) =>
                        atualizar({ honorariosModo: e.target.value as ConfigHonorarios["modo"] })
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
                        valor={o.honorariosValor}
                        aoMudar={(v) => atualizar({ honorariosValor: v })}
                      />
                    </Campo>
                  )}
                  {o.honorariosModo === "percentual" && (
                    <Campo rotulo="Percentual sobre o valor transmitido">
                      <Numero
                        valor={o.honorariosPercentual}
                        aoMudar={(v) => atualizar({ honorariosPercentual: v })}
                      />
                    </Campo>
                  )}
                  {o.honorariosModo === "percentual_custos" && (
                    <Campo
                      rotulo="Percentual sobre os custos do serviço"
                      dica="Incide sobre todas as demais linhas apuradas. Não aparece destacado na proposta."
                    >
                      <Numero
                        valor={o.honorariosPercentualCustos}
                        aoMudar={(v) => atualizar({ honorariosPercentualCustos: v })}
                      />
                    </Campo>
                  )}
                  {o.honorariosModo === "tabela" && (
                    <Campo rotulo="Ação" dica="A tabela aplica o percentual e respeita o piso.">
                      <Selecao
                        value={o.acaoOab}
                        onChange={(e) => atualizar({ acaoOab: e.target.value })}
                      >
                        {TABELA_OAB.map((a) => (
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

            <Secao titulo="Condições do cálculo">
              <div className="space-y-3">
                {servico.nomeImposto ? (
                  <Campo
                    rotulo={`Alíquota do ${servico.nomeImposto}`}
                    dica="Vale só para esta cotação."
                  >
                    <Numero
                      valor={impostoAliquota}
                      aoMudar={(v) => atualizar({ aliquotaImposto: v })}
                    />
                  </Campo>
                ) : (
                  <p className="text-xs text-texto-suave">
                    Este serviço não recolhe imposto de transmissão.
                  </p>
                )}

                {servico.nomeImposto && (
                  <Interruptor
                    rotulo={`Aplicar multa sobre o ${servico.nomeImposto}`}
                    dica={`${o.parametros.multaPercentual}% para recolhimento em atraso.`}
                    ativo={o.aplicarMulta}
                    aoMudar={(v) => atualizar({ aplicarMulta: v })}
                  />
                )}

                {servico.temHerdeiros && (
                  <Campo rotulo="Rateio dos custos entre os herdeiros">
                    <Selecao
                      value={o.rateio}
                      onChange={(e) =>
                        atualizar({ rateio: e.target.value as Orcamento["rateio"] })
                      }
                    >
                      <option value="por_quinhao">Proporcional ao quinhão</option>
                      <option value="igualitario">Dividido igualmente</option>
                    </Selecao>
                  </Campo>
                )}
              </div>
            </Secao>
          </div>
        )}

        {/* ---------------- apuração ---------------- */}
        <Secao
          titulo="Apuração"
          descricao={
            apresentacao
              ? "Valor apurado para o serviço."
              : servico.vias.length > 1
                ? "As duas vias lado a lado. A diferença está na linha de custas."
                : servico.vias[0] === "judicial"
                  ? "Via judicial."
                  : "Via extrajudicial (cartório)."
          }
          acao={
            apresentacao ? (
              <Botao variante="fantasma" onClick={() => setVerDetalhamento(!verDetalhamento)}>
                {verDetalhamento ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {verDetalhamento ? "Ocultar detalhamento" : "Ver detalhamento"}
              </Botao>
            ) : undefined
          }
        >
          {apresentacao ? (
            <>
              <div className="rounded-lg border border-marinho/20 bg-marinho-50/50 px-5 py-4">
                <p className="text-xs text-texto-suave">
                  {via === "judicial" ? "Via judicial" : "Via cartório (extrajudicial)"}
                </p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-marinho">
                  {moeda(totalProposta)}
                </p>
                {qtdHerdeiros > 0 && (
                  <p className="mt-1 text-xs text-texto-suave">
                    {moeda(totalProposta / qtdHerdeiros)} por herdeiro ({qtdHerdeiros})
                  </p>
                )}
              </div>

              {verDetalhamento && (
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {resultado.linhas
                      .filter((l) => l.incluso)
                      .map((l) => (
                        <tr key={l.chave} className="border-b border-borda/50">
                          <td className="py-1.5">{l.nome}</td>
                          <td className="py-1.5 text-right tabular-nums">{moeda(l.valor)}</td>
                        </tr>
                      ))}
                    <tr className="font-semibold text-marinho">
                      <td className="pt-2.5">TOTAL APURADO</td>
                      <td className="pt-2.5 text-right tabular-nums">{moeda(resultado.total)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </>
          ) : (
            <div className={`grid gap-5 ${servico.vias.length > 1 ? "lg:grid-cols-2" : ""}`}>
              {servico.vias.map((viaAtual: Via) => {
                const r = viaAtual === "judicial" ? judicial : extrajudicial;
                const selecionada = via === viaAtual;
                return (
                  <div
                    key={viaAtual}
                    className={`rounded-lg border p-4 transition ${
                      selecionada ? "border-marinho bg-marinho-50/40" : "border-borda"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-marinho">
                        {viaAtual === "judicial" ? "Judicial" : "Cartório (extrajudicial)"}
                      </h3>
                      {servico.vias.length > 1 && (
                        <label className="flex items-center gap-1.5 text-xs text-texto-suave">
                          <input
                            type="radio"
                            name="via"
                            checked={selecionada}
                            onChange={() => atualizar({ viaEscolhida: viaAtual })}
                            className="accent-[var(--marinho)]"
                          />
                          usar na proposta
                        </label>
                      )}
                    </div>

                    <table className="w-full text-sm">
                      <tbody>
                        {r.linhas.map((l) => (
                          <tr key={`${viaAtual}-${l.chave}`} className="border-b border-borda/50">
                            <td className="py-1.5">
                              <span className="block">{l.nome}</span>
                              <span className="block text-[11px] text-texto-suave">
                                {l.memoria}
                              </span>
                            </td>
                            <td className="py-1.5 text-right tabular-nums">{moeda(l.valor)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="font-semibold text-marinho">
                          <td className="pt-2.5">TOTAL</td>
                          <td className="pt-2.5 text-right tabular-nums">{moeda(r.total)}</td>
                        </tr>
                        <tr className="text-xs text-texto-suave">
                          <td className="pt-1">Sem o registro</td>
                          <td className="pt-1 text-right tabular-nums">
                            {moeda(r.totalSemRegistro)}
                          </td>
                        </tr>
                        {servico.temHerdeiros && qtdHerdeiros > 0 && (
                          <tr className="text-xs text-texto-suave">
                            <td className="pt-1">Por herdeiro ({qtdHerdeiros})</td>
                            <td className="pt-1 text-right tabular-nums">
                              {moeda(r.totalPorHerdeiro)}
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </Secao>

        {/* ---------------- cotas-partes ---------------- */}
        {servico.temPartilha && o.herdeiros.length > 0 && (
          <Secao titulo="Cotas-partes" descricao="Quinhão de cada um e o custo do serviço rateado.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-borda text-left text-xs text-texto-suave">
                    <th className="pb-2 font-medium">Nome</th>
                    <th className="pb-2 font-medium">Condição</th>
                    <th className="pb-2 text-right font-medium">% do espólio</th>
                    <th className="pb-2 text-right font-medium">Quinhão</th>
                    <th className="pb-2 text-right font-medium">Custo rateado</th>
                    <th className="pb-2 text-right font-medium">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {partilha.porHerdeiro.map((p) => (
                    <tr key={p.herdeiroId} className="border-b border-borda/60">
                      <td className="py-2">{p.nome}</td>
                      <td className="py-2 text-texto-suave">
                        {p.tipo === "meeiro" ? "Meeiro(a)" : "Herdeiro(a)"}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {percentual(p.percentualTotal)}
                      </td>
                      <td className="py-2 text-right tabular-nums">{moeda(p.valor)}</td>
                      <td className="py-2 text-right tabular-nums text-erro">
                        −{moeda(p.custoRateado)}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums">
                        {moeda(p.liquido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold text-marinho">
                    <td className="pt-3" colSpan={3}>
                      Total
                    </td>
                    <td className="pt-3 text-right tabular-nums">
                      {moeda(partilha.totalMonte + partilha.totalMeacao)}
                    </td>
                    <td className="pt-3 text-right tabular-nums">−{moeda(totalProposta)}</td>
                    <td className="pt-3 text-right tabular-nums">
                      {moeda(partilha.totalMonte + partilha.totalMeacao - totalProposta)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Secao>
        )}

        {/* ---------------- parametrização (uso interno) ---------------- */}
        {!apresentacao && (
          <Secao
            titulo="Parametrização"
            descricao="Gravada junto com a cotação — um orçamento antigo continua mostrando os números com que foi feito."
            acao={
              <Botao
                variante="secundario"
                onClick={() =>
                  atualizar({
                    parametros: { ...PARAMETROS_PADRAO },
                    faixasCustas: FAIXAS_CUSTAS_JUDICIAIS.map((f) => ({ ...f })),
                    aliquotaImposto: null,
                  })
                }
              >
                <RotateCcw size={15} /> Restaurar
              </Botao>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPOS_PARAMETROS.map((campo) => (
                <Campo
                  key={campo.chave}
                  rotulo={`${campo.rotulo}${campo.formato === "percentual" ? " (%)" : ""}`}
                  dica={campo.dica}
                >
                  <Numero
                    valor={o.parametros[campo.chave]}
                    aoMudar={(v) => atualizar({ parametros: { ...o.parametros, [campo.chave]: v } })}
                  />
                </Campo>
              ))}
            </div>

            <div className="mt-6">
              <p className="mb-1 text-xs font-medium text-texto-suave">
                Custas judiciais — degraus em UFESP
              </p>
              <p className="mb-3 text-[11px] text-texto-suave">
                Aplicados sobre o monte-mor / valor da ação. Hoje: {moeda(o.parametros.ufesp)} por
                UFESP.
              </p>
              <div className="space-y-2">
                {o.faixasCustas.map((faixa, i) => (
                  <div
                    key={faixa.ordem}
                    className="grid grid-cols-[auto_1fr_auto_1fr_auto_100px_auto] items-center gap-2 text-xs text-texto-suave"
                  >
                    <span>de</span>
                    <Numero
                      valor={faixa.valorDe}
                      aoMudar={(v) =>
                        atualizar({
                          faixasCustas: o.faixasCustas.map((f, j) =>
                            j === i ? { ...f, valorDe: v } : f
                          ),
                        })
                      }
                    />
                    <span>até</span>
                    <Numero
                      valor={faixa.valorAte ?? 0}
                      placeholder="sem limite"
                      aoMudar={(v) =>
                        atualizar({
                          faixasCustas: o.faixasCustas.map((f, j) =>
                            j === i ? { ...f, valorAte: v > 0 ? v : null } : f
                          ),
                        })
                      }
                    />
                    <span>=</span>
                    <Numero
                      valor={faixa.quantidade}
                      aoMudar={(v) =>
                        atualizar({
                          faixasCustas: o.faixasCustas.map((f, j) =>
                            j === i ? { ...f, quantidade: v } : f
                          ),
                        })
                      }
                    />
                    <span className="whitespace-nowrap">
                      UFESP = {moeda(faixa.quantidade * o.parametros.ufesp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Secao>
        )}

        {/* ---------------- proposta ---------------- */}
        <Secao
          titulo="Proposta ao cliente"
          descricao="O que o cliente recebe."
          acao={
            <Botao onClick={() => window.print()}>
              <Printer size={16} /> Imprimir
            </Botao>
          }
        >
          <div className="grid gap-4 sm:grid-cols-4">
            {!apresentacao && (
              <Campo rotulo="Valor apurado">
                <div className="rounded-lg border border-borda bg-slate-50 px-3 py-2 text-right text-sm tabular-nums">
                  {moeda(resultado.total)}
                </div>
              </Campo>
            )}
            <Campo
              rotulo={apresentacao ? "Valor do serviço" : "Valor negociado"}
              dica={apresentacao ? undefined : "0 = usar o apurado"}
            >
              <Numero valor={o.valorNegociado} aoMudar={(v) => atualizar({ valorNegociado: v })} />
            </Campo>
            <Campo rotulo="Entrada (%)">
              <Numero valor={o.entrada} aoMudar={(v) => atualizar({ entrada: v })} />
            </Campo>
            <Campo rotulo="Parcelas do saldo">
              <Numero
                valor={o.parcelas}
                aoMudar={(v) => atualizar({ parcelas: Math.max(1, Math.round(v)) })}
              />
            </Campo>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-texto-suave">
              Itens da proposta — marque o que está incluso
            </p>
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
            <Botao
              variante="secundario"
              className="mt-3"
              onClick={() =>
                atualizar({
                  itensProposta: [...o.itensProposta, { descricao: "Novo item", incluso: true }],
                })
              }
            >
              <Plus size={15} /> Item
            </Botao>
          </div>

          <Campo rotulo="Observações" className="mt-5">
            <textarea
              value={o.observacoes}
              onChange={(e) => atualizar({ observacoes: e.target.value })}
              rows={3}
              placeholder="Ex.: IPTU em aberto dos dois imóveis."
              className="w-full rounded-lg border border-borda bg-white px-3 py-2 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
            />
          </Campo>
        </Secao>
      </div>

      <Proposta
        cliente={o.cliente}
        textoAbertura={servico.textoProposta}
        via={via}
        bens={o.bens}
        itens={o.itensProposta}
        total={totalProposta}
        entradaPercentual={o.entrada}
        parcelas={o.parcelas}
        validadeDias={30}
        observacoes={o.observacoes}
      />
    </div>
  );
}
