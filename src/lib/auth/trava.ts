// ============================================================
// TRAVA LOCAL — código validador cadastrado pela tela.
//
// Guarda apenas o HASH do código, nunca o código em si. A validação
// acontece no navegador, então isto é uma TRAVA DE CONVENIÊNCIA:
// impede que alguém abra o sistema por engano, mas não substitui a
// proteção de servidor (CUSTAS_CODIGO), que essa sim é inviolável.
//
// O que justifica ser suficiente aqui: as cotações ficam no
// localStorage de cada navegador — não há dado de cliente no servidor
// para alguém alcançar.
// ============================================================

const CHAVE_SESSAO = "custas.trava.aberta";

export async function hashCodigo(codigo: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codigo.trim()));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function codigoConfere(codigo: string, hashGuardado: string): Promise<boolean> {
  if (!hashGuardado) return true;
  return (await hashCodigo(codigo)) === hashGuardado;
}

/**
 * A liberação vale só enquanto a aba estiver aberta: fechou o navegador,
 * pede o código de novo.
 */
export function travaAberta(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(CHAVE_SESSAO) === "1";
}

export function abrirTrava() {
  window.sessionStorage.setItem(CHAVE_SESSAO, "1");
}

export function fecharTrava() {
  window.sessionStorage.removeItem(CHAVE_SESSAO);
}
