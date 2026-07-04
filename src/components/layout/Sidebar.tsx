import {
  LayoutDashboard, ClipboardList, Columns2, Calendar, Flame,
  FileText, LogOut, Settings, Building2, type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ViewName } from '../../types';

const NAV: { view: ViewName; label: string; Icon: LucideIcon; adminOnly?: boolean }[] = [
  { view: 'dashboard',     label: 'Dashboard',    Icon: LayoutDashboard },
  { view: 'pedidos',       label: 'Pedidos',      Icon: ClipboardList },
  { view: 'kanban',        label: 'Kanban',       Icon: Columns2 },
  { view: 'calendario',    label: 'Calendário',   Icon: Calendar },
  { view: 'urgentes',      label: 'Urgentes',     Icon: Flame },
  { view: 'clientes',      label: 'Clientes',     Icon: Building2 },
  { view: 'relatorios',    label: 'Relatórios',   Icon: FileText },
  { view: 'configuracoes', label: 'Configurações', Icon: Settings, adminOnly: true },
];

const SECTIONS: Record<string, string> = {
  dashboard:     'Visão Geral',
  calendario:    'Acompanhamento',
  clientes:      'Ferramentas',
  configuracoes: 'Sistema',
};

export function Sidebar() {
  const { view, navigate, sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar, nome, urgentCount, logout, isAdmin } = useApp();

  function handleNav(v: ViewName) {
    navigate(v);
    closeMobileSidebar();
  }

  const visibleNav = NAV.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileSidebarOpen ? ' mobile-open' : ''}`}>
      <div className="sb-brand">
        <div className="sb-logo">
          <img src="/assets/logo-wishbone.svg" alt="Wishbone" />
        </div>
        <div className="sb-brand-text">
          <strong>Wishbone</strong>
          <span>Produção 2026</span>
        </div>
      </div>

      <nav className="sb-nav">
        {visibleNav.map(({ view: v, label, Icon }) => (
          <span key={v}>
            {SECTIONS[v] && <div className="sb-section">{SECTIONS[v]}</div>}
            <button
              className={`nav-item${view === v ? ' active' : ''}`}
              onClick={() => handleNav(v)}
              data-tooltip={label}
            >
              <span className="nav-icon"><Icon size={16} /></span>
              <span className="nav-label">{label}</span>
              {v === 'urgentes' && urgentCount > 0 && (
                <span className="nav-badge">{urgentCount}</span>
              )}
            </button>
          </span>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-user">{nome}</div>
        <button className="sb-logout" onClick={logout} title="Sair">
          <LogOut size={14} />
          <span className="sb-logout-label">Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
