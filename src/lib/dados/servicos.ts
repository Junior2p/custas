// ============================================================
// TIPOS DE SERVIÇO — os que dependem de análise com base no valor.
// Cada serviço define o imposto, se tem herdeiros/partilha, as vias
// possíveis e o catálogo de custos que o compõe.
// Tudo isso vira registro editável no banco (tabelas `tipos_servico`
// e `catalogo_custos`) — aqui é a carga inicial.
// ============================================================
import type { ConfigHonorarios, ItemCatalogo, Via } from "@/lib/calculo/tipos";

export type DefinicaoServico = {
  chave: string;
  nome: string;
  /** Nome do imposto exibido na linha. `null` = o serviço não recolhe imposto. */
  nomeImposto: string | null;
  /** Alíquota em pontos percentuais. */
  impostoAliquota: number;
  temHerdeiros: boolean;
  temPartilha: boolean;
  vias: Via[];
  /** Ação correspondente na Tabela OAB. */
  acaoOab?: string;
  /** Como o serviço cobra honorários por padrão. */
  honorariosPadrao: ConfigHonorarios;
  /** Checklist ✅/❌ que vai na proposta deste serviço. */
  itensProposta: { descricao: string; incluso: boolean }[];
  /** Frase de abertura da proposta — cada serviço tem a sua concordância. */
  textoProposta: string;
  /** Aparece na tela — registra premissas que o Junior deve confirmar. */
  observacao?: string;
  catalogo: ItemCatalogo[];
};

// ------------------------------------------------------------
// Blocos reutilizáveis de custo
// ------------------------------------------------------------

const HONORARIOS: ItemCatalogo = {
  chave: "honorarios",
  nome: "Honorários Advocatícios",
  tipoCalculo: "honorarios",
  ordem: 10,
};

/**
 * Honorários embutidos: não são cobrados como item destacado, entram como
 * percentual sobre os demais custos. Por isso ficam no fim da lista.
 */
const HONORARIOS_EMBUTIDOS: ItemCatalogo = {
  chave: "honorarios",
  nome: "Honorários (embutidos)",
  tipoCalculo: "honorarios",
  ordem: 90,
};

const imposto = (nome: string): ItemCatalogo => ({
  chave: "imposto",
  nome,
  tipoCalculo: "imposto",
  ordem: 20,
});

/** Certidão tirada ANTES do ato — para instruir o inventário/escritura. */
const CERTIDAO_PREVIA: ItemCatalogo = {
  chave: "certidao_previa",
  nome: "Certidão de Imóveis (prévia)",
  tipoCalculo: "por_unidade",
  multiplicador: "certidoes",
  parametro: "certidaoImovel",
  ordem: 30,
};

const CERTIDAO_TESTAMENTO: ItemCatalogo = {
  chave: "certidao_testamento",
  nome: "Certidão de Testamento",
  tipoCalculo: "fixo",
  parametro: "certidaoTestamento",
  ordem: 40,
};

const CERTIDOES_PESSOAIS: ItemCatalogo = {
  chave: "certidoes_pessoais",
  nome: "Certidões Pessoais dos Herdeiros",
  tipoCalculo: "por_unidade",
  multiplicador: "herdeiros",
  parametro: "certidaoPessoalHerdeiro",
  ordem: 50,
};

const CUSTAS_JUDICIAIS: ItemCatalogo = {
  chave: "custas",
  nome: "Custas Processuais",
  tipoCalculo: "tabela_custas_judiciais",
  vias: ["judicial"],
  ordem: 60,
};

const CUSTAS_CARTORIO: ItemCatalogo = {
  chave: "custas",
  nome: "Custas de Cartório",
  tipoCalculo: "tabela_notas",
  vias: ["extrajudicial"],
  ordem: 60,
};

const REGISTRO_SRI: ItemCatalogo = {
  chave: "registro_sri",
  nome: "Registro no SRI",
  tipoCalculo: "tabela_sri",
  vinculadoRegistro: true,
  ordem: 70,
};

/** Certidão tirada DEPOIS do registro, já com a propriedade transferida. */
const CERTIDAO_POS_REGISTRO: ItemCatalogo = {
  chave: "certidao_pos_registro",
  nome: "Certidão de Imóveis (após o registro)",
  tipoCalculo: "por_unidade",
  multiplicador: "imoveis_registro",
  parametro: "certidaoImovel",
  vinculadoRegistro: true,
  ordem: 75,
};

const OUTROS_CUSTOS: ItemCatalogo = {
  chave: "outros_custos",
  nome: "Outros Custos",
  tipoCalculo: "percentual_sobre",
  base: "custas_registro",
  parametro: "outrosCustosPercentual",
  ordem: 80,
};

const COM_IMOVEIS = [CERTIDAO_PREVIA, REGISTRO_SRI, CERTIDAO_POS_REGISTRO];
const CUSTAS_AMBAS = [CUSTAS_JUDICIAIS, CUSTAS_CARTORIO];

// ------------------------------------------------------------
// Checklists da proposta
// ------------------------------------------------------------

const PROPOSTA_INVENTARIO = [
  { descricao: "Honorários Advocatícios", incluso: true },
  { descricao: "Custas Processuais / Extrajudiciais", incluso: true },
  { descricao: "Toda documentação necessária (certidões dos imóveis)", incluso: true },
  { descricao: "Imposto de Transmissão Causa Mortis e Doação — ITCMD", incluso: true },
  { descricao: "Registro da Partilha em nome dos herdeiros", incluso: true },
  { descricao: "Impostos atrasados (ex.: IPTU / IPVA)", incluso: false },
  { descricao: "Transferência de veículos junto ao DETRAN", incluso: false },
];

// Sem linha de honorários: eles entram embutidos no valor do serviço.
const PROPOSTA_ESCRITURA = [
  { descricao: "Elaboração e lavratura da Escritura Pública", incluso: true },
  { descricao: "Custas do Tabelionato de Notas", incluso: true },
  { descricao: "Toda documentação necessária (certidões dos imóveis)", incluso: true },
  { descricao: "Imposto de Transmissão de Bens Imóveis — ITBI", incluso: true },
  { descricao: "Registro do imóvel em nome do comprador", incluso: true },
  { descricao: "Impostos atrasados (ex.: IPTU)", incluso: false },
  { descricao: "Débitos e ônus anteriores à escritura", incluso: false },
];

const PROPOSTA_GENERICA = [
  { descricao: "Honorários Advocatícios", incluso: true },
  { descricao: "Custas Processuais / Extrajudiciais", incluso: true },
  { descricao: "Toda documentação necessária (certidões)", incluso: true },
  { descricao: "Registro do imóvel", incluso: true },
  { descricao: "Impostos atrasados (ex.: IPTU / IPVA)", incluso: false },
];

// ------------------------------------------------------------
// Serviços
// ------------------------------------------------------------

export const SERVICOS: DefinicaoServico[] = [
  {
    chave: "inventario_consensual",
    textoProposta:
      "Conforme solicitado, apresento a proposta para a realização dos serviços referente ao Inventário de:",
    nome: "Inventário Consensual",
    nomeImposto: "ITCMD",
    impostoAliquota: 4,
    temHerdeiros: true,
    temPartilha: true,
    vias: ["judicial", "extrajudicial"],
    acaoOab: "Inventário Consensual",
    honorariosPadrao: { modo: "tabela", percentual: 8, valorMinimo: 4354.77 },
    itensProposta: PROPOSTA_INVENTARIO,
    catalogo: [
      HONORARIOS,
      imposto("ITCMD"),
      CERTIDAO_TESTAMENTO,
      CERTIDOES_PESSOAIS,
      ...COM_IMOVEIS,
      ...CUSTAS_AMBAS,
      OUTROS_CUSTOS,
    ],
  },
  {
    chave: "inventario_litigioso",
    textoProposta:
      "Conforme solicitado, apresento a proposta para a realização dos serviços referente ao Inventário de:",
    nome: "Inventário Litigioso",
    nomeImposto: "ITCMD",
    impostoAliquota: 4,
    temHerdeiros: true,
    temPartilha: true,
    vias: ["judicial"],
    acaoOab: "Inventário Litigioso",
    honorariosPadrao: { modo: "tabela", percentual: 10, valorMinimo: 4354.77 },
    itensProposta: PROPOSTA_INVENTARIO,
    catalogo: [
      HONORARIOS,
      imposto("ITCMD"),
      CERTIDAO_TESTAMENTO,
      CERTIDOES_PESSOAIS,
      ...COM_IMOVEIS,
      CUSTAS_JUDICIAIS,
      OUTROS_CUSTOS,
    ],
  },
  {
    chave: "escritura",
    textoProposta:
      "Conforme solicitado, apresento a proposta para a realização dos serviços referente à Escritura de Compra e Venda de:",
    nome: "Escritura de Compra e Venda",
    nomeImposto: "ITBI",
    impostoAliquota: 3,
    temHerdeiros: false,
    temPartilha: false,
    vias: ["extrajudicial"],
    honorariosPadrao: { modo: "percentual_custos", percentual: 10 },
    itensProposta: PROPOSTA_ESCRITURA,
    observacao:
      "Honorários embutidos: 10% sobre os demais custos, sem cobrança destacada na proposta.",
    catalogo: [
      imposto("ITBI"),
      ...COM_IMOVEIS,
      CUSTAS_CARTORIO,
      OUTROS_CUSTOS,
      HONORARIOS_EMBUTIDOS,
    ],
  },
  {
    chave: "usucapiao",
    textoProposta:
      "Conforme solicitado, apresento a proposta para a realização dos serviços referente à Ação de Usucapião de:",
    nome: "Usucapião",
    nomeImposto: null,
    impostoAliquota: 0,
    temHerdeiros: false,
    temPartilha: false,
    vias: ["judicial", "extrajudicial"],
    acaoOab: "Usucapião",
    honorariosPadrao: { modo: "tabela", percentual: 20, valorMinimo: 4354.77 },
    itensProposta: PROPOSTA_GENERICA,
    observacao:
      "Sem imposto de transmissão — a aquisição por usucapião é originária. Se o caso exigir recolhimento, ligue o imposto na parametrização.",
    catalogo: [HONORARIOS, ...COM_IMOVEIS, ...CUSTAS_AMBAS, OUTROS_CUSTOS],
  },
  {
    chave: "divorcio_consensual",
    textoProposta:
      "Conforme solicitado, apresento a proposta para a realização dos serviços referente ao Divórcio de:",
    nome: "Divórcio Consensual",
    nomeImposto: null,
    impostoAliquota: 0,
    temHerdeiros: false,
    temPartilha: true,
    vias: ["judicial", "extrajudicial"],
    acaoOab: "Divórcio Consensual",
    honorariosPadrao: { modo: "tabela", percentual: 6, valorMinimo: 5598.99 },
    itensProposta: PROPOSTA_GENERICA,
    observacao:
      "A partilha igualitária não recolhe imposto. Havendo excesso de meação, o ITCMD incide só sobre o excesso — ligue o imposto e ajuste a base.",
    catalogo: [HONORARIOS, ...COM_IMOVEIS, ...CUSTAS_AMBAS, OUTROS_CUSTOS],
  },
  {
    chave: "divorcio_litigioso",
    textoProposta:
      "Conforme solicitado, apresento a proposta para a realização dos serviços referente ao Divórcio de:",
    nome: "Divórcio Litigioso",
    nomeImposto: null,
    impostoAliquota: 0,
    temHerdeiros: false,
    temPartilha: true,
    vias: ["judicial"],
    acaoOab: "Divórcio Litigioso",
    honorariosPadrao: { modo: "tabela", percentual: 8, valorMinimo: 8709.53 },
    itensProposta: PROPOSTA_GENERICA,
    observacao:
      "A partilha igualitária não recolhe imposto. Havendo excesso de meação, o ITCMD incide só sobre o excesso.",
    catalogo: [HONORARIOS, ...COM_IMOVEIS, CUSTAS_JUDICIAIS, OUTROS_CUSTOS],
  },
  {
    chave: "alvara_judicial",
    textoProposta:
      "Conforme solicitado, apresento a proposta para a realização dos serviços referente ao Alvará Judicial de:",
    nome: "Alvará Judicial",
    nomeImposto: null,
    impostoAliquota: 0,
    temHerdeiros: true,
    temPartilha: true,
    vias: ["judicial"],
    acaoOab: "Alvará judicial",
    honorariosPadrao: { modo: "tabela", percentual: 20, valorMinimo: 2206.06 },
    itensProposta: PROPOSTA_GENERICA,
    observacao:
      "Base de cálculo = valor do bem ou numerário a levantar. Ligue o ITCMD se o alvará envolver transmissão causa mortis.",
    catalogo: [HONORARIOS, CERTIDOES_PESSOAIS, CUSTAS_JUDICIAIS, OUTROS_CUSTOS],
  },
];

export const servicoPorChave = (chave: string) =>
  SERVICOS.find((s) => s.chave === chave) ?? SERVICOS[0];
