// ============================================================
// PADRÕES DE PARAMETRIZAÇÃO — carga inicial do banco.
// Reproduzem as constantes encontradas na planilha (seção 7 da análise).
// Depois de carregados, passam a ser editados pela tela de Parametrização.
// ============================================================
import type {
  FaixaCustasJudiciais,
  ItemCatalogo,
  Parametros,
} from "@/lib/calculo/tipos";

export const PARAMETROS_PADRAO: Parametros = {
  impostoAliquota: 4, // ITCMD/SP — na escritura vira ITBI 3%
  multaPercentual: 30,
  ufesp: 34.26, // vigência 2025 — conferir a cada ano
  certidaoImovel: 100,
  certidaoTestamento: 70,
  certidaoPessoalHerdeiro: 100,
  outrosCustosPercentual: 10,
  registroIncluiCertidao: true, // fiel à planilha — ver problema #6 da análise
};

/** Degraus de custas judiciais da planilha: 300 / 100 / 10 UFESP. */
export const FAIXAS_CUSTAS_JUDICIAIS: FaixaCustasJudiciais[] = [
  { ordem: 1, valorDe: 0, valorAte: 49999.99, base: "ufesp", quantidade: 10 },
  { ordem: 2, valorDe: 50000, valorAte: 499999.99, base: "ufesp", quantidade: 100 },
  { ordem: 3, valorDe: 500000, valorAte: null, base: "ufesp", quantidade: 300 },
];

/** Catálogo do serviço de INVENTÁRIO — espelha as colunas C e H da aba `Inventário`. */
export const CATALOGO_INVENTARIO: ItemCatalogo[] = [
  { chave: "honorarios", nome: "Honorários Advocatícios", tipoCalculo: "honorarios", ordem: 10 },
  { chave: "imposto", nome: "ITCMD", tipoCalculo: "imposto", ordem: 20 },
  {
    chave: "certidao_imoveis",
    nome: "Certidão Imóveis",
    tipoCalculo: "por_unidade",
    multiplicador: "certidoes",
    parametro: "certidaoImovel",
    ordem: 30,
  },
  {
    chave: "certidao_testamento",
    nome: "Certidão de Testamento",
    tipoCalculo: "fixo",
    parametro: "certidaoTestamento",
    ordem: 40,
  },
  {
    chave: "certidoes_pessoais",
    nome: "Certidões Pessoais dos Herdeiros",
    tipoCalculo: "por_unidade",
    multiplicador: "herdeiros",
    parametro: "certidaoPessoalHerdeiro",
    ordem: 50,
  },
  {
    chave: "custas",
    nome: "Custas Processuais",
    tipoCalculo: "tabela_custas_judiciais",
    vias: ["judicial"],
    ordem: 60,
  },
  {
    chave: "custas",
    nome: "Custas de Cartório",
    tipoCalculo: "tabela_notas",
    vias: ["extrajudicial"],
    ordem: 60,
  },
  { chave: "registro_sri", nome: "Registro no SRI", tipoCalculo: "tabela_sri", ordem: 70 },
  {
    chave: "outros_custos",
    nome: "Outros Custos",
    tipoCalculo: "percentual_sobre",
    base: "custas_registro",
    parametro: "outrosCustosPercentual",
    ordem: 80,
  },
];

/** Catálogo do serviço de ESCRITURA — só via cartório, ITBI, sem herdeiros. */
export const CATALOGO_ESCRITURA: ItemCatalogo[] = [
  { chave: "imposto", nome: "ITBI", tipoCalculo: "imposto", ordem: 10 },
  {
    chave: "certidao_imoveis",
    nome: "Certidão Imóveis",
    tipoCalculo: "por_unidade",
    multiplicador: "certidoes",
    parametro: "certidaoImovel",
    ordem: 20,
  },
  {
    chave: "custas",
    nome: "Custas de Cartório",
    tipoCalculo: "tabela_notas",
    vias: ["extrajudicial"],
    ordem: 30,
  },
  { chave: "registro_sri", nome: "Registro no SRI", tipoCalculo: "tabela_sri", ordem: 40 },
  {
    chave: "outros_custos",
    nome: "Outros Custos",
    tipoCalculo: "percentual_sobre",
    base: "custas_registro",
    parametro: "outrosCustosPercentual",
    ordem: 50,
  },
];

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
