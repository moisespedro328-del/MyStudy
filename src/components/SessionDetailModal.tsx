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
  Trash2,
} from 'lucide-react';
import { SessaoAula, Disciplina, Curso } from '../types';
import {
  getDisciplinas,
  getCursos,
  atualizarDisciplinaSessao,
  enviarSessaoParaLixeira,
  enviarMaterialParaLixeira,
  enviarApontamentoParaLixeira,
  enviarInformacaoParaLixeira,
  getMateriais,
  getApontamentos,
  getInformacoesImportantes,
} from '../lib/storage';
import { ConfirmModal } from './ConfirmModal';

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

  // Local state for interactive deletion inside modal
  const [informacoesState, setInformacoesState] = useState(sessao.informacoesImportantes || []);
  const [notasState, setNotasState] = useState(sessao.notas || []);
  const [materiaisState, setMateriaisState] = useState(sessao.materiais || []);
  const [audiosState, setAudiosState] = useState(sessao.audios || []);
  const [fotosState, setFotosState] = useState(sessao.fotografias || []);
  const [videosState, setVideosState] = useState(sessao.videos || []);

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

  const [confirmarExcluirSessao, setConfirmarExcluirSessao] = useState(false);

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

  const handleExcluirTodaSessao = () => {
    setConfirmarExcluirSessao(true);
  };

  const handleConfirmarExcluirSessaoAcao = () => {
    enviarSessaoParaLixeira(sessao.id);
    setConfirmarExcluirSessao(false);
    if (onAtualizado) onAtualizado();
    onFechar();
  };

  const handleExcluirInfo = (infId: string) => {
    enviarInformacaoParaLixeira(infId);
    setInformacoesState((prev) => prev.filter((i) => i.id !== infId));
    if (onAtualizado) onAtualizado();
  };

  const handleExcluirNota = (notaId: string) => {
    const todosAp = getApontamentos();
    const ap = todosAp.find((a) => a.id === notaId || a.sessaoId === sessao.id);
    if (ap) {
      enviarApontamentoParaLixeira(ap.id);
    }
    setNotasState((prev) => prev.filter((n) => n.id !== notaId));
    if (onAtualizado) onAtualizado();
  };

  const handleExcluirMaterial = (matId: string) => {
    enviarMaterialParaLixeira(matId);
    setMateriaisState((prev) => prev.filter((m) => m.id !== matId));
    if (onAtualizado) onAtualizado();
  };

  const handleExcluirAudio = (audioId: string, url: string) => {
    const mats = getMateriais();
    const mat = mats.find((m) => m.conteudo === url || m.id === audioId);
    if (mat) {
      enviarMaterialParaLixeira(mat.id);
    }
    setAudiosState((prev) => prev.filter((a) => a.id !== audioId));
    if (onAtualizado) onAtualizado();
  };

  const handleExcluirFoto = (fotoId: string, url: string) => {
    const mats = getMateriais();
    const mat = mats.find((m) => m.conteudo === url || m.id === fotoId);
    if (mat) {
      enviarMaterialParaLixeira(mat.id);
    }
    setFotosState((prev) => prev.filter((f) => f.id !== fotoId));
    if (onAtualizado) onAtualizado();
  };

  const handleExcluirVideo = (videoId: string, url: string) => {
    const mats = getMateriais();
    const mat = mats.find((m) => m.conteudo === url || m.id === videoId);
    if (mat) {
      enviarMaterialParaLixeira(mat.id);
    }
    setVideosState((prev) => prev.filter((v) => v.id !== videoId));
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExcluirTodaSessao}
              title="Enviar esta sessão para a Lixeira"
              className="p-2 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar para Lixeira</span>
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="text-slate-300 hover:text-white p-1 rounded-xl transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
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
          {informacoesState.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 fill-amber-500" />
                <span>Informações Importantes Guardadas ({informacoesState.length})</span>
              </h3>
              <div className="space-y-2">
                {informacoesState.map((inf) => (
                  <div
                    key={inf.id}
                    className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-slate-800 font-semibold text-xs leading-relaxed flex items-start justify-between gap-2"
                  >
                    <span>"{inf.texto}"</span>
                    <button
                      type="button"
                      onClick={() => handleExcluirInfo(inf.id)}
                      className="text-amber-800 hover:text-red-600 p-1 shrink-0"
                      title="Enviar para Lixeira"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Notes */}
          {notasState.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Notas Rápidas ({notasState.length})</span>
              </h3>
              <div className="grid gap-2">
                {notasState.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed shadow-sm flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">
                        {n.timestamp}
                      </span>
                      {n.texto}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExcluirNota(n.id)}
                      className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                      title="Enviar para Lixeira"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materials Attached */}
          {materiaisState.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-emerald-600" />
                <span>Materiais Anexados ({materiaisState.length})</span>
              </h3>
              <div className="grid gap-2">
                {materiaisState.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Folder className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{m.titulo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                        {m.tipo}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExcluirMaterial(m.id)}
                        className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                        title="Enviar para Lixeira"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio Recordings */}
          {audiosState.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-indigo-600" />
                <span>Gravações de Áudio ({audiosState.length})</span>
              </h3>
              <div className="space-y-2">
                {audiosState.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 block">
                        {a.titulo || 'Gravação de Áudio'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleExcluirAudio(a.id, a.url)}
                        className="text-slate-400 hover:text-red-600 p-1 shrink-0"
                        title="Enviar para Lixeira"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <audio src={a.url} controls className="w-full h-10" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {fotosState.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                <span>Fotografias da Aula ({fotosState.length})</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fotosState.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm relative group"
                  >
                    <img src={f.url} alt={f.titulo} className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleExcluirFoto(f.id, f.url)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg shadow-md hover:bg-red-700 transition opacity-90"
                      title="Enviar para Lixeira"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videosState.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-indigo-600" />
                <span>Vídeos Gravados ({videosState.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videosState.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-2xl overflow-hidden border border-slate-200 bg-black relative"
                  >
                    <video src={v.url} controls className="w-full max-h-48" />
                    <button
                      type="button"
                      onClick={() => handleExcluirVideo(v.id, v.url)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/90 text-white rounded-lg shadow-md hover:bg-red-700 transition z-10"
                      title="Enviar para Lixeira"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

      {/* Confirm Delete Session Modal */}
      <ConfirmModal
        isOpen={confirmarExcluirSessao}
        titulo="Excluir Sessão de Aula"
        mensagem="Tem certeza de que deseja enviar esta sessão e todos os seus conteúdos capturados para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluirSessaoAcao}
        onCancelar={() => setConfirmarExcluirSessao(false)}
      />
    </div>
  );
};
