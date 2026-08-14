// ============================================================
// PADRÕES DE PARAMETRIZAÇÃO — carga inicial do banco.
// Reproduzem as constantes encontradas na planilha (seção 7 da análise).
// Depois de carregados, passam a ser editados pela tela de Parametrização.
// ============================================================
import type { FaixaCustasJudiciais, Parametros } from "@/lib/calculo/tipos";

export const PARAMETROS_PADRAO: Parametros = {
  impostoAliquota: 4, // ITCMD/SP — cada tipo de serviço define a sua
  multaPercentual: 30,
  ufesp: 34.26, // vigência 2025 — conferir a cada ano
  certidaoImovel: 100,
  certidaoTestamento: 70,
  certidaoPessoalHerdeiro: 100,
  outrosCustosPercentual: 10,
};

/** Rótulos e formato de cada parâmetro, para a tela de parametrização. */
export const CAMPOS_PARAMETROS: {
  chave: keyof Parametros;
  rotulo: string;
  formato: "moeda" | "percentual";
  dica?: string;
}[] = [
  { chave: "multaPercentual", rotulo: "Multa sobre o imposto", formato: "percentual", dica: "Recolhimento em atraso" },
  { chave: "ufesp", rotulo: "UFESP", formato: "moeda", dica: "Base das custas judiciais" },
  { chave: "certidaoImovel", rotulo: "Certidão de imóvel", formato: "moeda", dica: "Cobrada duas vezes: prévia e após o registro" },
  { chave: "certidaoTestamento", rotulo: "Certidão de testamento", formato: "moeda", dica: "CENSEC" },
  { chave: "certidaoPessoalHerdeiro", rotulo: "Certidões por herdeiro", formato: "moeda" },
  { chave: "outrosCustosPercentual", rotulo: "Outros custos", formato: "percentual", dica: "Sobre custas + registro" },
];

/** Degraus de custas judiciais da planilha: 300 / 100 / 10 UFESP. */
export const FAIXAS_CUSTAS_JUDICIAIS: FaixaCustasJudiciais[] = [
  { ordem: 1, valorDe: 0, valorAte: 49999.99, base: "ufesp", quantidade: 10 },
  { ordem: 2, valorDe: 50000, valorAte: 499999.99, base: "ufesp", quantidade: 100 },
  { ordem: 3, valorDe: 500000, valorAte: null, base: "ufesp", quantidade: 300 },
];

// Os catálogos de custo de cada serviço ficam em `servicos.ts`.

/** Checklist padrão da proposta (aba `Proposta` da planilha). */
export const PROPOSTA_ITENS_PADRAO = [
  { descricao: "Honorários Advocatícios", incluso: true },
  { descricao: "Custas Processuais / Extrajudiciais", incluso: true },
  { descricao: "Toda documentação necessária (certidões dos imóveis)", incluso: true },
  { descricao: "Imposto de Transmissão Causa Mortis e Doação — ITCMD", incluso: true },
  { descricao: "Registro da Partilha em nome dos herdeiros", incluso: true },
  { descricao: "Impostos atrasados (ex.: IPTU / IPVA)", incluso: false },
  { descricao: "Transferência de veículos junto ao DETRAN", incluso: false },
];

export const CONDICOES_PADRAO = {
  entradaPercentual: 50,
  parcelas: 3,
  validadeDias: 30,
};
