-- ═══════════════════════════════════════════════════════════════════
-- Wishbone — Migração 2
-- Etapas de produção + timeline por pedido + cadastro de clientes
-- Rodar no SQL Editor do Supabase Studio (seguro rodar mais de uma vez)
-- ═══════════════════════════════════════════════════════════════════

-- 1) Etapa de produção no pedido (vazio = não definida)
alter table pedidos add column if not exists etapa text not null default '';

-- 2) Vínculo da auditoria com o pedido (timeline)
alter table auditoria add column if not exists pedido_id text;
create index if not exists auditoria_pedido_idx on auditoria (pedido_id);

-- 3) Cadastro de clientes
create table if not exists clientes (
  id          text primary key default gen_random_uuid()::text,
  nome        text not null unique,
  whatsapp    text not null default '',
  contato     text not null default '',
  observacoes text not null default '',
  criado_em   timestamptz not null default now()
);

alter table clientes enable row level security;
do $$ begin
  create policy "acesso_total_clientes" on clientes for all using (true) with check (true);
exception when duplicate_object then null; end $$;

-- 4) Opcional: já cadastrar os clientes existentes a partir dos pedidos
insert into clientes (nome)
select distinct cliente from pedidos where cliente <> ''
on conflict (nome) do nothing;
