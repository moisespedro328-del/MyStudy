import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  BookOpen,
  User,
  MapPin,
  X,
  Check,
} from 'lucide-react';
import {
  getCursos,
  getDisciplinasPorCurso,
  saveDisciplina,
  enviarDisciplinaParaLixeira,
} from '../lib/storage';
import { Curso, Disciplina, VisualizacaoAtual } from '../types';

interface CourseDetailViewProps {
  cursoId: string;
  onNavegar: (view: VisualizacaoAtual) => void;
}

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({
  cursoId,
  onNavegar,
}) => {
  const [curso, setCurso] = useState<Curso | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [disciplinaEmEdicao, setDisciplinaEmEdicao] = useState<Disciplina | null>(null);

  // Form states for Disciplina
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [professor, setProfessor] = useState('');
  const [sala, setSala] = useState('');

  const recarregar = () => {
    const todosCursos = getCursos();
    const c = todosCursos.find((item) => item.id === cursoId);
    if (c) {
      setCurso(c);
      setDisciplinas(getDisciplinasPorCurso(cursoId));
    }
  };

  useEffect(() => {
    recarregar();
  }, [cursoId]);

  const handleAbrirModalCriar = () => {
    setDisciplinaEmEdicao(null);
    setNome('');
    setCodigo('');
    setProfessor('');
    setSala('');
    setModalAberto(true);
  };

  const handleAbrirModalEditar = (d: Disciplina, e: React.MouseEvent) => {
    e.stopPropagation();
    setDisciplinaEmEdicao(d);
    setNome(d.nome);
    setCodigo(d.codigo || '');
    setProfessor(d.professor || '');
    setSala(d.sala || '');
    setModalAberto(true);
  };

  const handleExcluirDisciplina = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        'Mover esta disciplina para a Lixeira? Os seus materiais e anotações serão guardados com ela.'
      )
    ) {
      enviarDisciplinaParaLixeira(id);
      recarregar();
    }
  };

  const handleSalvarDisciplina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !curso) return;
    saveDisciplina(
      curso.id,
      nome.trim(),
      codigo.trim(),
      professor.trim(),
      sala.trim(),
      disciplinaEmEdicao?.id
    );
    setModalAberto(false);
    recarregar();
  };

  if (!curso) {
    return (
      <div className="p-8 text-center text-slate-500">
        Curso não encontrado.
        <button
          type="button"
          onClick={() => onNavegar({ tipo: 'cursos' })}
          className="ml-2 text-indigo-600 font-bold underline cursor-pointer"
        >
          Voltar para Cursos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Back button & Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onNavegar({ tipo: 'cursos' })}
          className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-2xl transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600">
            Curso
          </span>
          <h1 className="text-2xl font-extrabold text-slate-800">{curso.nome}</h1>
        </div>

        {/* Exclusively "+ Adicionar Disciplina" button inside a Course page */}
        <button
          type="button"
          onClick={handleAbrirModalCriar}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 text-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Disciplina</span>
        </button>
      </div>

      {/* Disciplines Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Disciplinas do Curso ({disciplinas.length})
          </h2>
        </div>

        {disciplinas.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
            <p className="text-slate-500 text-xs">
              Ainda não existem disciplinas cadastradas para este curso.
            </p>
            <button
              type="button"
              onClick={handleAbrirModalCriar}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Disciplina</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {disciplinas.map((disc) => (
              <div
                key={disc.id}
                onClick={() =>
                  onNavegar({
                    tipo: 'disciplina_detalhe',
                    disciplinaId: disc.id,
                  })
                }
                className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {disc.codigo && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                        {disc.codigo}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition">
                      {disc.nome}
                    </h3>
                  </div>

                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => handleAbrirModalEditar(disc, e)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      title="Editar Disciplina"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleExcluirDisciplina(disc.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Excluir Disciplina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  {disc.professor && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{disc.professor}</span>
                    </span>
                  )}
                  {disc.sala && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{disc.sala}</span>
                    </span>
                  )}

                  <span className="ml-auto font-bold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-0.5">
                    <span>Abrir</span>
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add / Edit Disciplina */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
              <h2 className="font-bold text-base">
                {disciplinaEmEdicao ? 'Editar Disciplina' : 'Adicionar Nova Disciplina'}
              </h2>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarDisciplina} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Disciplina *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Contabilidade Geral, Fiscalidade..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Código (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: CG101"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Professor (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Prof. Nome"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Sala / Anfiteatro
                  </label>
                  <input
                    type="text"
                    placeholder="Sala 2.04"
                    value={sala}
                    onChange={(e) => setSala(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  />
                </div>
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
    </div>
  );
};
