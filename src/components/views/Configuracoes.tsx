import { useRef, useState, FormEvent, ChangeEvent, ReactNode } from 'react';
import { Sun, Moon, Monitor, Trash2, UploadCloud, type LucideIcon } from 'lucide-react';
import { useApp, Tema } from '../../contexts/AppContext';
import { Avatar } from '../ui/Avatar';

/* ─── Configurações — mesma tela do Sistema de Orçamentos ───────
   Foto, dados da conta, tema e troca de senha, para qualquer
   perfil. A gestão de usuários e a auditoria ficaram na tela
   Contas (só admin), como no orçamento.
─────────────────────────────────────────────────────────────── */

const THEME_CARDS: { value: Tema; label: string; hint: string; Icon: LucideIcon }[] = [
  { value: 'claro',   label: 'Claro',   hint: 'Fundo branco o dia inteiro.',          Icon: Sun },
  { value: 'escuro',  label: 'Escuro',  hint: 'Menos brilho para trabalhar à noite.', Icon: Moon },
  { value: 'sistema', label: 'Sistema', hint: 'Acompanha o tema do computador.',      Icon: Monitor },
];

const ACCEPTED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
/* A foto vai para o próprio registro do usuário: reduzida a este
   lado, fica em poucos KB e não pesa no carregamento da lista. */
const AVATAR_SIDE = 256;

function validateAvatar(file: File): string | null {
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) return 'A foto precisa ser PNG, JPG ou WebP.';
  if (file.size > MAX_AVATAR_BYTES) return 'A foto precisa ter no máximo 2 MB.';
  return null;
}

/** Recorta o centro em quadrado e devolve um data URL pequeno. */
function reduzirFoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_SIDE;
      canvas.height = AVATAR_SIDE;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(src); reject(new Error('Canvas indisponível')); return; }
      ctx.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, AVATAR_SIDE, AVATAR_SIDE);
      URL.revokeObjectURL(src);
      resolve(canvas.toDataURL('image/webp', 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('Imagem inválida')); };
    img.src = src;
  });
}

function Section({ id, title, description, children }: { id?: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="st-section">
      <h2 className="st-title">{title}</h2>
      {description && <p className="st-desc">{description}</p>}
      <div className="st-body">{children}</div>
    </section>
  );
}

function PhotoCard() {
  const { nome, meuUsuario, alterarMinhaFoto, showToast } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Deixa escolher o mesmo arquivo de novo depois
    event.target.value = '';
    if (!file) return;

    const problem = validateAvatar(file);
    if (problem) {
      showToast(problem, true);
      return;
    }

    setBusy(true);
    try {
      await alterarMinhaFoto(await reduzirFoto(file));
      showToast('Foto atualizada');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível salvar a foto.', true);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await alterarMinhaFoto(null);
      showToast('Foto removida');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível remover a foto.', true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="st-photo">
      <Avatar name={nome} url={meuUsuario?.avatar_url} size={88} />

      <div className="st-photo-body">
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={busy || !meuUsuario}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={15} />
            {busy ? 'Enviando...' : 'Enviar foto'}
          </button>

          {meuUsuario?.avatar_url && (
            <button type="button" className="btn btn-sm" disabled={busy} onClick={handleRemove}>
              <Trash2 size={15} />
              Remover
            </button>
          )}
        </div>

        <p className="st-hint">
          PNG, JPG ou WebP, até 2 MB. Sem foto, aparecem as iniciais do seu nome.
        </p>

        <input
          ref={inputRef}
          type="file"
          hidden
          accept={ACCEPTED_AVATAR_TYPES.join(',')}
          onChange={handleFile}
        />
      </div>
    </div>
  );
}

function PasswordCard() {
  const { alterarMinhaSenha, showToast } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (password.length < 6) {
      showToast('A nova senha precisa ter pelo menos 6 caracteres.', true);
      return;
    }
    if (password !== confirmPassword) {
      showToast('A confirmação não bate com a nova senha.', true);
      return;
    }

    setSaving(true);
    try {
      await alterarMinhaSenha(password);
      setPassword('');
      setConfirmPassword('');
      showToast('Senha alterada. Use a nova senha no próximo login.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Não foi possível alterar a senha.', true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="st-grid">
      <div className="field">
        <label htmlFor="novaSenha">Nova senha</label>
        <input
          id="novaSenha"
          type="password"
          autoComplete="new-password"
          className="form-input"
          placeholder="Mínimo de 6 caracteres"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="confirmarSenha">Confirmar nova senha</label>
        <input
          id="confirmarSenha"
          type="password"
          autoComplete="new-password"
          className="form-input"
          placeholder="Repita a nova senha"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />
      </div>

      <div className="st-span">
        <button type="submit" className="btn btn-contrast" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar nova senha'}
        </button>
      </div>
    </form>
  );
}

export function Configuracoes() {
  const { nome, usuario, isAdmin, tema, setTema } = useApp();

  return (
    <div className="st-page">
      <Section title="Foto de perfil" description="Aparece no canto superior direito e no menu.">
        <PhotoCard />
      </Section>

      <Section title="Conta">
        <div className="st-grid">
          <div className="field">
            <label htmlFor="contaNome">Nome</label>
            <input id="contaNome" readOnly className="form-input" value={nome || ''} />
            {/* Nome e perfil são do admin, na tela Contas */}
            <p className="st-hint">Só o admin altera, na tela de contas.</p>
          </div>

          <div className="field">
            <label htmlFor="contaLogin">Login</label>
            <input id="contaLogin" readOnly className="form-input" value={usuario || ''} />
            <p className="st-hint">É com ele que você entra no sistema.</p>
          </div>

          <div className="field">
            <label htmlFor="contaPerfil">Perfil</label>
            <input id="contaPerfil" readOnly className="form-input" value={isAdmin ? 'Administrador' : 'Produção'} />
          </div>
        </div>
      </Section>

      <Section title="Aparência" description="Vale só neste navegador.">
        <div className="st-themes">
          {THEME_CARDS.map(({ value, label, hint, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTema(value)}
              aria-pressed={tema === value}
              className={`st-theme${tema === value ? ' active' : ''}`}
            >
              <Icon size={20} className="st-theme-icon" />
              <p className="st-theme-label">{label}</p>
              <p className="st-theme-hint">{hint}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section id="senha" title="Senha" description="Trocar aqui vale para o próximo login.">
        <PasswordCard />
      </Section>
    </div>
  );
}
