-- ═══════════════════════════════════════════════════════════════════
-- Wishbone — Dados mockados para testes
-- Rodar no SQL Editor do Supabase Studio
-- Datas pensadas para hoje = 03/07/2026:
--   · atrasados (entrega no passado, não entregue)
--   · urgentes (entrega nos próximos 3 dias)
--   · em produção, aguardando, enviados, entregues e cancelado
-- Para limpar depois: delete from pedidos where id like 'mock%';
-- ═══════════════════════════════════════════════════════════════════

insert into pedidos (id, num, data, cliente, "nomePedidoOriginal", cor, qtd, "numeroSistema", tecnica, status_producao, status_pgto, entrega, observacoes) values
  -- ── Entregues (histórico, alimenta gráfico mensal e ranking) ──
  ('mock01', '010', '10/02/2026', 'Academia FitPower',        'Boné Snapback',      'Preto Aba Preta',     100, 'W010', 'Bordado 3D',        'Entregue',    'PAGO',     '28/02/2026', 'Cliente recorrente'),
  ('mock02', '011', '18/02/2026', 'Barbearia Navalha de Ouro','Boné Dad Hat',       'Preto/Dourado',        45, 'W011', 'Bordado',           'Entregue',    'PAGO',     '10/03/2026', ''),
  ('mock03', '012', '02/03/2026', 'Time Atlético FC',         'Boné Baseball',      'Vermelho/Branco',      80, 'W012', 'Bordado',           'Entregue',    'PAGO',     '20/03/2026', 'Segunda remessa do uniforme'),
  ('mock04', '013', '15/03/2026', 'Igreja Vida Nova',         'Boné Dad Hat',       'Azul Marinho',        150, 'W013', 'Silk Screen',       'Entregue',    'PAGO',     '05/04/2026', 'Evento de jovens'),
  ('mock05', '014', '28/03/2026', 'Petshop Aumigo',           'Boné Trucker',       'Verde/Malha Branca',   35, 'W014', 'Patch Emborrachado','Entregue',    'PARCIAL',  '15/04/2026', 'Restante na retirada'),
  ('mock06', '015', '08/04/2026', 'Festival Sons do Norte',   'Bucket Hat',         'Tie-Dye Multicolor',  200, 'W015', 'Sublimação',        'Entregue',    'PAGO',     '30/04/2026', 'Edição 2026'),
  ('mock07', '016', '20/04/2026', 'Construtora Nordeste',     'Boné Militar',       'Laranja Neon',        120, 'W016', 'Bordado',           'Entregue',    'PAGO',     '12/05/2026', 'EPI com logo'),
  ('mock08', '017', '05/05/2026', 'Hamburgueria Brasa',       'Boné Trucker',       'Preto/Vermelho',       60, 'W017', 'Bordado 3D',        'Entregue',    'PAGO',     '25/05/2026', ''),
  ('mock09', '018', '18/05/2026', 'Colégio Horizonte',        'Viseira Esportiva',  'Branco/Azul',          90, 'W018', 'Silk Screen',       'Entregue',    'PENDENTE', '08/06/2026', 'Aguardando NF da escola'),

  -- ── ATRASADOS (entrega passou e não foi entregue) ──
  ('mock10', '019', '25/05/2026', 'StreetWear Store',         'Boné Snapback',      'Preto Total',          75, 'W019', 'Patch Emborrachado','Em Produção', 'PENDENTE', '22/06/2026', 'Cliente cobrando entrega!'),
  ('mock11', '020', '01/06/2026', 'Distribuidora Sertão',     'Boné Baseball',      'Amarelo/Preto',        50, 'W020', 'Bordado',           'Em Produção', 'PARCIAL',  '28/06/2026', 'Linha de brindes'),
  ('mock12', '021', '05/06/2026', 'Pizzaria Forno a Lenha',   'Boné Dad Hat',       'Vermelho Escuro',      40, 'W021', 'Bordado',           'Aguardando',  'PENDENTE', '30/06/2026', 'Arte ainda não aprovada'),

  -- ── URGENTES (vencem hoje ou nos próximos 3 dias) ──
  ('mock13', '022', '08/06/2026', 'Pousada Sol & Mar',        'Viseira Esportiva',  'Azul Royal',           40, 'W022', 'Bordado 3D',        'Em Produção', 'PAGO',     '03/07/2026', 'Vence HOJE — priorizar'),
  ('mock14', '023', '10/06/2026', 'Corrida Rustica 10K',      'Boné Dry-Fit',       'Verde Limão',         300, 'W023', 'Sublimação',        'Em Produção', 'PAGO',     '04/07/2026', 'Kit atleta do evento'),
  ('mock15', '024', '12/06/2026', 'Cervejaria Mandacaru',     'Boné Trucker',       'Caramelo/Bege',        65, 'W024', 'Patch Emborrachado','Em Produção', 'PARCIAL',  '05/07/2026', 'Lançamento da IPA nova'),
  ('mock16', '025', '14/06/2026', 'Auto Center Turbo',        'Boné Snapback',      'Cinza/Preto',          55, 'W025', 'Bordado',           'Aguardando',  'PENDENTE', '06/07/2026', 'Aguardando pagamento para iniciar'),

  -- ── Em produção (prazo confortável) ──
  ('mock17', '026', '15/06/2026', 'Tech Corp Brasil',         'Boné Snapback',      'Preto Total',         200, 'W026', 'Patch Emborrachado','Em Produção', 'PAGO',     '20/07/2026', 'Onboarding de funcionários'),
  ('mock18', '027', '18/06/2026', 'Sorveteria Gelato',        'Boné Dad Hat',       'Rosa Pastel',          30, 'W027', 'Bordado',           'Em Produção', 'PAGO',     '25/07/2026', 'Arte com sorvete estilizado'),
  ('mock19', '028', '20/06/2026', 'Escola Municipal Verde',   'Boné Dad Hat',       'Verde/Branco',        180, 'W028', 'Silk Screen',       'Em Produção', 'PENDENTE', '01/08/2026', 'Projeto ambiental'),
  ('mock20', '029', '22/06/2026', 'Clínica Sorriso Já',       'Boné Baseball',      'Branco/Azul Claro',    25, 'W029', 'Bordado',           'Em Produção', 'PAGO',     '05/08/2026', ''),

  -- ── Aguardando ──
  ('mock21', '030', '25/06/2026', 'Banda Forró Elétrico',     'Bucket Hat',         'Preto/Amarelo',       110, 'W030', 'Sublimação',        'Aguardando',  'PENDENTE', '10/08/2026', 'Aguardando aprovação da arte'),
  ('mock22', '031', '28/06/2026', 'Mercadinho São José',      'Boné Dad Hat',       'Azul/Branco',          70, 'W031', 'Silk Screen',       'Aguardando',  'PENDENTE', '15/08/2026', 'Orçamento aprovado, falta sinal'),

  -- ── Enviados ──
  ('mock23', '032', '10/06/2026', 'Agropecuária Boi Forte',   'Boné Country',       'Marrom Couro',         85, 'W032', 'Bordado 3D',        'Enviado',     'PAGO',     '08/07/2026', 'Enviado via transportadora'),
  ('mock24', '033', '12/06/2026', 'Studio Tattoo Ink',        'Boné Snapback',      'Preto/Roxo',           35, 'W033', 'Bordado',           'Enviado',     'PAGO',     '07/07/2026', 'Sedex — rastreio BR123456789'),

  -- ── Cancelado ──
  ('mock25', '034', '20/06/2026', 'Loja Ponto Certo',         'Boné Trucker',       'Azul/Branco',          50, 'W034', 'Silk Screen',       'Cancelado',   'PENDENTE', '30/07/2026', 'Cliente desistiu — arte reprovada 2x')
on conflict (id) do nothing;
