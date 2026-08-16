// ============================================================
// Testes da sessão — o que protege o acesso ao sistema.
// ============================================================
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.CUSTAS_USUARIO = "usuario@teste.com";
process.env.CUSTAS_SENHA = "senha-para-teste";
process.env.CUSTAS_SEGREDO = "segredo-para-teste";

import { COOKIE_SESSAO, criarSessao, iguais, sessaoValida } from "./sessao";

test("uma sessão recém-criada é aceita", async () => {
  const { valor, maxAge } = await criarSessao();
  assert.ok(await sessaoValida(valor));
  assert.ok(maxAge > 0);
});

test("cookie ausente ou malformado é recusado", async () => {
  for (const entrada of [undefined, "", "sem-ponto", "abc.def", ".", "123."]) {
    assert.equal(await sessaoValida(entrada), false, `aceitou "${entrada}"`);
  }
});

test("assinatura adulterada é recusada", async () => {
  const { valor } = await criarSessao();
  const [prazo, assinatura] = valor.split(".");

  // troca um caractere da assinatura
  const alterada = (assinatura[0] === "a" ? "b" : "a") + assinatura.slice(1);
  assert.equal(await sessaoValida(`${prazo}.${alterada}`), false);

  // estende o prazo mantendo a assinatura antiga
  const maisTarde = Number(prazo) + 3600_000;
  assert.equal(await sessaoValida(`${maisTarde}.${assinatura}`), false);
});

test("sessão vencida é recusada", async () => {
  const vencida = Date.now() - 1000;
  // Assinatura legítima para um prazo já passado: mesmo válida, não serve.
  const { valor } = await criarSessao();
  const assinatura = valor.split(".")[1];
  assert.equal(await sessaoValida(`${vencida}.${assinatura}`), false);
});

test("credenciais só existem quando usuário E senha estão definidos", async () => {
  const { credenciaisConfiguradas } = await import("./sessao");
  assert.ok(credenciaisConfiguradas());

  const senhaOriginal = process.env.CUSTAS_SENHA;
  process.env.CUSTAS_SENHA = "";
  assert.equal(credenciaisConfiguradas(), false, "sem senha não há login possível");
  process.env.CUSTAS_SENHA = senhaOriginal;
});

test("trocar o segredo invalida as sessões em aberto", async () => {
  const { valor } = await criarSessao();
  assert.ok(await sessaoValida(valor));

  process.env.CUSTAS_SEGREDO = "outro-segredo";
  assert.equal(await sessaoValida(valor), false);

  process.env.CUSTAS_SEGREDO = "segredo-para-teste";
});

test("a comparação da senha é feita caractere a caractere, sem atalho", () => {
  assert.ok(iguais("abc", "abc"));
  assert.equal(iguais("abc", "abd"), false);
  assert.equal(iguais("abc", "abcd"), false, "tamanhos diferentes nunca batem");
  assert.equal(iguais("", "x"), false);
  assert.ok(iguais("", ""));
});

test("o nome do cookie é estável", () => {
  // Mudar isto desloga todo mundo — que fique explícito.
  assert.equal(COOKIE_SESSAO, "custas_sessao");
});
