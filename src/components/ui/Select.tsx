import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  dot?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  compact?: boolean;
  className?: string;
}

export function Select({
  value, onChange, options, placeholder = 'Selecione...', compact, className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div
      ref={ref}
      className={`custom-select${open ? ' open' : ''}${compact ? ' compact' : ''}${className ? ' ' + className : ''}`}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <span className="custom-select-value">
          {selected?.dot && <span className="cs-dot" style={{ background: selected.dot }} />}
          {selected
            ? <span className="custom-select-text">{selected.label}</span>
            : <span className="custom-select-placeholder">{placeholder}</span>
          }
        </span>
        <ChevronDown size={14} className="cs-chevron" />
      </button>

      {open && (
        <div className="custom-select-dropdown">
          {placeholder && (
            <div
              className={`cs-option placeholder-opt${!selected ? ' selected' : ''}`}
              onClick={() => { onChange(''); setOpen(false); }}
            >
              {placeholder}
            </div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              className={`cs-option${opt.value === value ? ' selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.dot && <span className="cs-dot" style={{ background: opt.dot }} />}
              <span className="custom-select-text">{opt.label}</span>
              {opt.value === value && <Check size={12} className="cs-check" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const STATUS_PRODUCAO_OPTS: SelectOption[] = [
  { value: 'Em Produção', label: 'Em Produção', dot: '#fde047' },
  { value: 'Aguardando',  label: 'Aguardando',  dot: '#fb923c' },
  { value: 'ATRASADO',   label: 'Atrasado',    dot: '#f87171' },
  { value: 'Enviado',    label: 'Enviado',     dot: '#60a5fa' },
  { value: 'Entregue',   label: 'Entregue',    dot: '#4ade80' },
  { value: 'Cancelado',  label: 'Cancelado',   dot: '#9ca3af' },
];

export const PGTO_OPTS_SELECT: SelectOption[] = [
  { value: 'PENDENTE', label: 'Pendente', dot: '#fb923c' },
  { value: 'PAGO',     label: 'Pago',     dot: '#4ade80' },
  { value: 'PARCIAL',  label: 'Parcial',  dot: '#fde047' },
];
