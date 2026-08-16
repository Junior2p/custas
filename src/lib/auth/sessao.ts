// ============================================================
// ACESSO — usuário e senha conferidos NO SERVIDOR.
//
// A trava anterior era cadastrada pela tela e guardada no navegador.
// Isso nunca protegeu de verdade: quem abria o sistema de outra
// máquina tinha o armazenamento vazio, portanto nenhuma trava. Só o
// servidor pode barrar alguém que nunca esteve aqui.
//
// As credenciais ficam em variáveis de ambiente — nunca no código,
// nunca no repositório, nunca no navegador.
// ============================================================

export const COOKIE_SESSAO = "custas_sessao";
const DURACAO_HORAS = 12;

export const usuarioConfigurado = () =>
  (process.env.CUSTAS_USUARIO ?? "").trim().toLowerCase();

export const senhaConfigurada = () => process.env.CUSTAS_SENHA ?? "";

/** Só há login possível quando as duas variáveis existem. */
export const credenciaisConfiguradas = () =>
  Boolean(usuarioConfigurado() && senhaConfigurada());

/**
 * Em produção o acesso é SEMPRE exigido. Sem credenciais configuradas o
 * sistema fica bloqueado com instruções, em vez de aberto na internet —
 * é preferível derrubar o acesso a expor os dados por esquecimento.
 *
 * Em desenvolvimento, sem credenciais, abre direto.
 */
export const exigeAcesso = () =>
  credenciaisConfiguradas() || process.env.NODE_ENV === "production";

const segredo = () =>
  process.env.CUSTAS_SEGREDO?.trim() || `custas::${usuarioConfigurado()}::${senhaConfigurada()}`;

async function chave() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function assinar(dados: string): Promise<string> {
  const bytes = await crypto.subtle.sign("HMAC", await chave(), new TextEncoder().encode(dados));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparação em tempo constante — não vaza o tamanho do acerto. */
export function iguais(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

export async function criarSessao(): Promise<{ valor: string; maxAge: number }> {
  const expiraEm = Date.now() + DURACAO_HORAS * 3600_000;
  return {
    valor: `${expiraEm}.${await assinar(String(expiraEm))}`,
    maxAge: DURACAO_HORAS * 3600,
  };
}

export async function sessaoValida(cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false;

  const [expiraEm, assinatura] = cookie.split(".");
  if (!expiraEm || !assinatura) return false;

  const prazo = Number(expiraEm);
  if (!Number.isFinite(prazo) || prazo < Date.now()) return false;

  return iguais(assinatura, await assinar(expiraEm));
}
