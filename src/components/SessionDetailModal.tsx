import React from 'react';
import {
  X,
  Mic,
  Camera,
  Video,
  FileText,
  Bookmark,
  Calendar,
  Clock,
} from 'lucide-react';
import { SessaoAula } from '../types';

interface SessionDetailModalProps {
  sessao: SessaoAula;
  onFechar: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  sessao,
  onFechar,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(sessao.dataInicio).toLocaleDateString()}</span>
              {sessao.duracaoMinutos && (
                <span className="flex items-center gap-1 ml-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{sessao.duracaoMinutos} min</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-white">{sessao.titulo}</h2>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="text-slate-300 hover:text-white p-1 rounded-xl transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50">
          {/* Key Info Clips */}
          {sessao.informacoesImportantes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 fill-amber-500" />
                <span>Informações Importantes Guardadas ({sessao.informacoesImportantes.length})</span>
              </h3>
              <div className="space-y-2">
                {sessao.informacoesImportantes.map((inf) => (
                  <div
                    key={inf.id}
                    className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-slate-800 font-semibold text-xs leading-relaxed"
                  >
                    "{inf.texto}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Notes */}
          {sessao.notas.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Notas Rápidas ({sessao.notas.length})</span>
              </h3>
              <div className="grid gap-2">
                {sessao.notas.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed shadow-sm"
                  >
                    <span className="text-[10px] text-slate-400 block mb-1">
                      {n.timestamp}
                    </span>
                    {n.texto}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio Recordings */}
          {sessao.audios.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-indigo-600" />
                <span>Gravações de Áudio ({sessao.audios.length})</span>
              </h3>
              <div className="space-y-2">
                {sessao.audios.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-sm"
                  >
                    <span className="text-xs font-bold text-slate-800 block">
                      {a.titulo || 'Gravação de Áudio'}
                    </span>
                    <audio src={a.url} controls className="w-full h-10" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {sessao.fotografias.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Fotografias da Aula ({sessao.fotografias.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sessao.fotografias.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm"
                  >
                    <img src={f.url} alt={f.titulo} className="w-full h-32 object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {sessao.videos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-600" />
                <span>Vídeos Gravados ({sessao.videos.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sessao.videos.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl overflow-hidden border border-slate-200 bg-black"
                  >
                    <video src={v.url} controls className="w-full max-h-48" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 text-right">
          <button
            type="button"
            onClick={onFechar}
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
