import { BarraLateral } from "@/components/BarraLateral";
import { ProvedorCustas } from "@/components/Contexto";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProvedorCustas>
      <BarraLateral>{children}</BarraLateral>
    </ProvedorCustas>
  );
}
