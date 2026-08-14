"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function BotaoSair() {
  const router = useRouter();

  async function sair() {
    await createClient().auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-texto-suave transition hover:bg-slate-100 hover:text-texto"
    >
      <LogOut size={14} /> Sair
    </button>
  );
}
