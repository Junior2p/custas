// ============================================================
// ARMAZENAMENTO DAS AÇÕES JUDICIAIS
// Mesma mecânica das cotações patrimoniais: navegador + arquivo.
// ============================================================
import { normalizarAcao, type AcaoJudicial } from "./modelo";

const CHAVE = "custas.acoes";

export function listarAcoes(): AcaoJudicial[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const dados = JSON.parse(bruto) as { acoes?: Partial<AcaoJudicial>[] };
    return Array.isArray(dados.acoes) ? dados.acoes.map(normalizarAcao) : [];
  } catch {
    return [];
  }
}

export function gravarAcoes(acoes: AcaoJudicial[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, JSON.stringify({ acoes }));
}

export function salvarAcao(acao: AcaoJudicial): AcaoJudicial[] {
  const atual = listarAcoes();
  const registro = { ...acao, atualizadoEm: new Date().toISOString() };
  const i = atual.findIndex((a) => a.id === registro.id);

  const lista = i >= 0 ? atual.map((a, j) => (j === i ? registro : a)) : [registro, ...atual];
  lista.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  gravarAcoes(lista);
  return lista;
}

export function excluirAcao(id: string): AcaoJudicial[] {
  const lista = listarAcoes().filter((a) => a.id !== id);
  gravarAcoes(lista);
  return lista;
}
