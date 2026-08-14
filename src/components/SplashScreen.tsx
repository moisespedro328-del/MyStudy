import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, GraduationCap } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const FRASES_MOTIVACIONAIS = [
  {
    frase: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.',
    autor: 'Robert Collier',
  },
  {
    frase: 'Organize a sua mente, domine a sua rotina e alcance o seu potencial.',
    autor: 'Foco Acadêmico',
  },
  {
    frase: 'Cada minuto de dedicação é um passo seguro em direção aos seus objetivos.',
    autor: 'Constância',
  },
  {
    frase: 'A persistência transforma a aprendizagem no seu maior superpoder.',
    autor: 'Desenvolvimento Pessoal',
  },
  {
    frase: 'O conhecimento que você adquire hoje constrói as conquistas de amanhã.',
    autor: 'Excelência',
  },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [frase] = useState(() => {
    const randomIndex = Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length);
    return FRASES_MOTIVACIONAIS[randomIndex];
  });

  const [progresso, setProgresso] = useState(0);
  const [statusTexto, setStatusTexto] = useState('A preparar o seu espaço...');

  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    // Tempo otimizado para carregar os recursos do dispositivo e proporcionar leitura agradável da frase
    const duracaoTotal = 1350;

    const atualizarProgresso = (currentTime: number) => {
      const decorrido = currentTime - startTime;
      const percentual = Math.min(Math.round((decorrido / duracaoTotal) * 100), 100);

      setProgresso(percentual);

      if (percentual < 45) {
        setStatusTexto('A sincronizar os seus cursos...');
      } else if (percentual < 85) {
        setStatusTexto('A carregar apontamentos e materiais...');
      } else {
        setStatusTexto('Tudo pronto para estudar!');
      }

      if (decorrido < duracaoTotal) {
        animationFrameId = requestAnimationFrame(atualizarProgresso);
      } else {
        // Pequena pausa para fade out suave
        setTimeout(() => {
          onFinish();
        }, 180);
      }
    };

    animationFrameId = requestAnimationFrame(atualizarProgresso);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [onFinish]);

  return (
    <motion.div
      id="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: 'easeInOut' } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-slate-950 text-white px-6 py-12 select-none overflow-hidden"
    >
      {/* Background Subtle Glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Placeholder for balance */}
      <div className="w-full flex justify-center items-center gap-1.5 opacity-60">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-200">
          Espaço de Estudos Inteligente
        </span>
      </div>

      {/* Center Main Content (Logo & Motivational Quote) */}
      <div className="flex flex-col items-center text-center max-w-sm mx-auto space-y-7 z-10">
        {/* App Icon with Entrance Animation */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-500/30 border border-indigo-400/30">
            <BookOpen className="w-10 h-10 text-white stroke-[2.2]" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center shadow-lg">
            <GraduationCap className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Brand Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="space-y-1"
        >
          <h1 className="text-3xl font-black tracking-tight text-white">
            My<span className="text-indigo-400">Study</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Seu ecossistema de aprendizagem e produtividade
          </p>
        </motion.div>

        {/* Motivational Quote Box (Option 2) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-slate-900/80 border border-slate-800 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl space-y-2 relative"
        >
          <p className="text-sm sm:text-base text-slate-200 font-serif italic leading-relaxed">
            "{frase.frase}"
          </p>
          <div className="flex items-center justify-end gap-1 text-[11px] font-semibold text-indigo-400">
            <span>— {frase.autor}</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Progress & Device Processing Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="w-full max-w-xs space-y-3 z-10"
      >
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span className="font-medium">{statusTexto}</span>
          <span className="font-mono text-indigo-300 font-semibold">{progresso}%</span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/50">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-75 ease-out"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};
