import React, { useState } from 'react';
import {
  Share2,
  Download,
  Star,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { MaterialItem } from '../types';
import { compartilharMaterial, guardarNoDispositivo } from '../lib/materialActions';
import { toggleMaterialImportant, updateMaterial, deleteMaterial } from '../lib/storage';

interface MaterialActionMenuModalProps {
  material: MaterialItem;
  onFechar: () => void;
  onAtualizado?: () => void;
  onRemovido?: () => void;
}

export const MaterialActionMenuModal: React.FC<MaterialActionMenuModalProps> = ({
  material,
  onFechar,
  onAtualizado,
  onRemovido,
}) => {
  // Modal internal states
  const [modalRenomearAberto, setModalRenomearAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState(material.titulo);

  // Status message state
  const [mensagemStatus, setMensagemStatus] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [processando, setProcessando] = useState(false);

  const mostrarToast = (texto: string, tipo: 'sucesso' | 'erro') => {
    setMensagemStatus({ texto, tipo });
    setTimeout(() => setMensagemStatus(null), 3500);
  };

  // 📤 PARTILHAR
  const handlePartilhar = async () => {
    setProcessando(true);
    const resultado = await compartilharMaterial(material);
    setProcessando(false);
    mostrarToast(resultado.mensagem, resultado.sucesso ? 'sucesso' : 'erro');
  };

  // 💾 GUARDAR NO DISPOSITIVO
  const handleGuardar = async () => {
    setProcessando(true);
    const resultado = await guardarNoDispositivo(material);
    setProcessando(false);
    mostrarToast(resultado.mensagem, resultado.sucesso ? 'sucesso' : 'erro');
  };

  // ⭐ MARCAR COMO IMPORTANTE
  const handleToggleImportante = () => {
    const eImp = toggleMaterialImportant(material.id);
    mostrarToast(
      eImp ? 'Material marcado como importante! ⭐' : 'Removido dos materiais importantes.',
      'sucesso'
    );
    if (onAtualizado) onAtualizado();
  };

  // ✏️ RENOMEAR
  const handleConfirmarRenomear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    updateMaterial(material.id, { titulo: novoTitulo.trim() });
    setModalRenomearAberto(false);
    mostrarToast('Material renomeado com sucesso!', 'sucesso');
    if (onAtualizado) onAtualizado();
  };

  // 🗑️ REMOVER DO APLICATIVO
  const handleConfirmarExcluir = () => {
    deleteMaterial(material.id);
    setModalExcluirAberto(false);
    if (onRemovido) {
      onRemovido();
    }
    onFechar();
  };

  return (
    <>
      {/* Main Options Menu / Bottom Sheet Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        onClick={onFechar}
      >
        <div
          className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5 truncate max-w-[85%]">
              <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded border border-indigo-400/20 shrink-0">
                {material.tipo}
              </span>
              <h3 className="font-bold text-sm text-white truncate">{material.titulo}</h3>
            </div>
            <button
              type="button"
              onClick={onFechar}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Message Notification */}
          {mensagemStatus && (
            <div
              className={`p-3 text-xs font-bold flex items-center gap-2 border-b animate-in fade-in duration-200 ${
                mensagemStatus.tipo === 'sucesso'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {mensagemStatus.tipo === 'sucesso' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="flex-1">{mensagemStatus.texto}</span>
            </div>
          )}

          {/* Actions List */}
          <div className="p-3 space-y-1 bg-slate-50">
            {/* 1. Partilhar */}
            <button
              type="button"
              disabled={processando}
              onClick={handlePartilhar}
              className="w-full p-3.5 bg-white hover:bg-indigo-50/80 text-slate-800 hover:text-indigo-900 font-bold text-xs rounded-2xl border border-slate-200/80 transition flex items-center gap-3 shadow-2xs group cursor-pointer"
            >
              <div className="p-2 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition shrink-0">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-extrabold text-slate-800 group-hover:text-indigo-950">
                  📤 Partilhar
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Enviar para apps compatíveis (WhatsApp, Email, Drive...)
                </span>
              </div>
            </button>

            {/* 2. Guardar no dispositivo */}
            <button
              type="button"
              disabled={processando}
              onClick={handleGuardar}
              className="w-full p-3.5 bg-white hover:bg-indigo-50/80 text-slate-800 hover:text-indigo-900 font-bold text-xs rounded-2xl border border-slate-200/80 transition flex items-center gap-3 shadow-2xs group cursor-pointer"
            >
              <div className="p-2 bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-extrabold text-slate-800 group-hover:text-indigo-950">
                  💾 Guardar no dispositivo
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Salvar uma cópia no armazenamento do telefone
                </span>
              </div>
            </button>

            {/* 3. Marcar como importante */}
            <button
              type="button"
              onClick={handleToggleImportante}
              className="w-full p-3.5 bg-white hover:bg-amber-50/80 text-slate-800 hover:text-amber-900 font-bold text-xs rounded-2xl border border-slate-200/80 transition flex items-center gap-3 shadow-2xs group cursor-pointer"
            >
              <div
                className={`p-2 rounded-xl transition shrink-0 ${
                  material.eImportante
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-amber-500 group-hover:text-white'
                }`}
              >
                <Star
                  className={`w-4 h-4 ${
                    material.eImportante ? 'fill-amber-500 text-amber-500' : ''
                  }`}
                />
              </div>
              <div className="text-left">
                <span className="block text-sm font-extrabold text-slate-800 group-hover:text-amber-950">
                  ⭐ {material.eImportante ? 'Remover dos Importantes' : 'Marcar como importante'}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  {material.eImportante
                    ? 'Retirar o selo de destaque deste material'
                    : 'Destacar este material para acesso rápido'}
                </span>
              </div>
            </button>

            {/* 4. Renomear */}
            <button
              type="button"
              onClick={() => setModalRenomearAberto(true)}
              className="w-full p-3.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200/80 transition flex items-center gap-3 shadow-2xs group cursor-pointer"
            >
              <div className="p-2 bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white rounded-xl transition shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-extrabold text-slate-800">
                  ✏️ Renomear
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Alterar o título de exibição no aplicativo
                </span>
              </div>
            </button>

            {/* 5. Remover do aplicativo */}
            <button
              type="button"
              onClick={() => setModalExcluirAberto(true)}
              className="w-full p-3.5 bg-white hover:bg-red-50 text-red-700 font-bold text-xs rounded-2xl border border-red-100 transition flex items-center gap-3 shadow-2xs group cursor-pointer"
            >
              <div className="p-2 bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white rounded-xl transition shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-extrabold text-red-700 group-hover:text-red-900">
                  🗑️ Remover do aplicativo
                </span>
                <span className="text-[11px] font-medium text-red-500">
                  Remover este material da organização do aplicativo
                </span>
              </div>
            </button>
          </div>

          <div className="p-3 bg-white border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onFechar}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* RENAME MODAL */}
      {modalRenomearAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Renomear Material</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalRenomearAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRenomear} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Novo Título do Material:
                </label>
                <input
                  type="text"
                  required
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Resumo de Contabilidade.pdf"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRenomearAberto(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Salvar Alteração
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {modalExcluirAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Remover este material do aplicativo?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  "{material.titulo}"
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              Esta ação removerá o material da organização do seu aplicativo. Ficheiros guardados fora do aplicativo no dispositivo não serão afetados.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalExcluirAberto(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarExcluir}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
