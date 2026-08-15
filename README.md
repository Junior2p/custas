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
| **Ações Patrimoniais** | Inventário, escritura, usucapião, divórcio, alvará — tudo que se mede por bens. Serviço, cliente, nº de herdeiros, bens e a composição dos custos |
| **Herdeiros e quinhões** | Detalhamento nominal e rateio — só necessário na hora do inventário, não para cotar |
| **Proposta** | Valor, condições de pagamento, checklist ✅/❌ e impressão |
| **Ações Judiciais** | Ações comuns, em dois documentos: **extrato de honorários** (processo em curso, ato a ato pela Tabela OAB/SP) e **proposta de ingresso** (honorários iniciais + êxito + taxa judiciária de 1,5%) |
| **Parametrização** | Certidões, multa, UFESP, honorários padrão, condições padrão e dados do escritório |
| **Tabelas de cartório** | Faixas de Notas e do SRI e a Tabela OAB — editáveis e com importação de CSV |

## Documentos

Todos passam pelo mesmo layout (`src/components/documentos/Documento.tsx`): logo do
escritório no topo, título, corpo e assinatura com OAB e telefone.

**Todo texto é revisável antes de imprimir.** Cada documento tem uma seção *Textos do
documento* com título, abertura, blocos específicos e observações — o que estiver ali sai
no PDF exatamente como estiver.

### Extrato de honorários

`Valor final = piso da Tabela OAB/SP × complexidade`, com acréscimo opcional de êxito.
Os testes conferem contra um extrato real (processo 1004737-78.2022.8.26.0189):
subtotal R$ 20.585,71 e total geral R$ 21.585,71.

### Proposta de ingresso

Honorários iniciais + percentual de êxito (cobrado só em caso de sucesso) + taxa
judiciária sobre o valor da causa — **1,5%** por padrão, editável.

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

## Vários bens: qual base entra em cada faixa

| Cobrança | Base da faixa | Por quê |
|---|---|---|
| **Registro no SRI** | sempre **imóvel a imóvel** | cada matrícula é um ato próprio, e os imóveis podem estar em comarcas diferentes |
| **Custas de Notas** | **soma dos bens** (padrão) | a escritura é um ato único |
| **Custas judiciais** | monte-mor / valor da ação | é a regra do foro |

O parâmetro `notasPorBem` (desligado por padrão) permite apurar as custas de Notas bem a
bem, para quando os atos forem separados. Há um interruptor na apuração sempre que
houver mais de um bem. Ele **não afeta** o registro no SRI nem as custas judiciais.

Como as tabelas são regressivas, a escolha pesa: 4 imóveis de R$ 50.000 dão R$ 3.458,80
somados contra R$ 7.760,40 bem a bem.

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

Duas camadas, ambas sem banco:

**1. Código validador cadastrado na tela** (Parametrização → Acesso). É o caminho normal:
o sistema pede o código ao abrir. Guarda-se apenas o **SHA-256** — o código em si não fica
salvo em lugar nenhum e não vai no arquivo exportado. A liberação vale enquanto a aba
estiver aberta.

Esqueceu? A tela de entrada tem *Esqueci o código*: confirmando o e-mail cadastrado em
Parametrização → Dados do escritório, o código é **redefinido** (não há como reenviá-lo —
o sistema não conhece o código, só a impressão digital dele).

> Esta camada roda no navegador: é uma **trava de conveniência**. Ela impede o acesso
> casual, não um ataque. O que a torna suficiente aqui é que as cotações ficam no
> `localStorage` de cada navegador — não há dado de cliente no servidor.

**2. Código no servidor** (opcional, inviolável). Defina `CUSTAS_CODIGO` e a validação
passa a acontecer antes de a página carregar, com cookie `httpOnly` assinado em HMAC:

```bash
npx vercel env add CUSTAS_CODIGO production --scope elj
```

| Variável | Papel |
|---|---|
| `CUSTAS_CODIGO` | Ativa a proteção de servidor. Ausente = só a trava local |
| `CUSTAS_SEGREDO` | Opcional. Sem ele deriva do código — trocá-lo encerra as sessões |

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
