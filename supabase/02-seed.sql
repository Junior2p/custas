-- ============================================================
-- CUSTAS — carga inicial (seed)
-- Dados extraídos de "Custos Processuais.xlsx" (vigência 2025).
-- Rodar DEPOIS de 01-schema.sql.
-- ============================================================

-- ------------------------------------------------------------
-- Escritório
-- ------------------------------------------------------------
insert into configuracoes (id, nome, oab, telefone, email, cidade)
values (1, 'Edmilson Lopes Junior', 'OAB/SP 294.775', '(17) 99703-5758',
        'juniorlopes.2p@gmail.com', 'São João das Duas Pontes / SP')
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- Parâmetros gerais
-- ------------------------------------------------------------
insert into parametros (chave, rotulo, grupo, tipo, valor, descricao, ordem) values
  ('imposto_itcmd',            'Alíquota ITCMD',                 'impostos',  'percentual', '4',     'Imposto de transmissão causa mortis (SP)', 10),
  ('imposto_itbi',             'Alíquota ITBI',                  'impostos',  'percentual', '3',     'Imposto de transmissão inter vivos', 20),
  ('multa_imposto',            'Multa sobre o imposto',          'impostos',  'percentual', '30',    'Aplicada quando o recolhimento está em atraso', 30),
  ('ufesp',                    'UFESP',                          'custas',    'moeda',      '34.26', 'Unidade Fiscal do Estado de São Paulo — conferir a cada ano', 40),
  ('certidao_imovel',          'Certidão de imóvel',             'certidoes', 'moeda',      '100',   'Valor unitário do SRI. Cobrada duas vezes por imóvel: prévia e após o registro', 50),
  ('certidao_testamento',      'Certidão de testamento',         'certidoes', 'moeda',      '70',    'CENSEC', 60),
  ('certidao_pessoal_herdeiro','Certidões pessoais por herdeiro','certidoes', 'moeda',      '100',   'Multiplicado pelo número de herdeiros', 70),
  ('outros_custos_percentual', 'Outros custos',                  'custas',    'percentual', '10',    'Percentual sobre custas + registro', 80),
  ('proposta_entrada',         'Entrada da proposta',            'proposta',  'percentual', '50',    'Percentual pago na assinatura', 100),
  ('proposta_parcelas',        'Parcelas do saldo',              'proposta',  'inteiro',    '3',     'Nº de parcelas do valor restante', 110),
  ('proposta_validade_dias',   'Validade da proposta',           'proposta',  'inteiro',    '30',    'Dias de validade', 120)
on conflict (chave) do nothing;

-- ------------------------------------------------------------
-- Tabelas de emolumentos 2025
-- ------------------------------------------------------------
insert into tabelas_emolumentos (tipo, nome, ano, vigencia_inicio, ativa) values
  ('notas', 'Tabelionato de Notas — 2025', 2025, '2025-01-01', true),
  ('sri',   'Registro de Imóveis — 2025',  2025, '2025-01-01', true);

-- Faixas — NOTAS
insert into faixas_emolumentos (tabela_id, ordem, valor_de, valor_ate, valor_total)
select t.id, v.ordem, v.valor_de, v.valor_ate, v.valor_total
  from tabelas_emolumentos t,
       (values
    (1, 0.0, 1524.0, 362.98),
    (2, 1524.01, 5761.0, 542.43),
    (3, 5761.01, 9603.0, 846.96),
    (4, 9603.01, 19210.0, 1209.95),
    (5, 19210.01, 38420.0, 1635.48),
    (6, 38420.01, 76840.0, 1940.1),
    (7, 76840.01, 115260.0, 2303.08),
    (8, 115260.01, 153680.0, 2728.61),
    (9, 153680.01, 192100.0, 3091.68),
    (10, 192100.01, 230520.0, 3458.8),
    (11, 230520.01, 268940.0, 3880.19),
    (12, 268940.01, 307360.0, 4247.39),
    (13, 307360.01, 330146.0, 4672.93),
    (14, 330146.01, 384200.0, 4973.32),
    (15, 384200.01, 768400.0, 5519.9),
    (16, 768400.01, 1152600.0, 6129.04),
    (17, 1152600.01, 1536800.0, 6796.6),
    (18, 1536800.01, 2345066.0, 7510.07),
    (19, 2345066.01, 3908444.0, 10430.69),
    (20, 3908444.01, 5862665.0, 13559.85),
    (21, 5862665.01, 7816887.0, 16689.08),
    (22, 7816887.01, 9771109.0, 19818.25),
    (23, 9771109.01, 11725331.0, 22947.4),
    (24, 11725331.01, 13679552.0, 26076.63),
    (25, 13679552.01, 15633774.0, 29205.8),
    (26, 15633774.01, 17587996.0, 32335.0),
    (27, 17587996.01, 19542217.0, 35464.28),
    (28, 19542217.01, 23450661.0, 41722.67),
    (29, 23450661.01, 27359105.0, 47981.02),
    (30, 27359105.01, 31267548.0, 54239.42),
    (31, 31267548.01, 35175992.0, 60497.77),
    (32, 35175992.01, null, 66756.25)
       ) as v(ordem, valor_de, valor_ate, valor_total)
 where t.tipo = 'notas' and t.ano = 2025
on conflict (tabela_id, ordem) do nothing;

-- Faixas — SRI
insert into faixas_emolumentos (tabela_id, ordem, valor_de, valor_ate, valor_total)
select t.id, v.ordem, v.valor_de, v.valor_ate, v.valor_total
  from tabelas_emolumentos t,
       (values
    (1, 0.01, 2306.0, 257.2),
    (2, 2306.01, 5761.0, 412.72),
    (3, 5761.01, 9603.0, 740.42),
    (4, 9603.01, 19210.0, 1098.57),
    (5, 19210.01, 38420.0, 1335.6),
    (6, 38420.01, 115260.0, 1489.46),
    (7, 115260.01, 192100.0, 1901.09),
    (8, 192100.01, 230520.0, 2311.88),
    (9, 230520.01, 268940.0, 2516.87),
    (10, 268940.01, 307360.0, 2723.02),
    (11, 307360.01, 345780.0, 2870.61),
    (12, 345780.01, 384200.0, 2945.43),
    (13, 384200.01, 768400.0, 3284.18),
    (14, 768400.01, 1152600.0, 3846.1),
    (15, 1152600.01, 1536800.0, 4427.79),
    (16, 1536800.01, 1921000.0, 5009.53),
    (17, 1921000.01, 2305200.0, 5310.3),
    (18, 2305200.01, 3842000.0, 6814.06),
    (19, 3842000.01, 5763000.0, 9520.82),
    (20, 5763000.01, 7684000.0, 12528.33),
    (21, 7684000.01, 9605000.0, 15535.85),
    (22, 9605000.01, 11526000.0, 18543.37),
    (23, 11526000.01, 13447000.0, 21550.88),
    (24, 13447000.01, 15368000.0, 24558.39),
    (25, 15368000.01, 17289000.0, 27565.91),
    (26, 17289000.01, 19210000.0, 30573.43),
    (27, 19210000.01, 23052000.0, 35084.71),
    (28, 23052000.01, 26894000.0, 41099.74),
    (29, 26894000.01, 30736000.0, 47114.79),
    (30, 30736000.01, 34578000.0, 53129.83),
    (31, 34578000.01, null, 59144.87)
       ) as v(ordem, valor_de, valor_ate, valor_total)
 where t.tipo = 'sri' and t.ano = 2025
on conflict (tabela_id, ordem) do nothing;

-- ------------------------------------------------------------
-- Tabela OAB
-- ------------------------------------------------------------
insert into tabela_honorarios (acao, percentual, valor_minimo) values
  ('Usucapião', 20.0, 4354.77),
  ('Alvará judicial', 20.0, 2206.06),
  ('Divórcio Consensual', 6.0, 5598.99),
  ('Divórcio Litigioso', 8.0, 8709.53),
  ('Inventário Consensual', 8.0, 4354.77),
  ('Inventário Litigioso', 10.0, 4354.77);

-- ------------------------------------------------------------
-- Custas judiciais (degraus em UFESP, conforme a planilha)
-- ------------------------------------------------------------
insert into faixas_custas_judiciais (ordem, valor_de, valor_ate, base, quantidade) values
  (1, 0,      49999.99,  'ufesp', 10),
  (2, 50000,  499999.99, 'ufesp', 100),
  (3, 500000, null,      'ufesp', 300);

-- ------------------------------------------------------------
-- Tipos de serviço — os que dependem de análise com base no valor
-- ------------------------------------------------------------
insert into tipos_servico
  (chave, nome, imposto, imposto_aliquota, tem_herdeiros, tem_partilha, vias_permitidas, honorarios_modo, honorarios_percentual, ordem) values
  ('inventario_consensual', 'Inventário Consensual',       'itcmd',   4, true,  true,  array['judicial','extrajudicial'], 'tabela',            8,  10),
  ('inventario_litigioso',  'Inventário Litigioso',        'itcmd',   4, true,  true,  array['judicial'],                 'tabela',            10, 20),
  -- Escritura: honorários embutidos — 10% sobre os demais custos, sem cobrança destacada
  ('escritura',             'Escritura de Compra e Venda', 'itbi',    3, false, false, array['extrajudicial'],            'percentual_custos', 10, 30),
  ('usucapiao',             'Usucapião',                   'nenhum',  0, false, false, array['judicial','extrajudicial'], 'tabela',            20, 40),
  ('divorcio_consensual',   'Divórcio Consensual',         'nenhum',  0, false, true,  array['judicial','extrajudicial'], 'tabela',            6,  50),
  ('divorcio_litigioso',    'Divórcio Litigioso',          'nenhum',  0, false, true,  array['judicial'],                 'tabela',            8,  60),
  ('alvara_judicial',       'Alvará Judicial',             'nenhum',  0, true,  true,  array['judicial'],                 'tabela',            20, 70)
on conflict (chave) do nothing;

-- Liga cada serviço à sua ação na Tabela OAB
update tipos_servico ts set acao_honorario_id = th.id
  from tabela_honorarios th
 where ts.acao_honorario_id is null
   and th.acao = case ts.chave
     when 'inventario_consensual' then 'Inventário Consensual'
     when 'inventario_litigioso'  then 'Inventário Litigioso'
     when 'usucapiao'             then 'Usucapião'
     when 'divorcio_consensual'   then 'Divórcio Consensual'
     when 'divorcio_litigioso'    then 'Divórcio Litigioso'
     when 'alvara_judicial'       then 'Alvará judicial'
   end;

-- ------------------------------------------------------------
-- Catálogo de custos
--
-- Blocos por serviço. Observações:
--  · a certidão do imóvel entra DUAS vezes — prévia (antes do ato) e
--    após o registro, ambas usando o parâmetro `certidao_imovel`;
--  · `vinculado_registro` marca o que sai do "total sem registro" e
--    compõe a base dos "Outros Custos".
-- ------------------------------------------------------------
insert into catalogo_custos
  (chave, nome, tipo_calculo, parametro, base, multiplicador, vias, vinculado_registro, tipo_servico_id, ordem)
select v.chave, v.nome, v.tipo_calculo, v.parametro, v.base, v.multiplicador, v.vias, v.vinculado_registro, ts.id, v.ordem
  from tipos_servico ts
  join (values
    -- serviço                 chave                    nome                                  tipo_calculo               parametro                    base               multiplicador       vias                      vinc.  ordem
    ('inventario_consensual', 'honorarios',            'Honorários Advocatícios',            'honorarios',              null,                        null,              null,               null::text[],             false, 10),
    ('inventario_consensual', 'imposto',               'ITCMD',                              'imposto',                 null,                        null,              null,               null::text[],             false, 20),
    ('inventario_consensual', 'certidao_previa',       'Certidão de Imóveis (prévia)',       'por_unidade',             'certidao_imovel',           null,              'certidoes',        null::text[],             false, 30),
    ('inventario_consensual', 'certidao_testamento',   'Certidão de Testamento',             'fixo',                    'certidao_testamento',       null,              null,               null::text[],             false, 40),
    ('inventario_consensual', 'certidoes_pessoais',    'Certidões Pessoais dos Herdeiros',   'por_unidade',             'certidao_pessoal_herdeiro', null,              'herdeiros',        null::text[],             false, 50),
    ('inventario_consensual', 'custas',                'Custas Processuais',                 'tabela_custas_judiciais', null,                        null,              null,               array['judicial'],        false, 60),
    ('inventario_consensual', 'custas',                'Custas de Cartório',                 'tabela_notas',            null,                        null,              null,               array['extrajudicial'],   false, 60),
    ('inventario_consensual', 'registro_sri',          'Registro no SRI',                    'tabela_sri',              null,                        null,              null,               null::text[],             true,  70),
    ('inventario_consensual', 'certidao_pos_registro', 'Certidão de Imóveis (após registro)','por_unidade',             'certidao_imovel',           null,              'imoveis_registro', null::text[],             true,  75),
    ('inventario_consensual', 'outros_custos',         'Outros Custos',                      'percentual_sobre',        'outros_custos_percentual',  'custas_registro', null,               null::text[],             false, 80),

    ('inventario_litigioso',  'honorarios',            'Honorários Advocatícios',            'honorarios',              null,                        null,              null,               null::text[],             false, 10),
    ('inventario_litigioso',  'imposto',               'ITCMD',                              'imposto',                 null,                        null,              null,               null::text[],             false, 20),
    ('inventario_litigioso',  'certidao_previa',       'Certidão de Imóveis (prévia)',       'por_unidade',             'certidao_imovel',           null,              'certidoes',        null::text[],             false, 30),
    ('inventario_litigioso',  'certidao_testamento',   'Certidão de Testamento',             'fixo',                    'certidao_testamento',       null,              null,               null::text[],             false, 40),
    ('inventario_litigioso',  'certidoes_pessoais',    'Certidões Pessoais dos Herdeiros',   'por_unidade',             'certidao_pessoal_herdeiro', null,              'herdeiros',        null::text[],             false, 50),
    ('inventario_litigioso',  'custas',                'Custas Processuais',                 'tabela_custas_judiciais', null,                        null,              null,               array['judicial'],        false, 60),
    ('inventario_litigioso',  'registro_sri',          'Registro no SRI',                    'tabela_sri',              null,                        null,              null,               null::text[],             true,  70),
    ('inventario_litigioso',  'certidao_pos_registro', 'Certidão de Imóveis (após registro)','por_unidade',             'certidao_imovel',           null,              'imoveis_registro', null::text[],             true,  75),
    ('inventario_litigioso',  'outros_custos',         'Outros Custos',                      'percentual_sobre',        'outros_custos_percentual',  'custas_registro', null,               null::text[],             false, 80),

    ('escritura',             'imposto',               'ITBI',                               'imposto',                 null,                        null,              null,               null::text[],             false, 20),
    ('escritura',             'certidao_previa',       'Certidão de Imóveis (prévia)',       'por_unidade',             'certidao_imovel',           null,              'certidoes',        null::text[],             false, 30),
    ('escritura',             'custas',                'Custas de Cartório',                 'tabela_notas',            null,                        null,              null,               array['extrajudicial'],   false, 60),
    ('escritura',             'registro_sri',          'Registro no SRI',                    'tabela_sri',              null,                        null,              null,               null::text[],             true,  70),
    ('escritura',             'certidao_pos_registro', 'Certidão de Imóveis (após registro)','por_unidade',             'certidao_imovel',           null,              'imoveis_registro', null::text[],             true,  75),
    ('escritura',             'outros_custos',         'Outros Custos',                      'percentual_sobre',        'outros_custos_percentual',  'custas_registro', null,               null::text[],             false, 80),
    -- por último: incide sobre todas as linhas acima
    ('escritura',             'honorarios',            'Honorários (embutidos)',             'honorarios',              null,                        null,              null,               null::text[],             false, 90),

    ('usucapiao',             'honorarios',            'Honorários Advocatícios',            'honorarios',              null,                        null,              null,               null::text[],             false, 10),
    ('usucapiao',             'certidao_previa',       'Certidão de Imóveis (prévia)',       'por_unidade',             'certidao_imovel',           null,              'certidoes',        null::text[],             false, 30),
    ('usucapiao',             'custas',                'Custas Processuais',                 'tabela_custas_judiciais', null,                        null,              null,               array['judicial'],        false, 60),
    ('usucapiao',             'custas',                'Custas de Cartório',                 'tabela_notas',            null,                        null,              null,               array['extrajudicial'],   false, 60),
    ('usucapiao',             'registro_sri',          'Registro no SRI',                    'tabela_sri',              null,                        null,              null,               null::text[],             true,  70),
    ('usucapiao',             'certidao_pos_registro', 'Certidão de Imóveis (após registro)','por_unidade',             'certidao_imovel',           null,              'imoveis_registro', null::text[],             true,  75),
    ('usucapiao',             'outros_custos',         'Outros Custos',                      'percentual_sobre',        'outros_custos_percentual',  'custas_registro', null,               null::text[],             false, 80),

    ('divorcio_consensual',   'honorarios',            'Honorários Advocatícios',            'honorarios',              null,                        null,              null,               null::text[],             false, 10),
    ('divorcio_consensual',   'certidao_previa',       'Certidão de Imóveis (prévia)',       'por_unidade',             'certidao_imovel',           null,              'certidoes',        null::text[],             false, 30),
    ('divorcio_consensual',   'custas',                'Custas Processuais',                 'tabela_custas_judiciais', null,                        null,              null,               array['judicial'],        false, 60),
    ('divorcio_consensual',   'custas',                'Custas de Cartório',                 'tabela_notas',            null,                        null,              null,               array['extrajudicial'],   false, 60),
    ('divorcio_consensual',   'registro_sri',          'Registro no SRI',                    'tabela_sri',              null,                        null,              null,               null::text[],             true,  70),
    ('divorcio_consensual',   'certidao_pos_registro', 'Certidão de Imóveis (após registro)','por_unidade',             'certidao_imovel',           null,              'imoveis_registro', null::text[],             true,  75),
    ('divorcio_consensual',   'outros_custos',         'Outros Custos',                      'percentual_sobre',        'outros_custos_percentual',  'custas_registro', null,               null::text[],             false, 80),

    ('divorcio_litigioso',    'honorarios',            'Honorários Advocatícios',            'honorarios',              null,                        null,              null,               null::text[],             false, 10),
    ('divorcio_litigioso',    'certidao_previa',       'Certidão de Imóveis (prévia)',       'por_unidade',             'certidao_imovel',           null,              'certidoes',        null::text[],             false, 30),
    ('divorcio_litigioso',    'custas',                'Custas Processuais',                 'tabela_custas_judiciais', null,                        null,              null,               array['judicial'],        false, 60),
    ('divorcio_litigioso',    'registro_sri',          'Registro no SRI',                    'tabela_sri',              null,                        null,              null,               null::text[],             true,  70),
    ('divorcio_litigioso',    'certidao_pos_registro', 'Certidão de Imóveis (após registro)','por_unidade',             'certidao_imovel',           null,              'imoveis_registro', null::text[],             true,  75),
    ('divorcio_litigioso',    'outros_custos',         'Outros Custos',                      'percentual_sobre',        'outros_custos_percentual',  'custas_registro', null,               null::text[],             false, 80),

    ('alvara_judicial',       'honorarios',            'Honorários Advocatícios',            'honorarios',              null,                        null,              null,               null::text[],             false, 10),
    ('alvara_judicial',       'certidoes_pessoais',    'Certidões Pessoais dos Herdeiros',   'por_unidade',             'certidao_pessoal_herdeiro', null,              'herdeiros',        null::text[],             false, 50),
    ('alvara_judicial',       'custas',                'Custas Processuais',                 'tabela_custas_judiciais', null,                        null,              null,               array['judicial'],        false, 60),
    ('alvara_judicial',       'outros_custos',         'Outros Custos',                      'percentual_sobre',        'outros_custos_percentual',  'custas_registro', null,               null::text[],             false, 80)
  ) as v(servico, chave, nome, tipo_calculo, parametro, base, multiplicador, vias, vinculado_registro, ordem)
    on v.servico = ts.chave;

-- ------------------------------------------------------------
-- Modelo de proposta — Inventário
-- ------------------------------------------------------------
insert into modelos_proposta (nome, tipo_servico_id, texto_abertura, padrao)
select 'Proposta padrão — Inventário', ts.id,
       'Conforme solicitado, apresento a proposta para a realização dos serviços referente ao Inventário de:',
       true
  from tipos_servico ts where ts.chave = 'inventario_consensual';

insert into modelos_proposta_itens (modelo_id, descricao, incluso, ordem)
select m.id, v.descricao, v.incluso, v.ordem
  from modelos_proposta m,
       (values
    ('Honorários Advocatícios',                              true,  10),
    ('Custas Processuais / Extrajudiciais',                  true,  20),
    ('Toda documentação necessária (certidões dos imóveis)', true,  30),
    ('Imposto de Transmissão Causa Mortis e Doação — ITCMD', true,  40),
    ('Registro da Partilha em nome dos herdeiros',           true,  50),
    ('Impostos atrasados (ex.: IPTU / IPVA)',                false, 60),
    ('Transferência de veículos junto ao DETRAN',            false, 70)
       ) as v(descricao, incluso, ordem)
 where m.nome = 'Proposta padrão — Inventário';

-- ------------------------------------------------------------
-- Modelo de proposta — Escritura (sem linha de honorários:
-- eles entram embutidos no valor do serviço)
-- ------------------------------------------------------------
insert into modelos_proposta (nome, tipo_servico_id, texto_abertura, padrao)
select 'Proposta padrão — Escritura', ts.id,
       'Conforme solicitado, apresento a proposta para a realização dos serviços referente à Escritura de:',
       true
  from tipos_servico ts where ts.chave = 'escritura';

insert into modelos_proposta_itens (modelo_id, descricao, incluso, ordem)
select m.id, v.descricao, v.incluso, v.ordem
  from modelos_proposta m,
       (values
    ('Elaboração e lavratura da Escritura Pública',           true,  10),
    ('Custas do Tabelionato de Notas',                        true,  20),
    ('Toda documentação necessária (certidões dos imóveis)',  true,  30),
    ('Imposto de Transmissão de Bens Imóveis — ITBI',         true,  40),
    ('Registro do imóvel em nome do comprador',               true,  50),
    ('Impostos atrasados (ex.: IPTU)',                        false, 60),
    ('Débitos e ônus anteriores à escritura',                 false, 70)
       ) as v(descricao, incluso, ordem)
 where m.nome = 'Proposta padrão — Escritura';
