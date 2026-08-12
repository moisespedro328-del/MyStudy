import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  FolderArchive,
  GraduationCap,
  BookOpen,
  Folder,
  FileText,
  Clock,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  exportarBackup,
  validarEAnalisarBackup,
  restaurarBackup,
  BackupMetadata,
} from '../lib/backupService';
import { getCursos } from '../lib/storage';

interface BackupRestoreModalProps {
  onFechar: () => void;
  abaInicial?: 'exportar' | 'restaurar';
  onRestauradoComSucesso?: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  onFechar,
  abaInicial = 'exportar',
  onRestauradoComSucesso,
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'exportar' | 'restaurar'>(abaInicial);

  // States for Export
  const [exportando, setExportando] = useState(false);
  const [progressoTexto, setProgressoTexto] = useState('');
  const [progressoPercentual, setProgressoPercentual] = useState(0);
  const [exportResultado, setExportResultado] = useState<{
    sucesso: boolean;
    mensagem: string;
    stats?: any;
  } | null>(null);

  // States for Restore
  const [analisando, setAnalisando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
  const [backupValidoData, setBackupValidoData] = useState<{
    metadata: BackupMetadata;
    zipObj: any;
  } | null>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [modoConflito, setModoConflito] = useState<'combinar' | 'substituir'>('combinar');
  const [restoreResultado, setRestoreResultado] = useState<{
    sucesso: boolean;
    mensagem: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if app already has data
  const possuiDadosLocais = getCursos().length > 0;

  // 📤 EXPORTAR BACKUP
  const handleIniciarExportacao = async () => {
    setExportando(true);
    setExportResultado(null);
    setProgressoTexto('Iniciando exportação...');
    setProgressoPercentual(5);

    const res = await exportarBackup((msg, atual, total) => {
      setProgressoTexto(msg);
      if (atual !== undefined && total && total > 0) {
        const perc = Math.min(100, Math.round((atual / total) * 100));
        setProgressoPercentual(perc);
      }
    });

    setExportando(false);
    setExportResultado(res);
  };

  // 📥 SELECIONAR FICHEIRO DE BACKUP
  const handleFicheiroSelecionado = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalisando(true);
    setErroValidacao(null);
    setBackupValidoData(null);
    setRestoreResultado(null);

    const val = await validarEAnalisarBackup(file);
    setAnalisando(false);

    if (val.valido && val.metadata && val.zipObj) {
      setBackupValidoData({ metadata: val.metadata, zipObj: val.zipObj });
    } else {
      setErroValidacao(val.mensagem || 'Ficheiro de backup inválido.');
    }

    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 📥 CONFIRMAR RESTAURAÇÃO
  const handleConfirmarRestauracao = async () => {
    if (!backupValidoData) return;

    setRestaurando(true);
    setProgressoTexto('A preparar restauração...');
    setProgressoPercentual(10);

    const res = await restaurarBackup(
      backupValidoData.zipObj,
      backupValidoData.metadata,
      modoConflito,
      (msg, atual, total) => {
        setProgressoTexto(msg);
        if (atual !== undefined && total && total > 0) {
          const perc = Math.min(100, Math.round((atual / total) * 100));
          setProgressoPercentual(perc);
        }
      }
    );

    setRestaurando(false);
    setRestoreResultado(res);

    if (res.sucesso && onRestauradoComSucesso) {
      onRestauradoComSucesso();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/30 text-indigo-300 rounded-2xl border border-indigo-500/20">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Backup e Dados
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Organização pessoal com total autonomia do estudante
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 grid grid-cols-2 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setAbaAtiva('exportar')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              abaAtiva === 'exportar'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>📤 Exportar Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('restaurar')}
            className={`py-2.5 px-4 rounded-2xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer ${
              abaAtiva === 'restaurar'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>📥 Restaurar Backup</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 bg-slate-50">
          {/* 📤 EXPORT TAB */}
          {abaAtiva === 'exportar' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Crie uma cópia completa dos seus estudos
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      O backup organiza os seus cursos, disciplinas, ficheiros (PDFs, fotografias, áudios e vídeos), apontamentos e horários numa estrutura de pastas compactada com o ficheiro <strong className="text-slate-800">MyStudy_Backup_Info.json</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress State */}
              {exportando && (
                <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>{progressoTexto}</span>
                    </span>
                    <span>{progressoPercentual}%</span>
                  </div>
                  <div className="w-full bg-indigo-200/70 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressoPercentual}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Result State */}
              {exportResultado && (
                <div
                  className={`p-4 rounded-2xl border animate-in fade-in ${
                    exportResultado.sucesso
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {exportResultado.sucesso ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm">
                        {exportResultado.sucesso ? 'Backup Criado com Sucesso!' : 'Falha na Exportação'}
                      </h4>
                      <p className="text-xs leading-relaxed opacity-90">
                        {exportResultado.mensagem}
                      </p>

                      {exportResultado.stats && (
                        <div className="mt-3 pt-3 border-t border-emerald-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-bold text-emerald-800">
                          <div>🎓 Cursos: {exportResultado.stats.totalCursos}</div>
                          <div>📚 Disciplinas: {exportResultado.stats.totalDisciplinas}</div>
                          <div>📂 Materiais: {exportResultado.stats.totalMateriais}</div>
                          <div>📝 Apontamentos: {exportResultado.stats.totalApontamentos}</div>
                          <div>🎓 Sessões: {exportResultado.stats.totalSessoes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={exportando}
                  onClick={handleIniciarExportacao}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{exportando ? 'A Gerar Backup...' : '📤 Exportar Backup Agora'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 📥 RESTORE TAB */}
          {abaAtiva === 'restaurar' && (
            <div className="space-y-5">
              {/* File Selector Box */}
              {!backupValidoData && !restaurando && (
                <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-4 hover:border-indigo-400 transition">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
                    <Download className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">
                      Selecione um ficheiro de backup (.zip)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Escolha o ficheiro de backup gerado anteriormente pelo MyStudy (contendo a estrutura de pastas e o MyStudy_Backup_Info.json).
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={handleFicheiroSelecionado}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={analisando}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    {analisando ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>A Analisar Backup...</span>
                      </>
                    ) : (
                      <>
                        <Folder className="w-4 h-4" />
                        <span>Escolher Ficheiro no Dispositivo</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Validation Error */}
              {erroValidacao && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-red-900 flex items-start gap-3 animate-in fade-in">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs">Backup Inválido</h4>
                    <p className="text-xs opacity-90 mt-0.5">{erroValidacao}</p>
                  </div>
                </div>
              )}

              {/* Backup Preview & Confirmation Modal */}
              {backupValidoData && !restaurando && !restoreResultado && (
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                      <FileCheck className="w-5 h-5" />
                      <span>Backup Encontrado e Validado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBackupValidoData(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 underline font-bold"
                    >
                      Trocar Ficheiro
                    </button>
                  </div>

                  {/* Summary Stats Grid */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>📅 Criado em:</span>
                      <span className="text-slate-900 font-extrabold">
                        {new Date(backupValidoData.metadata.dataCriacao).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-bold text-slate-700">
                      <div className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-600" />
                        <span>Cursos: {backupValidoData.metadata.estatisticas.totalCursos}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span>Disciplinas: {backupValidoData.metadata.estatisticas.totalDisciplinas}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2">
                        <Folder className="w-4 h-4 text-indigo-600" />
                        <span>Materiais: {backupValidoData.metadata.estatisticas.totalMateriais}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Apontamentos: {backupValidoData.metadata.estatisticas.totalApontamentos}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        <span>Horários: {backupValidoData.metadata.estatisticas.totalHorarios}</span>
                      </div>
                    </div>
                  </div>

                  {/* Protection Warning if local data exists */}
                  {possuiDadosLocais && (
                    <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Atenção: O aplicativo já possui dados no dispositivo</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Escolha como deseja tratar a mesclagem com as informações existentes:
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <label
                          className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center gap-2 ${
                            modoConflito === 'combinar'
                              ? 'bg-amber-100/80 border-amber-400 text-amber-950'
                              : 'bg-white border-amber-200 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="modoConflito"
                            checked={modoConflito === 'combinar'}
                            onChange={() => setModoConflito('combinar')}
                            className="text-indigo-600"
                          />
                          <span>Combinar / Atualizar</span>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition flex items-center gap-2 ${
                            modoConflito === 'substituir'
                              ? 'bg-red-100/80 border-red-400 text-red-950'
                              : 'bg-white border-amber-200 text-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="modoConflito"
                            checked={modoConflito === 'substituir'}
                            onChange={() => setModoConflito('substituir')}
                            className="text-red-600"
                          />
                          <span>Substituir Tudo</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setBackupValidoData(null)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmarRestauracao}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
                    >
                      Restaurar Backup
                    </button>
                  </div>
                </div>
              )}

              {/* Progress State during Restore */}
              {restaurando && (
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>{progressoTexto}</span>
                    </span>
                    <span>{progressoPercentual}%</span>
                  </div>
                  <div className="w-full bg-emerald-200/70 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressoPercentual}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Restore Result State */}
              {restoreResultado && (
                <div
                  className={`p-4 rounded-2xl border animate-in fade-in ${
                    restoreResultado.sucesso
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {restoreResultado.sucesso ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-extrabold text-sm">
                        {restoreResultado.sucesso ? 'Restauração Concluída!' : 'Falha na Restauração'}
                      </h4>
                      <p className="text-xs leading-relaxed opacity-90 mt-1">
                        {restoreResultado.mensagem}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={onFechar}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
