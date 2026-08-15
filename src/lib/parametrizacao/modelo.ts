// ============================================================
// PARAMETRIZAÇÃO — os valores de base do escritório.
// Ficam fora das cotações: mudam pouco e valem para todas.
// Uma cotação nova nasce com uma cópia dos parâmetros simples
// (certidões, multa, UFESP), para não se alterar sozinha depois.
// ============================================================
import type {
  AcaoHonorario,
  ConfigHonorarios,
  FaixaCustasJudiciais,
  FaixaEmolumento,
  Parametros,
} from "@/lib/calculo/tipos";
import { FAIXAS_CUSTAS_JUDICIAIS, PARAMETROS_PADRAO } from "@/lib/dados/padroes";
import { TABELA_NOTAS_2025, TABELA_OAB, TABELA_SRI_2025 } from "@/lib/dados/tabelas-2025";

export type DadosEscritorio = {
  nome: string;
  oab: string;
  telefone: string;
  email: string;
  /** Endereço completo, como sai no timbrado. */
  endereco: string;
  /** Usada na linha de data, no fim do documento. */
  cidade: string;
};

export type CondicoesPadrao = {
  entrada: number;
  parcelas: number;
  validadeDias: number;
};

export type Acesso = {
  /** SHA-256 do código validador. Vazio = sistema sem trava. */
  codigoHash: string;
};

export type Parametrizacao = {
  parametros: Parametros;
  faixasCustas: FaixaCustasJudiciais[];
  tabelaNotas: FaixaEmolumento[];
  tabelaSri: FaixaEmolumento[];
  tabelaOab: AcaoHonorario[];
  /** Honorário padrão quando o serviço não define outro. */
  honorariosPadrao: {
    modo: ConfigHonorarios["modo"];
    valor: number;
    percentual: number;
    percentualCustos: number;
  };
  escritorio: DadosEscritorio;
  condicoes: CondicoesPadrao;
  acesso: Acesso;
};

export const PARAMETRIZACAO_PADRAO: Parametrizacao = {
  parametros: { ...PARAMETROS_PADRAO },
  faixasCustas: FAIXAS_CUSTAS_JUDICIAIS.map((f) => ({ ...f })),
  tabelaNotas: TABELA_NOTAS_2025.map((f) => ({ ...f })),
  tabelaSri: TABELA_SRI_2025.map((f) => ({ ...f })),
  tabelaOab: TABELA_OAB.map((a) => ({ ...a })),
  honorariosPadrao: {
    modo: "tabela",
    valor: 2000,
    percentual: 8,
    percentualCustos: 10,
  },
  escritorio: {
    nome: "Edmilson Lopes Junior",
    oab: "OAB/SP 294.775",
    telefone: "(17) 99703-5758",
    email: "juniorlopes.2p@gmail.com",
    endereco: "Rua Arnaldo Rodrigues Neto, 305, centro — São João das Duas Pontes/SP",
    cidade: "São João das Duas Pontes/SP",
  },
  condicoes: {
    entrada: 50,
    parcelas: 3,
    validadeDias: 30,
  },
  acesso: { codigoHash: "" },
};

/**
 * Completa o que faltar com os padrões — protege contra arquivos antigos,
 * gravados antes de um campo novo existir.
 */
export function normalizar(bruto: Partial<Parametrizacao> | null | undefined): Parametrizacao {
  if (!bruto) return estruturaClonada(PARAMETRIZACAO_PADRAO);

  return {
    parametros: { ...PARAMETRIZACAO_PADRAO.parametros, ...bruto.parametros },
    faixasCustas: bruto.faixasCustas?.length
      ? bruto.faixasCustas
      : PARAMETRIZACAO_PADRAO.faixasCustas.map((f) => ({ ...f })),
    tabelaNotas: bruto.tabelaNotas?.length
      ? bruto.tabelaNotas
      : PARAMETRIZACAO_PADRAO.tabelaNotas.map((f) => ({ ...f })),
    tabelaSri: bruto.tabelaSri?.length
      ? bruto.tabelaSri
      : PARAMETRIZACAO_PADRAO.tabelaSri.map((f) => ({ ...f })),
    tabelaOab: bruto.tabelaOab?.length
      ? bruto.tabelaOab
      : PARAMETRIZACAO_PADRAO.tabelaOab.map((a) => ({ ...a })),
    honorariosPadrao: {
      ...PARAMETRIZACAO_PADRAO.honorariosPadrao,
      ...bruto.honorariosPadrao,
    },
    escritorio: { ...PARAMETRIZACAO_PADRAO.escritorio, ...bruto.escritorio },
    condicoes: { ...PARAMETRIZACAO_PADRAO.condicoes, ...bruto.condicoes },
    acesso: { ...PARAMETRIZACAO_PADRAO.acesso, ...bruto.acesso },
  };
}

function estruturaClonada(p: Parametrizacao): Parametrizacao {
  return {
    parametros: { ...p.parametros },
    faixasCustas: p.faixasCustas.map((f) => ({ ...f })),
    tabelaNotas: p.tabelaNotas.map((f) => ({ ...f })),
    tabelaSri: p.tabelaSri.map((f) => ({ ...f })),
    tabelaOab: p.tabelaOab.map((a) => ({ ...a })),
    honorariosPadrao: { ...p.honorariosPadrao },
    escritorio: { ...p.escritorio },
    condicoes: { ...p.condicoes },
    acesso: { ...p.acesso },
  };
}

const CHAVE = "custas.parametrizacao";

export function carregarParametrizacao(): Parametrizacao {
  if (typeof window === "undefined") return estruturaClonada(PARAMETRIZACAO_PADRAO);
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return normalizar(bruto ? JSON.parse(bruto) : null);
  } catch {
    return estruturaClonada(PARAMETRIZACAO_PADRAO);
  }
}

export function gravarParametrizacao(p: Parametrizacao) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, JSON.stringify(p));
}
