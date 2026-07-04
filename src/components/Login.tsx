import { useState, FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';

export function Login() {
  const { login } = useApp();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const ok = await login(usuario.trim(), senha);
      if (!ok) setErro('Usuário ou senha incorretos.');
    } catch (err) {
      setErro(err instanceof Error ? `Erro de conexão: ${err.message}` : 'Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-logo">
          <img src="/assets/logo-wishbone.svg" alt="Wishbone" className="login-logo-img" />
          <h1>Wishbone</h1>
          <p>Controle de Produção 2026</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Usuário</label>
            <input
              type="text"
              placeholder="Digite seu usuário"
              autoComplete="username"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <div className="login-err">{erro}</div>
        </form>
      </div>
    </div>
  );
}
