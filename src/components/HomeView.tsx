import React, { useState, useEffect } from 'react';
import {
  Zap,
  BookOpen,
  Clock,
  Bookmark,
  Plus,
  ChevronRight,
  Lightbulb,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  getCursos,
  getDisciplinasPorCurso,
  getInformacoesImportantes,
  getProximasAulasHoje,
  getPerfil,
} from '../lib/storage';
import { VisualizacaoAtual, Curso, InformacaoImportante } from '../types';
import { getDicaAleatoria, DicaEstudo } from '../lib/notifications';

interface HomeViewProps {
  onNavegar: (view: VisualizacaoAtual) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavegar }) => {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [informacoes, setInformacoes] = useState<InformacaoImportante[]>([]);
  const [proximasAulas, setProximasAulas] = useState<
    ReturnType<typeof getProximasAulasHoje>
  >([]);
  const [dicaAtual, setDicaAtual] = useState<DicaEstudo | null>(null);
  const perfil = getPerfil();

  useEffect(() => {
    setCursos(getCursos());
    setInformacoes(getInformacoesImportantes().slice(0, 3)); // show top 3
    setProximasAulas(getProximasAulasHoje());
    if (perfil.dicasEstudoAtivas) {
      setDicaAtual(getDicaAleatoria());
    }
  }, []);

  // Format today date in Portuguese
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Date & Greeting Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4 pointer-events-none">
          <BookOpen className="w-64 h-64" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold tracking-wide uppercase">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{dataFormatada}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Olá, {perfil.nomeEstudante || 'Estudante'}!
          </h1>
          <p className="text-indigo-200 text-xs sm:text-sm max-w-lg">
            O que você gostaria de estudar ou capturar hoje? O aplicativo organiza tudo para você.
          </p>
        </div>
      </div>

      {/* Access to Modo Aula (Prominent Visual Card) */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg hover:shadow-xl transition-all border border-amber-400/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3 h-3 fill-white" />
              <span>Acesso Rápido</span>
            </div>
            <h2 className="text-xl font-black">Modo Aula Instantâneo</h2>
            <p className="text-amber-100 text-xs">
              Grave áudios, tire fotos e anote pontos importantes sem precisar navegar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavegar({ tipo: 'modo_aula' })}
            className="px-6 py-3 bg-white text-orange-600 font-bold rounded-2xl hover:bg-amber-50 transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer text-sm active:scale-95"
          >
            <Zap className="w-4 h-4 fill-orange-600" />
            <span>Iniciar Modo Aula</span>
          </button>
        </div>
      </div>

      {/* Proximas Aulas do Dia */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Aulas de Hoje</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavegar({ tipo: 'horario' })}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Ver Horário</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {proximasAulas.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500 text-xs">
            Nenhuma aula agendada para hoje. Toque em "Horário" para cadastrar sua rotina.
          </div>
        ) : (
          <div className="grid gap-2.5">
            {proximasAulas.map(({ horario, disciplina, curso, estaEmAndamento }) => (
              <div
                key={horario.id}
                onClick={() =>
                  disciplina &&
                  onNavegar({
                    tipo: 'disciplina_detalhe',
                    disciplinaId: disciplina.id,
                  })
                }
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  estaEmAndamento
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/50'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: curso?.cor || '#3F51B5' }}
                    ></span>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {disciplina?.nome || 'Disciplina'}
                    </span>
                    {estaEmAndamento && (
                      <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-extrabold rounded-full uppercase animate-pulse">
                        Em Andamento
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">
                    {curso?.nome} {horario.sala ? `• Sala ${horario.sala}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-slate-700 text-xs bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                    {horario.horaInicio} - {horario.horaFim}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meus Cursos Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>Meus Cursos</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavegar({ tipo: 'cursos' })}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Gerenciar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {cursos.length === 0 ? (
          <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
            <p className="text-slate-500 text-xs">Você ainda não possui cursos cadastrados.</p>
            <button
              type="button"
              onClick={() => onNavegar({ tipo: 'cursos' })}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Curso</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cursos.map((curso) => {
              const numDisc = getDisciplinasPorCurso(curso.id).length;
              return (
                <div
                  key={curso.id}
                  onClick={() => onNavegar({ tipo: 'curso_detalhe', cursoId: curso.id })}
                  className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: curso.cor }}
                    ></div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition">
                        {curso.nome}
                      </h3>
                      <p className="text-slate-500 text-xs">
                        {numDisc} {numDisc === 1 ? 'disciplina' : 'disciplinas'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Informações Importantes Summary */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>Informações Importantes</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavegar({ tipo: 'informacoes_importantes' })}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span>Ver todas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {informacoes.length === 0 ? (
          <p className="text-slate-400 text-xs italic py-2 text-center">
            Nenhuma informação importante marcada até agora.
          </p>
        ) : (
          <div className="space-y-2">
            {informacoes.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl space-y-1"
              >
                <p className="font-semibold text-slate-800 text-xs leading-relaxed">
                  "{item.texto}"
                </p>
                {item.origem && (
                  <p className="text-[10px] text-amber-800 font-medium italic">
                    Origem: {item.origem}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Study Tip Card */}
      {dicaAtual && (
        <div className="bg-indigo-50 border border-indigo-200/80 rounded-3xl p-4 flex gap-3.5 items-start">
          <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shrink-0 shadow-sm">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dica de Estudo: {dicaAtual.titulo}</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">{dicaAtual.conteudo}</p>
          </div>
        </div>
      )}
    </div>
  );
};
