import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  Video,
  Sun,
  Sparkles,
  Zap,
  ZapOff,
  RotateCw,
  Sliders,
  Grid,
  Check,
  RefreshCcw,
  Square,
} from 'lucide-react';

export type AcademicFilterMode = 'normal' | 'slide' | 'quadro_branco' | 'quadro_negro' | 'documento';

interface AcademicCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapturePhoto: (dataUrl: string, metadata?: { filter?: string; zoom?: number }) => void;
  onRecordVideo?: (videoUrl: string) => void;
  modoInicial?: 'foto' | 'video';
}

export const AcademicCameraModal: React.FC<AcademicCameraModalProps> = ({
  isOpen,
  onClose,
  onCapturePhoto,
  onRecordVideo,
  modoInicial = 'foto',
}) => {
  // Mode: photo or video
  const [modo, setModo] = useState<'foto' | 'video'>(modoInicial);

  // Camera stream & hardware states
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchAtiva, setTorchAtiva] = useState(false);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);

  // Controls
  const [zoom, setZoom] = useState(1);
  const [brilho, setBrilho] = useState(100); // 60% to 160%
  const [contraste, setContraste] = useState(100); // 70% to 170%
  const [filtro, setFiltro] = useState<AcademicFilterMode>('normal');
  const [mostrarGrade, setMostrarGrade] = useState(false);
  const [mostrarControlesAvancados, setMostrarControlesAvancados] = useState(false);

  // Tap to focus state
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  // Video recording
  const [gravandoVideo, setGravandoVideo] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);

  // Post capture preview / crop / adjust
  const [fotoCapturadaPreview, setFotoCapturadaPreview] = useState<string | null>(null);
  const [rotacaoPreview, setRotacaoPreview] = useState(0); // 0, 90, 180, 270

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerGravacaoRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Pinch-to-zoom tracking
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  // Start Camera
  const startCamera = useCallback(async () => {
    // Stop existing stream
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: modo === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStreamRef.current = stream;

      const track = stream.getVideoTracks()[0];
      videoTrackRef.current = track;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Check capabilities (Torch, Zoom)
      if (track && typeof track.getCapabilities === 'function') {
        const capabilities = track.getCapabilities() as any;
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }

        if (capabilities.zoom) {
          setHasHardwareZoom(true);
        } else {
          setHasHardwareZoom(false);
        }
      }

      setCameraAtiva(true);
    } catch (err) {
      console.warn('Tentando câmera padrão sem restrições:', err);
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: modo === 'video',
        });
        videoStreamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
        setCameraAtiva(true);
      } catch (fallbackErr) {
        console.error('Falha ao acessar câmera:', fallbackErr);
        alert('Não foi possível acessar a câmera. Por favor verifique as permissões.');
      }
    }
  }, [facingMode, modo]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    videoTrackRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (timerGravacaoRef.current) {
      clearInterval(timerGravacaoRef.current);
    }
    setCameraAtiva(false);
    setTorchAtiva(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setFotoCapturadaPreview(null);
      setZoom(1);
      setBrilho(100);
      setContraste(100);
      setFiltro('normal');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Apply Hardware or Digital Zoom
  const handleApplyZoom = (newZoom: number) => {
    const clamped = Math.max(1, Math.min(newZoom, 5));
    setZoom(clamped);

    if (hasHardwareZoom && videoTrackRef.current) {
      try {
        videoTrackRef.current.applyConstraints({
          advanced: [{ zoom: clamped } as any],
        });
      } catch (e) {
        console.warn('Hardware zoom não suportado:', e);
      }
    }
  };

  // Toggle Torch
  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;
    const novoEstado = !torchAtiva;
    try {
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: novoEstado } as any],
      });
      setTorchAtiva(novoEstado);
    } catch (e) {
      console.warn('Falha ao acionar lanterna:', e);
    }
  };

  // Switch Camera Lens (Front / Back)
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setTorchAtiva(false);
  };

  // Tap to Focus
  const handleTouchFocus = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setFocusPoint({ x, y });

    // Auto dismiss focus box after 1.5s
    setTimeout(() => {
      setFocusPoint(null);
    }, 1500);

    // Try hardware focus constraint if available
    if (videoTrackRef.current && typeof videoTrackRef.current.applyConstraints === 'function') {
      try {
        videoTrackRef.current.applyConstraints({
          advanced: [
            {
              focusMode: 'continuous',
            } as any,
          ],
        });
      } catch (err) {
        // Soft fallback
      }
    }
  };

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialTouchDistanceRef.current = dist;
      initialZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialTouchDistanceRef.current;
      const targetZoom = Math.min(Math.max(initialZoomRef.current * ratio, 1), 5);
      handleApplyZoom(parseFloat(targetZoom.toFixed(1)));
    }
  };

  const handleTouchEnd = () => {
    initialTouchDistanceRef.current = null;
  };

  // Compute CSS filter string for live preview & canvas processing
  const getFilterStyle = () => {
    let filterString = `brightness(${brilho}%) contrast(${contraste}%)`;
    if (filtro === 'slide') {
      filterString += ` contrast(135%) saturate(120%) brightness(105%)`;
    } else if (filtro === 'quadro_branco') {
      filterString += ` contrast(160%) brightness(115%) grayscale(25%)`;
    } else if (filtro === 'quadro_negro') {
      filterString += ` contrast(170%) brightness(95%) invert(10%)`;
    } else if (filtro === 'documento') {
      filterString += ` grayscale(100%) contrast(180%) brightness(110%)`;
    }
    return filterString;
  };

  // Process and Capture Photo
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    canvas.width = vWidth;
    canvas.height = vHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Apply digital zoom crop
    const effectiveZoom = zoom;
    const cropWidth = vWidth / effectiveZoom;
    const cropHeight = vHeight / effectiveZoom;
    const cropX = (vWidth - cropWidth) / 2;
    const cropY = (vHeight - cropHeight) / 2;

    ctx.save();
    // Apply filter directly in canvas context
    ctx.filter = getFilterStyle();

    // Mirror if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // If filter is "documento", apply high-contrast binarization enhancement offline
    if (filtro === 'documento') {
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const cleanVal = v > 128 ? Math.min(255, v * 1.15) : v * 0.85;
          d[i] = cleanVal;
          d[i + 1] = cleanVal;
          d[i + 2] = cleanVal;
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.warn('Canvas processing fallback', err);
      }
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setFotoCapturadaPreview(dataUrl);
    setRotacaoPreview(0);
  };

  // Confirm photo capture and send to parent
  const handleConfirmarFoto = () => {
    if (!fotoCapturadaPreview) return;

    if (rotacaoPreview === 0) {
      onCapturePhoto(fotoCapturadaPreview, { filter: filtro, zoom });
      setFotoCapturadaPreview(null);
      onClose();
      return;
    }

    // Apply rotation if needed
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      if (!ctx) return;

      if (rotacaoPreview === 90 || rotacaoPreview === 270) {
        c.width = img.height;
        c.height = img.width;
      } else {
        c.width = img.width;
        c.height = img.height;
      }

      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate((rotacaoPreview * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedDataUrl = c.toDataURL('image/jpeg', 0.92);
      onCapturePhoto(rotatedDataUrl, { filter: filtro, zoom });
      setFotoCapturadaPreview(null);
      onClose();
    };
    img.src = fotoCapturadaPreview;
  };

  // Video recording methods
  const handleStartVideoRecording = () => {
    if (!videoStreamRef.current) return;
    recordedChunksRef.current = [];

    try {
      const recorder = new MediaRecorder(videoStreamRef.current);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        if (onRecordVideo) {
          onRecordVideo(videoUrl);
        }
        onClose();
      };

      recorder.start(1000);
      setGravandoVideo(true);
      setTempoGravacao(0);

      timerGravacaoRef.current = window.setInterval(() => {
        setTempoGravacao((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao gravar vídeo:', err);
      alert('Não foi possível iniciar a gravação de vídeo.');
    }
  };

  const handleStopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerGravacaoRef.current) {
      clearInterval(timerGravacaoRef.current);
    }
    setGravandoVideo(false);
  };

  const formatarTempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden touch-none">
      <canvas ref={canvasRef} className="hidden" />

      {/* ================= POST-CAPTURE PREVIEW SCREEN ================= */}
      {fotoCapturadaPreview ? (
        <div className="relative w-full h-full flex flex-col justify-between bg-slate-950 p-4">
          {/* Top Bar Preview */}
          <div className="flex items-center justify-between z-10">
            <button
              type="button"
              onClick={() => setFotoCapturadaPreview(null)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition active:scale-95 cursor-pointer"
              title="Voltar / Descartar"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Ajuste da Fotografia</p>
              <p className="text-[10px] text-slate-400">Verifique a nitidez do quadro antes de salvar</p>
            </div>
            <button
              type="button"
              onClick={() => setRotacaoPreview((prev) => (prev + 90) % 360)}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition active:scale-95 flex items-center gap-1 text-xs cursor-pointer"
              title="Girar 90°"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Center Image with rotation */}
          <div className="flex-1 flex items-center justify-center overflow-hidden my-4">
            <img
              src={fotoCapturadaPreview}
              alt="Foto Capturada"
              style={{
                transform: `rotate(${rotacaoPreview}deg)`,
                transition: 'transform 0.2s ease',
              }}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="flex items-center justify-between gap-4 max-w-md mx-auto w-full z-10">
            <button
              type="button"
              onClick={() => setFotoCapturadaPreview(null)}
              className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-bold text-xs sm:text-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Tirar Outra</span>
            </button>
            <button
              type="button"
              onClick={handleConfirmarFoto}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs sm:text-sm transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar na Aula</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= LIVE CAMERA VIEWPORT & CONTROLS ================= */
        <div
          ref={containerRef}
          onClick={handleTouchFocus}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-full flex flex-col justify-between overflow-hidden"
        >
          {/* Top Bar: Tools, Torch, Grid, Lens Flip, Close */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              {hasTorch && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTorch();
                  }}
                  className={`p-2.5 rounded-full backdrop-blur-md transition active:scale-95 cursor-pointer ${
                    torchAtiva
                      ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/30'
                      : 'bg-black/40 text-white hover:bg-black/60'
                  }`}
                  title="Lanterna / Flash"
                >
                  {torchAtiva ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMostrarGrade(!mostrarGrade);
                }}
                className={`p-2.5 rounded-full backdrop-blur-md transition active:scale-95 cursor-pointer ${
                  mostrarGrade ? 'bg-indigo-600 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                }`}
                title="Grade de Alinhamento 3x3"
              >
                <Grid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMostrarControlesAvancados(!mostrarControlesAvancados);
                }}
                className={`p-2.5 rounded-full backdrop-blur-md transition active:scale-95 cursor-pointer ${
                  mostrarControlesAvancados ? 'bg-indigo-600 text-white' : 'bg-black/40 text-white hover:bg-black/60'
                }`}
                title="Ajustes de Luz e Contraste"
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFacingMode();
                }}
                className="p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition active:scale-95 cursor-pointer"
                title="Alternar Câmera (Frontal / Traseira)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Video element */}
          <div className="absolute inset-0 z-0 flex items-center justify-center bg-black overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                filter: getFilterStyle(),
                transform: `${facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)'} scale(${zoom})`,
                transformOrigin: 'center center',
                transition: 'transform 0.08s ease-out',
              }}
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* 3x3 Grid Overlay */}
            {mostrarGrade && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="border-r border-b border-white/25" />
                <div className="" />
              </div>
            )}

            {/* Tap-to-focus indicator */}
            {focusPoint && (
              <div
                style={{
                  top: focusPoint.y - 32,
                  left: focusPoint.x - 32,
                }}
                className="absolute w-16 h-16 border-2 border-amber-400 rounded-lg pointer-events-none z-20 animate-ping flex items-center justify-center"
              >
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
              </div>
            )}

            {/* Video Recording Timer Indicator */}
            {gravandoVideo && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-rose-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-mono font-bold shadow-lg animate-pulse">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
                <span>REC {formatarTempo(tempoGravacao)}</span>
              </div>
            )}
          </div>

          {/* Right Floating Control: Vertical Zoom & Brightness Slider if Advanced opened */}
          {mostrarControlesAvancados && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-3 top-20 z-20 bg-slate-950/85 backdrop-blur-md border border-white/10 p-3 rounded-2xl space-y-4 shadow-2xl flex flex-col items-center w-36"
            >
              {/* Brightness / Light adjustment */}
              <div className="w-full space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" /> Luz
                  </span>
                  <span>{brilho}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="160"
                  value={brilho}
                  onChange={(e) => setBrilho(Number(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="w-full space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold">
                  <span className="flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-indigo-400" /> Contraste
                  </span>
                  <span>{contraste}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="170"
                  value={contraste}
                  onChange={(e) => setContraste(Number(e.target.value))}
                  className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Reset adjustments */}
              <button
                type="button"
                onClick={() => {
                  setBrilho(100);
                  setContraste(100);
                  setFiltro('normal');
                }}
                className="w-full py-1 text-[10px] bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg font-medium transition text-center cursor-pointer"
              >
                Repor Padrão
              </button>
            </div>
          )}

          {/* Bottom Area: Filter Pills, Zoom Level Buttons, Trigger Button & Mode Switch */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 inset-x-0 z-20 flex flex-col items-center gap-3 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent"
          >
            {/* Filter Modes for Academic Quality */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full px-2 py-1 scrollbar-none">
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'slide', label: 'Slide / Projetor' },
                { id: 'quadro_branco', label: 'Quadro Branco' },
                { id: 'quadro_negro', label: 'Quadro Negro' },
                { id: 'documento', label: 'Documento P&B' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltro(f.id as AcademicFilterMode)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide transition whitespace-nowrap active:scale-95 cursor-pointer ${
                    filtro === f.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick Zoom Buttons (1x, 2x, 3x, 5x) */}
            <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              {[1, 2, 3, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleApplyZoom(level)}
                  className={`w-7 h-7 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition active:scale-90 cursor-pointer ${
                    Math.round(zoom) === level
                      ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {level}x
                </button>
              ))}
            </div>

            {/* Main Trigger & Mode Selector Row */}
            <div className="w-full max-w-sm flex items-center justify-between px-4 pt-1">
              {/* Switch to Photo / Video */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (gravandoVideo) handleStopVideoRecording();
                    setModo('foto');
                  }}
                  className={`text-xs font-bold transition px-2.5 py-1.5 rounded-xl cursor-pointer ${
                    modo === 'foto' ? 'text-amber-400 bg-white/10' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  FOTO
                </button>
                <button
                  type="button"
                  onClick={() => setModo('video')}
                  className={`text-xs font-bold transition px-2.5 py-1.5 rounded-xl cursor-pointer ${
                    modo === 'video' ? 'text-rose-400 bg-white/10' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  VÍDEO
                </button>
              </div>

              {/* Main Shutter Button */}
              {modo === 'foto' ? (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="w-18 h-18 rounded-full bg-white p-1.5 shadow-2xl active:scale-90 transition transform flex items-center justify-center border-4 border-slate-900 focus:outline-none cursor-pointer"
                  title="Fotografar Quadro"
                >
                  <div className="w-full h-full rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-inner hover:bg-slate-100" />
                </button>
              ) : !gravandoVideo ? (
                <button
                  type="button"
                  onClick={handleStartVideoRecording}
                  className="w-18 h-18 rounded-full bg-white/20 p-1.5 shadow-2xl active:scale-90 transition transform flex items-center justify-center border-4 border-rose-500 focus:outline-none cursor-pointer"
                  title="Gravar Vídeo"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-600 shadow-md hover:bg-rose-500 transition" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopVideoRecording}
                  className="w-18 h-18 rounded-full bg-white/20 p-1.5 shadow-2xl active:scale-90 transition transform flex items-center justify-center border-4 border-white focus:outline-none cursor-pointer"
                  title="Parar Gravação de Vídeo"
                >
                  <Square className="w-6 h-6 fill-rose-600 text-rose-600 animate-pulse" />
                </button>
              )}

              {/* Quick close */}
              <div className="w-16 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
