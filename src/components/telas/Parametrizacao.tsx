"use client";

import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";

import { CAMPOS_PARAMETROS } from "@/lib/dados/padroes";
import { PARAMETRIZACAO_PADRAO } from "@/lib/parametrizacao/modelo";
import { useCustas } from "../Contexto";
import { Pagina } from "../Pagina";
import { Botao, Campo, Interruptor, Numero, Secao, Selecao, Texto, moeda } from "../ui";
import { SecaoAcesso } from "./SecaoAcesso";

export function Parametrizacao() {
  const { parametrizacao: p, atualizarParametrizacao, cotacao, atualizar } = useCustas();
  const [aviso, setAviso] = useState("");

  function anunciar(texto: string) {
    setAviso(texto);
    setTimeout(() => setAviso(""), 3500);
  }

  /** Leva os valores de base para a cotação que está aberta. */
  function aplicarNaCotacao() {
    atualizar({
      parametros: { ...p.parametros },
      faixasCustas: p.faixasCustas.map((f) => ({ ...f })),
    });
    anunciar(`Valores aplicados à cotação ${cotacao.numero}.`);
  }

  return (
    <Pagina
      titulo="Parametrização"
      descricao="Valores de base do escritório. Valem para as cotações novas."
      acao={
        <div className="flex gap-2">
          <Botao variante="secundario" onClick={aplicarNaCotacao}>
            <Check size={15} /> Aplicar à cotação aberta
          </Botao>
          <Botao
            variante="secundario"
            onClick={() => {
              atualizarParametrizacao({
                ...p,
                parametros: { ...PARAMETRIZACAO_PADRAO.parametros },
                faixasCustas: PARAMETRIZACAO_PADRAO.faixasCustas.map((f) => ({ ...f })),
              });
              anunciar("Valores restaurados.");
            }}
          >
            <RotateCcw size={15} /> Restaurar
          </Botao>
        </div>
      }
    >
      {aviso && (
        <p className="rounded-lg bg-marinho-50 px-4 py-2.5 text-sm text-marinho">{aviso}</p>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-alerta">
        Alterar aqui <strong>não muda cotações já feitas</strong> — cada uma guarda os valores com
        que foi calculada. Para trazer os valores novos para a cotação aberta, use{" "}
        <em>Aplicar à cotação aberta</em>.
      </div>

      <SecaoAcesso />

      {/* ---------------- valores de base ---------------- */}
      <Secao titulo="Custos de base" descricao="Certidões, multa, UFESP e percentuais.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAMPOS_PARAMETROS.map((campo) => (
            <Campo
              key={campo.chave}
              rotulo={`${campo.rotulo}${campo.formato === "percentual" ? " (%)" : ""}`}
              dica={campo.dica}
            >
              <Numero
                moeda={campo.formato === "moeda"}
                valor={p.parametros[campo.chave]}
                aoMudar={(v) =>
                  atualizarParametrizacao({
                    ...p,
                    parametros: { ...p.parametros, [campo.chave]: v },
                  })
                }
              />
            </Campo>
          ))}
        </div>

        <div className="mt-5 border-t border-borda pt-4">
          <Interruptor
            rotulo="Custas de cartório (Notas) bem a bem"
            dica="Desligado (padrão): a escritura é um ato único e a faixa sai da soma dos bens. Ligado: cada bem entra na sua própria faixa. Não afeta o registro no SRI — esse é sempre por imóvel, já que cada matrícula é um ato e os imóveis podem estar em comarcas diferentes — nem as custas judiciais, que incidem sobre o monte-mor."
            ativo={p.parametros.notasPorBem}
            aoMudar={(v) =>
              atualizarParametrizacao({
                ...p,
                parametros: { ...p.parametros, notasPorBem: v },
              })
            }
          />
        </div>
      </Secao>

      {/* ---------------- honorários padrão ---------------- */}
      <Secao
        titulo="Honorários padrão"
        descricao="Usado quando o tipo de serviço não define um modo próprio."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo rotulo="Modo">
            <Selecao
              value={p.honorariosPadrao.modo}
              onChange={(e) =>
                atualizarParametrizacao({
                  ...p,
                  honorariosPadrao: {
                    ...p.honorariosPadrao,
                    modo: e.target.value as typeof p.honorariosPadrao.modo,
                  },
                })
              }
            >
              <option value="fixo">Valor fixo</option>
              <option value="tabela">Tabela OAB</option>
              <option value="percentual">% sobre o valor do bem</option>
              <option value="percentual_custos">% sobre os custos (embutido)</option>
            </Selecao>
          </Campo>
          <Campo rotulo="Valor fixo padrão">
            <Numero
              moeda
              valor={p.honorariosPadrao.valor}
              aoMudar={(v) =>
                atualizarParametrizacao({
                  ...p,
                  honorariosPadrao: { ...p.honorariosPadrao, valor: v },
                })
              }
            />
          </Campo>
          <Campo rotulo="% sobre o bem">
            <Numero
              valor={p.honorariosPadrao.percentual}
              aoMudar={(v) =>
                atualizarParametrizacao({
                  ...p,
                  honorariosPadrao: { ...p.honorariosPadrao, percentual: v },
                })
              }
            />
          </Campo>
          <Campo rotulo="% sobre os custos">
            <Numero
              valor={p.honorariosPadrao.percentualCustos}
              aoMudar={(v) =>
                atualizarParametrizacao({
                  ...p,
                  honorariosPadrao: { ...p.honorariosPadrao, percentualCustos: v },
                })
              }
            />
          </Campo>
        </div>
      </Secao>

      {/* ---------------- custas judiciais ---------------- */}
      <Secao
        titulo="Custas judiciais"
        descricao={`Degraus em UFESP sobre o monte-mor / valor da ação. Hoje: ${moeda(p.parametros.ufesp)} por UFESP.`}
      >
        <div className="space-y-2">
          {p.faixasCustas.map((faixa, i) => (
            <div
              key={faixa.ordem}
              className="grid grid-cols-[auto_1fr_auto_1fr_auto_100px_auto] items-center gap-2 text-xs text-texto-suave"
            >
              <span>de</span>
              <Numero
                moeda
                valor={faixa.valorDe}
                aoMudar={(v) =>
                  atualizarParametrizacao({
                    ...p,
                    faixasCustas: p.faixasCustas.map((f, j) =>
                      j === i ? { ...f, valorDe: v } : f
                    ),
                  })
                }
              />
              <span>até</span>
              <Numero
                moeda
                valor={faixa.valorAte ?? 0}
                placeholder="sem limite"
                aoMudar={(v) =>
                  atualizarParametrizacao({
                    ...p,
                    faixasCustas: p.faixasCustas.map((f, j) =>
                      j === i ? { ...f, valorAte: v > 0 ? v : null } : f
                    ),
                  })
                }
              />
              <span>=</span>
              <Numero
                valor={faixa.quantidade}
                aoMudar={(v) =>
                  atualizarParametrizacao({
                    ...p,
                    faixasCustas: p.faixasCustas.map((f, j) =>
                      j === i ? { ...f, quantidade: v } : f
                    ),
                  })
                }
              />
              <span className="whitespace-nowrap">
                UFESP = {moeda(faixa.quantidade * p.parametros.ufesp)}
              </span>
            </div>
          ))}
        </div>
      </Secao>

      {/* ---------------- condições padrão ---------------- */}
      <Secao titulo="Condições padrão da proposta" descricao="Ponto de partida de cada cotação nova.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo rotulo="Entrada (%)">
            <Numero
              valor={p.condicoes.entrada}
              aoMudar={(v) =>
                atualizarParametrizacao({ ...p, condicoes: { ...p.condicoes, entrada: v } })
              }
            />
          </Campo>
          <Campo rotulo="Parcelas do saldo">
            <Numero
              valor={p.condicoes.parcelas}
              aoMudar={(v) =>
                atualizarParametrizacao({
                  ...p,
                  condicoes: { ...p.condicoes, parcelas: Math.max(1, Math.round(v)) },
                })
              }
            />
          </Campo>
          <Campo rotulo="Validade (dias)">
            <Numero
              valor={p.condicoes.validadeDias}
              aoMudar={(v) =>
                atualizarParametrizacao({
                  ...p,
                  condicoes: { ...p.condicoes, validadeDias: Math.max(1, Math.round(v)) },
                })
              }
            />
          </Campo>
        </div>
      </Secao>

      {/* ---------------- escritório ---------------- */}
      <Secao titulo="Dados do escritório" descricao="Saem no rodapé da proposta impressa.">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["nome", "Nome"],
              ["oab", "OAB"],
              ["telefone", "Telefone"],
              ["email", "E-mail"],
              ["cidade", "Cidade"],
            ] as const
          ).map(([chave, rotulo]) => (
            <Campo key={chave} rotulo={rotulo}>
              <Texto
                value={p.escritorio[chave]}
                onChange={(e) =>
                  atualizarParametrizacao({
                    ...p,
                    escritorio: { ...p.escritorio, [chave]: e.target.value },
                  })
                }
              />
            </Campo>
          ))}
        </div>
      </Secao>
    </Pagina>
  );
}
