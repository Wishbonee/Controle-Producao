'use strict';

/* ══════════════════════════════════════════════
   USUÁRIOS — edite aqui para adicionar acesso
══════════════════════════════════════════════ */
const USERS = {
  admin:    { senha: 'admin123', perfil: 'admin',    nome: 'Gerência Solar' },
  producao: { senha: 'prod123',  perfil: 'producao', nome: 'Equipe de Produção' },
};

/* ══════════════════════════════════════════════
   BANCO LOCAL (localStorage)
══════════════════════════════════════════════ */
const DB_KEY = 'wishbone_pedidos_v2';
const SEED = [
  { id:'001', num:'001', data:'03/01/2026', cliente:'Studio Alpha',    nomePedidoOriginal:'Camiseta Polo',        cor:'Azul Navy',     qtd:120, numeroSistema:'S001', tecnica:'Bordado',     status_producao:'Em Produção', status_pgto:'PAGO',     entrega:'20/01/2026', observacoes:'' },
  { id:'002', num:'002', data:'10/01/2026', cliente:'Moda Urbana',     nomePedidoOriginal:'Regata Dry-Fit',       cor:'Preto',         qtd:60,  numeroSistema:'S002', tecnica:'Silk Screen', status_producao:'Entregue',    status_pgto:'PAGO',     entrega:'25/01/2026', observacoes:'Entregue no prazo' },
  { id:'003', num:'003', data:'15/01/2026', cliente:'Escola Verde',    nomePedidoOriginal:'Uniforme Escolar',     cor:'Verde/Branco',  qtd:200, numeroSistema:'S003', tecnica:'Bordado',     status_producao:'Aguardando',  status_pgto:'PENDENTE', entrega:'05/02/2026', observacoes:'Aguardando aprovação de arte' },
  { id:'004', num:'004', data:'20/01/2026', cliente:'Tech Corp',       nomePedidoOriginal:'Moletom Corporativo',  cor:'Cinza Mescla',  qtd:30,  numeroSistema:'S004', tecnica:'Estampa DTF', status_producao:'Em Produção', status_pgto:'PARCIAL',  entrega:'10/02/2026', observacoes:'Logo nas costas + peito' },
  { id:'005', num:'005', data:'01/02/2026', cliente:'Fitness Center',  nomePedidoOriginal:'Camiseta Esportiva',   cor:'Vermelho',      qtd:80,  numeroSistema:'S005', tecnica:'Silk Screen', status_producao:'ATRASADO',    status_pgto:'PENDENTE', entrega:'15/01/2026', observacoes:'Cliente cobrando' },
  { id:'006', num:'006', data:'10/02/2026', cliente:'Padaria Estrela', nomePedidoOriginal:'Avental',              cor:'Amarelo',       qtd:15,  numeroSistema:'S006', tecnica:'Bordado',     status_producao:'Em Produção', status_pgto:'PAGO',     entrega:'28/02/2026', observacoes:'' },
  { id:'007', num:'007', data:'15/02/2026', cliente:'Clínica Saúde',   nomePedidoOriginal:'Jaleco',               cor:'Branco',        qtd:25,  numeroSistema:'S007', tecnica:'Bordado',     status_producao:'Enviado',     status_pgto:'PAGO',     entrega:'25/02/2026', observacoes:'Enviado via Sedex' },
  { id:'008', num:'008', data:'01/03/2026', cliente:'Academia Fit',    nomePedidoOriginal:'Bermuda Esportiva',    cor:'Azul Royal',    qtd:45,  numeroSistema:'S008', tecnica:'Silk Screen', status_producao:'Em Produção', status_pgto:'PAGO',     entrega:'25/06/2026', observacoes:'' },
  { id:'009', num:'009', data:'05/03/2026', cliente:'Construtora Norte',nomePedidoOriginal:'Colete de Segurança', cor:'Laranja Neon',  qtd:100, numeroSistema:'S009', tecnica:'Bordado',     status_producao:'Aguardando',  status_pgto:'PENDENTE', entrega:'30/06/2026', observacoes:'Aguardando NF' },
];

const DB = {
  getAll()       { try { const r = localStorage.getItem(DB_KEY); return r ? JSON.parse(r) : this._seed(); } catch(_) { return this._seed(); } },
  save(a)        { try { localStorage.setItem(DB_KEY, JSON.stringify(a)); } catch(_) {} },
  _seed()        { const d = JSON.parse(JSON.stringify(SEED)); this.save(d); return d; },
  add(p)         { const a = this.getAll(); a.push(p); this.save(a); },
  update(p)      { const a = this.getAll(); const i = a.findIndex(x => x.id===p.id); if(i>=0) a[i]={...a[i],...p}; this.save(a); },
  remove(id)     { this.save(this.getAll().filter(p => p.id!==id)); },
  setStatus(id,s){ const a = this.getAll(); const p = a.find(x => x.id===id); if(p) p.status_producao=s; this.save(a); },
};

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return new Date(v.setHours(0,0,0,0), v);
  const s = String(v).trim();
  const p = s.includes('/') ? s.split('/') : s.includes('-') ? s.split('-') : null;
  if (!p || p.length!==3) return null;
  return s.includes('/') ? new Date(+p[2],+p[1]-1,+p[0]) : new Date(+p[0],+p[1]-1,+p[2]);
}
function fmtDate(v) {
  const d = toDate(v); if (!d||isNaN(d)) return String(v||'');
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function toInput(s) {
  const d = toDate(s); if (!d||isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function inputToFmt(v) { return v ? fmtDate(new Date(v+'T00:00:00')) : ''; }
function mesExtenso(v) {
  const d = toDate(v); if (!d||isNaN(d)) return '';
  return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][d.getMonth()] + ' ' + d.getFullYear();
}
function calcDias(entrega, status) {
  const st = (status||'').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  if (st==='ENTREGUE'||st==='FINALIZADO') return {status:'Entregue', dias:'Finalizado'};
  const d = toDate(entrega); if (!d||isNaN(d)) return {status:status||'Em Produção', dias:''};
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const diff = Math.floor((d-hoje)/86400000);
  if (diff<0)   return {status:'ATRASADO',            dias:`${Math.abs(diff)} dias atraso`};
  if (diff===0) return {status:status||'Em Produção', dias:'Vence hoje'};
  return {status:status||'Em Produção', dias:`${diff} dias`};
}
function enrich(p) {
  const di = calcDias(p.entrega, p.status_producao);
  const nome = [p.cliente||'', p.nomePedidoOriginal||''].filter(Boolean).join(' — ');
  return { ...p, nome, status:di.status, dias:di.dias, mes:mesExtenso(p.data||p.entrega)||'Sem Data', pgto:p.status_pgto||p.pgto||'PENDENTE', qtd:Number(p.qtd||0), obs:p.observacoes||p.obs||'', tecnica:p.tecnica||p.logo||'' };
}
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function stClass(s) { return ({  'Em Produção':'st-em','ATRASADO':'st-atrasado','Entregue':'st-entregue','Enviado':'st-enviado','Aguardando':'st-aguardando','Cancelado':'st-cancelado'})[s]||'st-em'; }
function pgtoClass(p) { if(!p) return 'badge-gray'; const u=p.toUpperCase(); return u==='PAGO'?'badge-green':u==='PARCIAL'?'badge-yellow':'badge-red'; }
function kBorder(s) { return ({'Em Produção':'k-border-em','ATRASADO':'k-border-atrasado','Entregue':'k-border-entregue','Enviado':'k-border-enviado','Aguardando':'k-border-aguardando','Cancelado':'k-border-cancelado'})[s]||'k-border-em'; }

/* ══════════════════════════════════════════════
   ESTADO
══════════════════════════════════════════════ */
const STATE = {
  usuario:null, perfil:null, nome:null,
  pedidos:[],
  filtro:{ busca:'', status:'', pgto:'', mes:'' },
  view: 'dashboard',
  cal: { year:new Date().getFullYear(), month:new Date().getMonth(), sel:null },
  repFiltro: { status:'', mes:'' },
};
const isAdmin = () => STATE.perfil==='admin';
const isProd  = () => STATE.perfil==='producao';

/* ══════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════ */
function showToast(msg, isErr=false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.toggle('err', isErr);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ══════════════════════════════════════════════
   BUILD APP STRUCTURE
══════════════════════════════════════════════ */
function buildAppUI() {
  document.getElementById('app-screen').innerHTML = `
    <!-- SIDEBAR -->
    <div id="sidebar">
      <div class="sb-brand">
        <div class="sb-logo"><img src="assets/logo-wishbone.svg" alt="Wishbone"></div>
        <div class="sb-brand-text">
          <strong>Wishbone</strong>
          <span>Produção 2026</span>
        </div>
      </div>
      <nav class="sb-nav">
        <div class="sb-section">Visão Geral</div>
        <button class="nav-item active" data-view="dashboard"  onclick="navigate('dashboard')"><span class="nav-icon">📊</span><span class="nav-label"> Dashboard</span></button>
        <button class="nav-item"        data-view="pedidos"    onclick="navigate('pedidos')"><span class="nav-icon">📋</span><span class="nav-label"> Pedidos</span></button>
        <button class="nav-item"        data-view="kanban"     onclick="navigate('kanban')"><span class="nav-icon">🗂</span><span class="nav-label"> Kanban</span></button>
        <div class="sb-section">Acompanhamento</div>
        <button class="nav-item"        data-view="calendario" onclick="navigate('calendario')"><span class="nav-icon">📅</span><span class="nav-label"> Calendário</span></button>
        <button class="nav-item"        data-view="urgentes"   onclick="navigate('urgentes')">
          <span class="nav-icon">🔥</span><span class="nav-label"> Urgentes</span>
          <span class="nav-badge" id="badge-urg" style="display:none">0</span>
        </button>
        <div class="sb-section">Ferramentas</div>
        <button class="nav-item"        data-view="relatorios" onclick="navigate('relatorios')"><span class="nav-icon">📄</span><span class="nav-label"> Relatórios</span></button>
      </nav>
      <div class="sb-footer">
        <div class="sb-user" id="sb-user"></div>
        <button onclick="doLogout()">↩ Sair da conta</button>
      </div>
    </div>

    <!-- APP BODY -->
    <div id="app-body">
      <div class="topbar">
        <div class="topbar-left">
          <button class="btn-toggle-sb" onclick="toggleSidebar()" title="Recolher menu">&#9776;</button>
          <div>
            <div class="page-title" id="page-title">Dashboard</div>
            <div class="page-sub"   id="page-sub"></div>
          </div>
        </div>
        <div class="top-right">
          <span class="pill pill-ok">&#128190; Local</span>
          <span class="pill pill-user" id="pill-user"></span>
          <button class="btn btn-sm btn-primary" id="btn-novo" onclick="openModal('novo')">+ Novo Pedido</button>
        </div>
      </div>
      <div id="view-content"></div>
    </div>

    <!-- MODAL PEDIDO -->
    <div class="modal-overlay" id="modal-pedido">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modal-title">Novo Pedido</h2>
          <button class="close-btn" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field"><label>Nº Pedido</label><input id="m-num" type="text" placeholder="Ex: 010"></div>
          <div class="field"><label>Data do Pedido</label><input id="m-data" type="date"></div>
          <div class="field"><label>Cliente</label><input id="m-cliente" type="text"></div>
          <div class="field"><label>Nome do Pedido</label><input id="m-nome" type="text" placeholder="Ex: Camiseta Polo"></div>
          <div class="field"><label>Quantidade</label><input id="m-qtd" type="number" min="0" placeholder="0"></div>
          <div class="field"><label>Cor / Modelo</label><input id="m-cor" type="text"></div>
          <div class="field"><label>Nº Sistema</label><input id="m-sistema" type="text"></div>
          <div class="field"><label>Técnica</label><input id="m-tecnica" type="text" placeholder="Bordado, Silk Screen, DTF..."></div>
          <div class="field"><label>Status Produção</label>
            <select id="m-status"><option>Em Produção</option><option>Aguardando</option><option>Enviado</option><option>Entregue</option><option>ATRASADO</option><option>Cancelado</option></select>
          </div>
          <div class="field"><label>Pagamento</label>
            <select id="m-pgto"><option>PENDENTE</option><option>PAGO</option><option>PARCIAL</option></select>
          </div>
          <div class="field"><label>Data de Entrega</label><input id="m-entrega" type="date"></div>
          <div class="field" style="grid-column:1/-1"><label>Observações</label><input id="m-obs" type="text"></div>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-primary" id="btn-salvar" onclick="salvarPedido()">Adicionar</button>
        </div>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  `;
  document.getElementById('modal-pedido').addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });
}

function applyProfileRestrictions() {
  if (isProd()) { document.getElementById('btn-novo').style.display='none'; }
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.classList.toggle('collapsed');
}

/* ══════════════════════════════════════════════
   NAVEGAÇÃO
══════════════════════════════════════════════ */
const VIEW_TITLES = { dashboard:'Dashboard', pedidos:'Pedidos', kanban:'Kanban', calendario:'Calendário', urgentes:'Urgentes', relatorios:'Relatórios' };
function navigate(view) {
  STATE.view = view;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.view===view));
  const pt = document.getElementById('page-title');
  if (pt) pt.textContent = VIEW_TITLES[view]||view;
  reloadData();
}

/* ══════════════════════════════════════════════
   LOGIN
══════════════════════════════════════════════ */
function initLogin() {
  const btn = document.getElementById('btn-login');
  const go  = () => {
    const usuario = document.getElementById('user-input').value.trim();
    const senha   = document.getElementById('pass-input').value;
    const err     = document.getElementById('login-error-msg');
    err.textContent = '';
    if (!usuario||!senha) { err.textContent='Preencha usuário e senha.'; return; }
    const u = USERS[usuario];
    if (!u||u.senha!==senha) { err.textContent='Usuário ou senha incorretos.'; return; }
    STATE.usuario=usuario; STATE.perfil=u.perfil; STATE.nome=u.nome;
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app-screen').style.display='flex';
    document.getElementById('pill-user').textContent = u.nome;
    document.getElementById('sb-user').textContent   = u.nome;
    applyProfileRestrictions();
    navigate('dashboard');
  };
  btn.onclick = go;
  ['user-input','pass-input'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if(e.key==='Enter') go(); }));
}

/* ══════════════════════════════════════════════
   DADOS
══════════════════════════════════════════════ */
function reloadData() {
  STATE.pedidos = DB.getAll().map(enrich);
  updateBadge();
  renderView();
}
function updateBadge() {
  const n = STATE.pedidos.filter(p=>p.status==='ATRASADO').length;
  const b = document.getElementById('badge-urg');
  if (b) { b.textContent=n; b.style.display=n>0?'':'none'; }
}
function renderView() {
  switch(STATE.view) {
    case 'dashboard':  renderDashboard();  break;
    case 'pedidos':    renderPedidos();    break;
    case 'kanban':     renderKanban();     break;
    case 'calendario': renderCalendario(); break;
    case 'urgentes':   renderUrgentes();   break;
    case 'relatorios': renderRelatorios(); break;
  }
}

/* ══════════════════════════════════════════════
   SVG CHARTS
══════════════════════════════════════════════ */
function svgDonut(slices, size=150) {
  const r=52, cx=size/2, cy=size/2, circ=2*Math.PI*r;
  const total=slices.reduce((s,x)=>s+x.v,0);
  if (!total) return `<div class="empty-msg">Sem dados</div>`;
  let off=0;
  const paths=slices.filter(s=>s.v>0).map(s=>{
    const dash=(s.v/total)*circ, gap=circ-dash, o=off; off+=dash;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.c}" stroke-width="24"
      stroke-dasharray="${dash.toFixed(1)} ${gap.toFixed(1)}" stroke-dashoffset="${(-o).toFixed(1)}"
      transform="rotate(-90 ${cx} ${cy})"><title>${s.l}: ${s.v}</title></circle>`;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block">
    ${paths}
    <circle cx="${cx}" cy="${cy}" r="28" fill="#fff"/>
    <text x="${cx}" y="${cy-5}" text-anchor="middle" font-size="17" font-weight="900" fill="#111">${total}</text>
    <text x="${cx}" y="${cy+10}" text-anchor="middle" font-size="8" fill="#6b7280" letter-spacing="0.5">TOTAL</text>
  </svg>`;
}
function svgBars(items) {
  if (!items.length) return `<div class="empty-msg">Sem dados</div>`;
  const max=Math.max(...items.map(x=>x.v),1), barW=30, gap=16, H=100;
  const W=items.length*(barW+gap)+gap;
  const bars=items.map((d,i)=>{
    const h=Math.max((d.v/max)*(H-24),d.v>0?4:0), x=gap+i*(barW+gap), y=H-20-h;
    return `<g>
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="5" fill="#F5E400"/>
      <text x="${x+barW/2}" y="${H-4}" text-anchor="middle" font-size="8" fill="#9ca3af" font-weight="600">${esc(d.l)}</text>
      ${d.v>0?`<text x="${x+barW/2}" y="${y-4}" text-anchor="middle" font-size="9" font-weight="800" fill="#111">${d.v}</text>`:''}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block;max-height:${H}px">
    <line x1="0" y1="${H-20}" x2="${W}" y2="${H-20}" stroke="#e5e7eb" stroke-width="1"/>
    ${bars}
  </svg>`;
}

/* ══════════════════════════════════════════════
   VIEW: DASHBOARD
══════════════════════════════════════════════ */
function renderDashboard() {
  const vc     = document.getElementById('view-content');
  const all    = STATE.pedidos;
  const total  = all.length;
  const pecas  = all.reduce((s,p)=>s+(p.qtd||0),0);
  const atras  = all.filter(p=>p.status==='ATRASADO').length;
  const entg   = all.filter(p=>p.status==='Entregue').length;
  const pend   = all.filter(p=>(p.pgto||'').toUpperCase()==='PENDENTE').length;
  const hoje   = new Date(); hoje.setHours(0,0,0,0);
  const em7    = all.filter(p=>{ const d=toDate(p.entrega); if(!d||isNaN(d)) return false; const diff=Math.floor((d-hoje)/86400000); return diff>=0&&diff<=7&&p.status!=='Entregue'&&p.status!=='Cancelado'; }).sort((a,b)=>toDate(a.entrega)-toDate(b.entrega));
  const recentes = [...all].reverse().slice(0,5);

  // Status slices
  const statusGroups = { 'Em Produção':'#fde047','Aguardando':'#fb923c','Enviado':'#60a5fa','Entregue':'#4ade80','ATRASADO':'#f87171','Cancelado':'#9ca3af' };
  const slices = Object.entries(statusGroups).map(([l,c])=>({ l, c, v:all.filter(p=>p.status===l).length })).filter(s=>s.v>0);

  // Meses
  const mesCounts={};
  all.forEach(p=>{ if(p.mes&&p.mes!=='Sem Data') mesCounts[p.mes]=(mesCounts[p.mes]||0)+1; });
  const mesItems=Object.entries(mesCounts).map(([l,v])=>({ l:l.split(' ')[0].slice(0,3), v }));

  const kpiCols = isAdmin() ? 5 : 4;
  const kpiPend = isAdmin() ? `<div class="kpi"><div class="kpi-icon">💳</div><div class="kpi-label">Pgto Pendente</div><div class="kpi-value" style="color:${pend?'#b91c1c':'#166534'}">${pend}</div><div class="kpi-sub">aguardando pagamento</div></div>` : '';

  vc.innerHTML = `
    <!-- KPIs -->
    <div class="kpis" style="grid-template-columns:repeat(${kpiCols},1fr)">
      <div class="kpi"><div class="kpi-icon">📦</div><div class="kpi-label">Total Pedidos</div><div class="kpi-value">${total}</div><div class="kpi-sub">cadastrados</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:100%"></div></div></div>
      <div class="kpi"><div class="kpi-icon">👕</div><div class="kpi-label">Total Peças</div><div class="kpi-value">${pecas.toLocaleString('pt-BR')}</div><div class="kpi-sub">unidades</div></div>
      <div class="kpi"><div class="kpi-icon">🔥</div><div class="kpi-label">Atrasados</div><div class="kpi-value" style="color:${atras?'#b91c1c':'#166534'}">${atras}</div><div class="kpi-sub">pedidos em atraso</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${total?Math.round(atras/total*100):0}%;background:${atras?'#f87171':'#4ade80'}"></div></div></div>
      <div class="kpi"><div class="kpi-icon">✅</div><div class="kpi-label">Entregues</div><div class="kpi-value" style="color:#166534">${entg}</div><div class="kpi-sub">${total?Math.round(entg/total*100):0}% do total</div><div class="kpi-bar"><div class="kpi-bar-fill" style="width:${total?Math.round(entg/total*100):0}%;background:#4ade80"></div></div></div>
      ${kpiPend}
    </div>

    <!-- CHARTS -->
    <div class="dash-row dash-row-2">
      <div class="dash-card">
        <div class="dash-card-header"><h3>Distribuição por Status</h3></div>
        <div class="dash-card-body">
          <div class="chart-wrap">
            ${svgDonut(slices)}
            <div class="chart-legend">
              ${slices.map(s=>`<div class="legend-row"><span class="legend-dot" style="background:${s.c}"></span><span class="legend-label">${s.l}</span><span class="legend-val">${s.v}</span></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="dash-card">
        <div class="dash-card-header"><h3>Pedidos por Mês</h3></div>
        <div class="dash-card-body">${svgBars(mesItems)}</div>
      </div>
    </div>

    <!-- PROXIMAS ENTREGAS + ATIVIDADE -->
    <div class="dash-row dash-row-2-1">
      <div class="dash-card">
        <div class="dash-card-header">
          <h3>📅 Próximas Entregas <small style="font-weight:600;color:var(--muted)">(7 dias)</small></h3>
          <span class="badge badge-yellow">${em7.length} pedido${em7.length!==1?'s':''}</span>
        </div>
        <div class="dash-card-body" style="padding:0 18px">
          ${em7.length ? em7.map(p=>{ const d=toDate(p.entrega); const meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']; return `<div class="delivery-item"><div class="delivery-date-box"><div class="d">${d.getDate()}</div><div class="m">${meses[d.getMonth()]}</div></div><div class="delivery-info"><div class="delivery-nome">${esc(p.nome)}</div><div class="delivery-meta">${esc(p.qtd)} pçs · ${esc(p.tecnica)} · <span class="badge ${stClass(p.status)}" style="padding:1px 7px;font-size:9px">${esc(p.status)}</span></div></div></div>`; }).join('') : '<div class="empty-msg">Nenhuma entrega nos próximos 7 dias 🎉</div>'}
        </div>
      </div>
      <div class="dash-card">
        <div class="dash-card-header"><h3>📈 Resumo Geral</h3></div>
        <div class="dash-card-body" style="padding:0 18px">
          <div class="stat-row"><span>Em Produção</span><strong>${all.filter(p=>p.status==='Em Produção').length}</strong></div>
          <div class="stat-row"><span>Aguardando</span><strong>${all.filter(p=>p.status==='Aguardando').length}</strong></div>
          <div class="stat-row"><span>Enviados</span><strong>${all.filter(p=>p.status==='Enviado').length}</strong></div>
          <div class="stat-row"><span>Atrasados</span><strong style="color:#b91c1c">${atras}</strong></div>
          <div class="stat-row"><span>Entregues</span><strong style="color:#166534">${entg}</strong></div>
          ${isAdmin()?`<div class="stat-row" style="border-top:2px solid #f5f5f5;margin-top:4px;padding-top:10px"><span>Pgto Pendente</span><strong style="color:#b91c1c">${pend}</strong></div>`:''}
          <div class="stat-row"><span>Total Peças</span><strong>${pecas.toLocaleString('pt-BR')}</strong></div>
        </div>
      </div>
    </div>
  `;
}

/* ══════════════════════════════════════════════
   VIEW: PEDIDOS
══════════════════════════════════════════════ */
function renderPedidos() {
  const vc = document.getElementById('view-content');
  vc.innerHTML = `
    <div class="controls-bar">
      <div class="filter-group fg-search"><label>Buscar</label><input type="text" id="f-busca" placeholder="Nº pedido, cliente, nome..." oninput="applyFilter()"></div>
      <div class="filter-group"><label>Status</label>
        <select id="f-status" onchange="applyFilter()">
          <option value="">Todos os status</option>
          <option>Em Produção</option><option>ATRASADO</option><option>Entregue</option>
          <option>Enviado</option><option>Aguardando</option><option>Cancelado</option>
        </select>
      </div>
      ${isAdmin()?`<div class="filter-group" id="group-pgto"><label>Pagamento</label>
        <select id="f-pgto" onchange="applyFilter()">
          <option value="">Todos</option><option>PAGO</option><option>PENDENTE</option><option>PARCIAL</option>
        </select>
      </div>`:''}
      <div class="filter-group filter-actions">
        <button class="btn btn-sm" onclick="clearFilter()">Limpar</button>
        <button class="btn btn-sm" onclick="reloadData()">&#8635;</button>
      </div>
    </div>
    <div class="month-tabs" id="month-tabs"></div>
    <div class="legend">
      <span><span class="dot" style="background:#fef08a"></span>Em Produção</span>
      <span><span class="dot" style="background:#fecdd3"></span>Atrasado</span>
      <span><span class="dot" style="background:#bbf7d0"></span>Entregue</span>
      <span><span class="dot" style="background:#bfdbfe"></span>Enviado</span>
      <span><span class="dot" style="background:#fed7aa"></span>Aguardando</span>
      <span><span class="dot" style="background:#e5e7eb"></span>Cancelado</span>
    </div>
    <div id="table-area"></div>
  `;
  buildMonthTabs();
  renderTable();
}
function buildMonthTabs() {
  const el = document.getElementById('month-tabs');
  if (!el) return;
  const meses = [...new Set(STATE.pedidos.map(p=>p.mes).filter(Boolean))];
  const cur   = STATE.filtro.mes;
  el.innerHTML = `<button class="tab${!cur?' tab-active':''}" onclick="selectTab('')">Todos</button>` +
    meses.map(m=>{
      const atras=STATE.pedidos.filter(p=>p.mes===m&&p.status==='ATRASADO').length;
      const badge=atras?` <span style="background:#fecdd3;color:#9f1239;border-radius:999px;padding:0 6px;font-size:9px">${atras}</span>`:'';
      return `<button class="tab${cur===m?' tab-active':''}" onclick="selectTab('${esc(m)}')">${esc(m)}${badge}</button>`;
    }).join('');
}
function selectTab(mes) { STATE.filtro.mes=mes; buildMonthTabs(); applyFilter(); }
function applyFilter() {
  STATE.filtro.busca  = (document.getElementById('f-busca')?.value||'').toLowerCase();
  STATE.filtro.status = document.getElementById('f-status')?.value||'';
  STATE.filtro.pgto   = document.getElementById('f-pgto')?.value||'';
  renderTable();
}
function clearFilter() {
  ['f-busca','f-status','f-pgto'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  STATE.filtro.mes=''; buildMonthTabs(); applyFilter();
}
function filteredPedidos() {
  const {busca,status,pgto,mes}=STATE.filtro;
  return STATE.pedidos.filter(p=>{
    if(busca  &&![p.num,p.nome,p.cliente,p.cor,p.obs,p.tecnica].join(' ').toLowerCase().includes(busca)) return false;
    if(status &&p.status!==status) return false;
    if(pgto   &&p.pgto!==pgto)     return false;
    if(mes    &&p.mes!==mes)        return false;
    return true;
  });
}
function renderTable() {
  const pedidos   = filteredPedidos();
  const area      = document.getElementById('table-area');
  if (!area) return;
  const showPgto  = isAdmin();
  const showAcoes = isAdmin();
  if (!pedidos.length) { area.innerHTML='<div class="table-card"><div class="empty">Nenhum pedido encontrado.</div></div>'; return; }
  const thead=`<thead><tr>
    <th>Nº</th><th>Data</th><th>Cliente / Pedido</th>
    <th class="center">Qtd</th><th>Cor / Modelo</th><th>Técnica</th>
    ${showPgto?'<th>Pgto</th>':''}<th>Entrega</th><th>Status</th><th>Dias</th><th>Obs</th>
    ${showAcoes?'<th class="center">Ações</th>':''}
  </tr></thead>`;
  const grupos={},ordem=[];
  pedidos.forEach(p=>{ if(!grupos[p.mes]){grupos[p.mes]=[];ordem.push(p.mes);} grupos[p.mes].push(p); });
  let html='';
  ordem.forEach(mes=>{
    const group=grupos[mes];
    let rows='';
    group.forEach(p=>{
      const rc=p.status==='ATRASADO'?'row-red':'';
      const sc=stClass(p.status);
      const opts=['Em Produção','Aguardando','Enviado','Entregue','ATRASADO','Cancelado'].map(o=>`<option value="${esc(o)}"${p.status===o?' selected':''}>${esc(o)}</option>`).join('');
      rows+=`<tr class="${rc}">
        <td><span class="num-pedido">${esc(p.num||p.id)}</span></td>
        <td class="muted">${esc(p.data||'')}</td>
        <td><span class="nome-pedido">${esc(p.nome)}</span></td>
        <td class="center"><strong>${p.qtd||0}</strong></td>
        <td class="muted">${esc(p.cor||'')}</td>
        <td><span class="badge badge-gray">${esc(p.tecnica||'')}</span></td>
        ${showPgto?`<td><span class="badge ${pgtoClass(p.pgto)}">${esc(p.pgto||'PENDENTE')}</span></td>`:''}
        <td class="muted">${esc(p.entrega||'')}</td>
        <td><span class="status-wrap ${sc}"><select class="status-select ${sc}" onchange="changeStatus('${esc(p.id)}',this.value)">${opts}</select></span></td>
        <td class="muted" style="white-space:nowrap">${esc(p.dias||'')}</td>
        <td class="muted">${esc(p.obs||'')}</td>
        ${showAcoes?`<td><div class="actions">
          <button class="btn btn-sm" onclick="openModal('editar','${esc(p.id)}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDelete('${esc(p.id)}')">Excluir</button>
        </div></td>`:''}
      </tr>`;
    });
    html+=`<div class="table-card"><div class="month-header">${esc(mes)}<span class="month-count">${group.length} pedido${group.length!==1?'s':''}</span></div><div class="table-scroll"><table>${thead}<tbody>${rows}</tbody></table></div></div>`;
  });
  area.innerHTML=html;
}

/* ══════════════════════════════════════════════
   VIEW: KANBAN
══════════════════════════════════════════════ */
function renderKanban() {
  const vc = document.getElementById('view-content');
  const cols = [
    { key:'ATRASADO',    label:'🔥 Atrasados', hClass:'kh-atrasado',  bClass:'k-border-atrasado'  },
    { key:'Em Produção', label:'⚙️ Em Produção', hClass:'kh-em',       bClass:'k-border-em'        },
    { key:'Aguardando',  label:'⏳ Aguardando',  hClass:'kh-aguardando',bClass:'k-border-aguardando'},
    { key:'Enviado',     label:'📦 Enviado',     hClass:'kh-enviado',   bClass:'k-border-enviado'   },
    { key:'Entregue',    label:'✅ Entregue',    hClass:'kh-entregue',  bClass:'k-border-entregue'  },
    { key:'Cancelado',   label:'⛔ Cancelado',   hClass:'kh-cancelado', bClass:'k-border-cancelado' },
  ];
  const board = cols.map(col=>{
    const cards = STATE.pedidos.filter(p=>p.status===col.key);
    const cardHTML = cards.length ? cards.map(p=>{
      const meses=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const ed = toDate(p.entrega);
      const edStr = ed&&!isNaN(ed) ? `${ed.getDate()} ${meses[ed.getMonth()]}` : '—';
      const pgtoEl = isAdmin() ? `<span class="badge ${pgtoClass(p.pgto)}" style="font-size:9px">${esc(p.pgto||'PENDENTE')}</span>` : '';
      return `<div class="k-card ${col.bClass}">
        <div class="k-card-num">#${esc(p.num||p.id)}</div>
        <div class="k-card-nome">${esc(p.nome)}</div>
        <div class="k-card-meta">
          <span>👕 ${p.qtd||0} pçs</span>
          <span>📅 ${edStr}</span>
        </div>
        <div class="k-card-foot">
          ${pgtoEl}
          ${isAdmin()?`<button class="btn btn-sm" style="padding:3px 8px;font-size:10px" onclick="openModal('editar','${esc(p.id)}')">Editar</button>`:'<span></span>'}
        </div>
      </div>`;
    }).join('') : `<div class="k-empty">Nenhum</div>`;
    return `<div class="kanban-col">
      <div class="kanban-col-header ${col.hClass}">
        ${col.label}
        <span class="k-col-count">${cards.length}</span>
      </div>
      <div class="kanban-col-body">${cardHTML}</div>
    </div>`;
  }).join('');
  vc.innerHTML = `<div class="kanban-board">${board}</div>`;
}

/* ══════════════════════════════════════════════
   VIEW: CALENDÁRIO
══════════════════════════════════════════════ */
function renderCalendario() {
  const vc  = document.getElementById('view-content');
  const cal = STATE.cal;
  vc.innerHTML = `
    <div class="cal-toolbar">
      <h2 id="cal-mes-title"></h2>
      <div class="cal-toolbar-right">
        <button class="btn btn-sm" onclick="calNav(-1)">&#8592; Anterior</button>
        <button class="btn btn-sm" onclick="calNav(0)">Hoje</button>
        <button class="btn btn-sm" onclick="calNav(1)">Próximo &#8594;</button>
      </div>
    </div>
    <div id="cal-container"></div>
    <div id="cal-detail"></div>
  `;
  buildCal();
}
function calNav(dir) {
  const cal = STATE.cal;
  if (dir===0) { cal.year=new Date().getFullYear(); cal.month=new Date().getMonth(); cal.sel=null; }
  else { cal.month+=dir; if(cal.month>11){cal.month=0;cal.year++;} if(cal.month<0){cal.month=11;cal.year--;} cal.sel=null; }
  buildCal();
}
function buildCal() {
  const cal   = STATE.cal;
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dias  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const title = document.getElementById('cal-mes-title');
  if (title) title.textContent = `${meses[cal.month]} ${cal.year}`;

  const first  = new Date(cal.year, cal.month, 1);
  const last   = new Date(cal.year, cal.month+1, 0);
  const hoje   = new Date(); hoje.setHours(0,0,0,0);
  const startWD = first.getDay();

  // Map deliveries by date key
  const byDate = {};
  STATE.pedidos.forEach(p=>{
    const d = toDate(p.entrega);
    if (!d||isNaN(d)) return;
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDate[k]) byDate[k]=[];
    byDate[k].push(p);
  });

  let cells = dias.map(d=>`<div class="cal-head">${d}</div>`).join('');

  // Empty cells before first
  for(let i=0;i<startWD;i++) cells+=`<div class="cal-cell other"></div>`;

  for(let day=1;day<=last.getDate();day++){
    const k  = `${cal.year}-${cal.month}-${day}`;
    const evs = byDate[k]||[];
    const dt = new Date(cal.year,cal.month,day);
    const isToday = dt.getTime()===hoje.getTime();
    const isSel   = cal.sel&&cal.sel.getTime()===dt.getTime();
    const evHTML  = evs.slice(0,3).map(p=>`<div class="cal-ev ${stClass(p.status)}" onclick="calSelectDay(${cal.year},${cal.month},${day})" title="${esc(p.nome)}">${esc(p.num)} ${esc(p.nomePedidoOriginal||p.nome.split('—')[1]||'')}</div>`).join('') + (evs.length>3?`<div style="font-size:9px;color:var(--muted);margin-top:2px">+${evs.length-3} mais</div>`:'');
    cells+=`<div class="cal-cell${isToday?' today':''}${isSel?' today':''}" onclick="calSelectDay(${cal.year},${cal.month},${day})">
      <div class="cal-num">${day}</div>
      ${evHTML}
    </div>`;
  }

  const remaining = 7-(last.getDay()+1)%7;
  if(remaining<7) for(let i=0;i<remaining;i++) cells+=`<div class="cal-cell other"></div>`;

  const container = document.getElementById('cal-container');
  if (container) container.innerHTML=`<div class="cal-grid">${cells}</div>`;

  // Show selected day detail
  if (cal.sel) {
    const sk = `${cal.sel.getFullYear()}-${cal.sel.getMonth()}-${cal.sel.getDate()}`;
    const evs = byDate[sk]||[];
    const det = document.getElementById('cal-detail');
    if (det) {
      det.innerHTML = evs.length ? `<div class="cal-detail-panel">
        <h4>Entregas em ${fmtDate(cal.sel)}</h4>
        ${evs.map(p=>`<div class="cal-detail-row">
          <span class="num">#${esc(p.num||p.id)}</span>
          <span style="flex:1;font-weight:700">${esc(p.nome)}</span>
          <span class="badge badge-gray" style="font-size:9px">${esc(p.tecnica||'')}</span>
          <span class="status-wrap ${stClass(p.status)}" style="padding:2px 8px;font-size:10px">${esc(p.status)}</span>
          ${isAdmin()?`<button class="btn btn-sm" style="font-size:10px" onclick="openModal('editar','${esc(p.id)}')">Editar</button>`:''}
        </div>`).join('')}
      </div>` : `<div class="cal-detail-panel"><div class="empty-msg">Nenhuma entrega neste dia.</div></div>`;
    }
  }
}
function calSelectDay(y,m,d) {
  const nd = new Date(y,m,d);
  STATE.cal.sel = STATE.cal.sel&&STATE.cal.sel.getTime()===nd.getTime() ? null : nd;
  buildCal();
}

/* ══════════════════════════════════════════════
   VIEW: URGENTES
══════════════════════════════════════════════ */
function renderUrgentes() {
  const vc   = document.getElementById('view-content');
  const atrs = STATE.pedidos.filter(p=>p.status==='ATRASADO').sort((a,b)=>{
    const da=toDate(a.entrega), db=toDate(b.entrega);
    return (da&&db) ? da-db : 0;
  });
  const cards = atrs.map(p=>{
    const d    = toDate(p.entrega);
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const dias = d&&!isNaN(d) ? Math.abs(Math.floor((d-hoje)/86400000)) : '?';
    return `<div class="urgent-card">
      <div class="urgent-days"><div class="dn">${dias}</div><div class="dl">dias</div></div>
      <div class="urgent-info">
        <div class="urgent-nome">${esc(p.nome)}</div>
        <div class="urgent-meta">📅 Entrega prevista: ${esc(p.entrega||'—')} &nbsp;·&nbsp; 👕 ${p.qtd||0} peças &nbsp;·&nbsp; ${esc(p.tecnica||'')}${isAdmin()?` &nbsp;·&nbsp; 💳 ${esc(p.pgto||'PENDENTE')}`:''}
        </div>
        ${p.obs?`<div class="urgent-meta" style="margin-top:3px;color:#b91c1c">📌 ${esc(p.obs)}</div>`:''}
      </div>
      <div class="urgent-acts">
        <button class="btn btn-sm btn-green" onclick="marcarEntregue('${esc(p.id)}')">✓ Entregue</button>
        ${isAdmin()?`<button class="btn btn-sm" onclick="openModal('editar','${esc(p.id)}')">Editar</button>`:''}
      </div>
    </div>`;
  }).join('');
  vc.innerHTML=`
    <div class="urgentes-header">
      <div class="info"><h2>Pedidos em Atraso</h2><p>Atenção imediata necessária — ordenados por data de entrega</p></div>
      <div class="urgentes-count">${atrs.length}</div>
    </div>
    ${atrs.length ? cards : '<div class="dash-card"><div class="empty-msg" style="padding:60px">🎉 Nenhum pedido em atraso!</div></div>'}
  `;
}
function marcarEntregue(id) {
  DB.setStatus(id,'Entregue');
  showToast('Pedido marcado como Entregue!');
  reloadData();
}

/* ══════════════════════════════════════════════
   VIEW: RELATÓRIOS
══════════════════════════════════════════════ */
function renderRelatorios() {
  const vc  = document.getElementById('view-content');
  const all = STATE.pedidos;
  const meses=[...new Set(all.map(p=>p.mes).filter(Boolean))];
  const total=all.length, pecas=all.reduce((s,p)=>s+(p.qtd||0),0);
  const atrs=all.filter(p=>p.status==='ATRASADO').length;
  const entg=all.filter(p=>p.status==='Entregue').length;
  const pend=isAdmin()?all.filter(p=>(p.pgto||'').toUpperCase()==='PENDENTE').length:null;

  vc.innerHTML=`
    <div class="rep-card">
      <h3>📄 Exportar Relatório em PDF</h3>
      <p>Gera um relatório formatado em nova janela, pronto para imprimir ou salvar como PDF.</p>
      <div class="rep-filters">
        <div class="filter-group"><label>Mês</label>
          <select id="rep-mes" onchange="updateRepStats()">
            <option value="">Todos os meses</option>
            ${meses.map(m=>`<option value="${esc(m)}">${esc(m)}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group"><label>Status</label>
          <select id="rep-status" onchange="updateRepStats()">
            <option value="">Todos os status</option>
            <option>Em Produção</option><option>ATRASADO</option><option>Entregue</option>
            <option>Enviado</option><option>Aguardando</option><option>Cancelado</option>
          </select>
        </div>
      </div>
      <div class="rep-stats" id="rep-stats"></div>
      <div style="margin-top:16px">
        <div class="rep-actions">
          <button class="rep-btn rep-btn-pdf" onclick="gerarPDF()">📄 Gerar PDF</button>
          <button class="rep-btn rep-btn-csv" onclick="exportarCSV()">📊 Exportar CSV</button>
        </div>
      </div>
    </div>

    <div class="rep-card">
      <h3>📋 Dados do Sistema</h3>
      <p>Informações gerais sobre o banco de dados local.</p>
      <div class="rep-stats">
        <div class="rep-stat"><div class="v">${total}</div><div class="l">Total Pedidos</div></div>
        <div class="rep-stat"><div class="v">${pecas.toLocaleString('pt-BR')}</div><div class="l">Total Peças</div></div>
        <div class="rep-stat"><div class="v" style="color:${atrs?'#b91c1c':'#166534'}">${atrs}</div><div class="l">Atrasados</div></div>
        <div class="rep-stat"><div class="v" style="color:#166534">${entg}</div><div class="l">Entregues</div></div>
      </div>
    </div>
  `;
  updateRepStats();
}
function getRepFiltered() {
  const mes    = document.getElementById('rep-mes')?.value||'';
  const status = document.getElementById('rep-status')?.value||'';
  return STATE.pedidos.filter(p=>(!mes||p.mes===mes)&&(!status||p.status===status));
}
function updateRepStats() {
  const pedidos = getRepFiltered();
  const total   = pedidos.length;
  const pecas   = pedidos.reduce((s,p)=>s+(p.qtd||0),0);
  const atrs    = pedidos.filter(p=>p.status==='ATRASADO').length;
  const entg    = pedidos.filter(p=>p.status==='Entregue').length;
  const el = document.getElementById('rep-stats');
  if (el) el.innerHTML=`
    <div class="rep-stat"><div class="v">${total}</div><div class="l">Pedidos</div></div>
    <div class="rep-stat"><div class="v">${pecas.toLocaleString('pt-BR')}</div><div class="l">Peças</div></div>
    <div class="rep-stat"><div class="v" style="color:${atrs?'#b91c1c':'#166534'}">${atrs}</div><div class="l">Atrasados</div></div>
    <div class="rep-stat"><div class="v" style="color:#166534">${entg}</div><div class="l">Entregues</div></div>
  `;
}

/* ══════════════════════════════════════════════
   AÇÕES: STATUS / EXCLUIR
══════════════════════════════════════════════ */
function changeStatus(id, novoStatus) {
  DB.setStatus(id, novoStatus);
  const p = STATE.pedidos.find(x=>x.id===id);
  if (p) { const di=calcDias(p.entrega,novoStatus); p.status_producao=novoStatus; p.status=di.status; p.dias=di.dias; }
  updateBadge();
  showToast('Status atualizado!');
  renderTable();
}
function confirmDelete(id) {
  const p = STATE.pedidos.find(x=>x.id===id);
  if (!confirm(`Excluir:\n"${p?p.nome:id}"\n\nEsta ação não pode ser desfeita.`)) return;
  DB.remove(id);
  showToast('Pedido excluído.');
  reloadData();
}

/* ══════════════════════════════════════════════
   MODAL PEDIDO
══════════════════════════════════════════════ */
let _mode='novo', _eid=null;
function openModal(mode, id) {
  _mode=mode; _eid=id||null;
  document.getElementById('modal-title').textContent = mode==='novo'?'Novo Pedido':'Editar Pedido';
  document.getElementById('btn-salvar').textContent  = mode==='novo'?'Adicionar':'Salvar';
  document.getElementById('m-num').disabled          = mode==='editar';
  if (mode==='editar'&&id) {
    const p=STATE.pedidos.find(x=>x.id===id); if(!p) return;
    document.getElementById('m-num').value     = p.num||p.id||'';
    document.getElementById('m-data').value    = toInput(p.data);
    document.getElementById('m-cliente').value = p.cliente||'';
    document.getElementById('m-nome').value    = p.nomePedidoOriginal||'';
    document.getElementById('m-qtd').value     = p.qtd||0;
    document.getElementById('m-cor').value     = p.cor||'';
    document.getElementById('m-sistema').value = p.numeroSistema||'';
    document.getElementById('m-tecnica').value = p.tecnica||'';
    document.getElementById('m-status').value  = p.status_producao||'Em Produção';
    document.getElementById('m-pgto').value    = p.pgto||'PENDENTE';
    document.getElementById('m-entrega').value = toInput(p.entrega);
    document.getElementById('m-obs').value     = p.obs||'';
  } else {
    ['m-num','m-cliente','m-nome','m-cor','m-sistema','m-tecnica','m-obs'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('m-qtd').value=''; document.getElementById('m-data').value=new Date().toISOString().split('T')[0];
    document.getElementById('m-status').value='Em Produção'; document.getElementById('m-pgto').value='PENDENTE'; document.getElementById('m-entrega').value='';
  }
  document.getElementById('modal-pedido').classList.add('open');
}
function closeModal() { document.getElementById('modal-pedido').classList.remove('open'); }
function salvarPedido() {
  const num=document.getElementById('m-num').value.trim();
  if (!num) { showToast('Nº Pedido é obrigatório.', true); return; }
  const qtd=Number(document.getElementById('m-qtd').value)||0;
  const pedido={
    id:_eid||num, num,
    data:               inputToFmt(document.getElementById('m-data').value),
    cliente:            document.getElementById('m-cliente').value.trim(),
    nomePedidoOriginal: document.getElementById('m-nome').value.trim(),
    qtd, quantidade:qtd,
    cor:                document.getElementById('m-cor').value.trim(),
    numeroSistema:      document.getElementById('m-sistema').value.trim(),
    tecnica:            document.getElementById('m-tecnica').value.trim(),
    logo:               document.getElementById('m-tecnica').value.trim(),
    status_producao:    document.getElementById('m-status').value,
    status_pgto:        document.getElementById('m-pgto').value,
    pgto:               document.getElementById('m-pgto').value,
    entrega:            inputToFmt(document.getElementById('m-entrega').value),
    obs:                document.getElementById('m-obs').value.trim(),
    observacoes:        document.getElementById('m-obs').value.trim(),
  };
  if (_mode==='novo') {
    if (DB.getAll().find(p=>p.id===num)) { showToast('Nº Pedido já existe.', true); return; }
    DB.add(pedido); showToast('Pedido adicionado!');
  } else { DB.update(pedido); showToast('Pedido atualizado!'); }
  closeModal(); reloadData();
}

/* ══════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════ */
function doLogout() {
  Object.assign(STATE, {usuario:null,perfil:null,nome:null,pedidos:[],filtro:{busca:'',status:'',pgto:'',mes:''},view:'dashboard'});
  document.getElementById('app-screen').style.display   = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  ['user-input','pass-input'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('login-error-msg').textContent='';
}

/* ══════════════════════════════════════════════
   EXPORTAR CSV
══════════════════════════════════════════════ */
function exportarCSV() {
  const pedidos  = STATE.view==='relatorios' ? getRepFiltered() : filteredPedidos();
  const showPgto = isAdmin();
  const sep=';';
  const cab=['Nº Pedido','Data','Cliente','Nome do Pedido','Qtd','Cor/Modelo','Técnica',...(showPgto?['Pagamento']:[]),'Entrega','Status','Dias','Observações'];
  const linhas=pedidos.map(p=>[p.num||p.id,p.data||'',p.cliente||'',p.nomePedidoOriginal||'',p.qtd||0,p.cor||'',p.tecnica||'',...(showPgto?[p.pgto||'PENDENTE']:[]),p.entrega||'',p.status||'',p.dias||'',p.obs||''].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(sep));
  const blob=new Blob(['﻿'+[cab.join(sep),...linhas].join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob),download:`wishbone-${new Date().toISOString().slice(0,10)}.csv`});
  a.click(); URL.revokeObjectURL(a.href);
  showToast('CSV exportado!');
}

/* ══════════════════════════════════════════════
   GERAR PDF (nova janela)
══════════════════════════════════════════════ */
function gerarPDF() {
  const pedidos  = STATE.view==='relatorios' ? getRepFiltered() : filteredPedidos();
  const showPgto = isAdmin();
  const now      = new Date().toLocaleString('pt-BR');
  const pecas    = pedidos.reduce((s,p)=>s+(p.qtd||0),0);
  const atrs     = pedidos.filter(p=>p.status==='ATRASADO').length;
  const entg     = pedidos.filter(p=>p.status==='Entregue').length;
  const pend     = pedidos.filter(p=>(p.pgto||'').toUpperCase()==='PENDENTE').length;
  const grupos={}, ordem=[];
  pedidos.forEach(p=>{ if(!grupos[p.mes]){grupos[p.mes]=[];ordem.push(p.mes);} grupos[p.mes].push(p); });
  let rows='';
  ordem.forEach(mes=>{
    rows+=`<tr><td colspan="${showPgto?9:8}" style="background:#111;color:#fff;font-weight:900;padding:8px 10px;font-size:9px;text-transform:uppercase;letter-spacing:.5px;border-top:3px solid #F5E400">${esc(mes)} — ${grupos[mes].length} pedido${grupos[mes].length!==1?'s':''}</td></tr>`;
    grupos[mes].forEach(p=>{
      const bg=p.status==='ATRASADO'?'#fff1f2':p.status==='Entregue'?'#f0fdf4':'#fff';
      const sc=p.status==='ATRASADO'?'#b91c1c':p.status==='Entregue'?'#166534':'#854d0e';
      const pc=p.pgto==='PAGO'?'#166534':p.pgto==='PARCIAL'?'#854d0e':'#b91c1c';
      rows+=`<tr style="background:${bg}">
        <td style="font-family:monospace;font-weight:900">${esc(p.num||p.id)}</td>
        <td>${esc(p.data||'')}</td><td><strong>${esc(p.nome)}</strong></td>
        <td style="text-align:center"><strong>${p.qtd||0}</strong></td>
        <td>${esc(p.cor||'')}</td><td>${esc(p.tecnica||'')}</td>
        ${showPgto?`<td style="font-weight:700;color:${pc}">${esc(p.pgto||'PENDENTE')}</td>`:''}
        <td>${esc(p.entrega||'')}</td>
        <td style="font-weight:800;color:${sc}">${esc(p.status||'')}</td>
      </tr>`;
    });
  });
  const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Wishbone — Relatório</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;font-size:11px;color:#111;padding:28px}
    .hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid #F5E400}
    .logo{display:flex;align-items:center;gap:10px}.lb{width:40px;height:40px;background:#F5E400;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:19px;flex-shrink:0}
    .bt h1{font-size:18px;font-weight:900}.bt p{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-top:1px}
    .mt{text-align:right;color:#6b7280;font-size:9px;line-height:1.8}.mt strong{display:block;font-size:12px;color:#111;font-weight:900;margin-bottom:3px}
    .kpis{display:flex;gap:10px;margin-bottom:16px}
    .kpi{flex:1;border:1px solid #e5e7eb;border-radius:9px;padding:10px 12px;position:relative;overflow:hidden}
    .kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:#F5E400}
    .kl{font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin-bottom:5px}
    .kv{font-size:20px;font-weight:900}
    table{width:100%;border-collapse:collapse}
    th{background:#111;color:#fff;text-align:left;padding:7px 9px;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}
    td{padding:6px 9px;border-bottom:1px solid #f0f0f0;font-size:9px;vertical-align:middle}
    .ft{margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:8px}
    @media print{@page{margin:1cm}th,tr{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="hd"><div class="logo"><div class="lb">W</div><div class="bt"><h1>Wishbone</h1><p>Controle de Produção 2026</p></div></div>
  <div class="mt"><strong>Relatório de Pedidos</strong>Emitido em: ${now}</div></div>
  <div class="kpis">
    <div class="kpi"><div class="kl">Total Pedidos</div><div class="kv">${pedidos.length}</div></div>
    <div class="kpi"><div class="kl">Total Peças</div><div class="kv">${pecas.toLocaleString('pt-BR')}</div></div>
    <div class="kpi"><div class="kl">Atrasados</div><div class="kv" style="color:${atrs?'#b91c1c':'#166534'}">${atrs}</div></div>
    <div class="kpi"><div class="kl">Entregues</div><div class="kv" style="color:#166534">${entg}</div></div>
    ${showPgto?`<div class="kpi"><div class="kl">Pgto Pendente</div><div class="kv" style="color:${pend?'#b91c1c':'#166534'}">${pend}</div></div>`:''}
  </div>
  <table><thead><tr>
    <th>Nº</th><th>Data</th><th>Cliente / Pedido</th><th>Qtd</th><th>Cor/Modelo</th><th>Técnica</th>
    ${showPgto?'<th>Pgto</th>':''}<th>Entrega</th><th>Status</th>
  </tr></thead><tbody>${rows}</tbody></table>
  <div class="ft">Wishbone — Sistema de Controle de Produção 2026 &bull; ${now}</div>
  <script>window.onload=function(){window.print()};<\/script>
  </body></html>`;
  const win=window.open('','_blank');
  if (!win) { showToast('Permita pop-ups para exportar PDF.', true); return; }
  win.document.write(html); win.document.close();
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  buildAppUI();
  initLogin();
});
