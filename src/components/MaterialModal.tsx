import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FileText,
  Camera,
  Video,
  Mic,
  Link2,
  Type,
  Upload,
  Square,
  Play,
  Check,
} from 'lucide-react';
import { TipoMaterial } from '../types';
import { saveMaterial } from '../lib/storage';

interface MaterialModalProps {
  disciplinaId: string;
  disciplinaNome: string;
  onFechar: () => void;
  onSalvo: () => void;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  disciplinaId,
  disciplinaNome,
  onFechar,
  onSalvo,
}) => {
  const [tipo, setTipo] = useState<TipoMaterial>('texto');
  const [titulo, setTitulo] = useState('');
  const [conteudoTexto, setConteudoTexto] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Media Capture States
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [tempoAudioSegundos, setTempoAudioSegundos] = useState(0);
  const [audioUrlCapturado, setAudioUrlCapturado] = useState<string | null>(null);

  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturadaUrl, setFotoCapturadaUrl] = useState<string | null>(null);

  const [gravandoVideo, setGravandoVideo] = useState(false);
  const [videoUrlCapturado, setVideoUrlCapturado] = useState<string | null>(null);

  const [arquivoUpload, setArquivoUpload] = useState<{
    nome: string;
    url: string;
    tipo: string;
    tamanho: number;
  } | null>(null);

  // Refs for camera / microphone
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerAudioRef = useRef<any>(null);

  // Cleanup media streams on unmount
  useEffect(() => {
    return () => {
      pararCamera();
      if (timerAudioRef.current) clearInterval(timerAudioRef.current);
    };
  }, []);

  // --- Camera Helper ---
  const iniciarCamera = async () => {
    setCameraAtiva(true);
    setFotoCapturadaUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: tipo === 'video',
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      alert('Não foi possível acessar a câmera. Por favor verifique as permissões.');
      setCameraAtiva(false);
    }
  };

  const tirarFoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setFotoCapturadaUrl(dataUrl);
      pararCamera();
    }
  };

  const pararCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraAtiva(false);
  };

  // --- Audio Recording Helper ---
  const iniciarGravacaoAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioUrlCapturado(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setGravandoAudio(true);
      setTempoAudioSegundos(0);
      timerAudioRef.current = setInterval(() => {
        setTempoAudioSegundos((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Não foi possível acessar o microfone.');
    }
  };

  const pararGravacaoAudio = () => {
    if (mediaRecorderRef.current && gravandoAudio) {
      mediaRecorderRef.current.stop();
      setGravandoAudio(false);
      if (timerAudioRef.current) clearInterval(timerAudioRef.current);
    }
  };

  // --- Video Recording Helper ---
  const iniciarGravacaoVideo = async () => {
    await iniciarCamera();
    try {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (!stream) return;
      videoChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setVideoUrlCapturado(reader.result as string);
        };
        reader.readAsDataURL(videoBlob);
        pararCamera();
      };

      mediaRecorder.start();
      setGravandoVideo(true);
    } catch (err) {
      alert('Não foi possível gravar o vídeo.');
    }
  };

  const pararGravacaoVideo = () => {
    if (mediaRecorderRef.current && gravandoVideo) {
      mediaRecorderRef.current.stop();
      setGravandoVideo(false);
    }
  };

  // --- File Upload Helper ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setArquivoUpload({
        nome: file.name,
        url: reader.result as string,
        tipo: file.type,
        tamanho: file.size,
      });
      if (!titulo) {
        setTitulo(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit
  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      alert('Por favor digite um título para o material.');
      return;
    }

    let conteudoFinal = '';
    let nomeArq = undefined;
    let mimeType = undefined;
    let tamanho = undefined;

    if (tipo === 'texto') {
      conteudoFinal = conteudoTexto;
    } else if (tipo === 'link') {
      conteudoFinal = linkUrl;
    } else if (tipo === 'fotografia') {
      conteudoFinal = fotoCapturadaUrl || arquivoUpload?.url || '';
    } else if (tipo === 'audio') {
      conteudoFinal = audioUrlCapturado || arquivoUpload?.url || '';
    } else if (tipo === 'video') {
      conteudoFinal = videoUrlCapturado || arquivoUpload?.url || '';
    } else if (tipo === 'documento') {
      conteudoFinal = arquivoUpload?.url || '';
      nomeArq = arquivoUpload?.nome;
      mimeType = arquivoUpload?.tipo;
      tamanho = arquivoUpload?.tamanho;
    }

    if (!conteudoFinal) {
      alert('Por favor adicione ou capture o conteúdo do material.');
      return;
    }

    saveMaterial({
      disciplinaId, // Automatically associated context!
      titulo: titulo.trim(),
      tipo,
      conteudo: conteudoFinal,
      nomeArquivo: nomeArq,
      mimeType,
      tamanho,
    });

    onSalvo();
    onFechar();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-indigo-600 p-5 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-base">Adicionar Material de Estudo</h2>
            <p className="text-indigo-200 text-xs">
              Associado a: <strong>{disciplinaNome}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="text-indigo-200 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSalvar} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Material Type Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Material
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipo('texto')}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipo === 'texto'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Texto</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('fotografia')}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipo === 'fotografia'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Fotografia</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('audio')}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipo === 'audio'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Áudio</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('video')}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipo === 'video'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Vídeo</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('documento')}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipo === 'documento'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Documento</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('link')}
                className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  tipo === 'link'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Link</span>
              </button>
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título do Material *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Resumo do Capítulo 1 / Esquema de IVA..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 text-sm"
            />
          </div>

          {/* Type Specific Fields */}

          {/* 1. TEXTO */}
          {tipo === 'texto' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Conteúdo do Texto
              </label>
              <textarea
                rows={5}
                required
                placeholder="Escreva seu texto ou anotações..."
                value={conteudoTexto}
                onChange={(e) => setConteudoTexto(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              ></textarea>
            </div>
          )}

          {/* 2. LINK */}
          {tipo === 'link' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Endereço URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://exemplo.com/material.pdf"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              />
            </div>
          )}

          {/* 3. FOTOGRAFIA (Capture or Upload) */}
          {tipo === 'fotografia' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Capturar ou Carregar Imagem
              </label>

              {/* Camera view */}
              {cameraAtiva && (
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={tirarFoto}
                    className="absolute bottom-3 bg-white text-indigo-600 px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-indigo-50 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tirar Foto</span>
                  </button>
                </div>
              )}

              {/* Preview photo */}
              {fotoCapturadaUrl && !cameraAtiva && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                  <img src={fotoCapturadaUrl} alt="Foto Capturada" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => setFotoCapturadaUrl(null)}
                    className="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-full hover:bg-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                {!cameraAtiva && (
                  <button
                    type="button"
                    onClick={iniciarCamera}
                    className="flex-1 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Usar Câmera</span>
                  </button>
                )}

                <label className="flex-1 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Ficheiro</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 4. ÁUDIO (Record or Upload) */}
          {tipo === 'audio' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Gravar ou Carregar Áudio
              </label>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                {gravandoAudio ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <span>Gravando... {tempoAudioSegundos}s</span>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={pararGravacaoAudio}
                        className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        <span>Parar Gravação</span>
                      </button>
                    </div>
                  </div>
                ) : audioUrlCapturado ? (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-emerald-700 block">
                      Áudio gravado com sucesso!
                    </span>
                    <audio src={audioUrlCapturado} controls className="w-full h-10" />
                    <button
                      type="button"
                      onClick={() => setAudioUrlCapturado(null)}
                      className="text-xs text-red-600 underline font-medium"
                    >
                      Gravar Novamente
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={iniciarGravacaoAudio}
                    className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Iniciar Gravação de Áudio</span>
                  </button>
                )}
              </div>

              <div className="text-center text-xs text-slate-400 font-medium">ou</div>

              <label className="w-full py-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Carregar Ficheiro de Áudio</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* 5. VÍDEO (Record or Upload) */}
          {tipo === 'video' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Gravar ou Carregar Vídeo
              </label>

              {cameraAtiva && (
                <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  {gravandoVideo ? (
                    <button
                      type="button"
                      onClick={pararGravacaoVideo}
                      className="absolute bottom-3 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 animate-pulse cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Parar Vídeo</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={iniciarGravacaoVideo}
                      className="absolute bottom-3 bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-indigo-700 cursor-pointer"
                    >
                      <Video className="w-4 h-4" />
                      <span>Iniciar Gravação</span>
                    </button>
                  )}
                </div>
              )}

              {videoUrlCapturado && !cameraAtiva && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black">
                  <video src={videoUrlCapturado} controls className="w-full max-h-48" />
                </div>
              )}

              <div className="flex gap-2">
                {!cameraAtiva && (
                  <button
                    type="button"
                    onClick={iniciarGravacaoVideo}
                    className="flex-1 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-4 h-4" />
                    <span>Gravar Vídeo</span>
                  </button>
                )}

                <label className="flex-1 py-2.5 bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer text-center">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Vídeo</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 6. DOCUMENTO */}
          {tipo === 'documento' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ficheiro / Documento (PDF, DOC, etc.)
              </label>

              <label className="w-full p-6 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50/50 transition cursor-pointer text-center">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">
                  {arquivoUpload ? arquivoUpload.nome : 'Clique para selecionar um documento'}
                </span>
                <span className="text-[10px] text-slate-400">Suporta PDF, Word, Excel, TXT</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onFechar}
              className="w-1/2 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-md text-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Material</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
