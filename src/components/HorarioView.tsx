import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Zap,
  MapPin,
  X,
  Check,
  Calendar,
} from 'lucide-react';
import {
  getHorario,
  getDisciplinas,
  getCursos,
  saveHorarioAula,
  enviarHorarioParaLixeira,
} from '../lib/storage';
import { HorarioAula, Disciplina, Curso, VisualizacaoAtual } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface HorarioViewProps {
  onNavegar: (view: VisualizacaoAtual) => void;
}

const DIAS_SEMANA = [
  { id: 1, nome: 'Segunda-feira', curto: 'Seg' },
  { id: 2, nome: 'Terça-feira', curto: 'Ter' },
  { id: 3, nome: 'Quarta-feira', curto: 'Qua' },
  { id: 4, nome: 'Quinta-feira', curto: 'Qui' },
  { id: 5, nome: 'Sexta-feira', curto: 'Sex' },
  { id: 6, nome: 'Sábado', curto: 'Sáb' },
  { id: 7, nome: 'Domingo', curto: 'Dom' },
];

export const HorarioView: React.FC<HorarioViewProps> = ({ onNavegar }) => {
  const [horarios, setHorarios] = useState<HorarioAula[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [diaAtivo, setDiaAtivo] = useState<number>(() => {
    const today = new Date().getDay();
    return today === 0 ? 7 : today; // Convert 0 (Sun) to 7
  });

  // Modal State
  const [modalAberto, setModalAberto] = useState(false);
  const [discId, setDiscId] = useState('');
  const [diaSemana, setDiaSemana] = useState<number>(1);
  const [horaInicio, setHoraInicio] = useState('08:30');
  const [horaFim, setHoraFim] = useState('10:30');
  const [sala, setSala] = useState('');

  const [horarioParaExcluirId, setHorarioParaExcluirId] = useState<string | null>(null);

  const recarregar = () => {
    setHorarios(getHorario());
    const dList = getDisciplinas();
    setDisciplinas(dList);
    setCursos(getCursos());
    if (dList.length > 0 && !discId) {
      setDiscId(dList[0].id);
    }
  };

  useEffect(() => {
    recarregar();
  }, []);

  const handleAbrirModalModal = () => {
    setDiaSemana(diaAtivo);
    setModalAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discId) return;

    saveHorarioAula(discId, diaSemana, horaInicio, horaFim, sala.trim());
    setSala('');
    setModalAberto(false);
    recarregar();
  };

  const handleExcluir = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHorarioParaExcluirId(id);
  };

  const handleConfirmarExcluirHorario = () => {
    if (horarioParaExcluirId) {
      enviarHorarioParaLixeira(horarioParaExcluirId);
      setHorarioParaExcluirId(null);
      recarregar();
    }
  };

  // Horários for current active day tab
  const horariosDia = horarios
    .filter((h) => h.diaSemana === diaAtivo)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  return (
    <div className="space-y-6 pb-24">
      {/* Title Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-extrabold text-slate-800">Horário de Aulas</h1>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Cadastre o seu horário semanal para associar rapidamente as sessões no Modo Aula.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAbrirModalModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 text-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Aula ao Horário</span>
        </button>
      </div>

      {/* Weekday Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DIAS_SEMANA.map((dia) => {
          const numAulas = horarios.filter((h) => h.diaSemana === dia.id).length;
          return (
            <button
              key={dia.id}
              type="button"
              onClick={() => setDiaAtivo(dia.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex flex-col items-center gap-0.5 shrink-0 cursor-pointer ${
                diaAtivo === dia.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{dia.curto}</span>
              <span
                className={`text-[10px] font-medium ${
                  diaAtivo === dia.id ? 'text-indigo-200' : 'text-slate-400'
                }`}
              >
                {numAulas} {numAulas === 1 ? 'aula' : 'aulas'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Schedule List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>{DIAS_SEMANA.find((d) => d.id === diaAtivo)?.nome}</span>
        </h2>

        {horariosDia.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-3">
            <p>Nenhuma aula cadastrada para este dia da semana.</p>
            <button
              type="button"
              onClick={handleAbrirModalModal}
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Aula</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {horariosDia.map((item) => {
              const disc = disciplinas.find((d) => d.id === item.disciplinaId);
              const curso = disc ? cursos.find((c) => c.id === disc.cursoId) : undefined;
              return (
                <div
                  key={item.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-indigo-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-12 rounded-full shrink-0"
                      style={{ backgroundColor: curso?.cor || '#3F51B5' }}
                    ></div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        {curso?.nome}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm">{disc?.nome}</h3>
                      {item.sala && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span>Sala: {item.sala}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/80">
                    <span className="font-mono font-bold text-xs text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      {item.horaInicio} - {item.horaFim}
                    </span>

                    {/* Quick Start Modo Aula directly for this known scheduled class */}
                    <button
                      type="button"
                      onClick={() =>
                        disc &&
                        onNavegar({
                          tipo: 'modo_aula',
                          disciplinaIdPadrao: disc.id,
                        })
                      }
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl shadow-sm hover:from-amber-600 hover:to-orange-600 transition flex items-center gap-1 cursor-pointer"
                      title="Iniciar Modo Aula para esta disciplina"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Iniciar Aula</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleExcluir(item.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Timetable Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
              <h2 className="font-bold text-base">Adicionar Aula ao Horário</h2>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-indigo-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Disciplina *
                </label>
                <select
                  value={discId}
                  onChange={(e) => setDiscId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {disciplinas.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dia da Semana *
                </label>
                <select
                  value={diaSemana}
                  onChange={(e) => setDiaSemana(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hora de Início
                  </label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hora de Término
                  </label>
                  <input
                    type="time"
                    required
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Sala / Anfiteatro (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sala 2.04"
                  value={sala}
                  onChange={(e) => setSala(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/2 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-xs shadow-md flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Horário</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Schedule Modal */}
      <ConfirmModal
        isOpen={!!horarioParaExcluirId}
        titulo="Excluir Aula do Horário"
        mensagem="Mover esta aula do horário para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluirHorario}
        onCancelar={() => setHorarioParaExcluirId(null)}
      />
    </div>
  );
};
