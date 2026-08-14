import Image from "next/image";

import BotaoSair from "@/components/auth/BotaoSair";
import { usuarioAtual } from "@/lib/auth";
import { supabaseConfigurado } from "@/lib/supabase/config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();

  return (
    <>
      <header className="sem-impressao sticky top-0 z-10 border-b border-borda bg-superficie/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/jr-monograma.png"
              alt=""
              width={24}
              height={30}
              unoptimized
              className="h-6 w-auto"
            />
            <span className="text-sm font-semibold text-marinho">Custas</span>
          </div>

          <div className="flex items-center gap-3">
            {usuario ? (
              <>
                <span className="hidden text-xs text-texto-suave sm:inline">
                  {usuario.email}
                </span>
                <BotaoSair />
              </>
            ) : (
              <span
                className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-alerta"
                title="Sem banco configurado: nada é salvo e não há login."
              >
                modo simulação
              </span>
            )}
          </div>
        </div>
      </header>

      {children}
    </>
  );
}
