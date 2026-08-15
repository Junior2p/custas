"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";

import type { FaixaEmolumento } from "@/lib/calculo/tipos";
import { useCustas } from "../Contexto";
import { Pagina } from "../Pagina";
import { Botao, Campo, Numero, Secao, Texto, moeda } from "../ui";

type Aba = "notas" | "sri" | "oab";

export function Tabelas() {
  const [aba, setAba] = useState<Aba>("notas");
  const { parametrizacao: p, atualizarParametrizacao } = useCustas();

  const abas: { chave: Aba; rotulo: string; qtd: number }[] = [
    { chave: "notas", rotulo: "Tabelionato de Notas", qtd: p.tabelaNotas.length },
    { chave: "sri", rotulo: "Registro de Imóveis", qtd: p.tabelaSri.length },
    { chave: "oab", rotulo: "Tabela OAB", qtd: p.tabelaOab.length },
  ];

  return (
    <Pagina
      titulo="Tabelas de cartório"
      descricao="Emolumentos e honorários de referência. Atualize quando as tabelas mudarem de ano."
    >
      <div className="sem-impressao flex gap-1 rounded-lg border border-borda bg-superficie p-1">
        {abas.map(({ chave, rotulo, qtd }) => (
          <button
            key={chave}
            onClick={() => setAba(chave)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              aba === chave
                ? "bg-marinho text-white"
                : "text-texto-suave hover:bg-marinho-50 hover:text-marinho"
            }`}
          >
            {rotulo}
            <span className="ml-1.5 text-xs opacity-70">({qtd})</span>
          </button>
        ))}
      </div>

      {aba === "notas" && (
        <TabelaEmolumentos
          titulo="Tabelionato de Notas"
          descricao="Base das custas de cartório (escritura)."
          faixas={p.tabelaNotas}
          aoMudar={(tabelaNotas) => atualizarParametrizacao({ ...p, tabelaNotas })}
        />
      )}

      {aba === "sri" && (
        <TabelaEmolumentos
          titulo="Registro de Imóveis"
          descricao="Base do registro da partilha / da escritura."
          faixas={p.tabelaSri}
          aoMudar={(tabelaSri) => atualizarParametrizacao({ ...p, tabelaSri })}
        />
      )}

      {aba === "oab" && (
        <Secao
          titulo="Tabela OAB"
          descricao="Percentual sobre o valor e piso de cada ação."
          acao={
            <Botao
              variante="secundario"
              onClick={() =>
                atualizarParametrizacao({
                  ...p,
                  tabelaOab: [...p.tabelaOab, { acao: "Nova ação", percentual: 10, valorMinimo: 0 }],
                })
              }
            >
              <Plus size={15} /> Ação
            </Botao>
          }
        >
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_110px_150px_40px] gap-2 text-xs text-texto-suave">
              <span>Ação</span>
              <span className="text-right">%</span>
              <span className="text-right">Mínimo</span>
              <span />
            </div>
            {p.tabelaOab.map((acao, i) => (
              <div key={i} className="grid grid-cols-[1fr_110px_150px_40px] items-center gap-2">
                <Texto
                  value={acao.acao}
                  onChange={(e) =>
                    atualizarParametrizacao({
                      ...p,
                      tabelaOab: p.tabelaOab.map((a, j) =>
                        j === i ? { ...a, acao: e.target.value } : a
                      ),
                    })
                  }
                />
                <Numero
                  valor={acao.percentual}
                  aoMudar={(v) =>
                    atualizarParametrizacao({
                      ...p,
                      tabelaOab: p.tabelaOab.map((a, j) =>
                        j === i ? { ...a, percentual: v } : a
                      ),
                    })
                  }
                />
                <Numero
                  valor={acao.valorMinimo}
                  aoMudar={(v) =>
                    atualizarParametrizacao({
                      ...p,
                      tabelaOab: p.tabelaOab.map((a, j) =>
                        j === i ? { ...a, valorMinimo: v } : a
                      ),
                    })
                  }
                />
                <Botao
                  variante="fantasma"
                  onClick={() =>
                    atualizarParametrizacao({
                      ...p,
                      tabelaOab: p.tabelaOab.filter((_, j) => j !== i),
                    })
                  }
                  aria-label="Remover ação"
                >
                  <Trash2 size={15} />
                </Botao>
              </div>
            ))}
          </div>
        </Secao>
      )}
    </Pagina>
  );
}

function TabelaEmolumentos({
  titulo,
  descricao,
  faixas,
  aoMudar,
}: {
  titulo: string;
  descricao: string;
  faixas: FaixaEmolumento[];
  aoMudar: (faixas: FaixaEmolumento[]) => void;
}) {
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState("");

  function renumerar(lista: FaixaEmolumento[]) {
    return lista
      .slice()
      .sort((a, b) => a.valorDe - b.valorDe)
      .map((f, i) => ({ ...f, ordem: i + 1 }));
  }

  /**
   * Importa CSV no formato `valor_de;valor_ate;valor_total`.
   * Aceita vírgula ou ponto e vírgula como separador, e cabeçalho opcional.
   */
  async function importarCsv(arquivo: File) {
    setErro("");
    try {
      const linhas = (await arquivo.text())
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const novas: FaixaEmolumento[] = [];
      for (const linha of linhas) {
        const partes = linha.split(/[;,\t]/).map((c) => c.trim());
        if (partes.length < 3) continue;

        const numero = (t: string) => Number(t.replace(/\./g, "").replace(",", "."));
        const de = numero(partes[0]);
        const ate = partes[1] === "" || partes[1] === "-" ? null : numero(partes[1]);
        const total = numero(partes[2]);

        if (!Number.isFinite(de) || !Number.isFinite(total)) continue; // pula cabeçalho
        novas.push({ ordem: novas.length + 1, valorDe: de, valorAte: ate, valorTotal: total });
      }

      if (!novas.length) throw new Error("Nenhuma linha válida encontrada.");
      aoMudar(renumerar(novas));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    }
  }

  return (
    <Secao
      titulo={titulo}
      descricao={descricao}
      acao={
        <div className="flex gap-2">
          <Botao variante="secundario" onClick={() => inputArquivo.current?.click()}>
            <Upload size={15} /> Importar CSV
          </Botao>
          <Botao
            variante="secundario"
            onClick={() =>
              aoMudar(
                renumerar([
                  ...faixas,
                  {
                    ordem: faixas.length + 1,
                    valorDe: (faixas.at(-1)?.valorAte ?? 0) + 0.01,
                    valorAte: null,
                    valorTotal: 0,
                  },
                ])
              )
            }
          >
            <Plus size={15} /> Faixa
          </Botao>
          <input
            ref={inputArquivo}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) importarCsv(arquivo);
              e.target.value = "";
            }}
          />
        </div>
      }
    >
      {erro && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-erro">{erro}</p>}

      <p className="mb-3 text-[11px] text-texto-suave">
        CSV no formato <code>valor_de;valor_ate;valor_total</code> — deixe o{" "}
        <code>valor_ate</code> vazio na última faixa (&quot;acima de&quot;). Importar{" "}
        <strong>substitui</strong> a tabela inteira.
      </p>

      <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-borda">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr className="text-left text-xs text-texto-suave">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">De</th>
              <th className="px-3 py-2 font-medium">Até</th>
              <th className="px-3 py-2 font-medium">Emolumento</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {faixas.map((faixa, i) => (
              <tr key={i} className="border-t border-borda/60">
                <td className="px-3 py-1.5 text-xs text-texto-suave">{faixa.ordem}</td>
                <td className="px-3 py-1.5">
                  <Numero
                    valor={faixa.valorDe}
                    aoMudar={(v) =>
                      aoMudar(faixas.map((f, j) => (j === i ? { ...f, valorDe: v } : f)))
                    }
                    className="py-1"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <Numero
                    valor={faixa.valorAte ?? 0}
                    placeholder="acima de"
                    aoMudar={(v) =>
                      aoMudar(
                        faixas.map((f, j) => (j === i ? { ...f, valorAte: v > 0 ? v : null } : f))
                      )
                    }
                    className="py-1"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <Numero
                    valor={faixa.valorTotal}
                    aoMudar={(v) =>
                      aoMudar(faixas.map((f, j) => (j === i ? { ...f, valorTotal: v } : f)))
                    }
                    className="py-1"
                  />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <Botao
                    variante="fantasma"
                    onClick={() => aoMudar(renumerar(faixas.filter((_, j) => j !== i)))}
                    aria-label="Remover faixa"
                  >
                    <Trash2 size={14} />
                  </Botao>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-texto-suave">
        {faixas.length} faixas · última: acima de {moeda(faixas.at(-1)?.valorDe ?? 0)} →{" "}
        {moeda(faixas.at(-1)?.valorTotal ?? 0)}
      </p>
    </Secao>
  );
}
