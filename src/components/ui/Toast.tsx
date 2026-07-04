import { useApp } from '../../contexts/AppContext';

export function Toast() {
  const { toast } = useApp();
  return (
    <div className={`toast${toast ? ' show' : ''}${toast?.isError ? ' err' : ''}`}>
      {toast?.message}
    </div>
  );
}
