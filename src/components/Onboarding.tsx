import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import {
  savePerfil,
  saveCurso,
  saveDisciplina,
  saveHorarioAula,
  getCursos,
  getDisciplinasPorCurso,
  deleteCurso,
  deleteDisciplina,
} from '../lib/storage';
import { Curso, Disciplina } from '../types';

interface OnboardingProps {
  onConcluido: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onConcluido }) => {
  const [etapa, setEtapa] = useState<number>(1);
  const [nomeEstudanteInput, setNomeEstudanteInput] = useState('');

  // Course creation inputs
  const [novoCursoNome, setNovoCursoNome] = useState('');
  const [cursosList, setCursosList] = useState<Curso[]>([]);

  // Discipline creation inputs
  const [cursoSelecionadoParaDisc, setCursoSelecionadoParaDisc] = useState<string>('');
  const [novaDiscNome, setNovaDiscNome] = useState('');
  const [novaDiscProfessor, setNovaDiscProfessor] = useState('');
  const [novaDiscSala, setNovaDiscSala] = useState('');
  const [disciplinasList, setDisciplinasList] = useState<Disciplina[]>([]);

  // Schedule input (optional step 4)
  const [discHorario, setDiscHorario] = useState('');
  const [diaSemanaHorario, setDiaSemanaHorario] = useState<number>(1);
  const [horaInicio, setHoraInicio] = useState('08:30');
  const [horaFim, setHoraFim] = useState('10:30');
  const [horariosAddCount, setHorariosAddCount] = useState<number>(0);

  // Step 1: Start
  const handleStart = () => {
    if (nomeEstudanteInput.trim()) {
      savePerfil({ nomeEstudante: nomeEstudanteInput.trim() });
    }
    setEtapa(2);
  };

  // Step 2: Add course
  const handleAddCurso = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!novoCursoNome.trim()) return;
    const c = saveCurso(novoCursoNome.trim());
    setCursosList(getCursos());
    setNovoCursoNome('');
    if (!cursoSelecionadoParaDisc) {
      setCursoSelecionadoParaDisc(c.id);
    }
  };

  const handleRemoveCurso = (id: string) => {
    deleteCurso(id);
    const atualizados = getCursos();
    setCursosList(atualizados);
    if (cursoSelecionadoParaDisc === id && atualizados.length > 0) {
      setCursoSelecionadoParaDisc(atualizados[0].id);
    }
  };

  const handleAvancarCursos = () => {
    if (cursosList.length === 0) {
      // Fallback if none added, add a default one
      const c = saveCurso('Meu Curso de Estudos');
      setCursosList([c]);
      setCursoSelecionadoParaDisc(c.id);
    } else {
      setCursoSelecionadoParaDisc(cursosList[0].id);
    }
    setEtapa(3);
  };

  // Step 3: Add Disciplina
  const handleAddDisciplina = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!novaDiscNome.trim() || !cursoSelecionadoParaDisc) return;
    saveDisciplina(
      cursoSelecionadoParaDisc,
      novaDiscNome.trim(),
      '',
      novaDiscProfessor.trim(),
      novaDiscSala.trim()
    );
    setNovaDiscNome('');
    setNovaDiscProfessor('');
    setNovaDiscSala('');

    // reload all
    const allCursos = getCursos();
    let allDiscs: Disciplina[] = [];
    allCursos.forEach((c) => {
      allDiscs = [...allDiscs, ...getDisciplinasPorCurso(c.id)];
    });
    setDisciplinasList(allDiscs);
  };

  const handleRemoveDisciplina = (id: string) => {
    deleteDisciplina(id);
    const allCursos = getCursos();
    let allDiscs: Disciplina[] = [];
    allCursos.forEach((c) => {
      allDiscs = [...allDiscs, ...getDisciplinasPorCurso(c.id)];
    });
    setDisciplinasList(allDiscs);
  };

  // Step 4: Add Horario
  const handleAddHorario = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!discHorario) return;
    saveHorarioAula(discHorario, diaSemanaHorario, horaInicio, horaFim);
    setHorariosAddCount((prev) => prev + 1);
  };

  // Step 5: Finalize
  const handleConcluirOnboarding = () => {
    savePerfil({ onboardingConcluido: true });
    onConcluido();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Progress Bar */}
        <div className="bg-indigo-600 p-6 text-white text-center relative">
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-2">
            <span>Configuração Inicial</span>
            <span>Etapa {etapa} de 5</span>
          </div>
          <div className="w-full bg-indigo-900/40 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${(etapa / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {/* ETAPA 1: BOAS VINDAS */}
          {etapa === 1 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                <GraduationCap className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Bem-vindo ao MyStudy</h1>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                  O seu espaço pessoal de organização e estudos. A nossa filosofia é simples:
                </p>
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 font-medium text-sm italic">
                  "O estudante adiciona. O aplicativo organiza."
                </div>
              </div>

              <div className="text-left space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Como gostaria de ser chamado?
                </label>
                <input
                  type="text"
                  placeholder="Seu nome (ex: Alex)"
                  value={nomeEstudanteInput}
                  onChange={(e) => setNomeEstudanteInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={handleStart}
                className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Começar</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* ETAPA 2: CURSOS */}
          {etapa === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                  <span>Quais cursos você está fazendo?</span>
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Você pode adicionar um ou mais cursos (ex: Contabilidade, Gestão de Empresas).
                </p>
              </div>

              <form onSubmit={handleAddCurso} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do curso (ex: Contabilidade)"
                  value={novoCursoNome}
                  onChange={(e) => setNovoCursoNome(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-1 shrink-0 cursor-pointer text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </form>

              {/* Course list preview */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cursosList.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
                    Nenhum curso adicionado ainda. Digite acima para criar.
                  </div>
                ) : (
                  cursosList.map((curso) => (
                    <div
                      key={curso.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: curso.cor }}
                        ></div>
                        <span className="font-semibold text-slate-800 text-sm">{curso.nome}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCurso(curso.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEtapa(1)}
                  className="w-1/3 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition text-sm cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleAvancarCursos}
                  disabled={cursosList.length === 0}
                  className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <span>Avançar para Disciplinas</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 3: DISCIPLINAS */}
          {etapa === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Adicionar Disciplinas
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Adicione as disciplinas correspondentes a cada curso cadastrado.
                </p>
              </div>

              {/* Course Selector Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {cursosList.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCursoSelecionadoParaDisc(c.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
                      cursoSelecionadoParaDisc === c.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c.nome}
                  </button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleAddDisciplina} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Nome da disciplina (ex: Contabilidade Geral)"
                  value={novaDiscNome}
                  onChange={(e) => setNovaDiscNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Professor (Opcional)"
                    value={novaDiscProfessor}
                    onChange={(e) => setNovaDiscProfessor(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Sala / Local (Opcional)"
                    value={novaDiscSala}
                    onChange={(e) => setNovaDiscSala(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Disciplina</span>
                </button>
              </form>

              {/* List */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {disciplinasList.filter((d) => d.cursoId === cursoSelecionadoParaDisc).length === 0 ? (
                  <p className="text-center py-4 text-slate-400 text-xs">
                    Nenhuma disciplina adicionada a este curso ainda.
                  </p>
                ) : (
                  disciplinasList
                    .filter((d) => d.cursoId === cursoSelecionadoParaDisc)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl"
                      >
                        <span className="font-medium text-slate-800 text-xs">{d.nome}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDisciplina(d.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEtapa(2)}
                  className="w-1/3 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition text-sm cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setEtapa(4)}
                  className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <span>Avançar para Horários</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 4: HORÁRIO (OPCIONAL) */}
          {etapa === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-indigo-600" />
                  <span>Cadastrar Horário de Aulas</span>
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Esta etapa é opcional. Você pode pular e cadastrar seus horários mais tarde.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleAddHorario} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disciplina</label>
                  <select
                    value={discHorario}
                    onChange={(e) => setDiscHorario(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione uma disciplina...</option>
                    {disciplinasList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Dia</label>
                    <select
                      value={diaSemanaHorario}
                      onChange={(e) => setDiaSemanaHorario(Number(e.target.value))}
                      className="w-full px-2 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-800"
                    >
                      <option value={1}>Segunda</option>
                      <option value={2}>Terça</option>
                      <option value={3}>Quarta</option>
                      <option value={4}>Quinta</option>
                      <option value={5}>Sexta</option>
                      <option value={6}>Sábado</option>
                      <option value={7}>Domingo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Início</label>
                    <input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full px-2 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Término</label>
                    <input
                      type="time"
                      value={horaFim}
                      onChange={(e) => setHoraFim(e.target.value)}
                      className="w-full px-2 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!discHorario}
                  className="w-full py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Aula ao Horário</span>
                </button>
              </form>

              {horariosAddCount > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{horariosAddCount} aula(s) cadastrada(s) com sucesso!</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEtapa(5)}
                  className="w-1/2 py-3 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-100 transition text-sm cursor-pointer"
                >
                  Pular esta etapa
                </button>
                <button
                  type="button"
                  onClick={() => setEtapa(5)}
                  className="w-1/2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <span>Concluir</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ETAPA 5: CONCLUÍDO */}
          {etapa === 5 && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 shadow-sm animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-800">Tudo pronto!</h2>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                  A sua configuração inicial foi concluída com sucesso. Agora você pode organizar
                  seus cursos, disciplinas, materiais e usar o <strong>Modo Aula</strong> para capturar
                  tudo em tempo real.
                </p>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-left text-xs text-indigo-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-indigo-700">
                  <Sparkles className="w-4 h-4" />
                  <span>Dica de Navegação Contextual:</span>
                </div>
                <p>
                  Quando estiver dentro de um curso, toque em "Adicionar" para criar disciplinas.
                  Quando estiver dentro de uma disciplina, qualquer material adicionado será associado automaticamente a ela!
                </p>
              </div>

              <button
                type="button"
                onClick={handleConcluirOnboarding}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-lg cursor-pointer text-sm"
              >
                Ir para a Tela Inicial
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
