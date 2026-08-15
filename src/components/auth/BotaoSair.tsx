"use client";

import { LogOut } from "lucide-react";

import { fecharTrava } from "@/lib/auth/trava";

export default function BotaoSair() {
  async function sair() {
    fecharTrava();
    // Encerra também a sessão de servidor, quando existir (CUSTAS_CODIGO).
    await fetch("/api/sair", { method: "POST" }).catch(() => {});
    window.location.href = "/";
  }

  return (
    <button
      onClick={sair}
      title="Bloquear o sistema"
      className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-texto-suave transition hover:bg-slate-100 hover:text-texto"
    >
      <LogOut size={14} />
      <span className="hidden lg:inline">Bloquear</span>
    </button>
  );
}
