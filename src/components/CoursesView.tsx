import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Layers,
  X,
  Check,
} from 'lucide-react';
import {
  getCursos,
  getDisciplinasPorCurso,
  saveCurso,
  enviarCursoParaLixeira,
  CORES_PALETA,
} from '../lib/storage';
import { Curso, VisualizacaoAtual } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface CoursesViewProps {
  onNavegar: (view: VisualizacaoAtual) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ onNavegar }) => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [cursoEmEdicao, setCursoEmEdicao] = useState<Curso | null>(null);
  const [cursoParaExcluirId, setCursoParaExcluirId] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const recarregar = () => {
    setCursos(getCursos());
  };

  useEffect(() => {
    recarregar();
  }, []);

  const handleAbrirModalModalCriar = () => {
    setCursoEmEdicao(null);
    setNome('');
    setDescricao('');
    setModalAberto(true);
  };

  const handleAbrirModalEditar = (curso: Curso, e: React.MouseEvent) => {
    e.stopPropagation();
    setCursoEmEdicao(curso);
    setNome(curso.nome);
    setDescricao(curso.descricao || '');
    setModalAberto(true);
  };

  const handleExcluirCurso = (cursoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCursoParaExcluirId(cursoId);
  };

  const handleConfirmarExcluirCurso = () => {
    if (cursoParaExcluirId) {
      enviarCursoParaLixeira(cursoParaExcluirId);
      setCursoParaExcluirId(null);
      recarregar();
    }
  };

  const handleSalvarCurso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    saveCurso(nome.trim(), descricao.trim(), cursoEmEdicao?.id);
    setModalAberto(false);
    recarregar();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title & Add Course Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-800">Meus Cursos</h1>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Gerencie os seus cursos académicos. Selecione um curso para ver suas disciplinas.
          </p>
        </div>

        {/* Exclusively "+ Adicionar Curso" button on Courses page */}
        <button
          type="button"
          onClick={handleAbrirModalModalCriar}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-2 text-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Curso</span>
        </button>
      </div>

      {/* Courses List */}
      {cursos.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-300 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Nenhum curso cadastrado</h2>
            <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1">
              Toque no botão "+ Adicionar Curso" acima para começar a organizar suas disciplinas.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAbrirModalModalCriar}
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            + Adicionar Curso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cursos.map((curso) => {
            const numDisciplinas = getDisciplinasPorCurso(curso.id).length;
            return (
              <div
                key={curso.id}
                onClick={() => onNavegar({ tipo: 'curso_detalhe', cursoId: curso.id })}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer space-y-4 group relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0"
                      style={{ backgroundColor: curso.cor }}
                    >
                      {curso.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition">
                        {curso.nome}
                      </h2>
                      {curso.descricao && (
                        <p className="text-slate-500 text-xs line-clamp-1">{curso.descricao}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={(e) => handleAbrirModalEditar(curso, e)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      title="Editar Curso"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleExcluirCurso(curso.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Excluir Curso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {numDisciplinas} {numDisciplinas === 1 ? 'disciplina' : 'disciplinas'}
                    </span>
                  </span>

                  <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
                    <span>Ver Disciplinas</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Course */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
              <h2 className="font-bold text-base">
                {cursoEmEdicao ? 'Editar Curso' : 'Adicionar Novo Curso'}
              </h2>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarCurso} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome do Curso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Contabilidade, Gestão de Empresas..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Licenciatura 2026/2027..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 text-sm"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/2 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-md text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!cursoParaExcluirId}
        titulo="Excluir Curso"
        mensagem="Enviar este curso para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluirCurso}
        onCancelar={() => setCursoParaExcluirId(null)}
      />
    </div>
  );
};
