"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Simulador } from "./Simulador";

const CHAVE = "custas.apresentacao";

/**
 * Modo apresentação: usado quando a tela é compartilhada com o cliente.
 * Esconde a gestão de cotações, os honorários, as condições do cálculo e
 * a parametrização — fica só o que interessa ao cliente ver.
 */
export function AreaTrabalho() {
  const [apresentacao, setApresentacao] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setApresentacao(window.localStorage.getItem(CHAVE) === "1");
    setMontado(true);
  }, []);

  function alternar() {
    const novo = !apresentacao;
    setApresentacao(novo);
    window.localStorage.setItem(CHAVE, novo ? "1" : "0");
  }

  return (
    <>
      <div className="sem-impressao fixed right-4 bottom-4 z-20">
        <button
          onClick={alternar}
          title={
            apresentacao
              ? "Sair do modo apresentação e voltar a ver tudo"
              : "Esconder honorários, parametrização e gestão para compartilhar a tela"
          }
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition ${
            apresentacao
              ? "bg-dourado text-marinho hover:brightness-105"
              : "bg-marinho text-white hover:bg-marinho-700"
          }`}
        >
          {apresentacao ? <EyeOff size={16} /> : <Eye size={16} />}
          {apresentacao ? "Sair da apresentação" : "Modo apresentação"}
        </button>
      </div>

      {montado && <Simulador apresentacao={apresentacao} />}
    </>
  );
}
