// ============================================================
// ARMAZENAMENTO LOCAL
// As cotações ficam no navegador e podem ser exportadas para arquivo.
// Assim o sistema funciona por completo antes (ou no lugar) do banco.
// ============================================================
import type { Orcamento } from "./modelo";

const CHAVE = "custas.orcamentos";
const VERSAO = 1;

export type Arquivo = {
  aplicacao: "custas";
  versao: number;
  exportadoEm: string;
  orcamentos: Orcamento[];
};

export function listar(): Orcamento[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const dados = JSON.parse(bruto) as Arquivo;
    return Array.isArray(dados.orcamentos) ? dados.orcamentos : [];
  } catch {
    // Guardado corrompido não pode derrubar a tela: começa do zero.
    return [];
  }
}

function gravar(orcamentos: Orcamento[]) {
  if (typeof window === "undefined") return;
  const arquivo: Arquivo = {
    aplicacao: "custas",
    versao: VERSAO,
    exportadoEm: new Date().toISOString(),
    orcamentos,
  };
  window.localStorage.setItem(CHAVE, JSON.stringify(arquivo));
}

/** Insere ou atualiza, mantendo a lista ordenada do mais recente para o mais antigo. */
export function salvar(orcamento: Orcamento): Orcamento[] {
  const atual = listar();
  const registro = { ...orcamento, atualizadoEm: new Date().toISOString() };
  const i = atual.findIndex((o) => o.id === registro.id);

  const lista = i >= 0 ? atual.map((o, j) => (j === i ? registro : o)) : [registro, ...atual];
  lista.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  gravar(lista);
  return lista;
}

export function excluir(id: string): Orcamento[] {
  const lista = listar().filter((o) => o.id !== id);
  gravar(lista);
  return lista;
}

export function baixarArquivo(orcamentos: Orcamento[], nome?: string) {
  const arquivo: Arquivo = {
    aplicacao: "custas",
    versao: VERSAO,
    exportadoEm: new Date().toISOString(),
    orcamentos,
  };

  const blob = new Blob([JSON.stringify(arquivo, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dia = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = nome ?? `custas-${dia}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export type ResultadoImportacao = {
  lista: Orcamento[];
  importados: number;
  substituidos: number;
};

/**
 * Lê um arquivo exportado e mescla com o que já existe.
 * Orçamento com o mesmo `id` é substituído; os demais entram como novos.
 */
export function importarArquivo(conteudo: string): ResultadoImportacao {
  const dados = JSON.parse(conteudo) as Partial<Arquivo>;

  if (dados.aplicacao !== "custas" || !Array.isArray(dados.orcamentos)) {
    throw new Error("Arquivo não é uma exportação do Custas.");
  }
  if ((dados.versao ?? 0) > VERSAO) {
    throw new Error("Arquivo gerado por uma versão mais nova do sistema.");
  }

  const atual = listar();
  const existentes = new Map(atual.map((o) => [o.id, o]));
  let substituidos = 0;

  for (const importado of dados.orcamentos) {
    if (existentes.has(importado.id)) substituidos++;
    existentes.set(importado.id, importado);
  }

  const lista = [...existentes.values()].sort((a, b) =>
    b.atualizadoEm.localeCompare(a.atualizadoEm)
  );
  gravar(lista);

  return {
    lista,
    importados: dados.orcamentos.length - substituidos,
    substituidos,
  };
}
