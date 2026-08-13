import React, { useState, useEffect } from 'react';
import {
  Trash2,
  X,
  RotateCcw,
  BookOpen,
  Layers,
  FileText,
  Bookmark,
  Clock,
  Zap,
  Folder,
  AlertTriangle,
  Check,
} from 'lucide-react';
import {
  getLixeira,
  restaurarItemLixeira,
  eliminarPermanentementeLixeira,
  esvaziarLixeira,
} from '../lib/storage';
import { ItemLixeira, TipoItemLixeira } from '../types';

interface LixeiraModalProps {
  onFechar: () => void;
  onAtualizado?: () => void;
}

export const LixeiraModal: React.FC<LixeiraModalProps> = ({
  onFechar,
  onAtualizado,
}) => {
  const [items, setItems] = useState<ItemLixeira[]>([]);
  const [itemParaEliminar, setItemParaEliminar] = useState<ItemLixeira | null>(null);
  const [confirmarEsvaziar, setConfirmarEsvaziar] = useState(false);
  const [notificacao, setNotificacao] = useState<string | null>(null);

  const recarregar = () => {
    setItems(getLixeira());
    if (onAtualizado) onAtualizado();
  };

  useEffect(() => {
    recarregar();
  }, []);

  const handleRestaurar = (item: ItemLixeira) => {
    restaurarItemLixeira(item.id);
    setNotificacao(`"${item.nome}" foi restaurado com sucesso!`);
    setTimeout(() => setNotificacao(null), 3000);
    recarregar();
  };

  const handleEliminarPermanente = () => {
    if (itemParaEliminar) {
      eliminarPermanentementeLixeira(itemParaEliminar.id);
      setItemParaEliminar(null);
      setNotificacao('Item eliminado permanentemente.');
      setTimeout(() => setNotificacao(null), 3000);
      recarregar();
    }
  };

  const handleEsvaziarLixeira = () => {
    esvaziarLixeira();
    setConfirmarEsvaziar(false);
    setNotificacao('Lixeira esvaziada com sucesso.');
    setTimeout(() => setNotificacao(null), 3000);
    recarregar();
  };

  const getTipoBadge = (tipo: TipoItemLixeira) => {
    switch (tipo) {
      case 'curso':
        return { label: 'Curso', icon: BookOpen, color: 'bg-indigo-100 text-indigo-700' };
      case 'disciplina':
        return { label: 'Disciplina', icon: Layers, color: 'bg-blue-100 text-blue-700' };
      case 'material':
        return { label: 'Material', icon: Folder, color: 'bg-emerald-100 text-emerald-700' };
      case 'apontamento':
        return { label: 'Apontamento', icon: FileText, color: 'bg-violet-100 text-violet-700' };
      case 'informacao_importante':
        return { label: 'Informação', icon: Bookmark, color: 'bg-amber-100 text-amber-800' };
      case 'sessao_aula':
        return { label: 'Sessão / Aula', icon: Zap, color: 'bg-orange-100 text-orange-800' };
      case 'horario':
        return { label: 'Horário', icon: Clock, color: 'bg-teal-100 text-teal-800' };
      default:
        return { label: 'Item', icon: Trash2, color: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 via-rose-900 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <Trash2 className="w-6 h-6 text-rose-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Lixeira</h2>
              <p className="text-xs text-rose-200">
                Itens removidos do aplicativo ({items.length} {items.length === 1 ? 'item' : 'itens'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="text-slate-300 hover:text-white p-1 rounded-xl transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Feedback Alert */}
        {notificacao && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 px-5 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificacao}</span>
          </div>
        )}

        {/* Action Header bar */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              Restaure seus itens a qualquer momento ou elimine-os permanentemente.
            </span>
            <button
              type="button"
              onClick={() => setConfirmarEsvaziar(true)}
              className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Esvaziar lixeira</span>
            </button>
          </div>
        )}

        {/* Body list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {items.length === 0 ? (
            <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-dashed border-slate-200 my-4">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-base">A lixeira está vazia</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Quando você exclui cursos, disciplinas, materiais ou anotações, eles serão guardados aqui para segurança.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const badge = getTipoBadge(item.tipo);
              const IconComp = badge.icon;
              return (
                <div
                  key={item.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${badge.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${badge.color}`}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Eliminado em: {new Date(item.dataEliminacao).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm mt-1 leading-snug">
                        {item.nome}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleRestaurar(item)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemParaEliminar(item)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 text-right shrink-0">
          <button
            type="button"
            onClick={onFechar}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Confirmation Modal - Single Item Permanent Delete */}
      {itemParaEliminar && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">Excluir permanentemente?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deseja eliminar permanentemente <strong>"{itemParaEliminar.nome}"</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemParaEliminar(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminarPermanente}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Excluir permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Empty Trash */}
      {confirmarEsvaziar && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900">Esvaziar a lixeira?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza que deseja esvaziar a lixeira? Todos os {items.length} itens serão excluídos permanentemente do MyStudy e não poderão ser recuperados.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmarEsvaziar(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEsvaziarLixeira}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Esvaziar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
