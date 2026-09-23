import { useEffect, useRef, useState, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Menu, HardDrive, Cloud, ChevronDown, Sun, Moon, Monitor, LogOut, Settings, KeyRound, type LucideIcon } from 'lucide-react';
import { useApp, Tema } from '../../contexts/AppContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Avatar } from '../ui/Avatar';

/* ─── Barra superior no formato AppShell do orçamento ───────────
   Sem título (ele vive no cabeçalho da página): só o botão de
   menu no celular, o indicador Online/Local e o cartão de perfil.
─────────────────────────────────────────────────────────────── */

const TEMA_OPCOES: { value: Tema; label: string; Icon: LucideIcon }[] = [
  { value: 'claro',   label: 'Claro',   Icon: Sun },
  { value: 'escuro',  label: 'Escuro',  Icon: Moon },
  { value: 'sistema', label: 'Sistema', Icon: Monitor },
];

/* ─── Menu de perfil ────────────────────────────────────────────
   Fecha com Esc e clique fora; setas/Home/End navegam entre os
   itens e o foco volta ao gatilho ao fechar.
─────────────────────────────────────────────────────────────── */
function ProfileMenu() {
  const { nome, usuario, isAdmin, meuUsuario, tema, setTema, logout, navigate } = useApp();
  const foto = meuUsuario?.avatar_url;

  /* "Alterar senha" entra direto na seção de senha. Espera a
     tela trocar antes de rolar, senão o alvo ainda não existe. */
  function abrirConfiguracoes(ancora?: string) {
    setOpen(false);
    navigate('configuracoes');
    if (ancora) {
      setTimeout(() => {
        document.getElementById(ancora)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = nome || 'Sem nome';

  function itens(): HTMLElement[] {
    return Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? []);
  }

  function fechar(devolverFoco = true) {
    setOpen(false);
    if (devolverFoco) triggerRef.current?.focus();
  }

  // Clique fora fecha
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Ao abrir, foco no item marcado (ou no primeiro)
  useEffect(() => {
    if (!open) return;
    const lista = itens();
    const marcado = lista.find(el => el.getAttribute('aria-checked') === 'true');
    (marcado ?? lista[0])?.focus();
  }, [open]);

  function onMenuKeyDown(e: ReactKeyboardEvent) {
    const lista = itens();
    const atual = lista.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      fechar();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      lista[(atual + 1) % lista.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      lista[(atual - 1 + lista.length) % lista.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      lista[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      lista[lista.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      fechar(false);
    }
  }

  function onTriggerKeyDown(e: ReactKeyboardEvent) {
    if (e.key === 'ArrowDown' && !open) {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div ref={rootRef} className={`profile${open ? ' open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="profile-trigger"
        aria-label="Conta e preferências"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <Avatar name={name} url={foto} size={28} />
        <span className="profile-text">
          <span className="profile-name">{name}</span>
          <span className="profile-role">{isAdmin ? 'admin' : 'produção'}</span>
        </span>
        <ChevronDown size={15} className="profile-chevron" />
      </button>

      {open && (
        <div className="popover profile-menu" onKeyDown={onMenuKeyDown}>
          <div className="profile-menu-head">
            <Avatar name={name} url={foto} size={40} />
            <div style={{ minWidth: 0 }}>
              <p className="n">{name}</p>
              {/* O sistema não guarda e-mail: o login faz esse papel */}
              <p className="e">{usuario}</p>
            </div>
          </div>

          <div ref={menuRef} className="profile-menu-list" role="menu" aria-label="Conta e preferências">
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="menu-item"
              onClick={() => abrirConfiguracoes()}
            >
              <Settings size={17} />
              <span className="grow">Configurações</span>
            </button>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="menu-item"
              onClick={() => abrirConfiguracoes('senha')}
            >
              <KeyRound size={17} />
              <span className="grow">Alterar senha</span>
            </button>

            <div className="menu-sep" role="separator" />

            <div role="group" aria-labelledby="menu-tema-head">
              <div id="menu-tema-head" className="menu-section-head">Tema</div>
              {TEMA_OPCOES.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={tema === value}
                  tabIndex={-1}
                  className="menu-item"
                  onClick={() => setTema(value)}
                >
                  <Icon size={17} />
                  <span className="grow">{label}</span>
                  <span className="menu-dot" aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="menu-sep" role="separator" />

            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="menu-item danger"
              onClick={() => { setOpen(false); logout(); }}
            >
              <LogOut size={17} />
              <span className="grow">Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar() {
  const { toggleSidebar } = useApp();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="topbar-menu" onClick={toggleSidebar} aria-label="Abrir menu" title="Menu">
          <Menu size={17} />
        </button>

        <div className="topbar-spacer" />

        {isSupabaseConfigured ? (
          <span className="pill pill-ok" title="Dados sincronizados na nuvem">
            <Cloud size={12} />
            <span className="pill-status-label">Online</span>
          </span>
        ) : (
          <span className="pill" title="Dados salvos apenas neste navegador">
            <HardDrive size={12} />
            <span className="pill-status-label">Local</span>
          </span>
        )}

        <ProfileMenu />
      </div>
    </header>
  );
}
