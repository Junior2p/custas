-- ============================================================
-- CUSTAS — schema inicial (Supabase / PostgreSQL)
-- Sistema de apuração de custas processuais, escrituração e honorários.
-- Rodar no SQL Editor do Supabase, na ordem: 01-schema.sql → 02-seed.sql
-- ============================================================

-- ------------------------------------------------------------
-- PARAMETRIZAÇÃO
-- ------------------------------------------------------------

-- Tabelas de emolumentos (Notas e Registro de Imóveis), por vigência.
create table if not exists tabelas_emolumentos (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null check (tipo in ('notas', 'sri')),
  nome          text not null,
  ano           int  not null,
  vigencia_inicio date not null,
  vigencia_fim    date,
  ativa         boolean not null default true,
  criado_em     timestamptz not null default now()
);

create table if not exists faixas_emolumentos (
  id          uuid primary key default gen_random_uuid(),
  tabela_id   uuid not null references tabelas_emolumentos(id) on delete cascade,
  ordem       int not null,
  valor_de    numeric(14,2) not null,
  valor_ate   numeric(14,2),          -- null = faixa "acima de"
  valor_total numeric(14,2) not null,
  unique (tabela_id, ordem)
);
create index if not exists idx_faixas_tabela on faixas_emolumentos(tabela_id, valor_de);

-- Tabela de honorários da OAB.
create table if not exists tabela_honorarios (
  id              uuid primary key default gen_random_uuid(),
  acao            text not null,
  percentual      numeric(6,3) not null,   -- pontos percentuais (ex.: 8.000 = 8%)
  valor_minimo    numeric(14,2) not null,
  vigencia_inicio date not null default current_date,
  ativa           boolean not null default true
);

-- Faixas de custas judiciais (a planilha usa degraus em UFESP).
create table if not exists faixas_custas_judiciais (
  id          uuid primary key default gen_random_uuid(),
  ordem       int not null,
  valor_de    numeric(14,2) not null,
  valor_ate   numeric(14,2),
  base        text not null check (base in ('ufesp', 'moeda', 'percentual')),
  quantidade  numeric(14,4) not null,
  vigencia_inicio date not null default current_date,
  ativa       boolean not null default true
);

-- Parâmetros gerais: chave/valor tipado, todos editáveis na tela.
create table if not exists parametros (
  chave      text primary key,
  rotulo     text not null,
  grupo      text not null check (grupo in ('impostos', 'certidoes', 'custas', 'proposta', 'geral')),
  tipo       text not null check (tipo in ('percentual', 'moeda', 'inteiro', 'texto', 'booleano')),
  valor      text not null,
  descricao  text,
  ordem      int not null default 0
);

-- Tipos de serviço (Inventário, Escritura, Usucapião, Divórcio, Alvará…).
create table if not exists tipos_servico (
  id                uuid primary key default gen_random_uuid(),
  chave             text unique not null,
  nome              text not null,
  imposto           text not null default 'nenhum' check (imposto in ('itcmd', 'itbi', 'nenhum')),
  imposto_aliquota  numeric(6,3),            -- sobrescreve o parâmetro geral quando preenchido
  acao_honorario_id uuid references tabela_honorarios(id) on delete set null,
  tem_herdeiros     boolean not null default false,
  tem_partilha      boolean not null default false,
  vias_permitidas   text[] not null default array['judicial','extrajudicial'],
  ativo             boolean not null default true,
  ordem             int not null default 0
);

-- Catálogo de custos: define COMO cada linha de despesa é apurada.
create table if not exists catalogo_custos (
  id             uuid primary key default gen_random_uuid(),
  chave          text not null,
  nome           text not null,
  grupo          text,
  tipo_calculo   text not null check (tipo_calculo in (
                   'fixo','por_unidade','percentual_sobre','tabela_notas',
                   'tabela_sri','tabela_custas_judiciais','imposto','honorarios')),
  valor          numeric(14,2),
  percentual     numeric(6,3),
  base           text check (base in ('total_venal','total_transmitido','imposto','custas_registro','subtotal')),
  multiplicador  text check (multiplicador in ('herdeiros','imoveis','imoveis_registro','bens','certidoes','manual')),
  quantidade     numeric(14,4),
  parametro      text references parametros(chave) on delete set null,
  vias           text[],                   -- vazio/null = todas
  -- marca as linhas de custo de registro: compõem a base dos "Outros Custos"
  -- e são o que sai do "total sem registro"
  vinculado_registro boolean not null default false,
  tipo_servico_id uuid references tipos_servico(id) on delete cascade,
  incluso_padrao boolean not null default true,
  ordem          int not null default 0,
  ativo          boolean not null default true
);
create index if not exists idx_catalogo_servico on catalogo_custos(tipo_servico_id, ordem);

-- Modelos de proposta: checklist ✅/❌ e condições comerciais.
create table if not exists modelos_proposta (
  id                 uuid primary key default gen_random_uuid(),
  nome               text not null,
  tipo_servico_id    uuid references tipos_servico(id) on delete cascade,
  texto_abertura     text,
  entrada_percentual numeric(6,2) not null default 50,
  parcelas           int not null default 3,
  validade_dias      int not null default 30,
  observacoes        text,
  padrao             boolean not null default false
);

create table if not exists modelos_proposta_itens (
  id         uuid primary key default gen_random_uuid(),
  modelo_id  uuid not null references modelos_proposta(id) on delete cascade,
  descricao  text not null,
  incluso    boolean not null default true,
  ordem      int not null default 0
);

-- Dados do escritório que saem na proposta.
create table if not exists configuracoes (
  id          int primary key default 1 check (id = 1),
  nome        text not null,
  oab         text,
  telefone    text,
  email       text,
  cidade      text,
  logo_url    text,
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- OPERACIONAL
-- ------------------------------------------------------------

create table if not exists clientes (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  cpf_cnpj     text,
  rg           text,
  estado_civil text,
  profissao    text,
  endereco     text,
  telefone     text,
  email        text,
  observacoes  text,
  criado_em    timestamptz not null default now()
);
create index if not exists idx_clientes_nome on clientes(nome);

create table if not exists orcamentos (
  id               uuid primary key default gen_random_uuid(),
  numero           text unique not null,
  cliente_id       uuid references clientes(id) on delete restrict,
  tipo_servico_id  uuid not null references tipos_servico(id) on delete restrict,
  titulo           text,
  via              text not null default 'comparar' check (via in ('judicial','extrajudicial','comparar')),
  status           text not null default 'rascunho'
                     check (status in ('rascunho','enviado','aprovado','recusado','cancelado')),
  data_orcamento   date not null default current_date,
  validade_dias    int not null default 30,

  -- vigência congelada: o orçamento guarda quais tabelas usou
  tabela_notas_id  uuid references tabelas_emolumentos(id) on delete set null,
  tabela_sri_id    uuid references tabelas_emolumentos(id) on delete set null,

  honorarios_modo       text not null default 'fixo' check (honorarios_modo in ('tabela','percentual','fixo')),
  honorarios_percentual numeric(6,3),
  honorarios_valor      numeric(14,2),

  aplicar_multa_imposto boolean not null default false,
  incluir_registro      boolean not null default true,
  rateio_custos         text not null default 'por_quinhao'
                          check (rateio_custos in ('por_quinhao','igualitario','nenhum')),

  -- snapshot do que foi apurado
  valor_apurado_judicial      numeric(14,2),
  valor_apurado_extrajudicial numeric(14,2),
  -- o que foi de fato oferecido ao cliente (era digitado à mão na planilha)
  valor_negociado             numeric(14,2),

  entrada_percentual numeric(6,2) not null default 50,
  parcelas           int not null default 3,
  observacoes        text,

  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists idx_orcamentos_cliente on orcamentos(cliente_id);
create index if not exists idx_orcamentos_status on orcamentos(status, data_orcamento desc);

create table if not exists orcamento_bens (
  id            uuid primary key default gen_random_uuid(),
  orcamento_id  uuid not null references orcamentos(id) on delete cascade,
  ordem         int not null default 0,
  descricao     text not null,
  tipo          text not null default 'imovel' check (tipo in ('imovel','veiculo','outro')),
  valor_venal   numeric(14,2) not null default 0,
  percentual    numeric(9,6) not null default 1,   -- fração inventariada (1 = 100%)
  registrar     boolean not null default true,
  qtd_certidoes int not null default 1
);
create index if not exists idx_bens_orcamento on orcamento_bens(orcamento_id, ordem);

create table if not exists orcamento_itens (
  id                 uuid primary key default gen_random_uuid(),
  orcamento_id       uuid not null references orcamentos(id) on delete cascade,
  catalogo_custo_id  uuid references catalogo_custos(id) on delete set null,
  chave              text,
  descricao          text not null,
  via                text not null check (via in ('judicial','extrajudicial')),
  valor_calculado    numeric(14,2) not null default 0,
  valor_manual       numeric(14,2),                 -- override; null = usa o calculado
  origem             text not null default 'auto' check (origem in ('auto','manual')),
  incluso            boolean not null default true,
  vinculado_registro boolean not null default false,
  memoria_calculo    text,
  ordem              int not null default 0
);
create index if not exists idx_itens_orcamento on orcamento_itens(orcamento_id, via, ordem);

create table if not exists orcamento_herdeiros (
  id           uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references orcamentos(id) on delete cascade,
  nome         text not null,
  tipo         text not null default 'herdeiro' check (tipo in ('meeiro','herdeiro')),
  percentual   numeric(9,6) not null default 0,
  ordem        int not null default 0
);
create index if not exists idx_herdeiros_orcamento on orcamento_herdeiros(orcamento_id, ordem);

-- Quinhão de cada herdeiro em cada bem (quando o rateio não é uniforme).
create table if not exists orcamento_quinhoes (
  id           uuid primary key default gen_random_uuid(),
  bem_id       uuid not null references orcamento_bens(id) on delete cascade,
  herdeiro_id  uuid not null references orcamento_herdeiros(id) on delete cascade,
  percentual   numeric(9,6) not null default 0,
  unique (bem_id, herdeiro_id)
);

create table if not exists orcamento_proposta_itens (
  id           uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references orcamentos(id) on delete cascade,
  descricao    text not null,
  incluso      boolean not null default true,
  ordem        int not null default 0
);
create index if not exists idx_proposta_itens on orcamento_proposta_itens(orcamento_id, ordem);

-- ------------------------------------------------------------
-- GATILHOS
-- ------------------------------------------------------------

create or replace function set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

drop trigger if exists trg_orcamentos_atualizado on orcamentos;
create trigger trg_orcamentos_atualizado
  before update on orcamentos
  for each row execute function set_atualizado_em();

-- Numeração sequencial por ano: 0001/2026, 0002/2026…
create or replace function proximo_numero_orcamento()
returns text language plpgsql as $$
declare
  ano text := to_char(current_date, 'YYYY');
  seq int;
begin
  select coalesce(max(split_part(numero, '/', 1)::int), 0) + 1
    into seq
    from orcamentos
   where split_part(numero, '/', 2) = ano;
  return lpad(seq::text, 4, '0') || '/' || ano;
end $$;

-- ------------------------------------------------------------
-- SEGURANÇA (RLS) — sistema de usuário único, autenticado
-- ------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'tabelas_emolumentos','faixas_emolumentos','tabela_honorarios','faixas_custas_judiciais',
    'parametros','tipos_servico','catalogo_custos','modelos_proposta','modelos_proposta_itens',
    'configuracoes','clientes','orcamentos','orcamento_bens','orcamento_itens',
    'orcamento_herdeiros','orcamento_quinhoes','orcamento_proposta_itens'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists acesso_autenticado on %I', t);
    execute format(
      'create policy acesso_autenticado on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;
