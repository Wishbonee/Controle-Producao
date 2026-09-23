import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../contexts/AppContext';
import { ViewName } from '../../types';
import { Dashboard } from '../views/Dashboard';
import { Pedidos } from '../views/Pedidos';
import { Kanban } from '../views/Kanban';
import { Calendario } from '../views/Calendario';
import { Urgentes } from '../views/Urgentes';
import { Clientes } from '../views/Clientes';
import { Relatorios } from '../views/Relatorios';
import { Configuracoes } from '../views/Configuracoes';
import { Contas } from '../views/Contas';

/* Título e descrição de cada tela: saem uma vez só, no cabeçalho
   da página (a barra superior não repete o título). */
const PAGES: Record<ViewName, { title: string; description: string }> = {
  dashboard:     { title: 'Dashboard',     description: 'Visão geral da produção, entregas e clientes.' },
  pedidos:       { title: 'Pedidos',       description: 'Todos os pedidos, agrupados por mês de entrada.' },
  kanban:        { title: 'Kanban',        description: 'Arraste os cartões entre as colunas para mudar o status.' },
  calendario:    { title: 'Calendário',    description: 'Entregas previstas dia a dia.' },
  urgentes:      { title: 'Urgentes',      description: 'Pedidos atrasados e com entrega em até 3 dias.' },
  clientes:      { title: 'Clientes',      description: 'Cadastro de clientes usado no autocomplete dos pedidos.' },
  relatorios:    { title: 'Relatórios',    description: 'Filtre por período, cliente e status e exporte em PDF ou CSV.' },
  contas:        { title: 'Contas',        description: 'Quem entra no sistema, com qual perfil, e o log de auditoria.' },
  configuracoes: { title: 'Configurações', description: 'Sua conta, aparência e senha.' },
};

function ViewSkeleton() {
  return (
    <div className="skeleton-view" aria-busy="true" aria-label="Carregando dados">
      <div className="sk-row">
        <div className="sk sk-kpi" /><div className="sk sk-kpi" /><div className="sk sk-kpi" /><div className="sk sk-kpi" />
      </div>
      <div className="sk sk-bar" />
      <div className="sk sk-table" />
    </div>
  );
}

function ViewContent() {
  const { view } = useApp();
  switch (view) {
    case 'dashboard':     return <Dashboard />;
    case 'pedidos':       return <Pedidos />;
    case 'kanban':        return <Kanban />;
    case 'calendario':    return <Calendario />;
    case 'urgentes':      return <Urgentes />;
    case 'clientes':      return <Clientes />;
    case 'relatorios':    return <Relatorios />;
    case 'contas':        return <Contas />;
    case 'configuracoes': return <Configuracoes />;
    default:              return <Dashboard />;
  }
}

function PageHeader() {
  const { view, openModal } = useApp();
  const page = PAGES[view] ?? PAGES.dashboard;

  return (
    <div className="page-header">
      <div style={{ minWidth: 0 }}>
        <h1 className="page-title">{page.title}</h1>
        <p className="page-sub">{page.description}</p>
      </div>
      {/* Configurações e Contas não são da produção: sem ação de pedido */}
      {view !== 'configuracoes' && view !== 'contas' && (
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal('novo')}>
            <Plus size={15} />
            <span className="btn-label">Novo Pedido</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const { mobileSidebarOpen, closeMobileSidebar, sidebarCollapsed, loading } = useApp();

  // Gaveta aberta não deixa o fundo rolar junto
  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  return (
    <div className={`app-screen${sidebarCollapsed ? ' sb-collapsed' : ''}`}>
      {mobileSidebarOpen && (
        <div className="mobile-overlay" onClick={closeMobileSidebar} />
      )}
      <Sidebar />
      <div className="app-body">
        <Topbar />
        <main className="view-content">
          <PageHeader />
          {loading ? <ViewSkeleton /> : <ViewContent />}
        </main>
      </div>
    </div>
  );
}
