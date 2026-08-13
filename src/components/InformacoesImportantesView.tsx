import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  Filter,
  X,
  Check,
} from 'lucide-react';
import {
  getInformacoesImportantes,
  getDisciplinas,
  getCursos,
  saveInformacaoImportante,
  enviarInformacaoParaLixeira,
} from '../lib/storage';
import { InformacaoImportante, Disciplina, Curso, VisualizacaoAtual } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface InformacoesImportantesViewProps {
  onNavegar: (view: VisualizacaoAtual) => void;
}

export const InformacoesImportantesView: React.FC<InformacoesImportantesViewProps> = ({
  onNavegar,
}) => {
  const [informacoes, setInformacoes] = useState<InformacaoImportante[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);

  // Filter & Search
  const [busca, setBusca] = useState('');
  const [disciplinaFiltro, setDisciplinaFiltro] = useState<string>('todas');

  // Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [discSelecionada, setDiscSelecionada] = useState<string>('');
  const [textoInput, setTextoInput] = useState('');
  const [origemInput, setOrigemInput] = useState('');

  const [infoParaExcluirId, setInfoParaExcluirId] = useState<string | null>(null);

  const recarregar = () => {
    setInformacoes(getInformacoesImportantes());
    const dList = getDisciplinas();
    setDisciplinas(dList);
    setCursos(getCursos());
    if (dList.length > 0 && !discSelecionada) {
      setDiscSelecionada(dList[0].id);
    }
  };

  useEffect(() => {
    recarregar();
  }, []);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoInput.trim() || !discSelecionada) return;

    saveInformacaoImportante(
      discSelecionada,
      textoInput.trim(),
      origemInput.trim() || 'Anotação direta'
    );

    setTextoInput('');
    setOrigemInput('');
    setModalAberto(false);
    recarregar();
  };

  const handleExcluir = (id: string) => {
    setInfoParaExcluirId(id);
  };

  const handleConfirmarExcluir = () => {
    if (infoParaExcluirId) {
      enviarInformacaoParaLixeira(infoParaExcluirId);
      setInfoParaExcluirId(null);
      recarregar();
    }
  };

  // Filtered list
  const informacoesFiltradas = informacoes.filter((inf) => {
    const matchBusca =
      inf.texto.toLowerCase().includes(busca.toLowerCase()) ||
      inf.origem.toLowerCase().includes(busca.toLowerCase());
    const matchDisc = disciplinaFiltro === 'todas' || inf.disciplinaId === disciplinaFiltro;
    return matchBusca && matchDisc;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bookmark className="w-6 h-6 fill-white" />
            <h1 className="text-2xl font-black">Informações Importantes</h1>
          </div>
          <p className="text-amber-100 text-xs mt-1">
            Sua biblioteca central de fórmulas, conceitos e anotações essenciais de todas as disciplinas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="px-4 py-2.5 bg-white text-amber-700 font-bold rounded-2xl hover:bg-amber-50 transition shadow-md flex items-center justify-center gap-1.5 text-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-700" />
          <span>Nova Informação</span>
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar conceitos, fórmulas, referências..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={disciplinaFiltro}
            onChange={(e) => setDisciplinaFiltro(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
          >
            <option value="todas">Todas as Disciplinas</option>
            {disciplinas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {informacoesFiltradas.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
          <p className="text-slate-500 text-xs">
            Nenhuma informação importante encontrada com esses critérios.
          </p>
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs hover:bg-amber-600 transition inline-flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Informação</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {informacoesFiltradas.map((inf) => {
            const disc = disciplinas.find((d) => d.id === inf.disciplinaId);
            const curso = disc ? cursos.find((c) => c.id === disc.cursoId) : undefined;
            return (
              <div
                key={inf.id}
                className="p-5 bg-amber-50/70 border border-amber-200 rounded-3xl shadow-sm space-y-3 flex flex-col justify-between relative group hover:shadow-md transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    {disc && (
                      <span
                        onClick={() =>
                          onNavegar({
                            tipo: 'disciplina_detalhe',
                            disciplinaId: disc.id,
                            abaInicial: 'informacoes',
                          })
                        }
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-md text-white cursor-pointer hover:opacity-90 transition"
                        style={{ backgroundColor: curso?.cor || '#3F51B5' }}
                      >
                        {disc.nome}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleExcluir(inf.id)}
                      className="text-amber-700 hover:text-red-600 p-1 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="font-bold text-slate-800 text-sm leading-relaxed">
                    "{inf.texto}"
                  </p>
                </div>

                {inf.origem && (
                  <div className="pt-2 border-t border-amber-200/60 text-[11px] font-medium text-amber-900 italic">
                    Origem: {inf.origem}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-amber-500 p-5 text-white flex items-center justify-between">
              <h2 className="font-bold text-base">Guardar Informação Importante</h2>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="text-amber-100 hover:text-white p-1"
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
                  value={discSelecionada}
                  onChange={(e) => setDiscSelecionada(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
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
                  Conceito / Fórmula / Informação *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Ativo = Passivo + Capital Próprio..."
                  value={textoInput}
                  onChange={(e) => setTextoInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Origem / Referência (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Contabilidade Geral - Aula 03 - Pág 12"
                  value={origemInput}
                  onChange={(e) => setOrigemInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm"
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
                  className="w-1/2 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition text-xs shadow-md flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!infoParaExcluirId}
        titulo="Excluir Informação Important"
        mensagem="Enviar esta informação importante para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluir}
        onCancelar={() => setInfoParaExcluirId(null)}
      />
    </div>
  );
};
