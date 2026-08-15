"use client";

import { Plus, Trash2, TriangleAlert, Users } from "lucide-react";

import type { Herdeiro } from "@/lib/calculo/partilha";
import { gerarHerdeiros, novoId } from "@/lib/orcamento/modelo";
import { BotaoSalvar } from "../BotaoSalvar";
import { useCustas } from "../Contexto";
import { Pagina } from "../Pagina";
import { Botao, Campo, Secao, Selecao, Texto, Numero, moeda, percentual } from "../ui";

export function Herdeiros() {
  const { cotacao: o, servico, partilha, totalProposta, atualizar } = useCustas();

  const alterar = (id: string, campos: Partial<Herdeiro>) =>
    atualizar({ herdeiros: o.herdeiros.map((h) => (h.id === id ? { ...h, ...campos } : h)) });

  const sucessores = o.herdeiros.filter((h) => h.tipo === "herdeiro");

  /** Mantém a contagem da cotação alinhada com a lista nominal. */
  const sincronizar = (lista: Herdeiro[]) =>
    atualizar({
      herdeiros: lista,
      qtdHerdeiros: lista.filter((h) => h.tipo === "herdeiro").length || o.qtdHerdeiros,
    });

  if (!servico.temPartilha) {
    return (
      <Pagina titulo="Herdeiros e quinhões">
        <Secao titulo="Não se aplica">
          <p className="text-sm text-texto-suave">
            O serviço <strong>{servico.nome}</strong> não envolve partilha de quinhões.
          </p>
        </Secao>
      </Pagina>
    );
  }

  return (
    <Pagina
      titulo="Herdeiros e quinhões"
      descricao="Para cotar basta a quantidade. O detalhamento aqui serve na hora de fazer o inventário."
      acao={
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-texto-suave">Monte partilhável</p>
            <p className="text-xl font-semibold tabular-nums text-marinho">
              {moeda(partilha.totalMonte)}
            </p>
          </div>
          <BotaoSalvar />
        </div>
      }
    >
      <Secao
        titulo="Quem participa"
        descricao="O percentual do meeiro(a) incide sobre o valor venal; o dos herdeiros, sobre o monte partilhável."
        acao={
          <div className="flex flex-wrap gap-2">
            <Botao
              variante="secundario"
              onClick={() => sincronizar(gerarHerdeiros(o.qtdHerdeiros, true))}
              title="Cria a lista a partir da quantidade informada na apuração"
            >
              <Users size={15} /> Gerar {o.qtdHerdeiros} herdeiro(s)
            </Botao>
            <Botao
              variante="secundario"
              onClick={() =>
                sincronizar([
                  ...o.herdeiros,
                  {
                    id: novoId(),
                    nome: `Herdeiro ${sucessores.length + 1}`,
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
        {o.herdeiros.length === 0 ? (
          <p className="rounded-lg border border-dashed border-borda px-4 py-6 text-center text-sm text-texto-suave">
            Nenhum herdeiro detalhado. A cotação está usando{" "}
            <strong className="text-marinho">{o.qtdHerdeiros}</strong> herdeiro(s) para calcular as
            certidões — o detalhamento só é necessário na hora da partilha.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {o.herdeiros.map((h) => (
                <div
                  key={h.id}
                  className="grid grid-cols-[1fr_140px_110px_1fr_40px] items-center gap-2"
                >
                  <Texto value={h.nome} onChange={(e) => alterar(h.id, { nome: e.target.value })} />
                  <Selecao
                    value={h.tipo}
                    onChange={(e) => alterar(h.id, { tipo: e.target.value as Herdeiro["tipo"] })}
                  >
                    <option value="meeiro">Meeiro(a)</option>
                    <option value="herdeiro">Herdeiro(a)</option>
                  </Selecao>
                  <Numero
                    valor={Number((h.percentual * 100).toFixed(4))}
                    aoMudar={(v) => alterar(h.id, { percentual: v / 100 })}
                  />
                  <span className="text-sm tabular-nums text-texto-suave">
                    {moeda(partilha.porHerdeiro.find((p) => p.herdeiroId === h.id)?.valor ?? 0)}
                  </span>
                  <Botao
                    variante="fantasma"
                    onClick={() => sincronizar(o.herdeiros.filter((x) => x.id !== h.id))}
                    aria-label="Remover"
                  >
                    <Trash2 size={15} />
                  </Botao>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Botao
                variante="secundario"
                onClick={() => {
                  const fatia = sucessores.length ? 1 / sucessores.length : 0;
                  atualizar({
                    herdeiros: o.herdeiros.map((h) =>
                      h.tipo === "herdeiro" ? { ...h, percentual: fatia } : h
                    ),
                  });
                }}
              >
                Dividir igual entre os herdeiros
              </Botao>

              {o.qtdHerdeiros !== sucessores.length && (
                <p className="text-xs text-alerta">
                  A apuração está usando {o.qtdHerdeiros} herdeiro(s); aqui há{" "}
                  {sucessores.length}.
                </p>
              )}
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
          </>
        )}
      </Secao>

      {o.herdeiros.length > 0 && (
        <Secao
          titulo="Cotas-partes"
          descricao="Quanto cada um recebe e quanto do custo do serviço lhe cabe."
          acao={
            <Campo rotulo="Rateio dos custos">
              <Selecao
                value={o.rateio}
                onChange={(e) => atualizar({ rateio: e.target.value as typeof o.rateio })}
              >
                <option value="por_quinhao">Proporcional ao quinhão</option>
                <option value="igualitario">Dividido igualmente</option>
              </Selecao>
            </Campo>
          }
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
    </Pagina>
  );
}
