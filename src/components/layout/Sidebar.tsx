import { Fragment } from 'react';
import {
  LayoutDashboard, ClipboardList, Columns2, Calendar, Flame,
  FileText, Settings, Building2, UserPlus, PanelLeftClose, PanelLeftOpen, X,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ViewName } from '../../types';
import { Logo } from '../ui/Logo';

/* ─── Barra lateral no formato AppShell do orçamento ────────────
   Superfície que acompanha o tema (não é mais a faixa preta),
   recolhe para uma faixa de ícones (estado no localStorage, ver
   AppContext) e vira gaveta abaixo de 1024px. O sair e o tema
   foram para o menu de perfil da barra superior.
─────────────────────────────────────────────────────────────── */

type NavItem = { view: ViewName; label: string; Icon: LucideIcon; adminOnly?: boolean };

const NAV: NavItem[] = [
  { view: 'dashboard',  label: 'Dashboard',  Icon: LayoutDashboard },
  { view: 'pedidos',    label: 'Pedidos',    Icon: ClipboardList },
  { view: 'kanban',     label: 'Kanban',     Icon: Columns2 },
  { view: 'calendario', label: 'Calendário', Icon: Calendar },
  { view: 'urgentes',   label: 'Urgentes',   Icon: Flame },
  { view: 'clientes',   label: 'Clientes',   Icon: Building2 },
  { view: 'relatorios', label: 'Relatórios', Icon: FileText },
  { view: 'contas',     label: 'Contas',     Icon: UserPlus, adminOnly: true },
];

// Rodapé: o que não é trabalho do dia — ajuste da própria conta
const FOOTER_NAV: NavItem[] = [
  { view: 'configuracoes', label: 'Configurações', Icon: Settings },
];

const SECTIONS: Record<string, string> = {
  dashboard:  'Visão Geral',
  calendario: 'Acompanhamento',
  clientes:   'Ferramentas',
};

export function Sidebar() {
  const {
    view, navigate, sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar,
    toggleSidebar, urgentCount, isAdmin,
  } = useApp();

  // Gaveta aberta nunca fica recolhida
  const collapsed = sidebarCollapsed && !mobileSidebarOpen;

  function handleNav(v: ViewName) {
    navigate(v);
    closeMobileSidebar();
  }

  function renderItem({ view: v, label, Icon }: NavItem) {
    return (
      <button
        key={v}
        className={`nav-item${view === v ? ' active' : ''}`}
        onClick={() => handleNav(v)}
        data-tooltip={label}
        aria-label={collapsed ? label : undefined}
        aria-current={view === v ? 'page' : undefined}
      >
        <span className="nav-icon"><Icon size={collapsed ? 18 : 17} strokeWidth={2.1} /></span>
        <span className="nav-label">{label}</span>
        {v === 'urgentes' && urgentCount > 0 && (
          <span className="nav-badge">{urgentCount}</span>
        )}
      </button>
    );
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileSidebarOpen ? ' mobile-open' : ''}`}>
      <div className="sb-head">
        <button
          type="button"
          className="sb-home"
          onClick={() => handleNav('dashboard')}
          aria-label="Wishbone — início"
        >
          <Logo size={collapsed ? 24 : 27} showName={!collapsed} />
        </button>

        {!collapsed && (
          <button
            type="button"
            className="sb-icon-btn sb-collapse"
            onClick={toggleSidebar}
            title="Recolher menu"
            aria-label="Recolher menu"
          >
            <PanelLeftClose size={17} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          type="button"
          className="sb-icon-btn sb-expand"
          onClick={toggleSidebar}
          title="Expandir menu"
          aria-label="Expandir menu"
        >
          <PanelLeftOpen size={17} />
        </button>
      )}

      {/* Só aparece na gaveta do celular */}
      <button
        type="button"
        className="sb-icon-btn sb-close"
        onClick={closeMobileSidebar}
        aria-label="Fechar menu"
      >
        <X size={18} />
      </button>

      <nav className="sb-nav">
        {NAV.filter(item => !item.adminOnly || isAdmin).map(item => (
          <Fragment key={item.view}>
            {SECTIONS[item.view] && <div className="sb-section">{SECTIONS[item.view]}</div>}
            {renderItem(item)}
          </Fragment>
        ))}
      </nav>

      <div className="sb-footer">
        {FOOTER_NAV.map(renderItem)}
      </div>
    </aside>
  );
}
