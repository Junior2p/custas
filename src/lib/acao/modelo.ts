// ============================================================
// AÇÕES JUDICIAIS — o que não se mede por patrimônio.
//
// Dois documentos, o mesmo cadastro:
//  · EXTRATO   — fechamento de processo em andamento, ato a ato,
//                com base na Tabela de Honorários da OAB/SP;
//  · PROPOSTA  — ingresso de ação ou defesa, com honorários iniciais,
//                percentual de êxito e custas sobre o valor da causa.
// ============================================================

export type TipoDocumento = "extrato" | "proposta";

export type AtoProcessual = {
  id: string;
  descricao: string;
  /** Piso da Tabela OAB/SP para o ato. */
  valorMinimo: number;
  /** Percentual aplicado conforme a complexidade (ex.: 65 = 65% do piso). */
  complexidade: number;
  /** Acréscimo por êxito, em pontos percentuais. */
  exito: number;
};

export type CustoExtra = {
  id: string;
  descricao: string;
  valor: number;
};

export type AcaoJudicial = {
  id: string;
  numero: string;
  criadoEm: string;
  atualizadoEm: string;
  status: "rascunho" | "enviado" | "aprovado" | "recusado";

  tipoDocumento: TipoDocumento;

  cliente: string;
  processo: string;
  acao: string;
  valorCausa: number;
  dataDistribuicao: string;
  /** Preenchido a partir da data de distribuição, mas editável. */
  tempoAtuacaoMeses: number;

  // ---- extrato ----
  atos: AtoProcessual[];
  custosExtras: CustoExtra[];

  // ---- proposta de ingresso ----
  honorariosIniciais: number;
  percentualExito: number;
  /** Taxa judiciária sobre o valor da causa. Em regra 1,5%. */
  percentualCustas: number;

  // ---- textos do documento, revisáveis antes de imprimir ----
  titulo: string;
  textoAbertura: string;
  textoHonorarios: string;
  textoCustas: string;
  textoRiscos: string;
  observacoes: string;
};

let contador = 0;
export const novoId = () => `a${Date.now().toString(36)}${(contador++).toString(36)}`;

export const atoVazio = (): AtoProcessual => ({
  id: novoId(),
  descricao: "",
  valorMinimo: 0,
  complexidade: 100,
  exito: 0,
});

export const custoVazio = (): CustoExtra => ({ id: novoId(), descricao: "", valor: 0 });

/** Valor final do ato: piso × complexidade, acrescido do êxito. */
export function valorDoAto(ato: AtoProcessual): number {
  const comReducao = (ato.valorMinimo * ato.complexidade) / 100;
  return Math.round(comReducao * (1 + ato.exito / 100) * 100) / 100;
}

export const valorComReducao = (ato: AtoProcessual) =>
  Math.round(((ato.valorMinimo * ato.complexidade) / 100) * 100) / 100;

export function totaisAcao(a: AcaoJudicial) {
  const honorariosAtos = a.atos.reduce((s, ato) => s + valorDoAto(ato), 0);
  const extras = a.custosExtras.reduce((s, c) => s + c.valor, 0);
  const custas = (a.valorCausa * a.percentualCustas) / 100;
  const arredondar = (v: number) => Math.round(v * 100) / 100;

  return {
    honorariosAtos: arredondar(honorariosAtos),
    extras: arredondar(extras),
    custas: arredondar(custas),
    /** Extrato: honorários dos atos + custos com terceiros. */
    totalExtrato: arredondar(honorariosAtos + extras),
    /** Proposta: o que o cliente desembolsa para ingressar. */
    totalIngresso: arredondar(a.honorariosIniciais + custas + extras),
  };
}

export function proximoNumero(existentes: AcaoJudicial[]): string {
  const ano = new Date().getFullYear().toString();
  const doAno = existentes
    .map((a) => a.numero)
    .filter((n) => n.endsWith(`/${ano}`))
    .map((n) => Number(n.split("/")[0]))
    .filter((n) => Number.isFinite(n));
  return `${String((doAno.length ? Math.max(...doAno) : 0) + 1).padStart(4, "0")}/${ano}`;
}

/** Meses cheios entre a distribuição e hoje. */
export function mesesDesde(dataIso: string): number {
  if (!dataIso) return 0;
  const inicio = new Date(dataIso);
  if (Number.isNaN(inicio.getTime())) return 0;

  const hoje = new Date();
  const meses =
    (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
  return Math.max(0, hoje.getDate() < inicio.getDate() ? meses - 1 : meses);
}

// ------------------------------------------------------------
// Textos padrão — ponto de partida, editáveis em cada documento
// ------------------------------------------------------------

export const TEXTO_PROPOSTA = {
  titulo: "Proposta de Honorários Advocatícios",
  abertura:
    "Conforme conversamos, segue a proposta referente aos honorários advocatícios para ingresso da ação judicial:",
  honorarios:
    "Os honorários iniciais são devidos para protocolar a ação. O percentual de êxito será cobrado somente em caso de sucesso, e incidirá sobre o que for efetivamente pago pela parte contrária — seja por acordo ou por decisão judicial favorável.",
  custas:
    "O cliente também arcará com as custas do processo:\n• Taxa judiciária para protocolo, calculada sobre o valor da causa;\n• Eventuais despesas com cartório, cópias e custas de intimações, se necessárias;\n• Caso haja necessidade de perícia ou diligência, informarei previamente.",
  riscos:
    "Como toda ação judicial, existe a possibilidade de sentença desfavorável. Nesse caso:\n• Não será devido nenhum valor adicional de honorários, além dos honorários iniciais;\n• No entanto, poderá haver condenação em honorários de sucumbência e custas processuais em favor da parte contrária (conforme o Código de Processo Civil), cujo valor é fixado pelo juiz, geralmente entre 10% e 20% do valor da causa.",
  observacoes:
    "Reforço que todo o andamento será acompanhado de perto, com transparência, e que estarei à disposição para esclarecer qualquer ponto antes e durante o processo.",
};

export const TEXTO_EXTRATO = {
  titulo: "Extrato de Honorários Contratuais",
  abertura: "Com base na Tabela de Honorários da OAB/SP.",
  observacoes:
    "• Os valores acima seguem os parâmetros mínimos da Tabela da OAB/SP, ajustados conforme a complexidade de cada ato processual.\n• A atuação do patrono se estendeu por todas as fases processuais.",
};

export function acaoNova(
  existentes: AcaoJudicial[] = [],
  tipoDocumento: TipoDocumento = "proposta"
): AcaoJudicial {
  const agora = new Date().toISOString();
  const proposta = tipoDocumento === "proposta";

  return {
    id: novoId(),
    numero: proximoNumero(existentes),
    criadoEm: agora,
    atualizadoEm: agora,
    status: "rascunho",

    tipoDocumento,

    cliente: "",
    processo: "",
    acao: "",
    valorCausa: 0,
    dataDistribuicao: "",
    tempoAtuacaoMeses: 0,

    atos: proposta ? [] : [atoVazio()],
    custosExtras: [],

    honorariosIniciais: 1500,
    percentualExito: 10,
    percentualCustas: 1.5,

    titulo: proposta ? TEXTO_PROPOSTA.titulo : TEXTO_EXTRATO.titulo,
    textoAbertura: proposta ? TEXTO_PROPOSTA.abertura : TEXTO_EXTRATO.abertura,
    textoHonorarios: proposta ? TEXTO_PROPOSTA.honorarios : "",
    textoCustas: proposta ? TEXTO_PROPOSTA.custas : "",
    textoRiscos: proposta ? TEXTO_PROPOSTA.riscos : "",
    observacoes: proposta ? TEXTO_PROPOSTA.observacoes : TEXTO_EXTRATO.observacoes,
  };
}

/** Troca os textos padrão ao mudar o tipo de documento, preservando o resto. */
export function aplicarTipoDocumento(a: AcaoJudicial, tipo: TipoDocumento): AcaoJudicial {
  const base = acaoNova([], tipo);
  return {
    ...a,
    tipoDocumento: tipo,
    titulo: base.titulo,
    textoAbertura: base.textoAbertura,
    textoHonorarios: base.textoHonorarios,
    textoCustas: base.textoCustas,
    textoRiscos: base.textoRiscos,
    observacoes: base.observacoes,
    atos: tipo === "extrato" && a.atos.length === 0 ? [atoVazio()] : a.atos,
  };
}

export function normalizarAcao(bruto: Partial<AcaoJudicial>): AcaoJudicial {
  const modelo = acaoNova([], bruto.tipoDocumento ?? "proposta");
  return {
    ...modelo,
    ...bruto,
    atos: (bruto.atos ?? []).map((a) => ({ ...atoVazio(), ...a })),
    custosExtras: (bruto.custosExtras ?? []).map((c) => ({ ...custoVazio(), ...c })),
  };
}

export const rotuloAcao = (a: AcaoJudicial) =>
  `${a.numero} — ${a.cliente.trim() || "sem cliente"}`;
