"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function BotaoSair() {
  const router = useRouter();

  async function sair() {
    await fetch("/api/sair", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      title="Encerrar a sessão"
      className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-texto-suave transition hover:bg-slate-100 hover:text-texto"
    >
      <LogOut size={14} />
      <span className="hidden lg:inline">Sair</span>
    </button>
  );
}
