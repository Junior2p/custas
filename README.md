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

O menu tem os **tipos de ação**; as etapas de cada um ficam dentro da própria tela.

| Tipo | Etapas |
|---|---|
| **Ações Patrimoniais** | 1 Apuração · 2 Herdeiros e quinhões · 3 Proposta |
| **Ações Judiciais** | Dados do processo → documento (extrato ou proposta de ingresso) |

No inventário, marque **Tem meeiro(a)** quando houver: ele conta nas certidões pessoais
(uma pessoa a mais), mas fica **fora da divisão dos quinhões** — a meação é direito
próprio, não herança. O "valor por herdeiro" também ignora o meeiro.

As alíquotas padrão (**ITCMD 4%** e **ITBI 3%**) ficam em Parametrização → Custos de
base, e cada cotação pode sobrescrever a sua.

**Ações Patrimoniais** cobre o que se mede por bens: inventário, escritura, usucapião,
divórcio e alvará. **Ações Judiciais** cobre as ações comuns, em dois documentos —
*extrato de honorários* (processo em curso, ato a ato pela Tabela OAB/SP) e *proposta de
ingresso* (honorários iniciais + êxito + taxa judiciária de 1,5%).

Fora do fluxo, no rodapé do menu: **Parametrização** e **Tabelas de cartório**.
| **Parametrização** | Certidões, multa, UFESP, honorários padrão, condições padrão e dados do escritório |
| **Tabelas de cartório** | Faixas de Notas e do SRI e a Tabela OAB — editáveis e com importação de CSV |

## Documentos

Todos passam pelo mesmo layout (`src/components/documentos/Documento.tsx`): logo do
escritório no topo, título, corpo e assinatura com OAB e telefone.

**A impressão sai de um iframe próprio** (`src/lib/imprimir.ts`), não da página. O
documento é copiado para um quadro invisível do tamanho de uma folha, junto com as
folhas de estilo, e o `print()` é chamado ali.

Depender de `@media print` sobre a aplicação inteira se mostrou frágil: no Safari o PDF
saía em branco e a tela ficava apagada até recarregar, porque a folha de impressão
escondia a interface real. Com o iframe, a página em que se trabalha não é tocada.

A função espera as folhas de estilo e as imagens carregarem antes de disparar o diálogo
— sem isso o Safari imprime antes de ter o que desenhar.

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

Login de **usuário e senha conferidos no servidor**, sem banco. O proxy exige sessão
antes de a página carregar; ao entrar, o servidor devolve um cookie `httpOnly` assinado
em HMAC, válido por 12 horas.

| Variável | Papel |
|---|---|
| `CUSTAS_USUARIO` | Usuário aceito (um e-mail, em geral) |
| `CUSTAS_SENHA` | Senha |
| `CUSTAS_SEGREDO` | Opcional. Sem ele deriva das credenciais — trocar a senha encerra as sessões |

```bash
npx vercel env add CUSTAS_USUARIO production --scope elj
npx vercel env add CUSTAS_SENHA production --scope elj
```

Os comandos pedem o valor no terminal. Depois é preciso publicar de novo.

> **Em produção, sem as duas variáveis, o sistema fica bloqueado** — com instruções na
> tela, não aberto. Em desenvolvimento local, sem elas, abre direto.

Houve antes uma trava cadastrada pela própria tela, guardada no navegador. Ela **não
protegia**: quem abrisse o sistema de outra máquina tinha o armazenamento vazio, logo
nenhuma trava. Foi removida — só o servidor pode barrar quem nunca esteve aqui.

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
