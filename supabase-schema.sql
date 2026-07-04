-- ═══════════════════════════════════════════════════════════════════
-- Wishbone — Controle de Produção
-- Schema Supabase (rodar no SQL Editor do Supabase Studio)
-- ═══════════════════════════════════════════════════════════════════

-- ─── Tabela: usuarios ────────────────────────────────────────────────
create table if not exists usuarios (
  id        text primary key default gen_random_uuid()::text,
  login     text not null unique,
  senha     text not null,
  nome      text not null,
  perfil    text not null check (perfil in ('admin', 'producao')),
  ativo     boolean not null default true,
  criado_em timestamptz not null default now()
);

-- ─── Tabela: pedidos ─────────────────────────────────────────────────
-- Datas ficam como text (dd/mm/aaaa), igual ao formato usado no app.
create table if not exists pedidos (
  id                   text primary key,
  num                  text not null,
  data                 text not null default '',
  cliente              text not null default '',
  "nomePedidoOriginal" text not null default '',
  cor                  text not null default '',
  qtd                  integer not null default 0,
  "numeroSistema"      text not null default '',
  tecnica              text not null default '',
  status_producao      text not null default 'Aguardando',
  status_pgto          text not null default 'PENDENTE',
  entrega              text not null default '',
  observacoes          text not null default '',
  criado_em            timestamptz not null default now()
);

-- ─── Tabela: auditoria ───────────────────────────────────────────────
create table if not exists auditoria (
  id             text primary key,
  ts             timestamptz not null default now(),
  usuario        text not null,
  nome_usuario   text not null,
  acao           text not null,
  entidade_label text not null,
  detalhes       text
);

create index if not exists auditoria_ts_idx on auditoria (ts desc);

-- ─── RLS (acesso liberado para a chave anon; o app controla login) ──
alter table usuarios  enable row level security;
alter table pedidos   enable row level security;
alter table auditoria enable row level security;

create policy "acesso_total_usuarios"  on usuarios  for all using (true) with check (true);
create policy "acesso_total_pedidos"   on pedidos   for all using (true) with check (true);
create policy "acesso_total_auditoria" on auditoria for all using (true) with check (true);

-- ─── Usuários padrão (troque as senhas depois, em Configurações) ────
insert into usuarios (login, senha, nome, perfil, ativo) values
  ('admin',    'admin123', 'Gerência Solar',     'admin',    true),
  ('producao', 'prod123',  'Equipe de Produção', 'producao', true)
on conflict (login) do nothing;

-- ─── OPCIONAL: pedidos de demonstração (descomente se quiser) ───────
-- insert into pedidos (id, num, data, cliente, "nomePedidoOriginal", cor, qtd, "numeroSistema", tecnica, status_producao, status_pgto, entrega, observacoes) values
--   ('001', '001', '03/01/2026', 'Academia FitPower',     'Boné Snapback',     'Preto Aba Preta',    100, 'W001', 'Bordado 3D',         'Em Produção', 'PAGO',     '20/01/2026', ''),
--   ('002', '002', '10/01/2026', 'Time Atlético FC',      'Boné Baseball',     'Vermelho/Branco',    50,  'W002', 'Bordado',            'Entregue',    'PAGO',     '25/01/2026', 'Entregue no prazo'),
--   ('003', '003', '15/01/2026', 'Escola Municipal Verde','Boné Dad Hat',      'Verde/Branco',       180, 'W003', 'Silk Screen',        'Aguardando',  'PENDENTE', '05/02/2026', 'Aguardando aprovação da arte')
-- on conflict (id) do nothing;
