import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  FileText,
  Bookmark,
  Zap,
  Edit2,
  Trash2,
  Download,
  ExternalLink,
  Search,
  Check,
  X,
  Sparkles,
  Camera,
  Mic,
  Video,
  Eye,
  Calendar,
  MoreVertical,
  Star,
  Share2,
} from 'lucide-react';
import {
  getDisciplinas,
  getCursos,
  getMateriaisPorDisciplina,
  getApontamentosPorDisciplina,
  getInformacoesPorDisciplina,
  getSessoesPorDisciplina,
  deleteMaterial,
  deleteApontamento,
  deleteInformacaoImportante,
  saveApontamento,
  saveInformacaoImportante,
  deleteSessaoAula,
} from '../lib/storage';
import {
  Disciplina,
  Curso,
  MaterialItem,
  Apontamento,
  InformacaoImportante,
  SessaoAula,
  VisualizacaoAtual,
} from '../types';
import { MaterialModal } from './MaterialModal';
import { MaterialViewerModal } from './MaterialViewerModal';
import { MaterialActionMenuModal } from './MaterialActionMenuModal';
import { SessionDetailModal } from './SessionDetailModal';

interface SubjectDetailViewProps {
  disciplinaId: string;
  abaInicial?: 'materiais' | 'apontamentos' | 'informacoes' | 'aulas';
  onNavegar: (view: VisualizacaoAtual) => void;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  disciplinaId,
  abaInicial = 'materiais',
  onNavegar,
}) => {
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<
    'materiais' | 'apontamentos' | 'informacoes' | 'aulas'
  >(abaInicial);

  // Data lists
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [informacoes, setInformacoes] = useState<InformacaoImportante[]>([]);
  const [sessoes, setSessoes] = useState<SessaoAula[]>([]);

  // Modals & Forms
  const [modalMaterialAberto, setModalMaterialAberto] = useState(false);
  const [materialSelecionado, setMaterialSelecionado] = useState<MaterialItem | null>(null);
  const [materialParaMenu, setMaterialParaMenu] = useState<MaterialItem | null>(null);
  const [sessaoSelecionada, setSessaoSelecionada] = useState<SessaoAula | null>(null);

  // Apontamento Form Modal
  const [modalApontamentoAberto, setModalApontamentoAberto] = useState(false);
  const [apontamentoEmEdicao, setApontamentoEmEdicao] = useState<Apontamento | null>(null);
  const [tituloApontamento, setTituloApontamento] = useState('');
  const [textoApontamento, setTextoApontamento] = useState('');
  const [eImportanteApontamento, setEImportanteApontamento] = useState(false);

  // Informação Importante Form Modal
  const [modalInformacaoAberto, setModalInformacaoAberto] = useState(false);
  const [textoInformacao, setTextoInformacao] = useState('');
  const [origemInformacao, setOrigemInformacao] = useState('');

  // Search filter
  const [busca, setBusca] = useState('');

  const recarregar = () => {
    const discList = getDisciplinas();
    const d = discList.find((item) => item.id === disciplinaId);
    if (d) {
      setDisciplina(d);
      const c = getCursos().find((item) => item.id === d.cursoId);
      setCurso(c || null);

      setMateriais(getMateriaisPorDisciplina(disciplinaId));
      setApontamentos(getApontamentosPorDisciplina(disciplinaId));
      setInformacoes(getInformacoesPorDisciplina(disciplinaId));
      setSessoes(getSessoesPorDisciplina(disciplinaId));
    }
  };

  useEffect(() => {
    recarregar();
  }, [disciplinaId]);

  // Handle Apontamento
  const handleAbrirCriarApontamento = () => {
    setApontamentoEmEdicao(null);
    setTituloApontamento('');
    setTextoApontamento('');
    setEImportanteApontamento(false);
    setModalApontamentoAberto(true);
  };

  const handleAbrirEditarApontamento = (a: Apontamento) => {
    setApontamentoEmEdicao(a);
    setTituloApontamento(a.titulo);
    setTextoApontamento(a.texto);
    setEImportanteApontamento(a.eImportante);
    setModalApontamentoAberto(true);
  };

  const handleSalvarApontamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloApontamento.trim() || !textoApontamento.trim()) return;

    saveApontamento(
      disciplinaId,
      tituloApontamento.trim(),
      textoApontamento.trim(),
      [],
      [],
      eImportanteApontamento,
      apontamentoEmEdicao?.id
    );

    setModalApontamentoAberto(false);
    recarregar();
  };

  const handleExcluirApontamento = (id: string) => {
    if (window.confirm('Deseja excluir este apontamento?')) {
      deleteApontamento(id);
      recarregar();
    }
  };

  // Handle Informacao Importante
  const handleSalvarInformacao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoInformacao.trim()) return;

    saveInformacaoImportante(
      disciplinaId,
      textoInformacao.trim(),
      origemInformacao.trim() || `${disciplina?.nome || 'Disciplina'}`
    );

    setTextoInformacao('');
    setOrigemInformacao('');
    setModalInformacaoAberto(false);
    recarregar();
  };

  const handleExcluirInformacao = (id: string) => {
    if (window.confirm('Deseja remover esta informação importante?')) {
      deleteInformacaoImportante(id);
      recarregar();
    }
  };

  // Handle Material Delete
  const handleExcluirMaterial = (id: string) => {
    if (window.confirm('Deseja remover este material?')) {
      deleteMaterial(id);
      recarregar();
    }
  };

  // Handle Session Delete
  const handleExcluirSessao = (id: string) => {
    if (window.confirm('Deseja remover o registo desta aula?')) {
      deleteSessaoAula(id);
      recarregar();
    }
  };

  if (!disciplina) {
    return (
      <div className="p-8 text-center text-slate-500">
        Disciplina não encontrada.
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
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                curso
                  ? onNavegar({ tipo: 'curso_detalhe', cursoId: curso.id })
                  : onNavegar({ tipo: 'cursos' })
              }
              className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                {curso?.nome || 'Curso'}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                {disciplina.nome}
              </h1>
            </div>
          </div>

          {/* Start Modo Aula specifically for this subject */}
          <button
            type="button"
            onClick={() =>
              onNavegar({
                tipo: 'modo_aula',
                disciplinaIdPadrao: disciplina.id,
              })
            }
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-2xl shadow-md hover:from-amber-600 hover:to-orange-600 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">Modo Aula Aqui</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar nesta disciplina..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800"
          />
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pt-1">
          <button
            type="button"
            onClick={() => setAbaAtiva('materiais')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              abaAtiva === 'materiais'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Materiais ({materiais.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('apontamentos')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              abaAtiva === 'apontamentos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Apontamentos ({apontamentos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('informacoes')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              abaAtiva === 'informacoes'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-amber-500" />
            <span>Info Importantes ({informacoes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('aulas')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              abaAtiva === 'aulas'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Aulas Gravadas ({sessoes.length})</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: MATERIAIS --- */}
      {abaAtiva === 'materiais' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Materiais de Estudo
            </h2>

            {/* "+ Adicionar Material" automatically associated to current discipline */}
            <button
              type="button"
              onClick={() => setModalMaterialAberto(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Material</span>
            </button>
          </div>

          {materiais.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
              <p className="text-slate-500 text-xs">
                Ainda não há materiais nesta disciplina. Adicione PDFs, fotografias, áudios ou links.
              </p>
              <button
                type="button"
                onClick={() => setModalMaterialAberto(true)}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Material</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {materiais
                .filter((m) => m.titulo.toLowerCase().includes(busca.toLowerCase()))
                .map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setMaterialSelecionado(m)}
                    className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3 relative group hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                            {m.tipo === 'fotografia' && <Camera className="w-5 h-5" />}
                            {m.tipo === 'audio' && <Mic className="w-5 h-5" />}
                            {m.tipo === 'video' && <Video className="w-5 h-5" />}
                            {m.tipo === 'link' && <ExternalLink className="w-5 h-5" />}
                            {m.tipo === 'documento' && <FileText className="w-5 h-5" />}
                            {m.tipo === 'texto' && <FileText className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition">
                                {m.titulo}
                              </h3>
                              {m.eImportante && (
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              {m.tipo} • {new Date(m.dataCriacao).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Options Button ⋮ */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMaterialParaMenu(m);
                          }}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                          title="Opções do Material (⋮)"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Preview / Content Snippet */}
                      {m.tipo === 'texto' && (
                        <p className="text-slate-600 text-xs bg-slate-50 p-3 rounded-2xl line-clamp-2">
                          {m.conteudo}
                        </p>
                      )}

                      {m.tipo === 'link' && (
                        <p className="text-xs font-semibold text-indigo-600 underline flex items-center gap-1 truncate bg-slate-50 p-2 rounded-xl">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{m.conteudo}</span>
                        </p>
                      )}

                      {m.tipo === 'documento' && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-700">
                          <span className="truncate font-semibold max-w-[180px]">
                            {m.nomeArquivo || 'Documento PDF/DOC'}
                          </span>
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                            Ver Ficheiro
                          </span>
                        </div>
                      )}

                      {m.tipo === 'fotografia' && m.conteudo && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 h-32 bg-slate-100">
                          <img
                            src={m.conteudo}
                            alt={m.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {m.tipo === 'audio' && m.conteudo && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-1"
                        >
                          <audio src={m.conteudo} controls className="w-full h-8" />
                        </div>
                      )}

                      {m.tipo === 'video' && m.conteudo && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black max-h-36 flex items-center justify-center">
                          <video src={m.conteudo} className="w-full max-h-36 object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Quick Open Action Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Abrir Material</span>
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: APONTAMENTOS --- */}
      {abaAtiva === 'apontamentos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Apontamentos da Disciplina
            </h2>
            <button
              type="button"
              onClick={handleAbrirCriarApontamento}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Apontamento</span>
            </button>
          </div>

          {apontamentos.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
              <p className="text-slate-500 text-xs">Nenhum apontamento criado ainda.</p>
              <button
                type="button"
                onClick={handleAbrirCriarApontamento}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Apontamento</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {apontamentos
                .filter(
                  (a) =>
                    a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                    a.texto.toLowerCase().includes(busca.toLowerCase())
                )
                .map((a) => (
                  <div
                    key={a.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-base">{a.titulo}</h3>
                          {a.eImportante && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                              <Bookmark className="w-3 h-3 fill-amber-600" />
                              <span>Importante</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Criado em: {new Date(a.dataCriacao).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarApontamento(a)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirApontamento(a.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      {a.texto}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 3: INFORMAÇÕES IMPORTANTES --- */}
      {abaAtiva === 'informacoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Informações Importantes Guardadas
            </h2>
            <button
              type="button"
              onClick={() => setModalInformacaoAberto(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Info Importante</span>
            </button>
          </div>

          {informacoes.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
              <p className="text-slate-500 text-xs">
                Nenhuma informação importante guardada especificamente nesta disciplina.
              </p>
              <button
                type="button"
                onClick={() => setModalInformacaoAberto(true)}
                className="px-4 py-2 bg-amber-500 text-white font-semibold rounded-xl text-xs hover:bg-amber-600 transition inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar Informação</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {informacoes
                .filter((inf) => inf.texto.toLowerCase().includes(busca.toLowerCase()))
                .map((inf) => (
                  <div
                    key={inf.id}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-3xl space-y-2 relative flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800 text-sm leading-relaxed">
                        "{inf.texto}"
                      </p>
                      {inf.origem && (
                        <p className="text-xs text-amber-800 font-medium italic">
                          Origem: {inf.origem}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExcluirInformacao(inf.id)}
                      className="text-amber-700 hover:text-red-600 p-1 rounded-lg shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 4: AULAS GRAVADAS (SESSÕES) --- */}
      {abaAtiva === 'aulas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Aulas Gravadas (Sessões do Modo Aula)
            </h2>
            <button
              type="button"
              onClick={() =>
                onNavegar({
                  tipo: 'modo_aula',
                  disciplinaIdPadrao: disciplina.id,
                })
              }
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Iniciar Nova Aula</span>
            </button>
          </div>

          {sessoes.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
              <p className="text-slate-500 text-xs">
                Nenhuma sessão de aula gravada para esta disciplina. Use o <strong>Modo Aula</strong> para capturar tudo durante a aula.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sessoes.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSessaoSelecionada(s)}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md transition cursor-pointer space-y-3 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition">
                        {s.titulo}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {new Date(s.dataInicio).toLocaleDateString()} • {s.duracaoMinutos || 0} min
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="p-2 text-indigo-600 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
                        <Eye className="w-4 h-4" />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExcluirSessao(s.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                    {s.audios.length > 0 && (
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg flex items-center gap-1">
                        <Mic className="w-3 h-3 text-indigo-600" />
                        <span>{s.audios.length} áudios</span>
                      </span>
                    )}
                    {s.fotografias.length > 0 && (
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg flex items-center gap-1">
                        <Camera className="w-3 h-3 text-indigo-600" />
                        <span>{s.fotografias.length} fotos</span>
                      </span>
                    )}
                    {s.videos.length > 0 && (
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg flex items-center gap-1">
                        <Video className="w-3 h-3 text-indigo-600" />
                        <span>{s.videos.length} vídeos</span>
                      </span>
                    )}
                    {s.notas.length > 0 && (
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-600" />
                        <span>{s.notas.length} notas</span>
                      </span>
                    )}
                    {s.informacoesImportantes.length > 0 && (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg flex items-center gap-1">
                        <Bookmark className="w-3 h-3 fill-amber-600" />
                        <span>{s.informacoesImportantes.length} info imp</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Material Modal */}
      {modalMaterialAberto && (
        <MaterialModal
          disciplinaId={disciplinaId}
          disciplinaNome={disciplina.nome}
          onFechar={() => setModalMaterialAberto(false)}
          onSalvo={recarregar}
        />
      )}

      {/* Apontamento Modal */}
      {modalApontamentoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
              <h2 className="font-bold text-base">
                {apontamentoEmEdicao ? 'Editar Apontamento' : 'Criar Apontamento'}
              </h2>
              <button
                type="button"
                onClick={() => setModalApontamentoAberto(false)}
                className="text-indigo-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarApontamento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tópicos de Estudo para Exame..."
                  value={tituloApontamento}
                  onChange={(e) => setTituloApontamento(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Texto do Apontamento *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Escreva suas anotações detalhadas aqui..."
                  value={textoApontamento}
                  onChange={(e) => setTextoApontamento(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkImportante"
                  checked={eImportanteApontamento}
                  onChange={(e) => setEImportanteApontamento(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 border-slate-300"
                />
                <label htmlFor="chkImportante" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Marcar também como "Informação Importante"
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalApontamentoAberto(false)}
                  className="w-1/2 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-md text-xs flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Apontamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Informação Importante Modal */}
      {modalInformacaoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-amber-500 p-5 text-white flex items-center justify-between">
              <h2 className="font-bold text-base">Guardar Informação Importante</h2>
              <button
                type="button"
                onClick={() => setModalInformacaoAberto(false)}
                className="text-amber-100 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarInformacao} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Informação / Conceito Importante *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Ativo = Passivo + Capital Próprio..."
                  value={textoInformacao}
                  onChange={(e) => setTextoInformacao(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Origem / Referência
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aula 03 - pág 12"
                  value={origemInformacao}
                  onChange={(e) => setOrigemInformacao(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalInformacaoAberto(false)}
                  className="w-1/2 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition shadow-md text-xs flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Material Viewer Modal */}
      {materialSelecionado && (
        <MaterialViewerModal
          material={materialSelecionado}
          disciplinaNome={disciplina?.nome}
          onFechar={() => setMaterialSelecionado(null)}
          onExcluir={(id) => {
            handleExcluirMaterial(id);
            setMaterialSelecionado(null);
          }}
          onAtualizado={carregarDados}
        />
      )}

      {/* Material Options Menu Modal (⋮) */}
      {materialParaMenu && (
        <MaterialActionMenuModal
          material={materialParaMenu}
          onFechar={() => setMaterialParaMenu(null)}
          onAtualizado={carregarDados}
          onRemovido={carregarDados}
        />
      )}

      {/* Session Detail Modal */}
      {sessaoSelecionada && (
        <SessionDetailModal
          sessao={sessaoSelecionada}
          onFechar={() => setSessaoSelecionada(null)}
        />
      )}
    </div>
  );
};
