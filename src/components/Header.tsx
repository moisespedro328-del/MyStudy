import React from 'react';
import { Settings, Zap, Bookmark, GraduationCap } from 'lucide-react';
import { PerfilEstudante, VisualizacaoAtual } from '../types';

interface HeaderProps {
  perfil: PerfilEstudante;
  onNavegar: (view: VisualizacaoAtual) => void;
}

export const Header: React.FC<HeaderProps> = ({ perfil, onNavegar }) => {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand & Greeting */}
        <div
          onClick={() => onNavegar({ tipo: 'inicio' })}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight block text-white leading-tight">
              MyStudy
            </span>
            <span className="text-[11px] text-slate-400 font-medium block">
              Olá, {perfil.nomeEstudante || 'Estudante'} 👋
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Modo Aula Button */}
          <button
            type="button"
            onClick={() => onNavegar({ tipo: 'modo_aula' })}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Acesso Rápido ao Modo Aula"
          >
            <Zap className="w-4 h-4 text-amber-100 fill-amber-100 animate-pulse" />
            <span className="hidden sm:inline">Modo Aula</span>
          </button>

          {/* Key Info Shortcut */}
          <button
            type="button"
            onClick={() => onNavegar({ tipo: 'informacoes_importantes' })}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Informações Importantes Guardadas"
          >
            <Bookmark className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => onNavegar({ tipo: 'configuracoes' })}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
