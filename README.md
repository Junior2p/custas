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

## Telas

Navegação lateral, no padrão do Gestão de Imóveis:

| Tela | O que faz |
|---|---|
| **Apuração** | Serviço, cliente, quantidade de herdeiros, bens e a composição dos custos nas duas vias |
| **Herdeiros e quinhões** | Detalhamento nominal e rateio — só necessário na hora do inventário, não para cotar |
| **Proposta** | Valor, condições de pagamento, checklist ✅/❌ e impressão |
| **Parametrização** | Certidões, multa, UFESP, honorários padrão, condições padrão e dados do escritório |
| **Tabelas de cartório** | Faixas de Notas e do SRI e a Tabela OAB — editáveis e com importação de CSV |

## Como o sistema guarda as cotações

Funciona **sem banco**: cada cotação é gravada no `localStorage` do navegador e a lista
inteira pode ser **exportada para um arquivo `.json`** e importada de volta (em outra
máquina, ou como backup). O Supabase é opcional — quando as variáveis de ambiente
existirem, o login é exigido; sem elas, o sistema abre direto em "modo simulação".

A **parametrização é do escritório** (vale para todas as cotações), mas cada cotação
guarda uma cópia dos valores com que foi calculada. Assim um orçamento de meses atrás
não se altera sozinho quando a UFESP muda. Para trazer os valores novos para uma cotação
antiga existe o botão *Aplicar à cotação aberta*.

Cotações gravadas por versões anteriores são completadas na leitura
(`normalizarOrcamento`), então atualizar o sistema não quebra o histórico.

## Ajuste manual dos custos

Todo valor da composição é um campo editável. Digitar sobrepõe o cálculo (o campo fica
dourado) e o botão ao lado devolve ao valor calculado. É assim que se zera ou aumenta
"Outros Custos" sem mexer na fórmula — inclusive no modo apresentação.

## Modo apresentação

Botão no rodapé da barra lateral. Para quando a tela é compartilhada com o cliente:
esconde a **Parametrização**, as **Tabelas**, a gestão de cotações, a configuração de
**honorários** e as memórias de cálculo. A composição dos custos **continua visível e
editável** — o que muda é que ela deixa de revelar como cada número foi obtido.

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

## Acesso

Login de **usuário único, sem banco**. A senha fica em variável de ambiente e nunca no
código; o servidor devolve um cookie `httpOnly` assinado com HMAC, que o proxy confere a
cada requisição (validade de 12 horas).

| Variável | Papel |
|---|---|
| `CUSTAS_SENHA` | **Obrigatória.** Sem ela o sistema fica bloqueado em produção |
| `CUSTAS_EMAIL` | E-mail aceito (padrão: `juniorlopes.2p@gmail.com`) |
| `CUSTAS_SEGREDO` | Opcional. Sem ele, deriva da senha — trocar a senha encerra as sessões |

Em desenvolvimento, sem `CUSTAS_SENHA`, o app abre direto. Em produção, a ausência da
variável **bloqueia** o acesso em vez de deixar o sistema aberto.

Para configurar sem passar a senha por terceiros:

```bash
npx vercel env add CUSTAS_SENHA production --scope elj
```

O comando pede o valor no seu terminal. Depois é preciso publicar de novo para a
variável valer.

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
