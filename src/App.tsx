import { useApp } from './contexts/AppContext';
import { Login } from './components/Login';
import { AppLayout } from './components/layout/AppLayout';
import { Toast } from './components/ui/Toast';
import { PedidoModal } from './components/ui/PedidoModal';
import { ConfirmModal } from './components/ui/ConfirmModal';
import { DetalheModal } from './components/ui/DetalheModal';

export function App() {
  const { usuario } = useApp();

  return (
    <>
      {usuario ? <AppLayout /> : <Login />}
      <Toast />
      <PedidoModal />
      <ConfirmModal />
      <DetalheModal />
    </>
  );
}
