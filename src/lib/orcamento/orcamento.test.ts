// ============================================================
// Testes do modelo e do armazenamento das cotações.
// ============================================================
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  aplicarServico,
  gerarHerdeiros,
  orcamentoNovo,
  proximoNumero,
  rotuloOrcamento,
  type Orcamento,
} from "./modelo";
// O módulo só toca em `window` dentro das funções, então o import estático
// é seguro — basta o stub existir antes da primeira chamada.
import { excluir, importarArquivo, listar, salvar } from "./armazenamento";
import { PARAMETRIZACAO_PADRAO } from "@/lib/parametrizacao/modelo";

// localStorage mínimo para rodar o armazenamento fora do navegador.
class MemoriaLocal {
  private dados = new Map<string, string>();
  getItem(k: string) {
    return this.dados.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.dados.set(k, v);
  }
  removeItem(k: string) {
    this.dados.delete(k);
  }
  limpar() {
    this.dados.clear();
  }
}

const memoria = new MemoriaLocal();
(globalThis as unknown as { window: unknown }).window = { localStorage: memoria };

beforeEach(() => memoria.limpar());

// ------------------------------------------------------------
// Numeração
// ------------------------------------------------------------

test("a numeração é sequencial dentro do ano", () => {
  const ano = new Date().getFullYear();
  assert.equal(proximoNumero([]), `0001/${ano}`);

  const existentes = [
    { numero: `0001/${ano}` },
    { numero: `0007/${ano}` },
    { numero: `0003/${ano}` },
    { numero: `0042/${ano - 1}` }, // ano anterior não conta
  ] as Orcamento[];

  assert.equal(proximoNumero(existentes), `0008/${ano}`);
});

// ------------------------------------------------------------
// Troca de serviço
// ------------------------------------------------------------

test("trocar o serviço traz os padrões dele sem perder os bens", () => {
  const inventario = orcamentoNovo();
  const comBens = {
    ...inventario,
    cliente: "Fulano",
    bens: [{ ...inventario.bens[0], descricao: "Casa", valorVenal: 250000 }],
  };

  const escritura = aplicarServico(comBens, "escritura");

  assert.equal(escritura.tipoServico, "escritura");
  assert.equal(escritura.honorariosModo, "percentual_custos");
  assert.equal(escritura.honorariosPercentualCustos, 10);
  assert.equal(escritura.viaEscolhida, "extrajudicial"); // escritura não tem judicial
  assert.ok(!escritura.itensProposta.some((i) => i.descricao.includes("Honorários")));

  // o que o usuário digitou permanece
  assert.equal(escritura.cliente, "Fulano");
  assert.equal(escritura.bens[0].descricao, "Casa");
  assert.equal(escritura.bens[0].valorVenal, 250000);
});

test("a quantidade de herdeiros zera na escritura e volta no inventário", () => {
  const inventario = orcamentoNovo();
  assert.ok(inventario.qtdHerdeiros > 0);

  // A escritura não tem herdeiros: a contagem some do cálculo.
  const escritura = aplicarServico({ ...inventario, qtdHerdeiros: 4 }, "escritura");
  assert.equal(escritura.qtdHerdeiros, 0);

  // Voltando, sugere 2 — o detalhamento nominal segue sendo opcional.
  const devolta = aplicarServico(escritura, "inventario_consensual");
  assert.equal(devolta.qtdHerdeiros, 2);
  assert.deepEqual(devolta.herdeiros, []);
});

test("gerarHerdeiros monta a lista nominal a partir da quantidade", () => {
  const lista = gerarHerdeiros(3, true);

  assert.equal(lista.filter((h) => h.tipo === "herdeiro").length, 3);
  assert.equal(lista.filter((h) => h.tipo === "meeiro").length, 1);

  const soma = lista
    .filter((h) => h.tipo === "herdeiro")
    .reduce((s, h) => s + h.percentual, 0);
  assert.ok(Math.abs(soma - 1) < 1e-9, "os quinhões precisam fechar em 100%");

  assert.equal(gerarHerdeiros(2, false).length, 2, "sem meeiro, só os herdeiros");
});

test("uma cotação nova herda a parametrização do escritório", () => {
  const base = {
    ...PARAMETRIZACAO_PADRAO,
    parametros: { ...PARAMETRIZACAO_PADRAO.parametros, certidaoImovel: 137.5, ufesp: 40 },
    condicoes: { entrada: 30, parcelas: 6, validadeDias: 15 },
  };

  const o = orcamentoNovo([], "inventario_consensual", base);

  assert.equal(o.parametros.certidaoImovel, 137.5);
  assert.equal(o.parametros.ufesp, 40);
  assert.equal(o.entrada, 30);
  assert.equal(o.parcelas, 6);
  assert.equal(o.validadeDias, 15);
});

// ------------------------------------------------------------
// Armazenamento
// ------------------------------------------------------------

test("salvar insere e depois atualiza a mesma cotação", () => {
  const a = orcamentoNovo();
  salvar(a);
  assert.equal(listar().length, 1);

  salvar({ ...a, cliente: "Maria" });
  const lista = listar();
  assert.equal(lista.length, 1, "não pode duplicar ao salvar de novo");
  assert.equal(lista[0].cliente, "Maria");
});

test("excluir remove só a cotação indicada", () => {
  const a = orcamentoNovo();
  const b = { ...orcamentoNovo([a]), id: "outro" };
  salvar(a);
  salvar(b);

  const restante = excluir(a.id);
  assert.equal(restante.length, 1);
  assert.equal(restante[0].id, "outro");
});

test("armazenamento corrompido não derruba a tela", () => {
  memoria.setItem("custas.orcamentos", "{isso não é json");
  assert.deepEqual(listar(), []);
});

// ------------------------------------------------------------
// Arquivo (exportar / importar)
// ------------------------------------------------------------

const arquivoCom = (orcamentos: Orcamento[]) =>
  JSON.stringify({
    aplicacao: "custas",
    versao: 1,
    exportadoEm: new Date().toISOString(),
    orcamentos,
  });

test("importar mescla: substitui o que já existe e acrescenta o resto", () => {
  const existente = orcamentoNovo();
  salvar(existente);

  const atualizado = { ...existente, cliente: "Nome corrigido" };
  const novo = { ...orcamentoNovo([existente]), id: "novo-id", cliente: "Outro cliente" };

  const r = importarArquivo(arquivoCom([atualizado, novo]));

  assert.equal(r.substituidos, 1);
  assert.equal(r.importados, 1);
  assert.equal(r.lista.length, 2);
  assert.equal(r.lista.find((o) => o.id === existente.id)!.cliente, "Nome corrigido");
});

test("importar recusa arquivo de outra origem ou de versão futura", () => {
  assert.throws(
    () => importarArquivo(JSON.stringify({ aplicacao: "outra-coisa", orcamentos: [] })),
    /não é uma exportação do Custas/i
  );

  assert.throws(
    () => importarArquivo(JSON.stringify({ aplicacao: "custas", versao: 99, orcamentos: [] })),
    /versão mais nova/i
  );

  assert.throws(() => importarArquivo("não é json"), SyntaxError);
});

test("o rótulo da cotação indica quando ainda não há cliente", () => {
  const o = orcamentoNovo();
  assert.match(rotuloOrcamento(o), /sem cliente/);
  assert.match(rotuloOrcamento({ ...o, cliente: "Maria" }), /Maria/);
});

// ------------------------------------------------------------
// Parametrização congelada
// ------------------------------------------------------------

test("cada cotação guarda a própria parametrização", () => {
  const antiga = orcamentoNovo();
  salvar({ ...antiga, parametros: { ...antiga.parametros, ufesp: 34.26 } });

  const nova = orcamentoNovo(listar());
  salvar({ ...nova, parametros: { ...nova.parametros, ufesp: 37.02 } });

  const lista = listar();
  const ufesps = lista.map((o) => o.parametros.ufesp).sort();
  assert.deepEqual(ufesps, [34.26, 37.02], "mexer numa cotação não pode alterar a outra");
});

// ------------------------------------------------------------
// Compatibilidade com cotações antigas
// ------------------------------------------------------------

test("cotação gravada por versão anterior é completada ao ser lida", () => {
  // Formato antigo: sem ajustes, sem qtdHerdeiros, sem validade nem forma de pagamento.
  const antiga = {
    id: "antiga-1",
    numero: "0009/2025",
    criadoEm: "2025-11-02T10:00:00.000Z",
    atualizadoEm: "2025-11-02T10:00:00.000Z",
    cliente: "Espólio antigo",
    tipoServico: "inventario_consensual",
    bens: [{ id: "b1", descricao: "Casa", tipo: "imovel", valorVenal: 100000, percentual: 1 }],
    herdeiros: [
      { id: "h1", nome: "A", tipo: "herdeiro", percentual: 0.5 },
      { id: "h2", nome: "B", tipo: "herdeiro", percentual: 0.5 },
    ],
  };

  memoria.setItem(
    "custas.orcamentos",
    JSON.stringify({ aplicacao: "custas", versao: 1, orcamentos: [antiga] })
  );

  const [lida] = listar();

  assert.deepEqual(lida.ajustes, {}, "sem isso a tela quebra ao ler os ajustes");
  assert.equal(lida.qtdHerdeiros, 2, "a contagem é deduzida da lista nominal antiga");
  assert.ok(lida.validadeDias > 0);
  assert.equal(lida.formaPagamento, "");
  assert.equal(lida.bens[0].qtdCertidoes, 1, "campo novo do bem ganha o padrão");
  assert.equal(lida.bens[0].registrar, true);

  // o que existia é preservado
  assert.equal(lida.cliente, "Espólio antigo");
  assert.equal(lida.numero, "0009/2025");
  assert.equal(lida.bens[0].valorVenal, 100000);
});
