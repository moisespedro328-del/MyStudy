import React, { useState } from 'react';
import {
  X,
  Mic,
  Camera,
  Video,
  FileText,
  Bookmark,
  Calendar,
  Clock,
  Edit2,
  Folder,
  Layers,
  BookOpen,
  Check,
} from 'lucide-react';
import { SessaoAula, Disciplina, Curso } from '../types';
import { getDisciplinas, getCursos, atualizarDisciplinaSessao } from '../lib/storage';

interface SessionDetailModalProps {
  sessao: SessaoAula;
  onFechar: () => void;
  onAtualizado?: () => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  sessao,
  onFechar,
  onAtualizado,
}) => {
  const [modalAlterarDisciplina, setModalAlterarDisciplina] = useState(false);
  const [disciplinaAtualId, setDisciplinaAtualId] = useState(sessao.disciplinaId);

  const disciplinas = getDisciplinas();
  const cursos = getCursos();

  const disciplinaAtual = disciplinas.find((d) => d.id === disciplinaAtualId);
  const cursoAtual = disciplinaAtual
    ? cursos.find((c) => c.id === disciplinaAtual.cursoId)
    : null;

  const [cursoSelecionadoId, setCursoSelecionadoId] = useState<string>(
    cursoAtual?.id || (cursos[0]?.id || '')
  );
  const [novaDisciplinaId, setNovaDisciplinaId] = useState<string>(
    disciplinaAtualId
  );

  const disciplinasDoCurso = disciplinas.filter(
    (d) => d.cursoId === cursoSelecionadoId
  );

  const handleSalvarAlteracaoDisciplina = () => {
    if (!novaDisciplinaId) return;
    atualizarDisciplinaSessao(sessao.id, novaDisciplinaId);
    setDisciplinaAtualId(novaDisciplinaId);
    setModalAlterarDisciplina(false);
    if (onAtualizado) onAtualizado();
  };

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

        {/* Subheader - Current Discipline & Change Discipline Button */}
        <div className="bg-slate-100 p-3 px-6 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {cursoAtual ? `${cursoAtual.nome} • ` : ''}
              {disciplinaAtual ? disciplinaAtual.nome : 'Sem disciplina definida'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModalAlterarDisciplina(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Alterar disciplina</span>
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

          {/* Materials Attached */}
          {sessao.materiais && sessao.materiais.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-emerald-600" />
                <span>Materiais Anexados ({sessao.materiais.length})</span>
              </h3>
              <div className="grid gap-2">
                {sessao.materiais.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Folder className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{m.titulo}</span>
                    </div>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                      {m.tipo}
                    </span>
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

      {/* Alterar Disciplina Sub-modal */}
      {modalAlterarDisciplina && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                <span>Alterar Disciplina da Aula</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalAlterarDisciplina(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Selecione o Curso e a Disciplina à qual este registo de aula pertence.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Selecionar Curso
                </label>
                <select
                  value={cursoSelecionadoId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    setCursoSelecionadoId(cId);
                    const discList = disciplinas.filter((d) => d.cursoId === cId);
                    if (discList.length > 0) {
                      setNovaDisciplinaId(discList[0].id);
                    } else {
                      setNovaDisciplinaId('');
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Selecionar Disciplina
                </label>
                <select
                  value={novaDisciplinaId}
                  onChange={(e) => setNovaDisciplinaId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {disciplinasDoCurso.length === 0 ? (
                    <option value="">Nenhuma disciplina neste curso</option>
                  ) : (
                    disciplinasDoCurso.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome} {d.codigo ? `(${d.codigo})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalAlterarDisciplina(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarAlteracaoDisciplina}
                disabled={!novaDisciplinaId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Alteração</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
