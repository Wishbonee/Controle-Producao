import { useState, FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Logo } from './ui/Logo';

/* Mesmo layout do LoginPage do Sistema de Orçamentos: painel
   escuro da marca à esquerda, formulário à direita. Os campos e
   o fluxo de entrada continuam os mesmos de antes. */
export function Login() {
  const { login } = useApp();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
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
    <main className="login-screen">
      <section className="login-card">
        <div className="login-hero">
          <div className="login-hero-glow" />
          <div className="login-hero-inner">
            <div style={{ alignSelf: 'flex-start' }}>
              <Logo size={38} tone="light" />
            </div>
            <div>
              <h1>
                Produção sob controle,
                <br />
                do pedido à entrega.
              </h1>
              <p>Acompanhe pedidos, etapas e prazos da fábrica em um só lugar.</p>
            </div>
            {/* Dentro do painel escuro: cor fixa, não token */}
            <small>© 2026 Wishbone Custom Caps.</small>
          </div>
        </div>

        <div className="login-form-side">
          <div className="login-form-logo">
            <Logo size={30} />
          </div>

          <h2>Controle de Produção</h2>
          <p className="login-lead">Informe suas credenciais para acessar</p>

          <form onSubmit={handleSubmit}>
            {erro && <p className="notice" role="alert">{erro}</p>}

            <div className="field">
              <label htmlFor="loginUser">Usuário</label>
              <input
                id="loginUser"
                type="text"
                placeholder="Digite seu usuário"
                autoComplete="username"
                autoFocus
                value={usuario}
                onChange={e => { setUsuario(e.target.value); setErro(''); }}
              />
            </div>

            <div className="field">
              <label htmlFor="loginPassword">Senha</label>
              <div className="password-wrap">
                <input
                  id="loginPassword"
                  type={verSenha ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  value={senha}
                  onChange={e => { setSenha(e.target.value); setErro(''); }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setVerSenha(v => !v)}
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="login-copy">© 2026 Wishbone Custom Caps. Todos os direitos reservados.</p>
        </div>
      </section>
    </main>
  );
}
