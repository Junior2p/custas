"use client";

import { Save } from "lucide-react";

import { useCustas } from "./Contexto";
import { Botao } from "./ui";

/** Salva a cotação aberta. Fica no cabeçalho das telas que a editam. */
export function BotaoSalvar() {
  const { salvarCotacao, temAlteracoes } = useCustas();

  return (
    <Botao onClick={salvarCotacao} title="Salvar a cotação neste navegador">
      <Save size={16} /> Salvar
      {temAlteracoes && <span className="text-dourado">•</span>}
    </Botao>
  );
}
