# Custas

Sistema de apuração de **custas processuais, custos de escrituração e honorários
advocatícios**, com emissão de proposta ao cliente.

Ecossistema JR — Escritório Edmilson Lopes Junior · OAB/SP 294.775.

- Produção (previsto): **custas.valorlog.com.br**
- Base do projeto: engenharia reversa da planilha `Custos Processuais.xlsx`
  (documentada em `Cortex IA/Custas/docs/`)

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · lucide-react ·
Supabase · deploy na Vercel.

## Comandos

```bash
npm run dev        # ambiente local
npm test           # testes do motor de cálculo contra os números da planilha
npm run typecheck  # verificação de tipos
npm run build      # build de produção
```

## Estrutura

```
src/
├── app/                  páginas (App Router)
├── components/
│   ├── Simulador.tsx     tela de apuração (bens, herdeiros, custos, proposta)
│   ├── Proposta.tsx      documento impresso para o cliente
│   └── ui.tsx            campos, botões e formatadores
└── lib/
    ├── calculo/          MOTOR DE CÁLCULO — TypeScript puro, sem banco nem UI
    │   ├── tipos.ts
    │   ├── emolumentos.ts    busca de faixa (Notas e SRI) e custas judiciais
    │   ├── honorarios.ts     tabela OAB · percentual livre · valor fixo
    │   ├── orcamento.ts      orquestra bens → linhas de custo → totais
    │   ├── partilha.ts       meação, quinhões e rateio de custos
    │   └── calculo.test.ts   testes contra os valores reais da planilha
    ├── dados/            carga inicial (tabelas 2025, parâmetros, catálogo)
    └── supabase/         clientes de banco (browser e server)
supabase/
├── 01-schema.sql         estrutura do banco
└── 02-seed.sql           carga inicial (tabelas, parâmetros, catálogo, proposta)
```

## Motor de cálculo

Isolado de propósito: recebe um contexto (bens, herdeiros, tabelas, parâmetros) e
devolve as linhas de despesa com **memória de cálculo**, mais os totais por via
(judicial × cartório).

Os testes conferem os números contra a planilha de origem:

| Cenário | Resultado |
|---|---|
| Inventário · imóvel R$ 20.000 · 2 herdeiros · via cartório | R$ 6.788,19 ✅ igual à planilha |
| Escritura · imóvel R$ 400.000 · ITBI 3% | R$ 21.894,49 ✅ igual à planilha |
| Inventário · mesma base · via judicial | R$ 5.366,02 ⚠️ planilha dava R$ 5.495,31 (bug corrigido) |

As divergências são correções intencionais de erros da planilha, listadas em
`docs/01-ANALISE-PLANILHA.md` (seção 8).

## Banco

No SQL Editor do Supabase, rodar na ordem:

1. `supabase/01-schema.sql`
2. `supabase/02-seed.sql`

Depois preencher `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Deploy

```bash
npx vercel --prod --yes --scope elj
```

DNS: CNAME `custas` → `cname.vercel-dns.com` na GoDaddy (valorlog.com.br).
Depois, adicionar o card do sistema em `Portal-ELJ/src/lib/projetos.ts`.
