import { useState, useEffect, FormEvent } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Pedido, StatusProducao, StatusPagamento, ETAPAS } from '../../types';
import { toInputDate, inputToFmt } from '../../lib/helpers';
import { Select, STATUS_PRODUCAO_OPTS, PGTO_OPTS_SELECT, SelectOption } from './Select';

const ETAPA_OPTS: SelectOption[] = [
  { value: '', label: 'Sem etapa definida' },
  ...ETAPAS.map(e => ({ value: e, label: e })),
];

const TECNICA_OPTS = [
  'Bordado',
  'Bordado 3D',
  'Silk Screen',
  'Sublimação',
  'Patch Emborrachado',
  'Transfer DTF',
  'Gravação Laser',
  'Costura Direta',
];
const TIPO_OPTS: SelectOption[] = [
  'Boné Snapback', 'Boné Trucker', 'Boné Dad Hat', 'Boné Baseball',
  'Boné Militar', 'Bucket Hat', 'Viseira Esportiva', 'Boné 5-Panel', 'Outro',
].map(o => ({ value: o, label: o }));

const TECNICA_SELECT_OPTS: SelectOption[] = TECNICA_OPTS.map(o => ({ value: o, label: o }));

const empty = (): Omit<Pedido, 'id'> => ({
  num: '', data: '', cliente: '', nomePedidoOriginal: '',
  cor: '', qtd: 0, numeroSistema: '', tecnica: '',
  status_producao: 'Em Produção', status_pgto: 'PENDENTE',
  entrega: '', observacoes: '', etapa: '',
});

export function PedidoModal() {
  const { modal, closeModal, addPedido, updatePedido, showToast, clientes } = useApp();
  const [form, setForm] = useState(empty());

  useEffect(() => {
    if (!modal) return;
    if (modal.mode === 'editar' && modal.pedido) {
      const p = modal.pedido;
      setForm({
        num: p.num,
        data: toInputDate(p.data),
        cliente: p.cliente,
        nomePedidoOriginal: p.nomePedidoOriginal,
        cor: p.cor,
        qtd: p.qtd,
        numeroSistema: p.numeroSistema,
        tecnica: p.tecnica,
        status_producao: p.status_producao,
        status_pgto: p.status_pgto,
        entrega: toInputDate(p.entrega),
        observacoes: p.observacoes,
        etapa: p.etapa ?? '',
      });
    } else {
      setForm(empty());
    }
  }, [modal]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.cliente.trim() || !form.num.trim()) {
      showToast('Preencha Nº Pedido e Cliente.', true);
      return;
    }
    const payload = {
      ...form,
      data: inputToFmt(form.data as string),
      entrega: inputToFmt(form.entrega as string),
      qtd: Number(form.qtd),
    };
    if (modal?.mode === 'editar' && modal.pedido) {
      await updatePedido({ ...payload, id: modal.pedido.id });
      showToast('Pedido atualizado!');
    } else {
      await addPedido(payload);
      showToast('Pedido criado!');
    }
    closeModal();
  }

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  if (!modal) return null;

  return (
    <div
      className={`modal-overlay${modal ? ' open' : ''}`}
      onClick={e => e.target === e.currentTarget && closeModal()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2>{modal.mode === 'editar' ? 'Editar Pedido' : 'Novo Pedido'}</h2>
          <button className="close-btn" onClick={closeModal}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field">
              <label>Nº do Pedido</label>
              <input
                value={form.num}
                onChange={e => set('num', e.target.value)}
                placeholder="Ex: 010"
              />
            </div>
            <div className="field">
              <label>Data de Entrada</label>
              <input type="date" value={form.data as string} onChange={e => set('data', e.target.value)} />
            </div>
            <div className="field">
              <label>Cliente</label>
              <input
                value={form.cliente}
                onChange={e => set('cliente', e.target.value)}
                placeholder="Nome do cliente ou empresa"
                list="clientes-datalist"
              />
              <datalist id="clientes-datalist">
                {clientes.map(c => <option key={c.id} value={c.nome} />)}
              </datalist>
            </div>
            <div className="field">
              <label>Tipo de Produto</label>
              <Select
                value={form.nomePedidoOriginal}
                onChange={v => set('nomePedidoOriginal', v)}
                options={TIPO_OPTS}
                placeholder="Selecione o tipo..."
              />
            </div>
            <div className="field">
              <label>Quantidade</label>
              <input
                type="number" min={1}
                value={form.qtd || ''}
                onChange={e => set('qtd', Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="field">
              <label>Cor / Modelo</label>
              <input
                value={form.cor}
                onChange={e => set('cor', e.target.value)}
                placeholder="Ex: Preto Aba Preta, Branco Total"
              />
            </div>
            <div className="field">
              <label>Nº Orçamento / Sistema</label>
              <input
                value={form.numeroSistema}
                onChange={e => set('numeroSistema', e.target.value)}
                placeholder="Ex: W010"
              />
            </div>
            <div className="field">
              <label>Técnica de Personalização</label>
              <Select
                value={form.tecnica}
                onChange={v => set('tecnica', v)}
                options={TECNICA_SELECT_OPTS}
                placeholder="Selecione a técnica..."
              />
            </div>
            <div className="field">
              <label>Status de Produção</label>
              <Select
                value={form.status_producao}
                onChange={v => set('status_producao', v as StatusProducao)}
                options={STATUS_PRODUCAO_OPTS}
              />
            </div>
            <div className="field">
              <label>Status do Pagamento</label>
              <Select
                value={form.status_pgto}
                onChange={v => set('status_pgto', v as StatusPagamento)}
                options={PGTO_OPTS_SELECT}
              />
            </div>
            {(form.status_producao === 'Em Produção' || form.status_producao === 'ATRASADO') && (
              <div className="field">
                <label>Etapa de Produção</label>
                <Select
                  value={form.etapa ?? ''}
                  onChange={v => set('etapa', v)}
                  options={ETAPA_OPTS}
                  placeholder="Sem etapa definida"
                />
              </div>
            )}
            <div className="field">
              <label>Prazo de Entrega</label>
              <input type="date" value={form.entrega as string} onChange={e => set('entrega', e.target.value)} />
            </div>
            <div className="field full-col">
              <label>Observações</label>
              <input
                value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
                placeholder="Arte, posição do bordado, detalhes especiais..."
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              {modal.mode === 'editar' ? 'Salvar alterações' : 'Criar pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
