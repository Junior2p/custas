// ============================================================
// MODELO DO ORÇAMENTO
// Todo o estado de uma cotação em um objeto só — é o que se salva,
// exporta e importa. Serve tanto para o arquivo quanto para o banco.
// ============================================================
import type { Bem, ConfigHonorarios, FaixaCustasJudiciais, Parametros, Via } from "@/lib/calculo/tipos";
import type { Herdeiro } from "@/lib/calculo/partilha";
import { SERVICOS, servicoPorChave } from "@/lib/dados/servicos";
import { PARAMETRIZACAO_PADRAO, type Parametrizacao } from "@/lib/parametrizacao/modelo";

export type BemComId = Bem & { id: string };

export type ItemProposta = { descricao: string; incluso: boolean };

export type Orcamento = {
  id: string;
  numero: string;
  /** ISO. Gravado na criação e a cada salvamento. */
  criadoEm: string;
  atualizadoEm: string;

  cliente: string;
  observacoes: string;
  tipoServico: string;
  status: "rascunho" | "enviado" | "aprovado" | "recusado";

  bens: BemComId[];
  /**
   * Quantidade de herdeiros — é o que o cálculo usa (certidões pessoais,
   * valor por herdeiro). Informada direto na cotação.
   */
  qtdHerdeiros: number;
  /**
   * Há meeiro(a) na sucessão. Conta para as certidões pessoais, mas fica
   * de fora da divisão dos quinhões — a meação é direito próprio, não herança.
   */
  temMeeiro: boolean;
  /**
   * Detalhamento nominal dos quinhões. Preenchido na aba Herdeiros, quando
   * o inventário sai do papel — não é necessário para cotar.
   */
  herdeiros: Herdeiro[];

  honorariosModo: ConfigHonorarios["modo"];
  honorariosValor: number;
  honorariosPercentual: number;
  honorariosPercentualCustos: number;
  acaoOab: string;

  aplicarMulta: boolean;
  rateio: "por_quinhao" | "igualitario";
  viaEscolhida: Via;

  valorNegociado: number;
  entrada: number;
  parcelas: number;
  validadeDias: number;
  formaPagamento: string;
  /** Textos do documento, revisáveis antes de imprimir. */
  tituloProposta: string;
  textoAbertura: string;
  itensProposta: ItemProposta[];

  /**
   * Ajustes manuais por linha de custo: valor fixado à mão ou linha desligada.
   * É como se zera ou aumenta "Outros Custos" sem mexer na fórmula.
   */
  ajustes: Record<string, { valor?: number; incluso?: boolean }>;

  /**
   * Parametrização usada nesta cotação. Fica gravada junto para que um
   * orçamento antigo continue mostrando os números com que foi feito,
   * mesmo depois de a UFESP ou as certidões mudarem de valor.
   */
  parametros: Parametros;
  faixasCustas: FaixaCustasJudiciais[];
  aliquotaImposto: number | null;
};

let contador = 0;
export const novoId = () => `${Date.now().toString(36)}${(contador++).toString(36)}`;

export const bemVazio = (): BemComId => ({
  id: novoId(),
  descricao: "",
  tipo: "imovel",
  valorVenal: 0,
  percentual: 1,
  registrar: true,
  qtdCertidoes: 1,
});

/** Numeração sequencial por ano, no padrão 0001/2026. */
export function proximoNumero(existentes: Orcamento[]): string {
  const ano = new Date().getFullYear().toString();
  const doAno = existentes
    .map((o) => o.numero)
    .filter((n) => n.endsWith(`/${ano}`))
    .map((n) => Number(n.split("/")[0]))
    .filter((n) => Number.isFinite(n));
  const proximo = (doAno.length ? Math.max(...doAno) : 0) + 1;
  return `${String(proximo).padStart(4, "0")}/${ano}`;
}

export function orcamentoNovo(
  existentes: Orcamento[] = [],
  chaveServico?: string,
  base: Parametrizacao = PARAMETRIZACAO_PADRAO
): Orcamento {
  const servico = chaveServico ? servicoPorChave(chaveServico) : SERVICOS[0];
  const agora = new Date().toISOString();

  return {
    id: novoId(),
    numero: proximoNumero(existentes),
    criadoEm: agora,
    atualizadoEm: agora,

    cliente: "",
    observacoes: "",
    tipoServico: servico.chave,
    status: "rascunho",

    bens: [bemVazio()],
    qtdHerdeiros: servico.temHerdeiros ? 2 : 0,
    temMeeiro: false,
    herdeiros: [],

    honorariosModo: servico.honorariosPadrao.modo,
    honorariosValor:
      servico.honorariosPadrao.modo === "fixo"
        ? servico.honorariosPadrao.valor
        : base.honorariosPadrao.valor,
    honorariosPercentual: base.honorariosPadrao.percentual,
    honorariosPercentualCustos:
      servico.honorariosPadrao.modo === "percentual_custos"
        ? servico.honorariosPadrao.percentual
        : base.honorariosPadrao.percentualCustos,
    acaoOab: servico.acaoOab ?? "",

    aplicarMulta: false,
    rateio: "por_quinhao",
    viaEscolhida: servico.vias[0],

    valorNegociado: 0,
    entrada: base.condicoes.entrada,
    parcelas: base.condicoes.parcelas,
    validadeDias: base.condicoes.validadeDias,
    formaPagamento: "",
    tituloProposta: "Proposta de Prestação de Serviço",
    textoAbertura: servico.textoProposta,
    itensProposta: servico.itensProposta.map((i) => ({ ...i })),
    ajustes: {},

    parametros: { ...base.parametros },
    faixasCustas: base.faixasCustas.map((f) => ({ ...f })),
    aliquotaImposto: null,
  };
}

/** Ajusta o orçamento quando o tipo de serviço muda. */
export function aplicarServico(orcamento: Orcamento, chave: string): Orcamento {
  const servico = servicoPorChave(chave);

  return {
    ...orcamento,
    tipoServico: servico.chave,
    acaoOab: servico.acaoOab ?? orcamento.acaoOab,
    honorariosModo: servico.honorariosPadrao.modo,
    honorariosPercentualCustos:
      servico.honorariosPadrao.modo === "percentual_custos"
        ? servico.honorariosPadrao.percentual
        : orcamento.honorariosPercentualCustos,
    itensProposta: servico.itensProposta.map((i) => ({ ...i })),
    textoAbertura: servico.textoProposta,
    viaEscolhida: servico.vias.includes(orcamento.viaEscolhida)
      ? orcamento.viaEscolhida
      : servico.vias[0],
    aliquotaImposto: null,
    // Serviço sem herdeiros zera a contagem; ao voltar, sugere 2.
    qtdHerdeiros: servico.temHerdeiros ? orcamento.qtdHerdeiros || 2 : 0,
    temMeeiro: servico.temHerdeiros ? orcamento.temMeeiro : false,
  };
}

/** Gera a lista nominal a partir da quantidade informada na cotação. */
export function gerarHerdeiros(quantidade: number, comMeeiro: boolean): Herdeiro[] {
  const lista: Herdeiro[] = [];
  if (comMeeiro) {
    lista.push({ id: novoId(), nome: "Meeiro(a)", tipo: "meeiro", percentual: 0.5 });
  }
  const fatia = quantidade > 0 ? 1 / quantidade : 0;
  for (let i = 0; i < quantidade; i++) {
    lista.push({
      id: novoId(),
      nome: `Herdeiro ${i + 1}`,
      tipo: "herdeiro",
      percentual: fatia,
    });
  }
  return lista;
}

/**
 * Completa uma cotação lida do armazenamento ou de um arquivo.
 * Cotações gravadas por versões anteriores não têm os campos mais novos —
 * sem isso a tela quebra ao ler, por exemplo, `ajustes` inexistente.
 */
export function normalizarOrcamento(bruto: Partial<Orcamento>): Orcamento {
  const modelo = orcamentoNovo();
  const herdeiros = bruto.herdeiros ?? [];

  return {
    ...modelo,
    ...bruto,
    id: bruto.id ?? modelo.id,
    numero: bruto.numero ?? modelo.numero,
    bens: (bruto.bens ?? []).map((b) => ({ ...bemVazio(), ...b })),
    herdeiros,
    // Versões antigas guardavam só a lista nominal; a contagem vem dela.
    qtdHerdeiros:
      bruto.qtdHerdeiros ?? herdeiros.filter((h) => h.tipo === "herdeiro").length,
    temMeeiro: bruto.temMeeiro ?? herdeiros.some((h) => h.tipo === "meeiro"),
    itensProposta: bruto.itensProposta ?? modelo.itensProposta,
    ajustes: bruto.ajustes ?? {},
    validadeDias: bruto.validadeDias ?? modelo.validadeDias,
    formaPagamento: bruto.formaPagamento ?? "",
    tituloProposta: bruto.tituloProposta || modelo.tituloProposta,
    textoAbertura: bruto.textoAbertura || modelo.textoAbertura,
    parametros: { ...modelo.parametros, ...bruto.parametros },
    faixasCustas: bruto.faixasCustas?.length ? bruto.faixasCustas : modelo.faixasCustas,
    aliquotaImposto: bruto.aliquotaImposto ?? null,
  };
}

export const rotuloOrcamento = (o: Orcamento) =>
  `${o.numero} — ${o.cliente.trim() || "sem cliente"}`;
