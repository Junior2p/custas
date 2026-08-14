import { createClient } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";

/**
 * Usuário autenticado da requisição, ou `null` em modo simulação
 * (sem Supabase configurado).
 */
export async function usuarioAtual() {
  if (!supabaseConfigurado) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Exige autenticação. Use no início de toda server action que grave dados
 * ou use a service role key (que ignora RLS).
 */
export async function exigirUsuario() {
  const user = await usuarioAtual();
  if (!user) throw new Error("Não autenticado");
  return user;
}
