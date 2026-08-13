import React, { useState } from 'react';
import {
  Settings,
  Bell,
  User,
  Info,
  RotateCcw,
  Trash2,
  Check,
  GraduationCap,
  Sparkles,
  Database,
  Upload,
  Download,
  FolderArchive,
} from 'lucide-react';
import {
  getPerfil,
  savePerfil,
  seedDadosExemplo,
  limparTodosDados,
  getLixeira,
} from '../lib/storage';
import { VisualizacaoAtual } from '../types';
import { BackupRestoreModal } from './BackupRestoreModal';
import { LixeiraModal } from './LixeiraModal';

interface SettingsModalProps {
  onNavegar: (view: VisualizacaoAtual) => void;
  onReiniciarOnboarding: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onNavegar,
  onReiniciarOnboarding,
}) => {
  const [perfil, setPerfilState] = useState(getPerfil());
  const [nome, setNome] = useState(perfil.nomeEstudante);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(
    perfil.notificacoesAtivas
  );
  const [dicasEstudoAtivas, setDicasEstudoAtivas] = useState(
    perfil.dicasEstudoAtivas
  );
  const [mensagemSucesso, setMensagemSucesso] = useState('');
  const [modalBackup, setModalBackup] = useState<{
    aberto: boolean;
    aba: 'exportar' | 'restaurar';
  }>({ aberto: false, aba: 'exportar' });
  const [modalLixeiraAberto, setModalLixeiraAberto] = useState(false);
  const [qtdLixeira, setQtdLixeira] = useState(getLixeira().length);

  const recarregarLixeira = () => {
    setQtdLixeira(getLixeira().length);
  };

  const handleSalvarPreferencias = (e: React.FormEvent) => {
    e.preventDefault();
    savePerfil({
      nomeEstudante: nome.trim() || 'Estudante',
      notificacoesAtivas,
      dicasEstudoAtivas,
    });
    setPerfilState(getPerfil());
    setMensagemSucesso('Preferências salvas com sucesso!');
    setTimeout(() => setMensagemSucesso(''), 3000);
  };

  const handleCarregarExemplo = () => {
    if (
      window.confirm(
        'Deseja carregar dados de exemplo (Cursos de Contabilidade, Gestão e Horários)?'
      )
    ) {
      seedDadosExemplo();
      onNavegar({ tipo: 'inicio' });
    }
  };

  const handleLimparDados = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja apagar todos os cursos, disciplinas, apontamentos e materiais salvos localmente?'
      )
    ) {
      limparTodosDados();
      onReiniciarOnboarding();
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Configurações</h1>
          <p className="text-slate-500 text-xs">
            Gerencie seu perfil, preferências de notificações e armazenamento local.
          </p>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Preferences Form */}
      <form
        onSubmit={handleSalvarPreferencias}
        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5"
      >
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Perfil do Estudante</span>
        </h2>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Seu Nome
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3 pt-2">
          <Bell className="w-4 h-4 text-indigo-600" />
          <span>Notificações e Dicas</span>
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Notificações Locais de Aula
              </span>
              <span className="text-[11px] text-slate-500">
                Receber lembretes 15 minutos antes das aulas.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notificacoesAtivas}
              onChange={(e) => setNotificacoesAtivas(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl">
            <div>
              <span className="font-bold text-slate-800 text-xs block">
                Dicas de Estudo
              </span>
              <span className="text-[11px] text-slate-500">
                Exibir pequenas dicas de técnicas de estudo na tela inicial.
              </span>
            </div>
            <input
              type="checkbox"
              checked={dicasEstudoAtivas}
              onChange={(e) => setDicasEstudoAtivas(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-2xl hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </form>

      {/* Dados e Armazenamento -> Backup e Dados + Lixeira */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider block">
              Dados e armazenamento
            </span>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mt-0.5">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Backup, Lixeira e Dados</span>
            </h2>
          </div>
          {qtdLixeira > 0 && (
            <span className="px-2.5 py-1 bg-red-100 text-red-700 font-extrabold text-[10px] rounded-full flex items-center gap-1">
              <Trash2 className="w-3 h-3" />
              <span>{qtdLixeira} na lixeira</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Exporte backups completos, recupere itens excluídos na Lixeira ou restaure uma cópia dos seus dados.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setModalBackup({ aberto: true, aba: 'exportar' })}
            className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 font-extrabold text-xs rounded-2xl hover:bg-indigo-100 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>📤 Exportar backup</span>
          </button>

          <button
            type="button"
            onClick={() => setModalBackup({ aberto: true, aba: 'restaurar' })}
            className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-extrabold text-xs rounded-2xl hover:bg-emerald-100 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>📥 Restaurar backup</span>
          </button>

          <button
            type="button"
            onClick={() => setModalLixeiraAberto(true)}
            className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 font-extrabold text-xs rounded-2xl hover:bg-rose-100 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs relative"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>🗑️ Lixeira ({qtdLixeira})</span>
          </button>
        </div>
      </div>

      {/* Advanced Data Management */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
          <RotateCcw className="w-4 h-4 text-indigo-600" />
          <span>Gestão de Dados do Aplicativo</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCarregarExemplo}
            className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs rounded-2xl hover:bg-indigo-100 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Carregar Dados de Exemplo</span>
          </button>

          <button
            type="button"
            onClick={handleLimparDados}
            className="p-3.5 bg-red-50 border border-red-200 text-red-700 font-bold text-xs rounded-2xl hover:bg-red-100 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Limpar Todos os Dados</span>
          </button>
        </div>
      </div>

      {/* About App */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-600" />
          <span>Sobre o Aplicativo</span>
        </h2>

        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="font-extrabold text-slate-800 text-sm block">
              MyStudy V1.0
            </span>
            <p className="text-[11px] text-slate-500">
              "O estudante adiciona. O aplicativo organiza."
            </p>
            <p className="text-[10px] text-slate-400">
              Versão nativa 100% offline e privativa. Todos os dados permanecem salvos no dispositivo.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Backup / Restauração */}
      {modalBackup.aberto && (
        <BackupRestoreModal
          abaInicial={modalBackup.aba}
          onFechar={() => setModalBackup({ ...modalBackup, aberto: false })}
          onRestauradoComSucesso={() => {
            onNavegar({ tipo: 'inicio' });
          }}
        />
      )}

      {/* Modal da Lixeira */}
      {modalLixeiraAberto && (
        <LixeiraModal
          onFechar={() => {
            setModalLixeiraAberto(false);
            recarregarLixeira();
          }}
          onAtualizado={recarregarLixeira}
        />
      )}
    </div>
  );
};
