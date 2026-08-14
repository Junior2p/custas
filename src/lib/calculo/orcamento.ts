import { arredondar, custasJudiciais, emolumento, formatarMoeda } from "./emolumentos";
import { calcularHonorarios } from "./honorarios";
import type {
  Bem,
  ContextoCalculo,
  ItemCatalogo,
  LinhaCusto,
  ResultadoCalculo,
} from "./tipos";

/** Valor efetivamente transmitido de um bem: valor venal × fração inventariada. */
export function valorTransmitidoDoBem(bem: Bem): number {
  return arredondar(bem.valorVenal * bem.percentual);
}

/**
 * Apura um orçamento inteiro para uma via (judicial ou extrajudicial).
 *
 * O catálogo já deve chegar filtrado pelo tipo de serviço. Cada item vira uma linha,
 * na ordem definida no catálogo — itens que dependem de outros (ex.: "Outros Custos",
 * que incide sobre custas + registro) precisam vir depois deles.
 */
export function calcularOrcamento(ctx: ContextoCalculo): ResultadoCalculo {
  const p = ctx.parametros;

  const totalVenal = arredondar(ctx.bens.reduce((s, b) => s + b.valorVenal, 0));
  const totalTransmitido = arredondar(
    ctx.bens.reduce((s, b) => s + valorTransmitidoDoBem(b), 0)
  );
  const qtdBens = ctx.bens.length;
  const qtdImoveis = ctx.bens.filter((b) => b.tipo === "imovel").length;
  const qtdCertidoes = ctx.bens.reduce((s, b) => s + (b.qtdCertidoes ?? 0), 0);

  const imposto = arredondar(totalTransmitido * (p.impostoAliquota / 100));
  const multa = ctx.aplicarMulta ? arredondar(imposto * (p.multaPercentual / 100)) : 0;

  // Registro no SRI: emolumento por imóvel marcado para registro (+ certidão embutida).
  const registro = arredondar(
    ctx.bens
      .filter((b) => b.tipo === "imovel" && b.registrar)
      .reduce((s, b) => {
        const base = emolumento(ctx.tabelaSri, valorTransmitidoDoBem(b));
        return s + base + (p.registroIncluiCertidao ? p.certidaoImovel : 0);
      }, 0)
  );

  const custas =
    ctx.via === "judicial"
      ? custasJudiciais(ctx.faixasCustasJudiciais, totalTransmitido, p.ufesp)
      : {
          valor: emolumento(ctx.tabelaNotas, totalTransmitido),
          memoria: `tabela de Notas — faixa de ${formatarMoeda(totalTransmitido)}`,
        };

  const bases = {
    totalVenal,
    totalTransmitido,
    qtdBens,
    qtdImoveis,
    qtdCertidoes,
    imposto,
    multa,
    registro,
  };

  const aplicavel = (item: ItemCatalogo) =>
    !item.vias || item.vias.length === 0 || item.vias.includes(ctx.via);

  const linhas: LinhaCusto[] = [];

  for (const item of [...ctx.catalogo].filter(aplicavel).sort((a, b) => a.ordem - b.ordem)) {
    const subtotal = arredondar(
      linhas.filter((l) => l.incluso).reduce((s, l) => s + l.valor, 0)
    );
    const bruto = resolverItem(item, ctx, bases, { custas, subtotal });
    if (!bruto) continue;

    const ajuste = ctx.ajustes?.[item.chave];
    const manual = ajuste?.valor !== undefined;

    linhas.push({
      chave: item.chave,
      nome: item.nome,
      valor: arredondar(manual ? ajuste.valor! : bruto.valor),
      memoria: manual ? `valor ajustado à mão (calculado: ${formatarMoeda(bruto.valor)})` : bruto.memoria,
      origem: manual ? "manual" : "auto",
      incluso: ajuste?.incluso ?? true,
    });
  }

  for (const [i, extra] of (ctx.linhasManuais ?? []).entries()) {
    linhas.push({
      chave: `manual_${i + 1}`,
      nome: extra.nome,
      valor: arredondar(extra.valor),
      memoria: "linha criada no orçamento",
      origem: "manual",
      incluso: extra.incluso ?? true,
    });
  }

  const total = arredondar(
    linhas.filter((l) => l.incluso).reduce((s, l) => s + l.valor, 0)
  );
  const valorRegistroNasLinhas = arredondar(
    linhas
      .filter((l) => l.incluso && l.chave === "registro_sri")
      .reduce((s, l) => s + l.valor, 0)
  );

  return {
    via: ctx.via,
    linhas,
    total,
    totalSemRegistro: arredondar(total - valorRegistroNasLinhas),
    totalPorHerdeiro: ctx.qtdHerdeiros > 0 ? arredondar(total / ctx.qtdHerdeiros) : total,
    bases,
  };
}

type Derivados = {
  custas: { valor: number; memoria: string };
  subtotal: number;
};

function resolverItem(
  item: ItemCatalogo,
  ctx: ContextoCalculo,
  bases: ResultadoCalculo["bases"],
  derivados: Derivados
): { valor: number; memoria: string } | null {
  const p = ctx.parametros;
  const doParametro = (padrao: number) =>
    item.parametro ? Number(p[item.parametro]) : padrao;

  switch (item.tipoCalculo) {
    case "honorarios": {
      const r = calcularHonorarios(ctx.honorarios, bases.totalTransmitido);
      return { valor: r.valor, memoria: r.memoria };
    }

    case "imposto": {
      const valor = arredondar(bases.imposto + bases.multa);
      const memoria = ctx.aplicarMulta
        ? `${p.impostoAliquota}% de ${formatarMoeda(bases.totalTransmitido)} + multa de ${p.multaPercentual}%`
        : `${p.impostoAliquota}% sobre ${formatarMoeda(bases.totalTransmitido)}`;
      return { valor, memoria };
    }

    case "fixo": {
      const valor = doParametro(item.valor ?? 0);
      return { valor: arredondar(valor), memoria: "valor fixo" };
    }

    case "por_unidade": {
      const unitario = doParametro(item.valor ?? 0);
      const qtd = quantidade(item, ctx, bases);
      return {
        valor: arredondar(unitario * qtd),
        memoria: `${qtd} × ${formatarMoeda(unitario)}`,
      };
    }

    case "percentual_sobre": {
      const perc = doParametro(item.percentual ?? 0);
      const base = valorDaBase(item, bases, derivados);
      return {
        valor: arredondar(base * (perc / 100)),
        memoria: `${perc}% sobre ${formatarMoeda(base)}`,
      };
    }

    case "tabela_notas":
      return {
        valor: derivados.custas.valor,
        memoria: derivados.custas.memoria,
      };

    case "tabela_custas_judiciais":
      return {
        valor: derivados.custas.valor,
        memoria: derivados.custas.memoria,
      };

    case "tabela_sri": {
      const detalhe = ctx.bens.filter((b) => b.tipo === "imovel" && b.registrar).length;
      return {
        valor: bases.registro,
        memoria: `tabela do SRI — ${detalhe} imóvel(is) a registrar`,
      };
    }

    default:
      return null;
  }
}

function quantidade(
  item: ItemCatalogo,
  ctx: ContextoCalculo,
  bases: ResultadoCalculo["bases"]
): number {
  switch (item.multiplicador) {
    case "herdeiros":
      return ctx.qtdHerdeiros;
    case "imoveis":
      return bases.qtdImoveis;
    case "bens":
      return bases.qtdBens;
    case "certidoes":
      return bases.qtdCertidoes;
    default:
      return item.quantidade ?? 1;
  }
}

function valorDaBase(
  item: ItemCatalogo,
  bases: ResultadoCalculo["bases"],
  derivados: Derivados
): number {
  switch (item.base) {
    case "total_venal":
      return bases.totalVenal;
    case "total_transmitido":
      return bases.totalTransmitido;
    case "imposto":
      return arredondar(bases.imposto + bases.multa);
    case "custas_registro":
      return arredondar(derivados.custas.valor + bases.registro);
    case "subtotal":
      return derivados.subtotal;
    default:
      return 0;
  }
}
