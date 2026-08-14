"use client";

// ============================================================
// SIMULADOR — versão de trabalho, ainda sem banco.
// Usa o mesmo motor de cálculo que vai rodar no sistema final
// (src/lib/calculo), com as tabelas 2025 extraídas da planilha.
// ============================================================

import { useMemo, useState } from "react";
import { Plus, Printer, RotateCcw, Trash2, TriangleAlert } from "lucide-react";

import { calcularOrcamento } from "@/lib/calculo/orcamento";
import { buscarAcao } from "@/lib/calculo/honorarios";
import { calcularPartilha, type Herdeiro } from "@/lib/calculo/partilha";
import type {
  Bem,
  ConfigHonorarios,
  ContextoCalculo,
  FaixaCustasJudiciais,
  Parametros,
  Via,
} from "@/lib/calculo/tipos";
import { TABELA_NOTAS_2025, TABELA_SRI_2025, TABELA_OAB } from "@/lib/dados/tabelas-2025";
import {
  CAMPOS_PARAMETROS,
  CONDICOES_PADRAO,
  FAIXAS_CUSTAS_JUDICIAIS,
  PARAMETROS_PADRAO,
} from "@/lib/dados/padroes";
import { SERVICOS, servicoPorChave } from "@/lib/dados/servicos";
import { Proposta } from "./Proposta";
import { Botao, Campo, Interruptor, Numero, Secao, Selecao, Texto, moeda, percentual } from "./ui";

let sequencia = 0;
const novoId = () => `id_${++sequencia}`;

const bemVazio = (): Bem & { id: string } => ({
  id: novoId(),
  descricao: "",
  tipo: "imovel",
  valorVenal: 0,
  percentual: 1,
  registrar: true,
  qtdCertidoes: 1,
});

export function Simulador() {
  const [tipoServico, setTipoServico] = useState(SERVICOS[0].chave);
  const [cliente, setCliente] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [bens, setBens] = useState<(Bem & { id: string })[]>([
    { ...bemVazio(), descricao: "Imóvel", valorVenal: 20000 },
  ]);

  const [herdeiros, setHerdeiros] = useState<Herdeiro[]>([
    { id: novoId(), nome: "Meeiro(a)", tipo: "meeiro", percentual: 0.5 },
    { id: novoId(), nome: "Herdeiro 1", tipo: "herdeiro", percentual: 0.5 },
    { id: novoId(), nome: "Herdeiro 2", tipo: "herdeiro", percentual: 0.5 },
  ]);

  const [honorariosModo, setHonorariosModo] = useState<ConfigHonorarios["modo"]>(
    SERVICOS[0].honorariosPadrao.modo
  );
  const [honorariosValor, setHonorariosValor] = useState(2000);
  const [honorariosPercentual, setHonorariosPercentual] = useState(8);
  const [honorariosPercentualCustos, setHonorariosPercentualCustos] = useState(10);
  const [acaoOab, setAcaoOab] = useState(SERVICOS[0].acaoOab ?? TABELA_OAB[0].acao);

  const [aplicarMulta, setAplicarMulta] = useState(false);
  const [rateio, setRateio] = useState<"por_quinhao" | "igualitario">("por_quinhao");

  // Parametrização — depois vem do banco; aqui já dá para ajustar e ver o efeito.
  const [parametros, setParametros] = useState<Parametros>(PARAMETROS_PADRAO);
  const [faixasCustas, setFaixasCustas] =
    useState<FaixaCustasJudiciais[]>(FAIXAS_CUSTAS_JUDICIAIS);
  const [aliquotas, setAliquotas] = useState<Record<string, number>>({});

  const [valorNegociado, setValorNegociado] = useState(0);
  const [viaEscolhida, setViaEscolhida] = useState<Via>("extrajudicial");
  const [itensProposta, setItensProposta] = useState(SERVICOS[0].itensProposta);
  const [entrada, setEntrada] = useState(CONDICOES_PADRAO.entradaPercentual);
  const [parcelas, setParcelas] = useState(CONDICOES_PADRAO.parcelas);

  const servico = servicoPorChave(tipoServico);
  const impostoAliquota = aliquotas[servico.chave] ?? servico.impostoAliquota;
  const qtdHerdeiros = herdeiros.filter((h) => h.tipo === "herdeiro").length;

  // A via escolhida precisa existir no serviço (escritura só tem cartório, p. ex.).
  const via = servico.vias.includes(viaEscolhida) ? viaEscolhida : servico.vias[0];

  const honorarios: ConfigHonorarios = useMemo(() => {
    if (honorariosModo === "fixo") return { modo: "fixo", valor: honorariosValor };
    if (honorariosModo === "percentual")
      return { modo: "percentual", percentual: honorariosPercentual };
    if (honorariosModo === "percentual_custos")
      return { modo: "percentual_custos", percentual: honorariosPercentualCustos };
    const acao = buscarAcao(TABELA_OAB, acaoOab) ?? TABELA_OAB[0];
    return { modo: "tabela", percentual: acao.percentual, valorMinimo: acao.valorMinimo };
  }, [
    honorariosModo,
    honorariosValor,
    honorariosPercentual,
    honorariosPercentualCustos,
    acaoOab,
  ]);

  const contextoBase = useMemo(
    (): Omit<ContextoCalculo, "via"> => ({
      bens,
      qtdHerdeiros: servico.temHerdeiros ? qtdHerdeiros : 0,
      parametros: { ...parametros, impostoAliquota },
      aplicarMulta,
      honorarios,
      tabelaNotas: TABELA_NOTAS_2025,
      tabelaSri: TABELA_SRI_2025,
      faixasCustasJudiciais: faixasCustas,
      catalogo: servico.catalogo,
    }),
    [bens, servico, qtdHerdeiros, parametros, impostoAliquota, aplicarMulta, honorarios, faixasCustas]
  );

  const judicial = useMemo(
    () => calcularOrcamento({ ...contextoBase, via: "judicial" }),
    [contextoBase]
  );
  const extrajudicial = useMemo(
    () => calcularOrcamento({ ...contextoBase, via: "extrajudicial" }),
    [contextoBase]
  );

  const resultadoEscolhido = via === "judicial" ? judicial : extrajudicial;
  const totalProposta = valorNegociado > 0 ? valorNegociado : resultadoEscolhido.total;

  const partilha = useMemo(
    () =>
      calcularPartilha(bens, herdeiros, {
        rateioCustos: rateio,
        custoTotal: totalProposta,
      }),
    [bens, herdeiros, rateio, totalProposta]
  );

  // ---------- manipulação de listas ----------
  const alterarBem = (id: string, campo: Partial<Bem>) =>
    setBens((atual) => atual.map((b) => (b.id === id ? { ...b, ...campo } : b)));

  const alterarHerdeiro = (id: string, campo: Partial<Herdeiro>) =>
    setHerdeiros((atual) => atual.map((h) => (h.id === id ? { ...h, ...campo } : h)));

  const distribuirIgualmente = () => {
    const sucessores = herdeiros.filter((h) => h.tipo === "herdeiro");
    if (sucessores.length === 0) return;
    const fatia = 1 / sucessores.length;
    setHerdeiros((atual) =>
      atual.map((h) => (h.tipo === "herdeiro" ? { ...h, percentual: fatia } : h))
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ---------------- cabeçalho ---------------- */}
      <header className="sem-impressao mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-dourado uppercase">
            Escritório Edmilson Lopes Junior
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-marinho">
            Custas, Escrituração e Honorários
          </h1>
          <p className="mt-1 text-sm text-texto-suave">
            Simulador com as tabelas de Notas e Registro de Imóveis de 2025.
          </p>
        </div>
        <Botao onClick={() => window.print()}>
          <Printer size={16} /> Imprimir proposta
        </Botao>
      </header>

      <div className="sem-impressao space-y-5">
        {/* ---------------- serviço e cliente ---------------- */}
        <Secao titulo="Serviço e cliente">
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo rotulo="Tipo de serviço">
              <Selecao
                value={tipoServico}
                onChange={(e) => {
                  const novo = servicoPorChave(e.target.value);
                  setTipoServico(novo.chave);
                  if (novo.acaoOab) setAcaoOab(novo.acaoOab);
                  setHonorariosModo(novo.honorariosPadrao.modo);
                  if (novo.honorariosPadrao.modo === "percentual_custos") {
                    setHonorariosPercentualCustos(novo.honorariosPadrao.percentual);
                  }
                  setItensProposta(novo.itensProposta);
                }}
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
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nome do cliente / do espólio"
              />
            </Campo>
          </div>

          {servico.observacao && (
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
            <Botao variante="secundario" onClick={() => setBens((a) => [...a, bemVazio()])}>
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
                {bens.map((bem) => (
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
                        onClick={() => setBens((a) => a.filter((b) => b.id !== bem.id))}
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
                    {moeda(judicial.bases.totalTransmitido)}
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
                    setHerdeiros((a) => [
                      ...a,
                      {
                        id: novoId(),
                        nome: `Herdeiro ${a.filter((h) => h.tipo === "herdeiro").length + 1}`,
                        tipo: "herdeiro",
                        percentual: 0,
                      },
                    ])
                  }
                >
                  <Plus size={15} /> Herdeiro
                </Botao>
              </div>
            }
          >
            <div className="space-y-2">
              {herdeiros.map((h) => (
                <div key={h.id} className="grid grid-cols-[1fr_140px_110px_1fr_40px] items-center gap-2">
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
                    onClick={() => setHerdeiros((a) => a.filter((x) => x.id !== h.id))}
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

        {/* ---------------- honorários e opções ---------------- */}
        <div className="grid gap-5 lg:grid-cols-2">
          {servico.catalogo.some((i) => i.chave === "honorarios") && (
            <Secao titulo="Honorários">
              <div className="space-y-4">
                <Campo rotulo="Como calcular">
                  <Selecao
                    value={honorariosModo}
                    onChange={(e) =>
                      setHonorariosModo(e.target.value as ConfigHonorarios["modo"])
                    }
                  >
                    <option value="fixo">Valor fixo</option>
                    <option value="tabela">Tabela OAB</option>
                    <option value="percentual">% sobre o valor do bem</option>
                    <option value="percentual_custos">
                      % sobre os custos (embutido)
                    </option>
                  </Selecao>
                </Campo>

                {honorariosModo === "fixo" && (
                  <Campo rotulo="Valor">
                    <Numero valor={honorariosValor} aoMudar={setHonorariosValor} />
                  </Campo>
                )}
                {honorariosModo === "percentual" && (
                  <Campo rotulo="Percentual sobre o valor transmitido">
                    <Numero valor={honorariosPercentual} aoMudar={setHonorariosPercentual} />
                  </Campo>
                )}
                {honorariosModo === "percentual_custos" && (
                  <Campo
                    rotulo="Percentual sobre os custos do serviço"
                    dica="Incide sobre todas as demais linhas apuradas. Não aparece destacado na proposta — entra no valor do serviço."
                  >
                    <Numero
                      valor={honorariosPercentualCustos}
                      aoMudar={setHonorariosPercentualCustos}
                    />
                  </Campo>
                )}
                {honorariosModo === "tabela" && (
                  <Campo rotulo="Ação" dica="A tabela aplica o percentual e respeita o piso.">
                    <Selecao value={acaoOab} onChange={(e) => setAcaoOab(e.target.value)}>
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
                  dica="Vale só para este serviço."
                >
                  <Numero
                    valor={impostoAliquota}
                    aoMudar={(v) => setAliquotas((a) => ({ ...a, [servico.chave]: v }))}
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
                  dica={`${parametros.multaPercentual}% para recolhimento em atraso.`}
                  ativo={aplicarMulta}
                  aoMudar={setAplicarMulta}
                />
              )}

              {servico.temHerdeiros && (
                <Campo rotulo="Rateio dos custos entre os herdeiros">
                  <Selecao
                    value={rateio}
                    onChange={(e) => setRateio(e.target.value as typeof rateio)}
                  >
                    <option value="por_quinhao">Proporcional ao quinhão</option>
                    <option value="igualitario">Dividido igualmente</option>
                  </Selecao>
                </Campo>
              )}
            </div>
          </Secao>
        </div>

        {/* ---------------- resultado ---------------- */}
        <Secao
          titulo="Apuração"
          descricao={
            servico.vias.length > 1
              ? "As duas vias lado a lado. A diferença está na linha de custas."
              : servico.vias[0] === "judicial"
                ? "Via judicial."
                : "Via extrajudicial (cartório)."
          }
        >
          <div className={`grid gap-5 ${servico.vias.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {servico.vias.map(
              (viaAtual: Via) => {
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
                            onChange={() => setViaEscolhida(viaAtual)}
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
              }
            )}
          </div>
        </Secao>

        {/* ---------------- partilha ---------------- */}
        {servico.temPartilha && herdeiros.length > 0 && (
          <Secao
            titulo="Cotas-partes"
            descricao="Quinhão de cada um e o custo do serviço rateado."
          >
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
                      <td className="py-2 text-right tabular-nums">{percentual(p.percentualTotal)}</td>
                      <td className="py-2 text-right tabular-nums">{moeda(p.valor)}</td>
                      <td className="py-2 text-right tabular-nums text-erro">
                        −{moeda(p.custoRateado)}
                      </td>
                      <td className="py-2 text-right font-medium tabular-nums">{moeda(p.liquido)}</td>
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

        {/* ---------------- parametrização ---------------- */}
        <Secao
          titulo="Parametrização"
          descricao="Valores de referência do cálculo. Aqui é provisório — vira a tela de Parametrização, gravada no banco."
          acao={
            <Botao
              variante="secundario"
              onClick={() => {
                setParametros(PARAMETROS_PADRAO);
                setFaixasCustas(FAIXAS_CUSTAS_JUDICIAIS);
                setAliquotas({});
              }}
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
                  valor={parametros[campo.chave]}
                  aoMudar={(v) => setParametros((a) => ({ ...a, [campo.chave]: v }))}
                />
              </Campo>
            ))}
          </div>

          <div className="mt-6">
            <p className="mb-1 text-xs font-medium text-texto-suave">
              Custas judiciais — degraus em UFESP
            </p>
            <p className="mb-3 text-[11px] text-texto-suave">
              Aplicados sobre o monte-mor / valor da ação. Hoje: {moeda(parametros.ufesp)} por UFESP.
            </p>
            <div className="space-y-2">
              {faixasCustas.map((faixa, i) => (
                <div
                  key={faixa.ordem}
                  className="grid grid-cols-[auto_1fr_auto_1fr_auto_100px_auto] items-center gap-2 text-xs text-texto-suave"
                >
                  <span>de</span>
                  <Numero
                    valor={faixa.valorDe}
                    aoMudar={(v) =>
                      setFaixasCustas((a) =>
                        a.map((f, j) => (j === i ? { ...f, valorDe: v } : f))
                      )
                    }
                  />
                  <span>até</span>
                  <Numero
                    valor={faixa.valorAte ?? 0}
                    placeholder="sem limite"
                    aoMudar={(v) =>
                      setFaixasCustas((a) =>
                        a.map((f, j) => (j === i ? { ...f, valorAte: v > 0 ? v : null } : f))
                      )
                    }
                  />
                  <span>=</span>
                  <Numero
                    valor={faixa.quantidade}
                    aoMudar={(v) =>
                      setFaixasCustas((a) =>
                        a.map((f, j) => (j === i ? { ...f, quantidade: v } : f))
                      )
                    }
                  />
                  <span className="whitespace-nowrap">
                    UFESP = {moeda(faixa.quantidade * parametros.ufesp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Secao>

        {/* ---------------- proposta ---------------- */}
        <Secao
          titulo="Proposta ao cliente"
          descricao="O que o cliente recebe. O valor negociado substitui o apurado."
        >
          <div className="grid gap-4 sm:grid-cols-4">
            <Campo rotulo="Valor apurado">
              <div className="rounded-lg border border-borda bg-slate-50 px-3 py-2 text-right text-sm tabular-nums">
                {moeda(resultadoEscolhido.total)}
              </div>
            </Campo>
            <Campo rotulo="Valor negociado" dica="0 = usar o apurado">
              <Numero valor={valorNegociado} aoMudar={setValorNegociado} />
            </Campo>
            <Campo rotulo="Entrada (%)">
              <Numero valor={entrada} aoMudar={setEntrada} />
            </Campo>
            <Campo rotulo="Parcelas do saldo">
              <Numero valor={parcelas} aoMudar={(v) => setParcelas(Math.max(1, Math.round(v)))} />
            </Campo>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-texto-suave">
              Itens da proposta — marque o que está incluso
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {itensProposta.map((item, i) => (
                <div key={item.descricao} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.incluso}
                    onChange={(e) =>
                      setItensProposta((a) =>
                        a.map((x, j) => (j === i ? { ...x, incluso: e.target.checked } : x))
                      )
                    }
                    className="h-4 w-4 shrink-0 accent-[var(--marinho)]"
                  />
                  <Texto
                    value={item.descricao}
                    onChange={(e) =>
                      setItensProposta((a) =>
                        a.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x))
                      )
                    }
                  />
                  <Botao
                    variante="fantasma"
                    onClick={() => setItensProposta((a) => a.filter((_, j) => j !== i))}
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
                setItensProposta((a) => [...a, { descricao: "Novo item", incluso: true }])
              }
            >
              <Plus size={15} /> Item
            </Botao>
          </div>

          <Campo rotulo="Observações" className="mt-5">
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Ex.: IPTU em aberto dos dois imóveis."
              className="w-full rounded-lg border border-borda bg-white px-3 py-2 text-sm outline-none focus:border-marinho focus:ring-2 focus:ring-marinho/15"
            />
          </Campo>
        </Secao>
      </div>

      {/* ---------------- área de impressão ---------------- */}
      <Proposta
        cliente={cliente}
        textoAbertura={servico.textoProposta}
        via={via}
        bens={bens}
        itens={itensProposta}
        total={totalProposta}
        entradaPercentual={entrada}
        parcelas={parcelas}
        validadeDias={CONDICOES_PADRAO.validadeDias}
        observacoes={observacoes}
      />
    </div>
  );
}
