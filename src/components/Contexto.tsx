"use client";

// ============================================================
// CONTEXTO — estado compartilhado entre as telas.
// A cotação aberta, a lista salva, a parametrização do escritório
// e o modo apresentação vivem aqui, para que a navegação lateral
// não perca o que está sendo preenchido.
// ============================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buscarAcao } from "@/lib/calculo/honorarios";
import { calcularOrcamento } from "@/lib/calculo/orcamento";
import { calcularPartilha, type ResultadoPartilha } from "@/lib/calculo/partilha";
import type { ConfigHonorarios, ContextoCalculo, ResultadoCalculo, Via } from "@/lib/calculo/tipos";
import { servicoPorChave, type DefinicaoServico } from "@/lib/dados/servicos";
import { listarAcoes, salvarAcao as gravarAcao } from "@/lib/acao/armazenamento";
import { acaoNova, type AcaoJudicial } from "@/lib/acao/modelo";
import { listar, salvar as gravarCotacao } from "@/lib/orcamento/armazenamento";
import { orcamentoNovo, type Orcamento } from "@/lib/orcamento/modelo";
import {
  carregarParametrizacao,
  gravarParametrizacao,
  type Parametrizacao,
} from "@/lib/parametrizacao/modelo";

const CHAVE_APRESENTACAO = "custas.apresentacao";

type Estado = {
  pronto: boolean;
  cotacao: Orcamento;
  lista: Orcamento[];
  acao: AcaoJudicial;
  acoes: AcaoJudicial[];
  parametrizacao: Parametrizacao;
  apresentacao: boolean;
  temAlteracoes: boolean;

  servico: DefinicaoServico;
  via: Via;
  judicial: ResultadoCalculo;
  extrajudicial: ResultadoCalculo;
  resultado: ResultadoCalculo;
  totalProposta: number;
  partilha: ResultadoPartilha;

  atualizar: (campos: Partial<Orcamento>) => void;
  atualizarAcao: (campos: Partial<AcaoJudicial>) => void;
  trocarAcao: (a: AcaoJudicial) => void;
  trocarListaAcoes: (l: AcaoJudicial[]) => void;
  salvarAcao: () => void;
  trocarCotacao: (o: Orcamento) => void;
  trocarLista: (l: Orcamento[]) => void;
  salvarCotacao: () => void;
  atualizarParametrizacao: (p: Parametrizacao) => void;
  alternarApresentacao: () => void;
};

const Ctx = createContext<Estado | null>(null);

export function useCustas() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCustas precisa estar dentro de <ProvedorCustas>");
  return ctx;
}

export function ProvedorCustas({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  const [cotacao, setCotacao] = useState<Orcamento | null>(null);
  const [lista, setLista] = useState<Orcamento[]>([]);
  const [parametrizacao, setParametrizacao] = useState<Parametrizacao | null>(null);
  const [acao, setAcao] = useState<AcaoJudicial | null>(null);
  const [acoes, setAcoes] = useState<AcaoJudicial[]>([]);
  const [apresentacao, setApresentacao] = useState(false);
  const [referencia, setReferencia] = useState("");

  // Tudo vem do navegador: só monta no cliente.
  useEffect(() => {
    const base = carregarParametrizacao();
    const salvos = listar();
    const inicial = salvos[0] ?? orcamentoNovo(salvos, undefined, base);

    const acoesSalvas = listarAcoes();
    setAcoes(acoesSalvas);
    setAcao(acoesSalvas[0] ?? acaoNova(acoesSalvas));

    setParametrizacao(base);
    setLista(salvos);
    setCotacao(inicial);
    setReferencia(JSON.stringify(inicial));
    setApresentacao(window.localStorage.getItem(CHAVE_APRESENTACAO) === "1");
    setPronto(true);
  }, []);

  const atualizar = useCallback(
    (campos: Partial<Orcamento>) => setCotacao((atual) => (atual ? { ...atual, ...campos } : atual)),
    []
  );

  const trocarCotacao = useCallback((o: Orcamento) => {
    setCotacao(o);
    setReferencia(JSON.stringify(o));
  }, []);

  const salvarCotacao = useCallback(() => {
    setCotacao((atual) => {
      if (!atual) return atual;
      const nova = gravarCotacao(atual);
      setLista(nova);
      const gravado = nova.find((x) => x.id === atual.id) ?? atual;
      setReferencia(JSON.stringify(gravado));
      return gravado;
    });
  }, []);

  const atualizarAcao = useCallback(
    (campos: Partial<AcaoJudicial>) => setAcao((atual) => (atual ? { ...atual, ...campos } : atual)),
    []
  );

  const salvarAcaoAtual = useCallback(() => {
    setAcao((atual) => {
      if (!atual) return atual;
      const nova = gravarAcao(atual);
      setAcoes(nova);
      return nova.find((x) => x.id === atual.id) ?? atual;
    });
  }, []);

  const atualizarParametrizacao = useCallback((p: Parametrizacao) => {
    setParametrizacao(p);
    gravarParametrizacao(p);
  }, []);

  const alternarApresentacao = useCallback(() => {
    setApresentacao((atual) => {
      const novo = !atual;
      window.localStorage.setItem(CHAVE_APRESENTACAO, novo ? "1" : "0");
      return novo;
    });
  }, []);

  // ---------- cálculo ----------
  const derivado = useMemo(() => {
    if (!cotacao || !parametrizacao) return null;

    const servico = servicoPorChave(cotacao.tipoServico);
    const via = servico.vias.includes(cotacao.viaEscolhida)
      ? cotacao.viaEscolhida
      : servico.vias[0];

    const honorarios: ConfigHonorarios =
      cotacao.honorariosModo === "fixo"
        ? { modo: "fixo", valor: cotacao.honorariosValor }
        : cotacao.honorariosModo === "percentual"
          ? { modo: "percentual", percentual: cotacao.honorariosPercentual }
          : cotacao.honorariosModo === "percentual_custos"
            ? { modo: "percentual_custos", percentual: cotacao.honorariosPercentualCustos }
            : (() => {
                const acao =
                  buscarAcao(parametrizacao.tabelaOab, cotacao.acaoOab) ??
                  parametrizacao.tabelaOab[0];
                return {
                  modo: "tabela" as const,
                  percentual: acao.percentual,
                  valorMinimo: acao.valorMinimo,
                };
              })();

    const base: Omit<ContextoCalculo, "via"> = {
      bens: cotacao.bens,
      qtdHerdeiros: servico.temHerdeiros ? cotacao.qtdHerdeiros : 0,
      parametros: {
        ...cotacao.parametros,
        impostoAliquota: cotacao.aliquotaImposto ?? servico.impostoAliquota,
      },
      aplicarMulta: cotacao.aplicarMulta,
      honorarios,
      tabelaNotas: parametrizacao.tabelaNotas,
      tabelaSri: parametrizacao.tabelaSri,
      faixasCustasJudiciais: cotacao.faixasCustas,
      catalogo: servico.catalogo,
      ajustes: cotacao.ajustes,
    };

    const judicial = calcularOrcamento({ ...base, via: "judicial" });
    const extrajudicial = calcularOrcamento({ ...base, via: "extrajudicial" });
    const resultado = via === "judicial" ? judicial : extrajudicial;
    const totalProposta = cotacao.valorNegociado > 0 ? cotacao.valorNegociado : resultado.total;

    const partilha = calcularPartilha(cotacao.bens, cotacao.herdeiros, {
      rateioCustos: cotacao.rateio,
      custoTotal: totalProposta,
    });

    return { servico, via, judicial, extrajudicial, resultado, totalProposta, partilha };
  }, [cotacao, parametrizacao]);

  if (!pronto || !cotacao || !parametrizacao || !derivado || !acao) {
    return (
      <p className="mx-auto max-w-6xl px-4 py-20 text-center text-sm text-texto-suave">
        Carregando…
      </p>
    );
  }

  const valor: Estado = {
    pronto,
    cotacao,
    lista,
    acao,
    acoes,
    parametrizacao,
    apresentacao,
    temAlteracoes: JSON.stringify(cotacao) !== referencia,
    ...derivado,
    atualizar,
    atualizarAcao,
    trocarAcao: setAcao,
    trocarListaAcoes: setAcoes,
    salvarAcao: salvarAcaoAtual,
    trocarCotacao,
    trocarLista: setLista,
    salvarCotacao,
    atualizarParametrizacao,
    alternarApresentacao,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}
