import React from 'react';
import { Home, BookOpen, Clock, Zap, Bookmark } from 'lucide-react';
import { VisualizacaoAtual } from '../types';

interface BottomNavProps {
  visualizacao: VisualizacaoAtual;
  onNavegar: (view: VisualizacaoAtual) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ visualizacao, onNavegar }) => {
  const isAtivo = (tipo: string) => visualizacao.tipo === tipo;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-lg">
      <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around">
        {/* Início */}
        <button
          type="button"
          onClick={() => onNavegar({ tipo: 'inicio' })}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            isAtivo('inicio')
              ? 'text-indigo-600 font-bold bg-indigo-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Início</span>
        </button>

        {/* Cursos */}
        <button
          type="button"
          onClick={() => onNavegar({ tipo: 'cursos' })}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            isAtivo('cursos') || isAtivo('curso_detalhe') || isAtivo('disciplina_detalhe')
              ? 'text-indigo-600 font-bold bg-indigo-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Cursos</span>
        </button>

        {/* Modo Aula (Prominent Center Button) */}
        <button
          type="button"
          onClick={() => onNavegar({ tipo: 'modo_aula' })}
          className={`flex flex-col items-center -mt-5 cursor-pointer ${
            isAtivo('modo_aula') ? 'scale-105' : 'hover:scale-105'
          } transition-transform`}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-amber-400/30">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <span className="text-[10px] font-extrabold text-amber-700 mt-0.5">Modo Aula</span>
        </button>

        {/* Horário */}
        <button
          type="button"
          onClick={() => onNavegar({ tipo: 'horario' })}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            isAtivo('horario')
              ? 'text-indigo-600 font-bold bg-indigo-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Horário</span>
        </button>

        {/* Informações Importantes */}
        <button
          type="button"
          onClick={() => onNavegar({ tipo: 'informacoes_importantes' })}
          className={`flex flex-col items-center py-1 px-3 rounded-2xl transition cursor-pointer ${
            isAtivo('informacoes_importantes')
              ? 'text-indigo-600 font-bold bg-indigo-50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Anotações</span>
        </button>
      </div>
    </nav>
  );
};
