"use client";

import { useRef, useState } from "react";
import { Copy, Download, FilePlus2, Trash2, Upload } from "lucide-react";

import {
  baixarArquivo,
  excluir as excluirDoArmazenamento,
  importarArquivo,
} from "@/lib/orcamento/armazenamento";
import { novoId, orcamentoNovo, proximoNumero, rotuloOrcamento } from "@/lib/orcamento/modelo";
import { useCustas } from "./Contexto";
import { Botao, Selecao } from "./ui";

export function BarraOrcamentos() {
  const {
    cotacao,
    lista,
    temAlteracoes,
    parametrizacao,
    trocarCotacao,
    trocarLista,
  } = useCustas();

  const inputArquivo = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const salva = lista.some((o) => o.id === cotacao.id);

  function anunciar(tipo: "ok" | "erro", texto: string) {
    setAviso({ tipo, texto });
    setTimeout(() => setAviso(null), 4000);
  }

  function abrir(id: string) {
    const alvo = lista.find((x) => x.id === id);
    if (!alvo) return;
    if (temAlteracoes && !confirm("Há alterações não salvas. Abrir outra cotação mesmo assim?"))
      return;
    trocarCotacao(alvo);
  }

  function duplicar() {
    const agora = new Date().toISOString();
    trocarCotacao({
      ...cotacao,
      id: novoId(),
      numero: proximoNumero(lista),
      cliente: cotacao.cliente ? `${cotacao.cliente} (cópia)` : "",
      status: "rascunho",
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }

  function excluir() {
    if (!confirm(`Excluir a cotação ${rotuloOrcamento(cotacao)}?`)) return;
    const restante = excluirDoArmazenamento(cotacao.id);
    trocarLista(restante);
    trocarCotacao(restante[0] ?? orcamentoNovo(restante, undefined, parametrizacao));
    anunciar("ok", "Cotação excluída.");
  }

  async function importar(arquivo: File) {
    try {
      const { lista: nova, importados, substituidos } = importarArquivo(await arquivo.text());
      trocarLista(nova);
      if (nova[0]) trocarCotacao(nova[0]);
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
          value={salva ? cotacao.id : ""}
          onChange={(e) => abrir(e.target.value)}
          className="max-w-xs flex-1"
          aria-label="Cotação"
        >
          {!salva && <option value="">{rotuloOrcamento(cotacao)} — não salva</option>}
          {lista.map((o) => (
            <option key={o.id} value={o.id}>
              {rotuloOrcamento(o)}
            </option>
          ))}
        </Selecao>

        <Botao
          variante="secundario"
          onClick={() => trocarCotacao(orcamentoNovo(lista, cotacao.tipoServico, parametrizacao))}
        >
          <FilePlus2 size={15} /> Nova
        </Botao>
        <Botao variante="secundario" onClick={duplicar} title="Criar uma cópia desta cotação">
          <Copy size={15} /> Duplicar
        </Botao>

        <span className="mx-1 hidden h-5 w-px bg-borda sm:block" />

        <Botao
          variante="secundario"
          onClick={() => baixarArquivo(lista.length ? lista : [cotacao])}
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

        {salva && (
          <Botao variante="fantasma" onClick={excluir} title="Excluir esta cotação">
            <Trash2 size={15} />
          </Botao>
        )}
      </div>

      <p className="mt-2 text-[11px] text-texto-suave">
        {lista.length === 0
          ? "Nenhuma cotação salva ainda. Elas ficam neste navegador — use Exportar para guardar em arquivo."
          : `${lista.length} cotação(ões) salvas neste navegador.`}
        {temAlteracoes && salva && (
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
