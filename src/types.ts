/**
 * Types and Data Models for MyStudy
 */

export type TipoMaterial = 'documento' | 'fotografia' | 'video' | 'audio' | 'link' | 'texto';

export interface Curso {
  id: string;
  nome: string;
  cor: string;
  descricao?: string;
  dataCriacao: string;
}

export interface Disciplina {
  id: string;
  cursoId: string;
  nome: string;
  codigo?: string;
  professor?: string;
  sala?: string;
  cor?: string;
  dataCriacao: string;
}

export interface MaterialItem {
  id: string;
  disciplinaId: string;
  titulo: string;
  tipo: TipoMaterial;
  conteudo: string; // URL, Base64, Blob key or Text content
  nomeArquivo?: string;
  mimeType?: string;
  tamanho?: number;
  dataCriacao: string;
  eImportante?: boolean;
}

export interface Apontamento {
  id: string;
  disciplinaId: string;
  titulo: string;
  texto: string;
  imagens: string[]; // Base64 or Blob URLs
  links: string[];
  eImportante: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface InformacaoImportante {
  id: string;
  disciplinaId: string;
  texto: string;
  origem: string; // e.g. "Contabilidade Geral - Aula 03 - Pág 12"
  dataCriacao: string;
}

export interface ItemAudioSessao {
  id: string;
  titulo: string;
  url: string;
  duracaoSegundos: number;
  dataCriacao: string;
}

export interface ItemFotoSessao {
  id: string;
  titulo: string;
  url: string;
  dataCriacao: string;
}

export interface ItemVideoSessao {
  id: string;
  titulo: string;
  url: string;
  dataCriacao: string;
}

export interface ItemNotaSessao {
  id: string;
  texto: string;
  timestamp: string;
}

export interface SessaoAula {
  id: string;
  disciplinaId: string;
  titulo: string;
  dataInicio: string;
  dataFim?: string;
  duracaoMinutos?: number;
  audios: ItemAudioSessao[];
  fotografias: ItemFotoSessao[];
  videos: ItemVideoSessao[];
  notas: ItemNotaSessao[];
  informacoesImportantes: InformacaoImportante[];
}

export interface HorarioAula {
  id: string;
  disciplinaId: string;
  diaSemana: number; // 1 (Segunda) to 7 (Domingo)
  horaInicio: string; // "08:30"
  horaFim: string; // "10:00"
  sala?: string;
}

export interface PerfilEstudante {
  nomeEstudante: string;
  onboardingConcluido: boolean;
  notificacoesAtivas: boolean;
  lembreteAulasMinutos: number;
  dicasEstudoAtivas: boolean;
}

export type VisualizacaoAtual =
  | { tipo: 'inicio' }
  | { tipo: 'cursos' }
  | { tipo: 'curso_detalhe'; cursoId: string }
  | { tipo: 'disciplina_detalhe'; disciplinaId: string; abaInicial?: 'materiais' | 'apontamentos' | 'informacoes' | 'aulas' }
  | { tipo: 'modo_aula'; disciplinaIdPadrao?: string }
  | { tipo: 'horario' }
  | { tipo: 'informacoes_importantes' }
  | { tipo: 'configuracoes' };
