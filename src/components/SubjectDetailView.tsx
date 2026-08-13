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
  enviarMaterialParaLixeira,
  enviarApontamentoParaLixeira,
  enviarInformacaoParaLixeira,
  enviarDisciplinaParaLixeira,
  saveApontamento,
  saveInformacaoImportante,
  enviarSessaoParaLixeira,
  atualizarDisciplinaSessao,
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
import { ConfirmModal } from './ConfirmModal';
import {
  CategoriaMaterial,
  CATEGORIAS_CONFIG,
  getCategoriaMaterial,
  isModoAulaMaterial,
  getContadoresCategorias,
} from '../lib/materialUtils';

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

  // Delete Confirm Modal States
  const [apontamentoParaExcluirId, setApontamentoParaExcluirId] = useState<string | null>(null);
  const [infoParaExcluirId, setInfoParaExcluirId] = useState<string | null>(null);
  const [confirmarExcluirDisciplina, setConfirmarExcluirDisciplina] = useState(false);
  const [materialParaExcluirId, setMaterialParaExcluirId] = useState<string | null>(null);
  const [sessaoParaExcluirId, setSessaoParaExcluirId] = useState<string | null>(null);

  // Search filter & Material Categories
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaMaterial | 'todas'>('todas');
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'antigos' | 'az'>('recentes');

  // Computed counters & filtered materials
  const contadores = getContadoresCategorias(materiais);

  const materiaisFiltrados = materiais
    .filter((m) => {
      if (categoriaFiltro !== 'todas' && getCategoriaMaterial(m) !== categoriaFiltro) {
        return false;
      }
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const matchTitulo = m.titulo.toLowerCase().includes(q);
        const matchNome = (m.nomeArquivo || '').toLowerCase().includes(q);
        const matchConteudo = (m.conteudo || '').toLowerCase().includes(q);
        return matchTitulo || matchNome || matchConteudo;
      }
      return true;
    })
    .sort((a, b) => {
      if (ordenacao === 'recentes') {
        return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
      }
      if (ordenacao === 'antigos') {
        return new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime();
      }
      if (ordenacao === 'az') {
        return a.titulo.localeCompare(b.titulo);
      }
      return 0;
    });

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
    setApontamentoParaExcluirId(id);
  };

  const handleConfirmarExcluirApontamento = () => {
    if (apontamentoParaExcluirId) {
      enviarApontamentoParaLixeira(apontamentoParaExcluirId);
      setApontamentoParaExcluirId(null);
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
    setInfoParaExcluirId(id);
  };

  const handleConfirmarExcluirInformacao = () => {
    if (infoParaExcluirId) {
      enviarInformacaoParaLixeira(infoParaExcluirId);
      setInfoParaExcluirId(null);
      recarregar();
    }
  };

  const handleExcluirDisciplina = () => {
    setConfirmarExcluirDisciplina(true);
  };

  const handleConfirmarExcluirDisciplinaAcao = () => {
    if (disciplina) {
      enviarDisciplinaParaLixeira(disciplina.id);
      setConfirmarExcluirDisciplina(false);
      if (curso) {
        onNavegar({ tipo: 'curso_detalhe', cursoId: curso.id });
      } else {
        onNavegar({ tipo: 'cursos' });
      }
    }
  };

  // Handle Material Delete
  const handleExcluirMaterial = (id: string) => {
    setMaterialParaExcluirId(id);
  };

  const handleConfirmarExcluirMaterial = () => {
    if (materialParaExcluirId) {
      enviarMaterialParaLixeira(materialParaExcluirId);
      setMaterialParaExcluirId(null);
      recarregar();
    }
  };

  // Handle Session Delete
  const handleExcluirSessao = (id: string) => {
    setSessaoParaExcluirId(id);
  };

  const handleConfirmarExcluirSessao = () => {
    if (sessaoParaExcluirId) {
      enviarSessaoParaLixeira(sessaoParaExcluirId);
      setSessaoParaExcluirId(null);
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
            <div className="flex items-center gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                  {curso?.nome || 'Curso'}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-800">
                  {disciplina.nome}
                </h1>
              </div>
              <button
                type="button"
                onClick={handleExcluirDisciplina}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                title="Excluir Disciplina"
              >
                <Trash2 className="w-5 h-5" />
              </button>
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
        <div className="space-y-5">
          {/* Top Bar: Title & Adicionar Material */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span>Materiais de Estudo</span>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-extrabold">
                  {materiais.length}
                </span>
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Organizados por categoria automaticamente
              </p>
            </div>

            <button
              type="button"
              onClick={() => setModalMaterialAberto(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Material</span>
            </button>
          </div>

          {/* Category Filter Pills / Selector */}
          <div className="space-y-3 bg-white p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Categorias de Conteúdo
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">Ordenar:</span>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="recentes">Mais recentes primeiro</option>
                  <option value="antigos">Mais antigos primeiro</option>
                  <option value="az">A - Z (Título)</option>
                </select>
              </div>
            </div>

            {/* Pill Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {/* TODAS button */}
              <button
                type="button"
                onClick={() => setCategoriaFiltro('todas')}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  categoriaFiltro === 'todas'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Todos</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    categoriaFiltro === 'todas'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {contadores.todas}
                </span>
              </button>

              {/* Category-specific buttons */}
              {(['documentos', 'videos', 'audios', 'fotografias', 'links'] as CategoriaMaterial[]).map(
                (catKey) => {
                  const conf = CATEGORIAS_CONFIG[catKey];
                  const qtd = contadores[catKey] || 0;
                  const eAtivo = categoriaFiltro === catKey;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategoriaFiltro(catKey)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                        eAtivo
                          ? `${conf.corBadge} border-transparent shadow-md`
                          : `${conf.corBg} ${conf.corTexto} ${conf.corBorda}`
                      }`}
                    >
                      <span className="text-sm">{conf.icone}</span>
                      <span>{conf.nome}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          eAtivo ? 'bg-white/20 text-white' : 'bg-white/80 text-slate-800'
                        }`}
                      >
                        {qtd}
                      </span>
                    </button>
                  );
                }
              )}

              {/* OUTROS button (if any item exists in Outros or if active) */}
              {(contadores.outros > 0 || categoriaFiltro === 'outros') && (
                <button
                  type="button"
                  onClick={() => setCategoriaFiltro('outros')}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                    categoriaFiltro === 'outros'
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>📦</span>
                  <span>Outros</span>
                  <span className="px-1.5 py-0.2 bg-white/30 rounded-full text-[10px] font-extrabold">
                    {contadores.outros}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Active Category Header Banner if filtered */}
          {categoriaFiltro !== 'todas' && (
            <div className="flex items-center justify-between p-3 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <span className="text-base">{CATEGORIAS_CONFIG[categoriaFiltro].icone}</span>
                <span className="font-bold">
                  Exibindo apenas {CATEGORIAS_CONFIG[categoriaFiltro].nome} ({materiaisFiltrados.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCategoriaFiltro('todas')}
                className="text-indigo-700 hover:text-indigo-900 font-bold underline cursor-pointer text-xs"
              >
                Ver todos os materiais
              </button>
            </div>
          )}

          {/* Content Area */}
          {materiais.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
              <p className="text-slate-500 text-xs">
                Ainda não há materiais nesta disciplina. Adicione PDFs, fotografias, áudios, vídeos ou links.
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
          ) : materiaisFiltrados.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
              <p className="text-slate-600 font-bold text-xs">Nenhum material encontrado</p>
              <p className="text-slate-400 text-xs">
                {busca
                  ? `Nenhum resultado para "${busca}" na categoria selecionada.`
                  : 'Esta categoria ainda não contém nenhum material.'}
              </p>
              {categoriaFiltro !== 'todas' && (
                <button
                  type="button"
                  onClick={() => setCategoriaFiltro('todas')}
                  className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Ver todas as categorias
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {materiaisFiltrados.map((m) => {
                const cat = getCategoriaMaterial(m);
                const conf = CATEGORIAS_CONFIG[cat];
                const veioModoAula = isModoAulaMaterial(m);

                return (
                  <div
                    key={m.id}
                    onClick={() => setMaterialSelecionado(m)}
                    className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3 relative group hover:border-indigo-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          {/* Icon Container with category color */}
                          <div
                            className={`p-2.5 rounded-2xl shrink-0 flex items-center justify-center ${conf.corBg} ${conf.corTexto} border ${conf.corBorda}`}
                          >
                            <span className="text-base">{conf.icone}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition">
                                {m.titulo}
                              </h3>
                              {m.eImportante && (
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                              )}
                            </div>

                            {/* Category & Date Subtitle + Modo Aula Indicator */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                {conf.nome} • {new Date(m.dataCriacao).toLocaleDateString()}
                              </span>

                              {veioModoAula && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300/80 rounded-md text-[9px] font-extrabold inline-flex items-center gap-0.5">
                                  <span>🎙️ Modo Aula</span>
                                </span>
                              )}
                            </div>
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

                      {/* Preview / Content Snippet based on Category */}
                      {cat === 'documentos' && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-700">
                          <div className="truncate max-w-[200px]">
                            <p className="truncate font-semibold text-slate-800">
                              {m.nomeArquivo || m.titulo}
                            </p>
                            {m.tamanho && (
                              <p className="text-[10px] text-slate-400">
                                {(m.tamanho / 1024).toFixed(0)} KB
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-blue-700 font-extrabold bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                            Documento
                          </span>
                        </div>
                      )}

                      {cat === 'links' && (
                        <div className="p-2.5 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-xs">
                          <a
                            href={m.conteudo}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-amber-800 hover:underline flex items-center gap-1.5 truncate"
                          >
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            <span className="truncate">{m.conteudo}</span>
                          </a>
                        </div>
                      )}

                      {cat === 'fotografias' && m.conteudo && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 h-32 bg-slate-100">
                          <img
                            src={m.conteudo}
                            alt={m.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {cat === 'audios' && m.conteudo && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="pt-1 bg-rose-50/50 p-2 rounded-2xl border border-rose-100"
                        >
                          <audio src={m.conteudo} controls className="w-full h-8" />
                        </div>
                      )}

                      {cat === 'videos' && m.conteudo && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black max-h-36 flex items-center justify-center">
                          <video src={m.conteudo} className="w-full max-h-36 object-cover" />
                        </div>
                      )}

                      {cat === 'outros' && (
                        <p className="text-slate-600 text-xs bg-slate-50 p-2.5 rounded-2xl line-clamp-2">
                          {m.conteudo.slice(0, 100)}
                        </p>
                      )}
                    </div>

                    {/* Quick Open Action Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs mt-2">
                      <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Visualizar {conf.nome}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
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
          onAtualizado={recarregar}
        />
      )}

      {/* Material Options Menu Modal (⋮) */}
      {materialParaMenu && (
        <MaterialActionMenuModal
          material={materialParaMenu}
          onFechar={() => setMaterialParaMenu(null)}
          onAtualizado={recarregar}
          onRemovido={recarregar}
        />
      )}

      {/* Session Detail Modal */}
      {sessaoSelecionada && (
        <SessionDetailModal
          sessao={sessaoSelecionada}
          onFechar={() => setSessaoSelecionada(null)}
          onAtualizado={recarregar}
        />
      )}

      {/* Confirm Delete Apontamento */}
      <ConfirmModal
        isOpen={!!apontamentoParaExcluirId}
        titulo="Excluir Apontamento"
        mensagem="Mover este apontamento para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluirApontamento}
        onCancelar={() => setApontamentoParaExcluirId(null)}
      />

      {/* Confirm Delete Informacao */}
      <ConfirmModal
        isOpen={!!infoParaExcluirId}
        titulo="Excluir Informação Important"
        mensagem="Enviar esta informação importante para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluirInformacao}
        onCancelar={() => setInfoParaExcluirId(null)}
      />

      {/* Confirm Delete Disciplina */}
      <ConfirmModal
        isOpen={confirmarExcluirDisciplina}
        titulo="Excluir Disciplina"
        mensagem="Enviar esta disciplina para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluirDisciplinaAcao}
        onCancelar={() => setConfirmarExcluirDisciplina(false)}
      />

      {/* Confirm Delete Material */}
      <ConfirmModal
        isOpen={!!materialParaExcluirId}
        titulo="Excluir Material"
        mensagem="Mover este material para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluirMaterial}
        onCancelar={() => setMaterialParaExcluirId(null)}
      />

      {/* Confirm Delete Session */}
      <ConfirmModal
        isOpen={!!sessaoParaExcluirId}
        titulo="Excluir Sessão de Aula"
        mensagem="Mover o registo desta aula para a Lixeira?"
        textoConfirmar="Enviar para a Lixeira"
        textoCancelar="Cancelar"
        onConfirmar={handleConfirmarExcluirSessao}
        onCancelar={() => setSessaoParaExcluirId(null)}
      />
    </div>
  );
};
