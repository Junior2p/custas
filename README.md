# Custas

Sistema de apuração de **custas processuais, custos de escrituração e honorários
advocatícios**, com emissão de proposta ao cliente.

Ecossistema JR — Escritório Edmilson Lopes Junior · OAB/SP 294.775.

- Repositório: **github.com/Junior2p/custas**
- Vercel: projeto **elj/custas** (deploy manual via CLI)
- Produção: **custas.valorlog.com.br** — aguardando o CNAME na GoDaddy
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

## Como o sistema guarda as cotações

Funciona **sem banco**: cada cotação é gravada no `localStorage` do navegador e a lista
inteira pode ser **exportada para um arquivo `.json`** e importada de volta (em outra
máquina, ou como backup). O Supabase é opcional — quando as variáveis de ambiente
existirem, o login é exigido; sem elas, o sistema abre direto em "modo simulação".

Cada cotação guarda **a própria parametrização** (UFESP, certidões, faixas de custas).
Assim um orçamento de meses atrás continua mostrando os números com que foi feito, mesmo
depois de os valores de referência mudarem.

## Modo apresentação

Botão fixo no canto inferior direito. Ligado, esconde tudo que é de uso interno —
gestão de cotações, honorários, condições do cálculo e parametrização — deixando à
mostra apenas bens, cotas-partes, o valor do serviço e a proposta. Para usar quando a
tela é compartilhada com o cliente.

## Estrutura

```
src/
├── app/
│   ├── (app)/            área autenticada
│   └── auth/login/       tela de acesso
├── components/
│   ├── AreaTrabalho.tsx  alterna o modo apresentação
│   ├── Simulador.tsx     tela de apuração (bens, herdeiros, custos, proposta)
│   ├── BarraOrcamentos.tsx  nova/salvar/duplicar/exportar/importar
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
    ├── orcamento/        modelo da cotação e armazenamento local (+ testes)
    ├── dados/            carga inicial (tabelas 2025, parâmetros, serviços)
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

**Serviços atendidos** (`src/lib/dados/servicos.ts`): Inventário Consensual e Litigioso,
Escritura de Compra e Venda, Usucapião, Divórcio Consensual e Litigioso, Alvará Judicial.
Cada um com seu imposto, catálogo de custos, vias e ação na Tabela OAB.

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

**DNS** (GoDaddy, zona `valorlog.com.br`): CNAME `custas` → `cname.vercel-dns.com`.
Depois de propagar: `npx vercel domains verify custas.valorlog.com.br --scope elj`.

**Deployment Protection** está ligada — o acesso passa pelo SSO da Vercel. É proposital
enquanto o sistema não tem login próprio. Para abrir ao público:
*Settings → Deployment Protection → Vercel Authentication → Disabled*.

Quando estiver público, adicionar o card em `Portal-ELJ/src/lib/projetos.ts`.
