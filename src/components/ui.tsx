"use client";

import { useState, type ReactNode } from "react";

export function Secao({
  titulo,
  descricao,
  acao,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-borda bg-superficie shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-borda px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-marinho uppercase">
            {titulo}
          </h2>
          {descricao && <p className="mt-0.5 text-xs text-texto-suave">{descricao}</p>}
        </div>
        {acao}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Campo({
  rotulo,
  dica,
  children,
  className = "",
}: {
  rotulo: string;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-texto-suave">{rotulo}</span>
      {children}
      {dica && <span className="mt-1 block text-[11px] text-texto-suave">{dica}</span>}
    </label>
  );
}

const baseInput =
  "w-full rounded-lg border border-borda bg-white px-3 py-2 text-sm text-texto outline-none transition focus:border-marinho focus:ring-2 focus:ring-marinho/15 disabled:bg-slate-50 disabled:text-texto-suave";

export function Texto(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

export function Selecao(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${baseInput} ${props.className ?? ""}`} />;
}

/**
 * Separador de milhar no padrão brasileiro, preservando o que está sendo
 * digitado depois da vírgula.
 */
function comMilhar(texto: string): string {
  const [inteira, ...resto] = texto.split(",");
  const digitos = inteira.replace(/\D/g, "");
  const agrupada = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return resto.length ? `${agrupada},${resto.join("")}` : agrupada;
}

/** Deixa só dígitos e a primeira vírgula: "10.000,50" -> "10000,50". */
function apenasNumero(texto: string): string {
  const limpo = texto.replace(/[^\d,]/g, "");
  const [inteira, ...resto] = limpo.split(",");
  return resto.length ? `${inteira},${resto.join("").slice(0, 4)}` : inteira;
}

function formatar(valor: number, moeda: boolean): string {
  if (!Number.isFinite(valor)) return "";
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: moeda ? 2 : 0,
    maximumFractionDigits: moeda ? 2 : 4,
  });
}

/**
 * Entrada numérica com separador de milhar. Enquanto o campo está em foco,
 * o texto digitado manda; ao sair, volta a ser formatado a partir do valor —
 * assim dá para apagar e redigitar sem a máscara atrapalhar.
 */
export function Numero({
  valor,
  aoMudar,
  moeda: ehMoeda = false,
  alinharDireita = true,
  ...props
}: {
  valor: number;
  aoMudar: (v: number) => void;
  /** Força duas casas decimais na exibição. */
  moeda?: boolean;
  alinharDireita?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const [digitando, setDigitando] = useState<string | null>(null);
  const [ultimoValor, setUltimoValor] = useState(valor);

  // Se o valor mudar por fora (trocar de cotação, importar arquivo, "aplicar
  // à cotação aberta"), o texto em digitação está velho e precisa sair do
  // caminho — senão o campo mostraria o número da cotação anterior.
  if (valor !== ultimoValor) {
    setUltimoValor(valor);
    const emDigitacao = digitando === null ? null : Number(apenasNumero(digitando).replace(",", "."));
    if (emDigitacao !== valor) setDigitando(null);
  }

  return (
    <input
      {...props}
      inputMode="decimal"
      value={digitando ?? formatar(valor, ehMoeda)}
      onChange={(e) => {
        const limpo = apenasNumero(e.target.value);
        setDigitando(comMilhar(limpo));
        const n = Number(limpo.replace(",", "."));
        aoMudar(Number.isFinite(n) ? n : 0);
      }}
      onFocus={(e) => {
        setDigitando(comMilhar(apenasNumero(e.target.value)));
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setDigitando(null);
        props.onBlur?.(e);
      }}
      className={`${baseInput} ${alinharDireita ? "text-right tabular-nums" : ""} ${props.className ?? ""}`}
    />
  );
}

export function Botao({
  variante = "primario",
  ...props
}: { variante?: "primario" | "secundario" | "fantasma" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const estilos = {
    primario: "bg-marinho text-white hover:bg-marinho-700",
    secundario: "border border-borda bg-white text-texto hover:bg-marinho-50",
    fantasma: "text-texto-suave hover:bg-slate-100 hover:text-texto",
  }[variante];

  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${estilos} ${props.className ?? ""}`}
    />
  );
}

export function Interruptor({
  rotulo,
  ativo,
  aoMudar,
  dica,
}: {
  rotulo: string;
  ativo: boolean;
  aoMudar: (v: boolean) => void;
  dica?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={ativo}
        onChange={(e) => aoMudar(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[var(--marinho)]"
      />
      <span>
        <span className="block text-sm text-texto">{rotulo}</span>
        {dica && <span className="block text-[11px] text-texto-suave">{dica}</span>}
      </span>
    </label>
  );
}

export const moeda = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const percentual = (v: number, casas = 2) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
