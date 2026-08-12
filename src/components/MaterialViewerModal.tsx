import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Camera,
  Video,
  Mic,
  Link2,
  Type,
  Download,
  ExternalLink,
  Copy,
  Check,
  Play,
  Pause,
  MoreVertical,
  Share2,
  Star,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { MaterialItem } from '../types';
import { compartilharMaterial, guardarNoDispositivo } from '../lib/materialActions';
import { toggleMaterialImportant } from '../lib/storage';
import { MaterialActionMenuModal } from './MaterialActionMenuModal';

interface MaterialViewerModalProps {
  material: MaterialItem;
  disciplinaNome?: string;
  onFechar: () => void;
  onExcluir?: (id: string) => void;
  onAtualizado?: () => void;
}

export const MaterialViewerModal: React.FC<MaterialViewerModalProps> = ({
  material,
  disciplinaNome,
  onFechar,
  onExcluir,
  onAtualizado,
}) => {
  const [copiado, setCopiado] = useState(false);
  const [tamanhoFonte, setTamanhoFonte] = useState<'sm' | 'base' | 'lg'>('base');
  const [menuAcoesAberto, setMenuAcoesAberto] = useState(false);
  const [mensagemToast, setMensagemToast] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

  // Audio custom state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tocandoAudio, setTocandoAudio] = useState(false);
  const [velocidadeAudio, setVelocidadeAudio] = useState(1);

  const mostrarToast = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setMensagemToast({ texto, tipo });
    setTimeout(() => setMensagemToast(null), 3500);
  };

  // Quick Share
  const handlePartilharRápido = async () => {
    const res = await compartilharMaterial(material);
    mostrarToast(res.mensagem, res.sucesso ? 'sucesso' : 'erro');
  };

  // Quick Save
  const handleGuardarRápido = async () => {
    const res = await guardarNoDispositivo(material);
    mostrarToast(res.mensagem, res.sucesso ? 'sucesso' : 'erro');
  };

  // Quick Star
  const handleToggleStar = () => {
    const eImp = toggleMaterialImportant(material.id);
    mostrarToast(
      eImp ? 'Material marcado como importante! ⭐' : 'Removido dos importantes.',
      'sucesso'
    );
    if (onAtualizado) onAtualizado();
  };

  // Copy helper
  const handleCopiarConteudo = () => {
    navigator.clipboard.writeText(material.conteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Format File Size
  const formatarTamanho = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Audio Speed change
  const handleMudarVelocidadeAudio = (vel: number) => {
    setVelocidadeAudio(vel);
    if (audioRef.current) {
      audioRef.current.playbackRate = vel;
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (tocandoAudio) {
      audioRef.current.pause();
      setTocandoAudio(false);
    } else {
      audioRef.current.play();
      setTocandoAudio(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col relative">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3 truncate max-w-[65%] sm:max-w-[70%]">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 text-indigo-300 rounded-2xl shrink-0">
              {material.tipo === 'fotografia' && <Camera className="w-5 h-5" />}
              {material.tipo === 'audio' && <Mic className="w-5 h-5" />}
              {material.tipo === 'video' && <Video className="w-5 h-5" />}
              {material.tipo === 'link' && <Link2 className="w-5 h-5" />}
              {material.tipo === 'documento' && <FileText className="w-5 h-5" />}
              {material.tipo === 'texto' && <Type className="w-5 h-5" />}
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                  {material.tipo}
                </span>
                {material.eImportante && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md text-[10px] font-bold inline-flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>Importante</span>
                  </span>
                )}
                {disciplinaNome && (
                  <span className="text-[11px] text-slate-300 font-medium truncate hidden sm:inline">
                    • {disciplinaNome}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white leading-tight mt-0.5 truncate">
                {material.titulo}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Star */}
            <button
              type="button"
              onClick={handleToggleStar}
              className={`p-2 rounded-xl transition cursor-pointer ${
                material.eImportante
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800'
              }`}
              title="Marcar como importante"
            >
              <Star className={`w-5 h-5 ${material.eImportante ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            {/* Quick Share */}
            <button
              type="button"
              onClick={handlePartilharRápido}
              className="p-2 text-slate-300 hover:text-indigo-300 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Partilhar Material"
            >
              <Share2 className="w-5 h-5" />
            </button>

            {/* Options Menu ⋮ */}
            <button
              type="button"
              onClick={() => setMenuAcoesAberto(true)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Opções do Material (⋮)"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onFechar}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer ml-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {mensagemToast && (
          <div
            className={`p-3 text-xs font-extrabold flex items-center justify-between gap-2 border-b animate-in fade-in duration-200 shrink-0 ${
              mensagemToast.tipo === 'sucesso'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {mensagemToast.tipo === 'sucesso' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{mensagemToast.texto}</span>
            </div>
            <button
              type="button"
              onClick={() => setMensagemToast(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body: Content Viewer per Type */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-5">
          {/* 1. TEXTO VIEWER */}
          {material.tipo === 'texto' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Tamanho da fonte:</span>
                  <button
                    type="button"
                    onClick={() => setTamanhoFonte('sm')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition ${
                      tamanhoFonte === 'sm'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Pequena
                  </button>
                  <button
                    type="button"
                    onClick={() => setTamanhoFonte('base')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition ${
                      tamanhoFonte === 'base'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Média
                  </button>
                  <button
                    type="button"
                    onClick={() => setTamanhoFonte('lg')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition ${
                      tamanhoFonte === 'lg'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    Grande
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopiarConteudo}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>
              </div>

              <div
                className={`bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm whitespace-pre-wrap leading-relaxed text-slate-800 ${
                  tamanhoFonte === 'sm' ? 'text-xs' : tamanhoFonte === 'lg' ? 'text-base' : 'text-sm'
                }`}
              >
                {material.conteudo || 'Nenhum texto inserido.'}
              </div>
            </div>
          )}

          {/* 2. LINK VIEWER */}
          {material.tipo === 'link' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Link2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">{material.titulo}</h3>
                <p className="text-xs text-indigo-600 font-mono break-all px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 inline-block max-w-full">
                  {material.conteudo}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <a
                  href={material.conteudo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition inline-flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir Link no Navegador</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopiarConteudo}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-2xl border border-slate-200 transition inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiado ? 'Link Copiado!' : 'Copiar Endereço'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. FOTOGRAFIA VIEWER */}
          {material.tipo === 'fotografia' && (
            <div className="space-y-4">
              {material.conteudo ? (
                <div className="bg-black/95 rounded-3xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center shadow-inner min-h-[280px]">
                  <img
                    src={material.conteudo}
                    alt={material.titulo}
                    className="max-h-[60vh] w-auto max-w-full object-contain rounded-2xl"
                  />
                </div>
              ) : (
                <div className="p-10 bg-slate-100 rounded-3xl text-center text-slate-500 text-xs">
                  A imagem não pode ser exibida.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePartilharRápido}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>Partilhar</span>
                </button>
                <button
                  type="button"
                  onClick={handleGuardarRápido}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Guardar no Dispositivo</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. ÁUDIO VIEWER */}
          {material.tipo === 'audio' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer shrink-0"
                >
                  {tocandoAudio ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>

                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-slate-800 text-base">{material.titulo}</h3>
                  <span className="text-xs text-slate-500">
                    Grave de áudio do estúdio de estudo
                  </span>
                </div>
              </div>

              {/* Native audio fallback */}
              {material.conteudo ? (
                <audio
                  ref={audioRef}
                  src={material.conteudo}
                  controls
                  onPlay={() => setTocandoAudio(true)}
                  onPause={() => setTocandoAudio(false)}
                  className="w-full h-12"
                />
              ) : (
                <p className="text-slate-400 text-xs italic">Áudio não disponível.</p>
              )}

              {/* Speed Controls */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-xs font-bold text-slate-600">Velocidade de reprodução:</span>
                <div className="flex gap-1.5">
                  {[0.75, 1, 1.25, 1.5, 2].map((vel) => (
                    <button
                      key={vel}
                      type="button"
                      onClick={() => handleMudarVelocidadeAudio(vel)}
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        velocidadeAudio === vel
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {vel}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePartilharRápido}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>Partilhar Áudio</span>
                </button>
                <button
                  type="button"
                  onClick={handleGuardarRápido}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Guardar Áudio</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. VÍDEO VIEWER */}
          {material.tipo === 'video' && (
            <div className="space-y-4">
              {material.conteudo ? (
                <div className="bg-black rounded-3xl overflow-hidden border border-slate-800 shadow-lg">
                  <video
                    src={material.conteudo}
                    controls
                    className="w-full max-h-[60vh] mx-auto"
                  />
                </div>
              ) : (
                <div className="p-10 bg-slate-100 rounded-3xl text-center text-slate-500 text-xs">
                  Vídeo indisponível.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePartilharRápido}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>Partilhar Vídeo</span>
                </button>
                <button
                  type="button"
                  onClick={handleGuardarRápido}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Guardar Vídeo</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. DOCUMENTO VIEWER (PDF / DOC / TXT) */}
          {material.tipo === 'documento' && (
            <div className="space-y-4">
              {/* Metadata Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {material.nomeArquivo || material.titulo}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {material.mimeType || 'Documento de Estudo'} •{' '}
                      {formatarTamanho(material.tamanho)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handlePartilharRápido}
                    className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    <span>Partilhar</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGuardarRápido}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Guardar no Dispositivo</span>
                  </button>
                </div>
              </div>

              {/* Embedded Document Viewer Preview (PDF / Base64 Data URL) */}
              {material.conteudo && material.conteudo.startsWith('data:') ? (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[50vh]">
                  <iframe
                    src={material.conteudo}
                    title={material.titulo}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : material.conteudo && material.conteudo.startsWith('http') ? (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[50vh]">
                  <iframe
                    src={material.conteudo}
                    title={material.titulo}
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-medium">
                    Pré-visualização não disponível diretamente nesta janela. Clique em "Guardar no Dispositivo" ou "Partilhar".
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMenuAcoesAberto(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
              <span>Menu do Material (⋮)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Options Menu Modal */}
      {menuAcoesAberto && (
        <MaterialActionMenuModal
          material={material}
          onFechar={() => setMenuAcoesAberto(false)}
          onAtualizado={() => {
            if (onAtualizado) onAtualizado();
          }}
          onRemovido={() => {
            if (onExcluir) onExcluir(material.id);
            onFechar();
          }}
        />
      )}
    </div>
  );
};
