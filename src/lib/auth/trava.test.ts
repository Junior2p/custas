// ============================================================
// Testes da trava local (código validador cadastrado pela tela).
// ============================================================
import { test } from "node:test";
import assert from "node:assert/strict";

import { codigoConfere, hashCodigo } from "./trava";

test("o hash não permite recuperar o código", async () => {
  const hash = await hashCodigo("meu-codigo");

  assert.equal(hash.length, 64, "SHA-256 em hexadecimal");
  assert.ok(!hash.includes("meu-codigo"));
  assert.notEqual(hash, "meu-codigo");
});

test("o mesmo código gera sempre o mesmo hash", async () => {
  assert.equal(await hashCodigo("abc123"), await hashCodigo("abc123"));
  assert.notEqual(await hashCodigo("abc123"), await hashCodigo("abc124"));
});

test("espaços nas pontas não mudam o código", async () => {
  assert.equal(await hashCodigo("  abc123  "), await hashCodigo("abc123"));
});

test("a conferência aceita o código certo e recusa o errado", async () => {
  const hash = await hashCodigo("codigo-certo");

  assert.ok(await codigoConfere("codigo-certo", hash));
  assert.equal(await codigoConfere("codigo-errado", hash), false);
  assert.equal(await codigoConfere("", hash), false);
});

test("sem hash cadastrado, o sistema fica liberado", async () => {
  assert.ok(await codigoConfere("qualquer coisa", ""));
});
