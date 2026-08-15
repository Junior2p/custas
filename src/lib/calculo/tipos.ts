// ============================================================
// TIPOS DO MOTOR DE CÁLCULO
// Espelham as regras da planilha "Custos Processuais.xlsx".
// Ver: Cortex IA/Custas/docs/01-ANALISE-PLANILHA.md
// ============================================================

/** Faixa de uma tabela de emolumentos (Notas ou SRI). `valorAte: null` = faixa "acima de". */
export type FaixaEmolumento = {
  ordem: number;
  valorDe: number;
  valorAte: number | null;
  valorTotal: number;
};

/** Linha da Tabela OAB: percentual sobre o valor, com piso. */
export type AcaoHonorario = {
  acao: string;
  /** Em pontos percentuais (ex.: 8 = 8%). */
  percentual: number;
  valorMinimo: number;
};

/** Faixa de custas judiciais. A planilha usa degraus em UFESP. */
export type FaixaCustasJudiciais = {
  ordem: number;
  valorDe: number;
  valorAte: number | null;
  /** `ufesp`: quantidade × UFESP · `moeda`: valor fixo · `percentual`: % sobre a base. */
  base: "ufesp" | "moeda" | "percentual";
  quantidade: number;
};

export type TipoBem = "imovel" | "veiculo" | "outro";

export type Bem = {
  descricao: string;
  tipo: TipoBem;
  valorVenal: number;
  /** Fração que entra na transmissão (0..1). 1 = 100%. */
  percentual: number;
  /** Se o registro no SRI entra no orçamento. */
  registrar: boolean;
  /** Quantas certidões deste bem são cobradas. */
  qtdCertidoes: number;
};

export type Via = "judicial" | "extrajudicial";

export type ConfigHonorarios =
  | { modo: "fixo"; valor: number }
  /** Percentual sobre o valor transmitido (o monte-mor / valor do bem). */
  | { modo: "percentual"; percentual: number }
  /**
   * Percentual sobre os demais custos apurados — honorários embutidos,
   * sem cobrança explícita ao cliente. Calculado sempre por último.
   */
  | { modo: "percentual_custos"; percentual: number }
  | { modo: "tabela"; percentual: number; valorMinimo: number };

/** Parâmetros gerais editáveis na área de Parametrização. */
export type Parametros = {
  /** Alíquota efetiva da cotação, resolvida a partir das padrão abaixo. */
  impostoAliquota: number;
  /** Padrão do imposto causa mortis (ITCMD/SP). */
  aliquotaItcmd: number;
  /** Padrão do imposto inter vivos (ITBI). */
  aliquotaItbi: number;
  multaPercentual: number;
  ufesp: number;
  certidaoImovel: number;
  certidaoTestamento: number;
  certidaoPessoalHerdeiro: number;
  outrosCustosPercentual: number;
  /**
   * Custas do Tabelionato de **Notas** apuradas bem a bem, cada um na sua
   * faixa. O padrão é `false`: a escritura é um ato só, então a faixa sai
   * da soma dos bens.
   *
   * Não afeta o **registro no SRI**, que é sempre por imóvel — cada
   * matrícula é um ato próprio, e os imóveis podem estar em comarcas
   * diferentes. Nem as **custas judiciais**, que incidem sobre o monte-mor.
   */
  notasPorBem: boolean;
};

/** Chaves numéricas de `Parametros` — as que a tela edita como número. */
export type ParametroNumerico = {
  [K in keyof Parametros]: Parametros[K] extends number ? K : never;
}[keyof Parametros];

export type BaseCalculo =
  | "total_venal"
  | "total_transmitido"
  | "imposto"
  | "custas_registro"
  | "subtotal";

export type Multiplicador =
  | "herdeiros"
  /** Herdeiros + meeiro(a): quem precisa de certidão pessoal. */
  | "pessoas"
  | "imoveis"
  | "imoveis_registro"
  | "bens"
  | "certidoes"
  | "manual";

export type TipoCalculo =
  | "fixo"
  | "por_unidade"
  | "percentual_sobre"
  | "tabela_notas"
  | "tabela_sri"
  | "tabela_custas_judiciais"
  | "imposto"
  | "honorarios";

/** Item do catálogo de custos — define COMO uma linha de despesa é apurada. */
export type ItemCatalogo = {
  chave: string;
  nome: string;
  tipoCalculo: TipoCalculo;
  ordem: number;
  /** Vias em que o item se aplica. Vazio/ausente = todas. */
  vias?: Via[];
  valor?: number;
  /** Em pontos percentuais. */
  percentual?: number;
  base?: BaseCalculo;
  multiplicador?: Multiplicador;
  /** Quantidade quando `multiplicador === "manual"`. */
  quantidade?: number;
  /**
   * Quando preenchido, o valor (ou percentual) do item vem deste parâmetro geral,
   * em vez de ficar duplicado no catálogo.
   */
  parametro?: ParametroNumerico;
  /**
   * Marca a linha como parte do custo de registro. Essas linhas compõem a base
   * "custas + registro" e são as que saem do "total sem registro".
   */
  vinculadoRegistro?: boolean;
};

/** Linha de despesa já apurada. */
export type LinhaCusto = {
  chave: string;
  nome: string;
  valor: number;
  /** Explica de onde saiu o número — aparece na tela e ajuda a conferir. */
  memoria: string;
  origem: "auto" | "manual";
  incluso: boolean;
  vinculadoRegistro: boolean;
};

export type ContextoCalculo = {
  bens: Bem[];
  qtdHerdeiros: number;
  /**
   * O meeiro(a) precisa das mesmas certidões pessoais que os herdeiros,
   * mas não entra na divisão dos quinhões.
   */
  temMeeiro: boolean;
  via: Via;
  parametros: Parametros;
  aplicarMulta: boolean;
  honorarios: ConfigHonorarios;
  tabelaNotas: FaixaEmolumento[];
  tabelaSri: FaixaEmolumento[];
  faixasCustasJudiciais: FaixaCustasJudiciais[];
  catalogo: ItemCatalogo[];
  /** Overrides por chave do catálogo: valor fixado à mão ou item desligado. */
  ajustes?: Record<string, { valor?: number; incluso?: boolean }>;
  /** Linhas avulsas criadas direto no orçamento. */
  linhasManuais?: { nome: string; valor: number; incluso?: boolean }[];
};

export type ResultadoCalculo = {
  via: Via;
  linhas: LinhaCusto[];
  total: number;
  totalSemRegistro: number;
  totalPorHerdeiro: number;
  /** Bases usadas, expostas para conferência na tela. */
  bases: {
    totalVenal: number;
    totalTransmitido: number;
    qtdBens: number;
    qtdImoveis: number;
    qtdCertidoes: number;
    imposto: number;
    multa: number;
    registro: number;
  };
};
