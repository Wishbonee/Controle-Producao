import { Menu, HardDrive, Cloud, Plus, Moon, Sun } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { isSupabaseConfigured } from '../../lib/supabase';

const TITLES: Record<string, string> = {
  dashboard:     'Dashboard',
  pedidos:       'Pedidos',
  kanban:        'Kanban',
  calendario:    'Calendário',
  urgentes:      'Urgentes',
  clientes:      'Clientes',
  relatorios:    'Relatórios',
  configuracoes: 'Configurações',
};

export function Topbar() {
  const { view, toggleSidebar, nome, openModal, theme, toggleTheme } = useApp();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="btn-toggle" onClick={toggleSidebar} title="Menu">
          <Menu size={20} />
        </button>
        <div>
          <div className="page-title">{TITLES[view] ?? view}</div>
        </div>
      </div>
      <div className="top-right">
        <button
          className="btn-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        {isSupabaseConfigured ? (
          <span className="pill pill-ok" title="Dados sincronizados na nuvem">
            <Cloud size={11} style={{ marginRight: 4 }} />
            Online
          </span>
        ) : (
          <span className="pill" title="Dados salvos apenas neste navegador">
            <HardDrive size={11} style={{ marginRight: 4 }} />
            Local
          </span>
        )}
        <span className="pill pill-user">{nome}</span>
        <button className="btn btn-sm btn-primary" onClick={() => openModal('novo')}>
          <Plus size={14} />
          <span className="btn-label">Novo Pedido</span>
        </button>
      </div>
    </header>
  );
}
