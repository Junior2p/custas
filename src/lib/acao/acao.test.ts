// ============================================================
// Testes das ações judiciais — conferidos contra o extrato real
// "MANOEL x MARILDA" (processo 1004737-78.2022.8.26.0189).
// ============================================================
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  acaoNova,
  aplicarTipoDocumento,
  mesesDesde,
  normalizarAcao,
  totaisAcao,
  valorComReducao,
  valorDoAto,
  type AtoProcessual,
} from "./modelo";

const ato = (descricao: string, valorMinimo: number, complexidade: number): AtoProcessual => ({
  id: descricao,
  descricao,
  valorMinimo,
  complexidade,
  exito: 0,
});

const perto = (recebido: number, esperado: number, tolerancia = 0.02) =>
  assert.ok(
    Math.abs(recebido - esperado) <= tolerancia,
    `esperado ~${esperado}, recebido ${recebido}`
  );

test("o extrato reproduz os valores do documento de referência", () => {
  const atos = [
    ato("Contestação", 5716.05, 65),
    ato("Contrarrazões ao Recurso de Apelação", 7462.62, 50),
    ato("Contrarrazões ao Agravo Especial", 11114.54, 30),
    ato("Impugnação ao Recurso Especial", 15084.02, 65),
  ];

  perto(valorDoAto(atos[0]), 3715.43);
  perto(valorDoAto(atos[1]), 3731.31);
  perto(valorDoAto(atos[2]), 3334.36);
  perto(valorDoAto(atos[3]), 9804.61);

  const acao = {
    ...acaoNova([], "extrato"),
    atos,
    custosExtras: [
      { id: "1", descricao: "Defesa oral — sessão de julgamento (TJ/SP)", valor: 1000 },
    ],
  };

  const t = totaisAcao(acao);
  perto(t.honorariosAtos, 20585.71);
  perto(t.totalExtrato, 21585.71);
});

test("o êxito acresce sobre o valor já reduzido", () => {
  const comExito = { ...ato("Apelação", 10000, 50), exito: 20 };

  perto(valorComReducao(comExito), 5000);
  perto(valorDoAto(comExito), 6000); // 5.000 + 20%
});

test("a proposta de ingresso soma honorários, taxa judiciária e despesas", () => {
  const acao = {
    ...acaoNova([], "proposta"),
    valorCausa: 250000,
    honorariosIniciais: 1500,
    percentualCustas: 1.5,
    custosExtras: [{ id: "1", descricao: "Certidões", valor: 200 }],
  };

  const t = totaisAcao(acao);
  perto(t.custas, 3750); // 1,5% de 250.000
  perto(t.totalIngresso, 5450); // 1.500 + 3.750 + 200
});

test("trocar o tipo de documento troca os textos e preserva o cadastro", () => {
  const proposta = { ...acaoNova([], "proposta"), cliente: "Manoel", valorCausa: 250000 };
  assert.match(proposta.titulo, /Proposta/i);

  const extrato = aplicarTipoDocumento(proposta, "extrato");
  assert.match(extrato.titulo, /Extrato/i);
  assert.equal(extrato.cliente, "Manoel");
  assert.equal(extrato.valorCausa, 250000);
  assert.ok(extrato.atos.length > 0, "extrato começa com uma linha de ato");
});

test("o tempo de atuação conta meses cheios", () => {
  const hoje = new Date();
  const haDoisMeses = new Date(hoje.getFullYear(), hoje.getMonth() - 2, hoje.getDate());

  assert.equal(mesesDesde(haDoisMeses.toISOString().slice(0, 10)), 2);
  assert.equal(mesesDesde(""), 0);
  assert.equal(mesesDesde("data inválida"), 0);
});

test("documento gravado por versão anterior é completado ao ser lido", () => {
  const antigo = { id: "x", numero: "0001/2025", cliente: "Antigo" };
  const lido = normalizarAcao(antigo);

  assert.equal(lido.cliente, "Antigo");
  assert.deepEqual(lido.custosExtras, []);
  assert.equal(lido.percentualCustas, 1.5);
  assert.ok(lido.titulo.length > 0);
});
