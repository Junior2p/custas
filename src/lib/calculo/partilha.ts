import { arredondar } from "./emolumentos";
import type { Bem } from "./tipos";

export type Herdeiro = {
  id: string;
  nome: string;
  tipo: "meeiro" | "herdeiro";
  /** Fração 0..1. Meeiro(a): sobre o valor venal. Herdeiro: sobre o monte partilhável. */
  percentual: number;
};

export type QuinhaoBem = {
  herdeiroId: string;
  nome: string;
  percentual: number;
  valor: number;
};

export type PartilhaBem = {
  descricao: string;
  valorVenal: number;
  /** Parte que entra no inventário (o que se divide entre os herdeiros). */
  monte: number;
  /** Parte que fica com o meeiro(a) por direito de meação. */
  meacao: number;
  quinhoes: QuinhaoBem[];
  /** Soma dos percentuais dos herdeiros neste bem — tem que fechar em 1. */
  checagem: number;
  fecha: boolean;
};

export type ResultadoPartilha = {
  bens: PartilhaBem[];
  totalVenal: number;
  totalMonte: number;
  totalMeacao: number;
  /** Consolidado por pessoa, com o rateio de custos já aplicado. */
  porHerdeiro: {
    herdeiroId: string;
    nome: string;
    tipo: "meeiro" | "herdeiro";
    /** Percentual sobre o total do espólio (meação + monte). */
    percentualTotal: number;
    valor: number;
    custoRateado: number;
    liquido: number;
  }[];
  /** Bens cujos percentuais não somam 100%. */
  inconsistencias: string[];
};

/**
 * Percentual de um herdeiro em um bem específico.
 * `percentuaisPorBem["indiceDoBem"]?.[herdeiroId]` sobrescreve o percentual global.
 */
type PercentuaisPorBem = Record<number, Record<string, number>>;

export type OpcoesPartilha = {
  /** Como o custo total do serviço é dividido entre os herdeiros. */
  rateioCustos?: "por_quinhao" | "igualitario" | "nenhum";
  /** Custo total a ratear (total apurado do orçamento). */
  custoTotal?: number;
  percentuaisPorBem?: PercentuaisPorBem;
};

export function calcularPartilha(
  bens: Bem[],
  herdeiros: Herdeiro[],
  opcoes: OpcoesPartilha = {}
): ResultadoPartilha {
  const { rateioCustos = "por_quinhao", custoTotal = 0, percentuaisPorBem = {} } = opcoes;

  const meeiro = herdeiros.find((h) => h.tipo === "meeiro");
  const sucessores = herdeiros.filter((h) => h.tipo === "herdeiro");

  const acumulado = new Map<string, number>();
  const inconsistencias: string[] = [];

  const detalhe: PartilhaBem[] = bens.map((bem, i) => {
    const monte = arredondar(bem.valorVenal * bem.percentual);
    const meacao = meeiro ? arredondar(bem.valorVenal * meeiro.percentual) : 0;

    const quinhoes: QuinhaoBem[] = sucessores.map((h) => {
      const perc = percentuaisPorBem[i]?.[h.id] ?? h.percentual;
      const valor = arredondar(monte * perc);
      acumulado.set(h.id, (acumulado.get(h.id) ?? 0) + valor);
      return { herdeiroId: h.id, nome: h.nome, percentual: perc, valor };
    });

    if (meeiro) acumulado.set(meeiro.id, (acumulado.get(meeiro.id) ?? 0) + meacao);

    const checagem = arredondar(
      quinhoes.reduce((s, q) => s + q.percentual, 0),
      6
    );
    const fecha = Math.abs(checagem - 1) < 0.0001;
    if (!fecha && sucessores.length > 0) {
      inconsistencias.push(
        `"${bem.descricao || `Bem ${i + 1}`}": os quinhões somam ${(checagem * 100).toFixed(2)}%, não 100%.`
      );
    }

    return { descricao: bem.descricao, valorVenal: bem.valorVenal, monte, meacao, quinhoes, checagem, fecha };
  });

  const totalVenal = arredondar(detalhe.reduce((s, b) => s + b.valorVenal, 0));
  const totalMonte = arredondar(detalhe.reduce((s, b) => s + b.monte, 0));
  const totalMeacao = arredondar(detalhe.reduce((s, b) => s + b.meacao, 0));
  const totalDistribuido = arredondar(
    [...acumulado.values()].reduce((s, v) => s + v, 0)
  );

  const pessoas = meeiro ? [meeiro, ...sucessores] : sucessores;

  const porHerdeiro = pessoas.map((h) => {
    const valor = arredondar(acumulado.get(h.id) ?? 0);
    const fatia = totalDistribuido > 0 ? valor / totalDistribuido : 0;

    let custoRateado = 0;
    if (rateioCustos === "por_quinhao") custoRateado = arredondar(custoTotal * fatia);
    else if (rateioCustos === "igualitario" && pessoas.length > 0)
      custoRateado = arredondar(custoTotal / pessoas.length);

    return {
      herdeiroId: h.id,
      nome: h.nome,
      tipo: h.tipo,
      percentualTotal: arredondar(fatia * 100, 4),
      valor,
      custoRateado,
      liquido: arredondar(valor - custoRateado),
    };
  });

  return { bens: detalhe, totalVenal, totalMonte, totalMeacao, porHerdeiro, inconsistencias };
}
