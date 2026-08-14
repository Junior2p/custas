// ============================================================
// MODELO DO ORÇAMENTO
// Todo o estado de uma cotação em um objeto só — é o que se salva,
// exporta e importa. Serve tanto para o arquivo quanto para o banco.
// ============================================================
import type { Bem, ConfigHonorarios, FaixaCustasJudiciais, Parametros, Via } from "@/lib/calculo/tipos";
import type { Herdeiro } from "@/lib/calculo/partilha";
import { FAIXAS_CUSTAS_JUDICIAIS, PARAMETROS_PADRAO } from "@/lib/dados/padroes";
import { SERVICOS, servicoPorChave } from "@/lib/dados/servicos";

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
  itensProposta: ItemProposta[];

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

export function orcamentoNovo(existentes: Orcamento[] = [], chaveServico?: string): Orcamento {
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
    herdeiros: servico.temHerdeiros
      ? [
          { id: novoId(), nome: "Meeiro(a)", tipo: "meeiro", percentual: 0.5 },
          { id: novoId(), nome: "Herdeiro 1", tipo: "herdeiro", percentual: 0.5 },
          { id: novoId(), nome: "Herdeiro 2", tipo: "herdeiro", percentual: 0.5 },
        ]
      : [],

    honorariosModo: servico.honorariosPadrao.modo,
    honorariosValor: servico.honorariosPadrao.modo === "fixo" ? servico.honorariosPadrao.valor : 2000,
    honorariosPercentual: 8,
    honorariosPercentualCustos:
      servico.honorariosPadrao.modo === "percentual_custos" ? servico.honorariosPadrao.percentual : 10,
    acaoOab: servico.acaoOab ?? "",

    aplicarMulta: false,
    rateio: "por_quinhao",
    viaEscolhida: servico.vias[0],

    valorNegociado: 0,
    entrada: 50,
    parcelas: 3,
    itensProposta: servico.itensProposta.map((i) => ({ ...i })),

    parametros: { ...PARAMETROS_PADRAO },
    faixasCustas: FAIXAS_CUSTAS_JUDICIAIS.map((f) => ({ ...f })),
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
    viaEscolhida: servico.vias.includes(orcamento.viaEscolhida)
      ? orcamento.viaEscolhida
      : servico.vias[0],
    aliquotaImposto: null,
    herdeiros:
      servico.temHerdeiros && orcamento.herdeiros.length === 0
        ? [
            { id: novoId(), nome: "Meeiro(a)", tipo: "meeiro", percentual: 0.5 },
            { id: novoId(), nome: "Herdeiro 1", tipo: "herdeiro", percentual: 1 },
          ]
        : orcamento.herdeiros,
  };
}

export const rotuloOrcamento = (o: Orcamento) =>
  `${o.numero} — ${o.cliente.trim() || "sem cliente"}`;
