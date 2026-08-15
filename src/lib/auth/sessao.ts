// ============================================================
// SESSÃO — login de usuário único, sem banco.
//
// A senha fica em variável de ambiente (nunca no código nem no
// repositório). Ao entrar, o servidor devolve um cookie httpOnly
// assinado com HMAC; o proxy só confere a assinatura e a validade.
// ============================================================

export const COOKIE_SESSAO = "custas_sessao";
const DURACAO_HORAS = 12;

/** Senha configurada. Sem ela não há login possível. */
export const senhaConfigurada = () => (process.env.CUSTAS_SENHA ?? "").trim();

/** E-mail aceito. Serve de conferência — a senha é o que protege. */
export const emailConfigurado = () =>
  (process.env.CUSTAS_EMAIL ?? "juniorlopes.2p@gmail.com").trim().toLowerCase();

/**
 * O segredo da assinatura deriva da própria senha quando não é informado —
 * assim basta configurar uma variável. Trocar a senha invalida as sessões
 * em aberto, que é o comportamento desejado.
 */
const segredo = () => process.env.CUSTAS_SEGREDO?.trim() || `custas::${senhaConfigurada()}`;

/**
 * Em produção, um app sem senha configurada é bloqueado em vez de ficar
 * aberto: é preferível derrubar o acesso a publicar os dados sem querer.
 */
export const exigeLogin = () =>
  Boolean(senhaConfigurada()) || process.env.NODE_ENV === "production";

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
