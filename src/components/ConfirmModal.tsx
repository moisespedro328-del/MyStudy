import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  titulo?: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  variante?: 'danger' | 'warning' | 'primary';
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  titulo = 'Confirmar Ação',
  mensagem,
  textoConfirmar = 'Enviar para a Lixeira',
  textoCancelar = 'Cancelar',
  variante = 'danger',
  onConfirmar,
  onCancelar,
}) => {
  if (!isOpen) return null;

  const btnColor =
    variante === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : variante === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6 space-y-5 transform transition-all scale-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">{titulo}</h3>
              <p className="text-xs text-slate-500 font-medium">Ação requer confirmação</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm font-semibold text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
          {mensagem}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer ${btnColor}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};
