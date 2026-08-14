"use client";

import { useRef, useState } from "react";
import { Copy, Download, FilePlus2, Save, Trash2, Upload } from "lucide-react";

import {
  baixarArquivo,
  excluir as excluirDoArmazenamento,
  importarArquivo,
} from "@/lib/orcamento/armazenamento";
import { rotuloOrcamento, type Orcamento } from "@/lib/orcamento/modelo";
import { Botao, Selecao } from "./ui";

export function BarraOrcamentos({
  lista,
  atual,
  temAlteracoes,
  aoAbrir,
  aoNovo,
  aoSalvar,
  aoDuplicar,
  aoTrocarLista,
}: {
  lista: Orcamento[];
  atual: Orcamento;
  temAlteracoes: boolean;
  aoAbrir: (id: string) => void;
  aoNovo: () => void;
  aoSalvar: () => void;
  aoDuplicar: () => void;
  aoTrocarLista: (lista: Orcamento[], selecionar?: Orcamento) => void;
}) {
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const salvo = lista.some((o) => o.id === atual.id);

  function anunciar(tipo: "ok" | "erro", texto: string) {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 4000);
  }

  function excluir() {
    if (!confirm(`Excluir a cotação ${rotuloOrcamento(atual)}?`)) return;
    const restante = excluirDoArmazenamento(atual.id);
    aoTrocarLista(restante, restante[0]);
    anunciar("ok", "Cotação excluída.");
  }

  async function importar(arquivo: File) {
    try {
      const { lista: nova, importados, substituidos } = importarArquivo(await arquivo.text());
      aoTrocarLista(nova, nova[0]);
      anunciar(
        "ok",
        `${importados} cotação(ões) importada(s)` +
          (substituidos ? `, ${substituidos} atualizada(s).` : ".")
      );
    } catch (e) {
      anunciar("erro", e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    }
  }

  return (
    <div className="sem-impressao rounded-xl border border-borda bg-superficie px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Selecao
          value={salvo ? atual.id : ""}
          onChange={(e) => aoAbrir(e.target.value)}
          className="max-w-xs flex-1"
          aria-label="Cotação"
        >
          {!salvo && <option value="">{rotuloOrcamento(atual)} — não salva</option>}
          {lista.map((o) => (
            <option key={o.id} value={o.id}>
              {rotuloOrcamento(o)}
            </option>
          ))}
        </Selecao>

        <Botao onClick={aoSalvar} title="Salvar no navegador">
          <Save size={15} /> Salvar
          {temAlteracoes && <span className="ml-0.5 text-dourado">•</span>}
        </Botao>
        <Botao variante="secundario" onClick={aoNovo}>
          <FilePlus2 size={15} /> Nova
        </Botao>
        <Botao variante="secundario" onClick={aoDuplicar} title="Criar uma cópia desta cotação">
          <Copy size={15} /> Duplicar
        </Botao>

        <span className="mx-1 hidden h-5 w-px bg-borda sm:block" />

        <Botao
          variante="secundario"
          onClick={() => baixarArquivo(lista.length ? lista : [atual])}
          title="Baixar todas as cotações em um arquivo"
        >
          <Download size={15} /> Exportar
        </Botao>
        <Botao variante="secundario" onClick={() => inputArquivo.current?.click()}>
          <Upload size={15} /> Importar
        </Botao>
        <input
          ref={inputArquivo}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) importar(arquivo);
            e.target.value = "";
          }}
        />

        {salvo && (
          <Botao variante="fantasma" onClick={excluir} title="Excluir esta cotação">
            <Trash2 size={15} />
          </Botao>
        )}
      </div>

      <p className="mt-2 text-[11px] text-texto-suave">
        {lista.length === 0
          ? "Nenhuma cotação salva ainda. As cotações ficam neste navegador — use Exportar para guardar em arquivo."
          : `${lista.length} cotação(ões) salvas neste navegador.`}
        {temAlteracoes && salvo && (
          <span className="ml-1 text-alerta">Há alterações não salvas.</span>
        )}
      </p>

      {aviso && (
        <p
          className={`mt-2 rounded-lg px-3 py-2 text-xs ${
            aviso.tipo === "ok" ? "bg-marinho-50 text-marinho" : "bg-red-50 text-erro"
          }`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
