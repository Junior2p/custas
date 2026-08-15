import { TravaLocal } from "@/components/auth/TravaLocal";
import { BarraLateral } from "@/components/BarraLateral";
import { ProvedorCustas } from "@/components/Contexto";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TravaLocal>
      <ProvedorCustas>
        <BarraLateral>{children}</BarraLateral>
      </ProvedorCustas>
    </TravaLocal>
  );
}
