import { arredondar, formatarMoeda } from "./emolumentos";
import type { ConfigHonorarios } from "./tipos";

/**
 * Honorários advocatícios em 3 modos.
 *
 * Na planilha os honorários eram um valor digitado à mão e a Tabela OAB não
 * alimentava nenhuma fórmula (problema #2 da análise). Aqui a tabela volta a valer.
 */
export function calcularHonorarios(
  config: ConfigHonorarios,
  base: number
): { valor: number; memoria: string } {
  if (config.modo === "fixo") {
    return { valor: arredondar(config.valor), memoria: "valor fixo" };
  }

  if (config.modo === "percentual") {
    return {
      valor: arredondar(base * (config.percentual / 100)),
      memoria: `${config.percentual}% sobre ${formatarMoeda(base)}`,
    };
  }

  // Tabela OAB: percentual sobre o valor, respeitando o piso da ação.
  const calculado = arredondar(base * (config.percentual / 100));
  if (calculado < config.valorMinimo) {
    return {
      valor: arredondar(config.valorMinimo),
      memoria: `piso da tabela OAB (${config.percentual}% de ${formatarMoeda(base)} = ${formatarMoeda(calculado)}, abaixo do mínimo)`,
    };
  }
  return {
    valor: calculado,
    memoria: `tabela OAB — ${config.percentual}% sobre ${formatarMoeda(base)}`,
  };
}
