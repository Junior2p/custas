/**
 * O sistema roda em dois estados:
 *
 * - **configurado** — as variáveis do Supabase existem: há login e os dados vêm do banco;
 * - **modo simulação** — sem as variáveis: o app abre direto no simulador, sem login e
 *   sem persistência. É o estado enquanto o banco não é provisionado.
 *
 * O middleware e a tela de login consultam esta flag para não quebrar quando falta env.
 */
export const supabaseConfigurado = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
