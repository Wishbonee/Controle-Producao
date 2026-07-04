import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useApp } from '../../contexts/AppContext';
import { Dashboard } from '../views/Dashboard';
import { Pedidos } from '../views/Pedidos';
import { Kanban } from '../views/Kanban';
import { Calendario } from '../views/Calendario';
import { Urgentes } from '../views/Urgentes';
import { Clientes } from '../views/Clientes';
import { Relatorios } from '../views/Relatorios';
import { Configuracoes } from '../views/Configuracoes';

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
    case 'configuracoes': return <Configuracoes />;
    default:              return <Dashboard />;
  }
}

export function AppLayout() {
  const { mobileSidebarOpen, closeMobileSidebar, loading } = useApp();

  return (
    <div className="app-screen">
      {mobileSidebarOpen && (
        <div className="mobile-overlay" onClick={closeMobileSidebar} />
      )}
      <Sidebar />
      <div className="app-body">
        <Topbar />
        <main className="view-content">
          {loading ? <ViewSkeleton /> : <ViewContent />}
        </main>
      </div>
    </div>
  );
}
