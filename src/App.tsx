import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  getPerfil,
  subscribeToStorage,
  savePerfil,
} from './lib/storage';
import { PerfilEstudante, VisualizacaoAtual } from './types';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Onboarding } from './components/Onboarding';
import { HomeView } from './components/HomeView';
import { CoursesView } from './components/CoursesView';
import { CourseDetailView } from './components/CourseDetailView';
import { SubjectDetailView } from './components/SubjectDetailView';
import { ModoAulaView } from './components/ModoAulaView';
import { InformacoesImportantesView } from './components/InformacoesImportantesView';
import { HorarioView } from './components/HorarioView';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [mostrarSplash, setMostrarSplash] = useState(true);
  const [perfil, setPerfil] = useState<PerfilEstudante>(getPerfil());
  const [visualizacao, setVisualizacao] = useState<VisualizacaoAtual>({
    tipo: 'inicio',
  });

  // Synchronize state on storage updates
  useEffect(() => {
    const unsubscribe = subscribeToStorage(() => {
      setPerfil(getPerfil());
    });
    return () => unsubscribe();
  }, []);

  // Handle URL hashtag quick shortcuts (e.g. #modo_aula)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#modo_aula') {
        setVisualizacao({ tipo: 'modo_aula' });
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleNavegar = (view: VisualizacaoAtual) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setVisualizacao(view);
  };

  const handleConcluirOnboarding = () => {
    setPerfil(getPerfil());
    setVisualizacao({ tipo: 'inicio' });
  };

  const handleReiniciarOnboarding = () => {
    savePerfil({ onboardingConcluido: false });
    setPerfil(getPerfil());
    setVisualizacao({ tipo: 'inicio' });
  };

  return (
    <>
      <AnimatePresence>
        {mostrarSplash && (
          <SplashScreen onFinish={() => setMostrarSplash(false)} />
        )}
      </AnimatePresence>

      {!perfil.onboardingConcluido ? (
        <Onboarding onConcluido={handleConcluirOnboarding} />
      ) : (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
          {/* Top Header Bar */}
          <Header perfil={perfil} onNavegar={handleNavegar} />

          {/* Main View Container */}
          <main className="max-w-5xl mx-auto px-4 pt-6">
            {visualizacao.tipo === 'inicio' && (
              <HomeView onNavegar={handleNavegar} />
            )}

            {visualizacao.tipo === 'cursos' && (
              <CoursesView onNavegar={handleNavegar} />
            )}

            {visualizacao.tipo === 'curso_detalhe' && (
              <CourseDetailView
                cursoId={visualizacao.cursoId}
                onNavegar={handleNavegar}
              />
            )}

            {visualizacao.tipo === 'disciplina_detalhe' && (
              <SubjectDetailView
                disciplinaId={visualizacao.disciplinaId}
                abaInicial={visualizacao.abaInicial}
                onNavegar={handleNavegar}
              />
            )}

            {visualizacao.tipo === 'modo_aula' && (
              <ModoAulaView
                disciplinaIdPadrao={visualizacao.disciplinaIdPadrao}
                onNavegar={handleNavegar}
              />
            )}

            {visualizacao.tipo === 'informacoes_importantes' && (
              <InformacoesImportantesView onNavegar={handleNavegar} />
            )}

            {visualizacao.tipo === 'horario' && (
              <HorarioView onNavegar={handleNavegar} />
            )}

            {visualizacao.tipo === 'configuracoes' && (
              <SettingsModal
                onNavegar={handleNavegar}
                onReiniciarOnboarding={handleReiniciarOnboarding}
              />
            )}
          </main>

          {/* Persistent Bottom Navigation */}
          <BottomNav visualizacao={visualizacao} onNavegar={handleNavegar} />
        </div>
      )}
    </>
  );
}
