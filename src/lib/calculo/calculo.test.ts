// ============================================================
// Testes do motor de cálculo contra os números reais da planilha.
// Rodar com:  npm test
// ============================================================
import { test } from "node:test";
import assert from "node:assert/strict";

import { emolumento, arredondar } from "./emolumentos";
import { buscarAcao, calcularHonorarios } from "./honorarios";
import { calcularOrcamento } from "./orcamento";
import { calcularPartilha } from "./partilha";
import type { Bem, ContextoCalculo } from "./tipos";
import { TABELA_NOTAS_2025, TABELA_SRI_2025, TABELA_OAB } from "../dados/tabelas-2025";
import { PARAMETROS_PADRAO, FAIXAS_CUSTAS_JUDICIAIS } from "../dados/padroes";
import { SERVICOS, servicoPorChave } from "../dados/servicos";

const INVENTARIO = servicoPorChave("inventario_consensual");
const ESCRITURA = servicoPorChave("escritura");

const perto = (recebido: number, esperado: number, tolerancia = 0.02) =>
  assert.ok(
    Math.abs(recebido - esperado) <= tolerancia,
    `esperado ~${esperado}, recebido ${recebido}`
  );

// ------------------------------------------------------------
// Tabelas de emolumentos
// ------------------------------------------------------------

test("PROCV da tabela de Notas bate com a planilha", () => {
  perto(emolumento(TABELA_NOTAS_2025, 20000), 1635.48);
  perto(emolumento(TABELA_NOTAS_2025, 400000), 5519.9);
  perto(emolumento(TABELA_NOTAS_2025, 1000), 362.98);
});

test("PROCV da tabela do SRI bate com a planilha", () => {
  perto(emolumento(TABELA_SRI_2025, 20000), 1335.6);
  perto(emolumento(TABELA_SRI_2025, 400000), 3284.18);
});

test("a última faixa passa a ser alcançada (problema #5 da análise)", () => {
  // Na planilha o PROCV parava na linha 32 e travava em 60.497,77.
  perto(emolumento(TABELA_NOTAS_2025, 40_000_000), 66756.25);
  perto(emolumento(TABELA_SRI_2025, 40_000_000), 59144.87);
});

// ------------------------------------------------------------
// Honorários
// ------------------------------------------------------------

test("honorários pela tabela OAB respeitam o piso da ação", () => {
  const inventarioConsensual = TABELA_OAB.find((a) => a.acao === "Inventário Consensual")!;
  const config = {
    modo: "tabela" as const,
    percentual: inventarioConsensual.percentual,
    valorMinimo: inventarioConsensual.valorMinimo,
  };

  // 8% de 20.000 = 1.600 → abaixo do piso de 4.354,77
  perto(calcularHonorarios(config, 20000).valor, 4354.77);
  // 8% de 500.000 = 40.000 → acima do piso
  perto(calcularHonorarios(config, 500000).valor, 40000);
});

// ------------------------------------------------------------
// Inventário — caso da planilha
// ------------------------------------------------------------

const bemImovel20k: Bem = {
  descricao: "Imóvel",
  tipo: "imovel",
  valorVenal: 20000,
  percentual: 1,
  registrar: true,
  qtdCertidoes: 1,
};

function contextoInventario(via: "judicial" | "extrajudicial"): ContextoCalculo {
  return {
    bens: [bemImovel20k],
    qtdHerdeiros: 2,
    via,
    parametros: PARAMETROS_PADRAO,
    aplicarMulta: true, // a planilha estava com o flag "MULTA" ligado
    honorarios: { modo: "fixo", valor: 2000 },
    tabelaNotas: TABELA_NOTAS_2025,
    tabelaSri: TABELA_SRI_2025,
    faixasCustasJudiciais: FAIXAS_CUSTAS_JUDICIAIS,
    catalogo: INVENTARIO.catalogo,
  };
}

test("inventário via cartório reproduz o total da planilha (R$ 6.788,19)", () => {
  const r = calcularOrcamento(contextoInventario("extrajudicial"));
  const linha = (chave: string) => r.linhas.find((l) => l.chave === chave)!.valor;

  perto(linha("honorarios"), 2000);
  perto(linha("imposto"), 1040); // ITCMD 800 + multa 240
  perto(linha("certidao_previa"), 100);
  perto(linha("certidao_testamento"), 70);
  perto(linha("certidoes_pessoais"), 200);
  perto(linha("custas"), 1635.48);
  // A planilha somava as duas certidões dentro de uma linha só; agora ficam explícitas.
  perto(linha("registro_sri"), 1335.6);
  perto(linha("certidao_pos_registro"), 100);
  perto(linha("outros_custos"), 307.11); // 10% sobre 1.635,48 + 1.435,60

  perto(r.total, 6788.19);
  perto(r.totalPorHerdeiro, 3394.09);
  perto(r.totalSemRegistro, 5352.59);
});

test("inventário via judicial: custas em UFESP e correção do 'Outros Custos'", () => {
  const r = calcularOrcamento(contextoInventario("judicial"));
  const linha = (chave: string) => r.linhas.find((l) => l.chave === chave)!.valor;

  perto(linha("custas"), 342.6); // 10 UFESP × 34,26

  // A planilha calculava "Outros Custos" da via judicial sobre as custas de CARTÓRIO
  // (C27 = H27) — problema #11. Aqui usa as custas judiciais, como deveria.
  perto(linha("outros_custos"), 177.82); // (342,60 + 1.435,60) × 10%
  perto(r.total, 5366.02); // planilha: 5.495,31 com o erro
});

test("ajuste manual sobrepõe o valor calculado e item desligado sai do total", () => {
  const ctx = contextoInventario("extrajudicial");
  const r = calcularOrcamento({
    ...ctx,
    ajustes: {
      honorarios: { valor: 6500 }, // valor negociado
      certidao_testamento: { incluso: false },
    },
  });

  const honorarios = r.linhas.find((l) => l.chave === "honorarios")!;
  assert.equal(honorarios.valor, 6500);
  assert.equal(honorarios.origem, "manual");
  perto(r.total, 6788.19 - 2000 + 6500 - 70);
});

// ------------------------------------------------------------
// Escritura — caso da planilha
// ------------------------------------------------------------

test("escritura reproduz o total da planilha (R$ 21.894,49)", () => {
  const r = calcularOrcamento({
    bens: [
      {
        descricao: "IMÓVEL",
        tipo: "imovel",
        valorVenal: 400000,
        percentual: 1,
        registrar: true,
        qtdCertidoes: 1,
      },
    ],
    qtdHerdeiros: 0,
    via: "extrajudicial",
    parametros: { ...PARAMETROS_PADRAO, impostoAliquota: 3 }, // ITBI
    aplicarMulta: false,
    honorarios: { modo: "fixo", valor: 0 },
    tabelaNotas: TABELA_NOTAS_2025,
    tabelaSri: TABELA_SRI_2025,
    faixasCustasJudiciais: FAIXAS_CUSTAS_JUDICIAIS,
    catalogo: ESCRITURA.catalogo,
  });

  const linha = (chave: string) => r.linhas.find((l) => l.chave === chave)!.valor;
  perto(linha("imposto"), 12000);
  perto(linha("custas"), 5519.9);
  perto(linha("registro_sri"), 3284.18);
  perto(linha("certidao_pos_registro"), 100);
  perto(linha("outros_custos"), 890.41);

  perto(r.total, 21894.49);
  perto(r.totalSemRegistro, 18510.31);
});

test("multa do ITBI passa a entrar quando ligada (corrige o problema #4)", () => {
  const base = {
    bens: [
      {
        descricao: "IMÓVEL",
        tipo: "imovel" as const,
        valorVenal: 400000,
        percentual: 1,
        registrar: true,
        qtdCertidoes: 1,
      },
    ],
    qtdHerdeiros: 0,
    via: "extrajudicial" as const,
    parametros: { ...PARAMETROS_PADRAO, impostoAliquota: 3 },
    honorarios: { modo: "fixo" as const, valor: 0 },
    tabelaNotas: TABELA_NOTAS_2025,
    tabelaSri: TABELA_SRI_2025,
    faixasCustasJudiciais: FAIXAS_CUSTAS_JUDICIAIS,
    catalogo: ESCRITURA.catalogo,
  };

  const semMulta = calcularOrcamento({ ...base, aplicarMulta: false });
  const comMulta = calcularOrcamento({ ...base, aplicarMulta: true });
  perto(comMulta.total - semMulta.total, 3600); // 30% de 12.000
});

// ------------------------------------------------------------
// Partilha
// ------------------------------------------------------------

test("partilha: meação de 50% e três quinhões iguais", () => {
  const bens: Bem[] = [
    {
      descricao: "Imóvel Rural",
      tipo: "imovel",
      valorVenal: 300000,
      percentual: 0.5, // metade vai a inventário; a outra é meação
      registrar: true,
      qtdCertidoes: 1,
    },
  ];

  const r = calcularPartilha(
    bens,
    [
      { id: "m", nome: "Cacilda", tipo: "meeiro", percentual: 0.5 },
      { id: "h1", nome: "Odimar", tipo: "herdeiro", percentual: 1 / 3 },
      { id: "h2", nome: "Katia", tipo: "herdeiro", percentual: 1 / 3 },
      { id: "h3", nome: "Luciana", tipo: "herdeiro", percentual: 1 / 3 },
    ],
    { rateioCustos: "por_quinhao", custoTotal: 30000 }
  );

  assert.equal(r.inconsistencias.length, 0);
  perto(r.totalMonte, 150000);
  perto(r.totalMeacao, 150000);

  const meeira = r.porHerdeiro.find((p) => p.tipo === "meeiro")!;
  perto(meeira.valor, 150000);
  perto(meeira.percentualTotal, 50, 0.01);
  perto(meeira.custoRateado, 15000);
  perto(meeira.liquido, 135000);

  const odimar = r.porHerdeiro.find((p) => p.nome === "Odimar")!;
  perto(odimar.valor, 50000);
  perto(odimar.custoRateado, 5000);
});

test("partilha aponta quinhões que não fecham em 100%", () => {
  const r = calcularPartilha(
    [{ descricao: "Casa", tipo: "imovel", valorVenal: 100000, percentual: 1, registrar: false, qtdCertidoes: 0 }],
    [
      { id: "h1", nome: "A", tipo: "herdeiro", percentual: 0.4 },
      { id: "h2", nome: "B", tipo: "herdeiro", percentual: 0.4 },
    ]
  );
  assert.equal(r.inconsistencias.length, 1);
  assert.match(r.inconsistencias[0], /80\.00%/);
});

test("arredondamento monetário elimina o ruído de ponto flutuante da planilha", () => {
  assert.equal(arredondar(362.97999999999996), 362.98);
  assert.equal(arredondar(307.108), 307.11);
});

// ------------------------------------------------------------
// Tipos de serviço
// ------------------------------------------------------------

test("toda ação declarada num serviço existe na Tabela OAB", () => {
  // Os nomes vieram do Excel com acentos decompostos (NFD) e não batiam com os
  // literais do código — o Alvará ficava sem honorários e ninguém percebia.
  for (const servico of SERVICOS) {
    if (!servico.acaoOab) continue;
    assert.ok(
      buscarAcao(TABELA_OAB, servico.acaoOab),
      `ação "${servico.acaoOab}" do serviço "${servico.nome}" não existe na Tabela OAB`
    );
  }
});

test("todo serviço apura um total em cada uma das suas vias", () => {
  const bens: Bem[] = [
    {
      descricao: "Imóvel",
      tipo: "imovel",
      valorVenal: 300000,
      percentual: 1,
      registrar: true,
      qtdCertidoes: 1,
    },
  ];

  for (const servico of SERVICOS) {
    const acao = buscarAcao(TABELA_OAB, servico.acaoOab);
    for (const via of servico.vias) {
      const r = calcularOrcamento({
        bens,
        qtdHerdeiros: 3,
        via,
        parametros: { ...PARAMETROS_PADRAO, impostoAliquota: servico.impostoAliquota },
        aplicarMulta: false,
        honorarios: acao
          ? { modo: "tabela", percentual: acao.percentual, valorMinimo: acao.valorMinimo }
          : { modo: "fixo", valor: 0 },
        tabelaNotas: TABELA_NOTAS_2025,
        tabelaSri: TABELA_SRI_2025,
        faixasCustasJudiciais: FAIXAS_CUSTAS_JUDICIAIS,
        catalogo: servico.catalogo,
      });

      assert.ok(r.total > 0, `${servico.nome} / ${via} apurou total zerado`);
      assert.ok(
        r.linhas.every((l) => Number.isFinite(l.valor)),
        `${servico.nome} / ${via} tem linha com valor inválido`
      );

      // Serviço com honorários no catálogo tem de trazer o valor da tabela OAB.
      if (servico.catalogo.some((i) => i.chave === "honorarios") && acao) {
        const honorarios = r.linhas.find((l) => l.chave === "honorarios")!.valor;
        assert.ok(honorarios > 0, `${servico.nome} / ${via} ficou sem honorários`);
      }
    }
  }
});
