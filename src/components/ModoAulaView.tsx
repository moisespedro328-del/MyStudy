import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  Mic,
  Camera,
  Video,
  FileText,
  Bookmark,
  Square,
  Check,
  X,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  FolderPlus,
  FileUp,
  File,
  AlertCircle,
} from 'lucide-react';
import {
  getCursos,
  getDisciplinas,
  getDisciplinasPorCurso,
  getProximasAulasHoje,
  saveSessaoAula,
  saveMaterial,
} from '../lib/storage';
import {
  Curso,
  Disciplina,
  ItemAudioSessao,
  ItemFotoSessao,
  ItemVideoSessao,
  ItemNotaSessao,
  InformacaoImportante,
  MaterialItem,
  TipoMaterial,
  VisualizacaoAtual,
} from '../types';

interface ModoAulaViewProps {
  disciplinaIdPadrao?: string;
  onNavegar: (view: VisualizacaoAtual) => void;
}

export const ModoAulaView: React.FC<ModoAulaViewProps> = ({
  disciplinaIdPadrao,
  onNavegar,
}) => {
  // Session Start Time
  const dataInicioRef = useRef<string>(new Date().toISOString());
  const [tempoSegundos, setTempoSegundos] = useState<number>(0);

  // Live Session Captures
  const [audios, setAudios] = useState<ItemAudioSessao[]>([]);
  const [fotografias, setFotografias] = useState<ItemFotoSessao[]>([]);
  const [videos, setVideos] = useState<ItemVideoSessao[]>([]);
  const [notas, setNotas] = useState<ItemNotaSessao[]>([]);
  const [informacoesImportantes, setInformacoesImportantes] = useState<
    InformacaoImportante[]
  >([]);
  const [materiaisAnexados, setMateriaisAnexados] = useState<MaterialItem[]>([]);

  // Active Modals for capture
  const [modalAudioAberto, setModalAudioAberto] = useState(false);
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [modalVideoAberto, setModalVideoAberto] = useState(false);
  const [modalNotaAberto, setModalNotaAberto] = useState(false);
  const [modalInfoAberto, setModalInfoAberto] = useState(false);
  const [modalMaterialAberto, setModalMaterialAberto] = useState(false);
  const [modalFinalizarAberto, setModalFinalizarAberto] = useState(false);

  // Active Media Recording States
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [duracaoGravacaoAudio, setDuracaoGravacaoAudio] = useState(0);

  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [gravandoVideo, setGravandoVideo] = useState(false);

  // Quick inputs
  const [textoNota, setTextoNota] = useState('');
  const [textoInfo, setTextoInfo] = useState('');

  // Material attachment input
  const [tituloMaterial, setTituloMaterial] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial>('pdf');
  const [conteudoMaterial, setConteudoMaterial] = useState('');
  const [nomeFicheiro, setNomeFicheiro] = useState('');

  // Toast / Conflict notification state
  const [mensagemConflito, setMensagemConflito] = useState<string | null>(null);

  // Course / Discipline selection at conclusion
  const [cursosList, setCursosList] = useState<Curso[]>([]);
  const [disciplinasList, setDisciplinasList] = useState<Disciplina[]>([]);
  const [cursoSelecionado, setCursoSelecionado] = useState<string>('');
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<string>(
    disciplinaIdPadrao || ''
  );
  const [tituloAula, setTituloAula] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerAudioRef = useRef<any>(null);

  const mostrarToastConflito = (msg: string) => {
    setMensagemConflito(msg);
    setTimeout(() => setMensagemConflito(null), 4000);
  };

  // Main session timer tick
  useEffect(() => {
    const timerSession = setInterval(() => {
      setTempoSegundos((prev) => prev + 1);
    }, 1000);

    // Auto check if there's a class currently running in timetable
    const proximas = getProximasAulasHoje();
    const emAndamento = proximas.find((p) => p.estaEmAndamento);
    if (emAndamento && emAndamento.disciplina) {
      setDisciplinaSelecionada(emAndamento.disciplina.id);
      setCursoSelecionado(emAndamento.disciplina.cursoId);
      setTituloAula(`Aula de ${emAndamento.disciplina.nome}`);
    } else {
      setTituloAula(`Aula — ${new Date().toLocaleDateString('pt-BR')}`);
    }

    const c = getCursos();
    setCursosList(c);
    if (c.length > 0 && !cursoSelecionado) {
      setCursoSelecionado(c[0].id);
    }
    setDisciplinasList(getDisciplinas());

    return () => {
      clearInterval(timerSession);
      if (timerAudioRef.current) clearInterval(timerAudioRef.current);
      pararCamera();
    };
  }, []);

  // Update discipline options when selected course changes
  useEffect(() => {
    if (cursoSelecionado) {
      const discs = getDisciplinasPorCurso(cursoSelecionado);
      if (discs.length > 0 && !discs.some((d) => d.id === disciplinaSelecionada)) {
        setDisciplinaSelecionada(discs[0].id);
      }
    }
  }, [cursoSelecionado]);

  // Format Elapsed Time (hh:mm:ss)
  const formatarTempo = (segundos: number) => {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    if (h > 0) {
      return `${h}h ${String(m).padStart(2, '0')}min ${String(s).padStart(2, '0')}s`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // --- Audio Capturing (Non-blocking / Background capable) ---
  const handleIniciarAudio = async () => {
    if (gravandoVideo) {
      mostrarToastConflito(
        'A gravação de vídeo já possui áudio integrado. Conclua o vídeo para iniciar um áudio separado.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const url = reader.result as string;
          setAudios((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              titulo: `Áudio ${prev.length + 1}`,
              url,
              duracaoSegundos: duracaoGravacaoAudio,
              dataCriacao: new Date().toISOString(),
            },
          ]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setGravandoAudio(true);
      setDuracaoGravacaoAudio(0);
      timerAudioRef.current = setInterval(() => {
        setDuracaoGravacaoAudio((prev) => prev + 1);
      }, 1000);
      setModalAudioAberto(false); // Close modal so user can work non-blocking!
    } catch (err) {
      alert('Não foi possível acessar o microfone.');
    }
  };

  const handlePararAudio = () => {
    if (mediaRecorderRef.current && gravandoAudio) {
      mediaRecorderRef.current.stop();
      setGravandoAudio(false);
      if (timerAudioRef.current) clearInterval(timerAudioRef.current);
      setModalAudioAberto(false);
    }
  };

  // --- Photo Capturing ---
  const handleIniciarCameraFoto = async () => {
    if (gravandoVideo) {
      mostrarToastConflito(
        'A gravação de vídeo está ativa. Pare o vídeo para tirar fotografias.'
      );
      return;
    }

    setModalFotoAberto(true);
    setCameraAtiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert('Não foi possível acessar a câmera.');
      setModalFotoAberto(false);
    }
  };

  const handleTirarFoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setFotografias((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          titulo: `Fotografia ${prev.length + 1}`,
          url: dataUrl,
          dataCriacao: new Date().toISOString(),
        },
      ]);
    }
    pararCamera();
    setModalFotoAberto(false);
  };

  const pararCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraAtiva(false);
  };

  // --- Video Capturing ---
  const handleIniciarCameraVideo = async () => {
    if (gravandoAudio) {
      mostrarToastConflito(
        'Termine a gravação de áudio em segundo plano antes de iniciar um vídeo.'
      );
      return;
    }

    setModalVideoAberto(true);
    setCameraAtiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert('Não foi possível acessar a câmera para vídeo.');
      setModalVideoAberto(false);
    }
  };

  const handleIniciarGravacaoVideo = () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    videoChunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideos((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            titulo: `Vídeo ${prev.length + 1}`,
            url: reader.result as string,
            dataCriacao: new Date().toISOString(),
          },
        ]);
      };
      reader.readAsDataURL(videoBlob);
      pararCamera();
      setModalVideoAberto(false);
    };

    recorder.start();
    setGravandoVideo(true);
  };

  const handlePararGravacaoVideo = () => {
    if (mediaRecorderRef.current && gravandoVideo) {
      mediaRecorderRef.current.stop();
      setGravandoVideo(false);
    }
  };

  // --- Quick Note ---
  const handleAdicionarNota = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoNota.trim()) return;
    setNotas((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        texto: textoNota.trim(),
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    ]);
    setTextoNota('');
    setModalNotaAberto(false);
  };

  // --- Key Info ---
  const handleAdicionarInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoInfo.trim()) return;
    setInformacoesImportantes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        disciplinaId: disciplinaSelecionada || '',
        texto: textoInfo.trim(),
        origem: `Aula — ${new Date().toLocaleDateString('pt-BR')}`,
        dataCriacao: new Date().toISOString(),
      },
    ]);
    setTextoInfo('');
    setModalInfoAberto(false);
  };

  // --- Attach Material / Document ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNomeFicheiro(file.name);
    if (!tituloMaterial) {
      setTituloMaterial(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setConteudoMaterial(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAdicionarMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloMaterial.trim()) return;

    const novoMat: MaterialItem = {
      id: Date.now().toString(),
      disciplinaId: disciplinaSelecionada || '',
      titulo: tituloMaterial.trim(),
      tipo: tipoMaterial,
      conteudo: conteudoMaterial || '',
      nomeArquivo: nomeFicheiro || `${tituloMaterial.trim()}.${tipoMaterial}`,
      eImportante: false,
      origemModoAula: true,
      dataCriacao: new Date().toISOString(),
    };

    setMateriaisAnexados((prev) => [...prev, novoMat]);

    setTituloMaterial('');
    setConteudoMaterial('');
    setNomeFicheiro('');
    setModalMaterialAberto(false);
  };

  // --- Finish Class ---
  const handleAbrirModalFinalizar = () => {
    setModalFinalizarAberto(true);
  };

  const handleSalvarSessaoFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplinaSelecionada) {
      alert('Por favor escolha a qual disciplina pertence esta aula.');
      return;
    }

    const duracaoMin = Math.max(1, Math.round(tempoSegundos / 60));

    // Save attached materials as permanent discipline materials in storage
    const materiaisSalvos: MaterialItem[] = materiaisAnexados.map((m) => {
      return saveMaterial({
        disciplinaId: disciplinaSelecionada,
        titulo: m.titulo,
        tipo: m.tipo,
        conteudo: m.conteudo || (m as any).conteudoUrl || '',
        nomeArquivo: m.nomeArquivo || (m as any).nomeFicheiro,
        eImportante: false,
        origemModoAula: true,
      });
    });

    saveSessaoAula({
      disciplinaId: disciplinaSelecionada,
      titulo: tituloAula.trim() || `Aula de ${new Date().toLocaleDateString('pt-BR')}`,
      dataInicio: dataInicioRef.current,
      dataFim: new Date().toISOString(),
      duracaoMinutos: duracaoMin,
      audios,
      fotografias,
      videos,
      notas,
      materiais: materiaisSalvos,
      informacoesImportantes: informacoesImportantes.map((i) => ({
        ...i,
        disciplinaId: disciplinaSelecionada,
      })),
    });

    setModalFinalizarAberto(false);
    onNavegar({
      tipo: 'disciplina_detalhe',
      disciplinaId: disciplinaSelecionada,
      abaInicial: 'aulas',
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Alert for Conflitos */}
      {mensagemConflito && (
        <div className="bg-rose-50 border-2 border-rose-300 text-rose-900 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{mensagemConflito}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensagemConflito(null)}
            className="text-rose-400 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner with Active Session Timer */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-amber-400/40 relative overflow-hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-white text-xs font-extrabold uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span>Aula em Andamento</span>
          </div>
          <h1 className="text-2xl font-black">{tituloAula}</h1>
          <p className="text-amber-100 text-xs">
            Capture fotos, áudios, vídeos, documentos e anotações. O aplicativo salvará tudo na disciplina certa ao finalizar.
          </p>
        </div>

        {/* Live Timer */}
        <div className="bg-black/30 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center shrink-0">
          <span className="text-[10px] text-amber-200 font-bold uppercase block tracking-wider">
            Tempo Decorrido
          </span>
          <span className="text-2xl font-mono font-black tracking-tight text-white">
            {formatarTempo(tempoSegundos)}
          </span>
        </div>
      </div>

      {/* Persistent Background Audio Status Bar */}
      {gravandoAudio && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 border border-red-400 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xs font-extrabold block">
                🎙️ Gravação de Áudio Ativa em Segundo Plano
              </span>
              <span className="text-[11px] text-red-100 font-mono">
                Duração: {duracaoGravacaoAudio}s — Pode continuar tirando fotos e notas!
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePararAudio}
            className="px-4 py-2 bg-white text-red-700 font-extrabold text-xs rounded-xl hover:bg-red-50 transition shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-red-700" />
            <span>Parar e Guardar</span>
          </button>
        </div>
      )}

      {/* Instant Action Grid Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Gravar Áudio */}
        <button
          type="button"
          onClick={() => {
            if (gravandoAudio) {
              setModalAudioAberto(true);
            } else {
              handleIniciarAudio();
            }
          }}
          className={`p-4 border rounded-3xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 cursor-pointer group ${
            gravandoAudio
              ? 'bg-red-50 border-red-300'
              : 'bg-white border-slate-200 hover:border-indigo-500'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              gravandoAudio
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <Mic className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            {gravandoAudio ? `Áudio (${duracaoGravacaoAudio}s)` : 'Gravar Áudio'}
          </span>
        </button>

        {/* Tirar Fotografia */}
        <button
          type="button"
          onClick={handleIniciarCameraFoto}
          className="p-4 bg-white border border-slate-200 hover:border-indigo-500 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800">Tirar Foto</span>
        </button>

        {/* Gravar Vídeo */}
        <button
          type="button"
          onClick={handleIniciarCameraVideo}
          className="p-4 bg-white border border-slate-200 hover:border-indigo-500 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Video className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800">Gravar Vídeo</span>
        </button>

        {/* Adicionar Material */}
        <button
          type="button"
          onClick={() => setModalMaterialAberto(true)}
          className="p-4 bg-emerald-50 border border-emerald-200 hover:border-emerald-400 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <FolderPlus className="w-6 h-6" />
          </div>
          <span className="text-xs font-extrabold text-emerald-900">Anexar Material</span>
        </button>

        {/* Nota Rápida */}
        <button
          type="button"
          onClick={() => setModalNotaAberto(true)}
          className="p-4 bg-white border border-slate-200 hover:border-indigo-500 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-800">Nota Rápida</span>
        </button>

        {/* Informação Importante */}
        <button
          type="button"
          onClick={() => setModalInfoAberto(true)}
          className="p-4 bg-amber-50 border border-amber-200 hover:border-amber-400 rounded-3xl shadow-sm hover:shadow-md transition flex flex-col items-center justify-center gap-2 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <Bookmark className="w-6 h-6 fill-white" />
          </div>
          <span className="text-xs font-extrabold text-amber-900">Info Importante</span>
        </button>
      </div>

      {/* Captured Items Live Stream Feed */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Conteúdos Capturados Nesta Aula</span>
          </h2>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {audios.length +
              fotografias.length +
              videos.length +
              notas.length +
              informacoesImportantes.length +
              materiaisAnexados.length}{' '}
            itens
          </span>
        </div>

        {audios.length === 0 &&
        fotografias.length === 0 &&
        videos.length === 0 &&
        notas.length === 0 &&
        informacoesImportantes.length === 0 &&
        materiaisAnexados.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
            Sua aula está em andamento! Toque nos botões acima para gravar áudios, fotos, vídeos, anexar materiais ou notas rápidas.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informações Importantes */}
            {informacoesImportantes.map((inf) => (
              <div
                key={inf.id}
                className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                    <Bookmark className="w-3 h-3 fill-amber-600" />
                    <span>Informação Importante</span>
                  </span>
                  <p className="font-bold text-slate-800 text-xs">"{inf.texto}"</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setInformacoesImportantes((prev) =>
                      prev.filter((item) => item.id !== inf.id)
                    )
                  }
                  className="text-amber-700 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Materiais Anexados */}
            {materiaisAnexados.map((m) => (
              <div
                key={m.id}
                className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Material Anexado ({m.tipo})
                    </span>
                    <p className="font-bold text-slate-800 text-xs truncate">
                      {m.titulo}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setMateriaisAnexados((prev) =>
                      prev.filter((item) => item.id !== m.id)
                    )
                  }
                  className="text-emerald-700 hover:text-red-600 p-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Quick Notes */}
            {notas.map((n) => (
              <div
                key={n.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400">
                    Nota • {n.timestamp}
                  </span>
                  <p className="text-xs font-medium text-slate-800">{n.texto}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotas((prev) => prev.filter((item) => item.id !== n.id))
                  }
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Audio List */}
            {audios.map((a) => (
              <div
                key={a.id}
                className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{a.titulo}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAudios((prev) => prev.filter((item) => item.id !== a.id))
                    }
                    className="text-slate-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <audio src={a.url} controls className="w-full h-8" />
              </div>
            ))}

            {/* Photos Grid */}
            {fotografias.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                {fotografias.map((f) => (
                  <div key={f.id} className="relative rounded-2xl overflow-hidden border border-slate-200">
                    <img src={f.url} alt={f.titulo} className="w-full h-28 object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setFotografias((prev) =>
                          prev.filter((item) => item.id !== f.id)
                        )
                      }
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Videos Grid */}
            {videos.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {videos.map((v) => (
                  <div key={v.id} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-black">
                    <video src={v.url} controls className="w-full max-h-36" />
                    <button
                      type="button"
                      onClick={() =>
                        setVideos((prev) =>
                          prev.filter((item) => item.id !== v.id)
                        )
                      }
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Bottom "Finalizar Aula" Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAbrirModalFinalizar}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-3xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer text-base active:scale-98"
        >
          <Check className="w-6 h-6" />
          <span>Finalizar Aula</span>
        </button>
      </div>

      {/* MODAL: Audio Recording */}
      {modalAudioAberto && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Gravação de Áudio</h3>

            {gravandoAudio ? (
              <div className="space-y-3">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <Mic className="w-10 h-10" />
                </div>
                <span className="text-xl font-bold font-mono text-slate-800 block">
                  {duracaoGravacaoAudio}s
                </span>
                <button
                  type="button"
                  onClick={handlePararAudio}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-white" />
                  <span>Parar e Guardar Áudio</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-500 text-xs">
                  Pressione o botão abaixo para iniciar a captura de áudio do professor.
                </p>
                <button
                  type="button"
                  onClick={handleIniciarAudio}
                  className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mic className="w-5 h-5" />
                  <span>Iniciar Gravação</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalAudioAberto(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Camera Photo */}
      {modalFotoAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden space-y-4 p-4 text-center">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Fotografar Quadro / Slides</h3>
              <button
                type="button"
                onClick={() => {
                  pararCamera();
                  setModalFotoAberto(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" />
            </div>

            <button
              type="button"
              onClick={handleTirarFoto}
              className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Camera className="w-5 h-5" />
              <span>Capturar Fotografia</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Camera Video */}
      {modalVideoAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden space-y-4 p-4 text-center">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Gravar Vídeo da Aula</h3>
              <button
                type="button"
                onClick={() => {
                  pararCamera();
                  setModalVideoAberto(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" />
            </div>

            {gravandoVideo ? (
              <button
                type="button"
                onClick={handlePararGravacaoVideo}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition shadow-md flex items-center justify-center gap-2 cursor-pointer animate-pulse text-sm"
              >
                <Square className="w-5 h-5 fill-white" />
                <span>Parar Gravação de Vídeo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleIniciarGravacaoVideo}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <Video className="w-5 h-5" />
                <span>Iniciar Gravação</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Quick Note */}
      {modalNotaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Criar Nota Rápida</h3>
              <button
                type="button"
                onClick={() => setModalNotaAberto(false)}
                className="text-indigo-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdicionarNota} className="p-6 space-y-4">
              <textarea
                rows={4}
                required
                autoFocus
                placeholder="Digite a nota rápida..."
                value={textoNota}
                onChange={(e) => setTextoNota(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              ></textarea>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalNotaAberto(false)}
                  className="w-1/2 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition text-xs"
                >
                  Adicionar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Key Info */}
      {modalInfoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-amber-500 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Marcar Informação Importante</h3>
              <button
                type="button"
                onClick={() => setModalInfoAberto(false)}
                className="text-amber-100 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdicionarInfo} className="p-6 space-y-4">
              <textarea
                rows={3}
                required
                autoFocus
                placeholder="Ex: 'Entra na prova prática', 'Conceito chave: Ativo = Passivo + CP'"
                value={textoInfo}
                onChange={(e) => setTextoInfo(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm"
              ></textarea>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalInfoAberto(false)}
                  className="w-1/2 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition text-xs"
                >
                  Guardar Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adicionar Material / Documento */}
      {modalMaterialAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FolderPlus className="w-5 h-5" />
                <span>Anexar Material à Aula</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalMaterialAberto(false)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdicionarMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título do Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 'Slides do Capítulo 3' ou 'Lista de Exercícios'"
                  value={tituloMaterial}
                  onChange={(e) => setTituloMaterial(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tipo de Material
                </label>
                <select
                  value={tipoMaterial}
                  onChange={(e) => setTipoMaterial(e.target.value as TipoMaterial)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="pdf">Ficheiro PDF</option>
                  <option value="slide">Apresentação / Slides</option>
                  <option value="documento">Documento de Texto</option>
                  <option value="imagem">Imagem / Diagrama</option>
                  <option value="outro">Outro Tipo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Selecionar Ficheiro do Dispositivo
                </label>
                <label className="w-full p-4 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition">
                  <FileUp className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    {nomeFicheiro ? `Ficheiro: ${nomeFicheiro}` : 'Toque para escolher ficheiro'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMaterialAberto(false)}
                  className="w-1/2 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Anexar Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Finalizar Aula & Escolher Disciplina */}
      {modalFinalizarAberto && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">A que disciplina pertence esta aula?</h3>
              <button
                type="button"
                onClick={() => setModalFinalizarAberto(false)}
                className="text-emerald-200 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarSessaoFinal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título da Aula
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aula 04 - Métodos de Custo"
                  value={tituloAula}
                  onChange={(e) => setTituloAula(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Curso *
                </label>
                <select
                  value={cursoSelecionado}
                  onChange={(e) => setCursoSelecionado(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {cursosList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Disciplina *
                </label>
                <select
                  value={disciplinaSelecionada}
                  onChange={(e) => setDisciplinaSelecionada(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {disciplinasList
                    .filter((d) => d.cursoId === cursoSelecionado)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                </select>
              </div>

              {/* Summary of items saved */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block">Resumo dos itens capturados:</span>
                <p>
                  • Duração: {Math.max(1, Math.round(tempoSegundos / 60))} min | {audios.length} áudios | {fotografias.length} fotos | {videos.length} vídeos | {notas.length} notas | {informacoesImportantes.length} info imp
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFinalizarAberto(false)}
                  className="w-1/3 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Aula na Disciplina</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
