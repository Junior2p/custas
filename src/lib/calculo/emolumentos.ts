import type { FaixaEmolumento, FaixaCustasJudiciais } from "./tipos";

/** Arredonda para 2 casas, evitando o erro de ponto flutuante herdado da planilha. */
export function arredondar(valor: number, casas = 2): number {
  const f = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * f) / f;
}

/**
 * Busca a faixa correspondente a um valor.
 *
 * Equivale ao PROCV aproximado da planilha, mas cobre também a última faixa
 * ("acima de"), que ficava de fora do intervalo B2:E32 — ver problema #5 da análise.
 */
export function buscarFaixa(
  faixas: FaixaEmolumento[],
  valor: number
): FaixaEmolumento | null {
  if (faixas.length === 0) return null;

  const ordenadas = [...faixas].sort((a, b) => a.valorDe - b.valorDe);

  // Abaixo da primeira faixa: usa a primeira (comportamento do PROCV com tabela iniciada em 0).
  if (valor < ordenadas[0].valorDe) return ordenadas[0];

  for (let i = ordenadas.length - 1; i >= 0; i--) {
    if (valor >= ordenadas[i].valorDe) return ordenadas[i];
  }
  return ordenadas[0];
}

/** Emolumento correspondente ao valor. Retorna 0 se a tabela estiver vazia. */
export function emolumento(faixas: FaixaEmolumento[], valor: number): number {
  const faixa = buscarFaixa(faixas, valor);
  return faixa ? arredondar(faixa.valorTotal) : 0;
}

/**
 * Custas judiciais por faixa.
 * Na planilha: ≥ 500.000 → 300 UFESP · ≥ 50.000 → 100 UFESP · < 50.000 → 10 UFESP.
 */
export function custasJudiciais(
  faixas: FaixaCustasJudiciais[],
  valor: number,
  ufesp: number
): { valor: number; memoria: string } {
  if (faixas.length === 0) return { valor: 0, memoria: "sem faixas cadastradas" };

  const ordenadas = [...faixas].sort((a, b) => a.valorDe - b.valorDe);
  let faixa = ordenadas[0];
  for (let i = ordenadas.length - 1; i >= 0; i--) {
    if (valor >= ordenadas[i].valorDe) {
      faixa = ordenadas[i];
      break;
    }
  }

  if (faixa.base === "ufesp") {
    return {
      valor: arredondar(faixa.quantidade * ufesp),
      memoria: `${faixa.quantidade} UFESP × ${formatarMoeda(ufesp)}`,
    };
  }
  if (faixa.base === "percentual") {
    return {
      valor: arredondar(valor * (faixa.quantidade / 100)),
      memoria: `${faixa.quantidade}% sobre ${formatarMoeda(valor)}`,
    };
  }
  return { valor: arredondar(faixa.quantidade), memoria: "valor fixo da faixa" };
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
