import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Custas — Apuração de custas, escrituração e honorários",
  description:
    "Sistema de apuração de custas processuais, custos de escrituração e honorários advocatícios, com emissão de proposta.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
