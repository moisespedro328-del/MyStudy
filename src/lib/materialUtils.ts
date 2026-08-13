import { MaterialItem } from '../types';

export type CategoriaMaterial =
  | 'documentos'
  | 'videos'
  | 'audios'
  | 'fotografias'
  | 'links'
  | 'outros';

export interface CategoriaInfo {
  key: CategoriaMaterial;
  nome: string;
  icone: string;
  descricao: string;
  corBg: string;
  corTexto: string;
  corBorda: string;
  corBadge: string;
}

export const CATEGORIAS_CONFIG: Record<CategoriaMaterial, CategoriaInfo> = {
  documentos: {
    key: 'documentos',
    nome: 'Documentos',
    icone: '📄',
    descricao: 'PDF, Word, Excel, PowerPoint e ficheiros de texto',
    corBg: 'bg-blue-50 hover:bg-blue-100/80',
    corTexto: 'text-blue-800',
    corBorda: 'border-blue-200',
    corBadge: 'bg-blue-600 text-white',
  },
  videos: {
    key: 'videos',
    nome: 'Vídeos',
    icone: '🎥',
    descricao: 'Gravações e ficheiros de vídeo de aula',
    corBg: 'bg-purple-50 hover:bg-purple-100/80',
    corTexto: 'text-purple-800',
    corBorda: 'border-purple-200',
    corBadge: 'bg-purple-600 text-white',
  },
  audios: {
    key: 'audios',
    nome: 'Áudios',
    icone: '🎙️',
    descricao: 'Gravações de voz e áudios de aula',
    corBg: 'bg-rose-50 hover:bg-rose-100/80',
    corTexto: 'text-rose-800',
    corBorda: 'border-rose-200',
    corBadge: 'bg-rose-600 text-white',
  },
  fotografias: {
    key: 'fotografias',
    nome: 'Fotografias',
    icone: '📷',
    descricao: 'Fotografias de quadros, esquemas e imagens',
    corBg: 'bg-emerald-50 hover:bg-emerald-100/80',
    corTexto: 'text-emerald-800',
    corBorda: 'border-emerald-200',
    corBadge: 'bg-emerald-600 text-white',
  },
  links: {
    key: 'links',
    nome: 'Links',
    icone: '🔗',
    descricao: 'Ligações e URLs de estudo externos',
    corBg: 'bg-amber-50 hover:bg-amber-100/80',
    corTexto: 'text-amber-800',
    corBorda: 'border-amber-200',
    corBadge: 'bg-amber-600 text-white',
  },
  outros: {
    key: 'outros',
    nome: 'Outros',
    icone: '📦',
    descricao: 'Outros ficheiros e materiais diversos',
    corBg: 'bg-slate-50 hover:bg-slate-100',
    corTexto: 'text-slate-800',
    corBorda: 'border-slate-200',
    corBadge: 'bg-slate-600 text-white',
  },
};

/**
  Categorizes a material item dynamically based on metadata, mimeType, filename extension or content URL
 */
export function getCategoriaMaterial(m: MaterialItem): CategoriaMaterial {
  if (!m) return 'outros';

  const tipo = (m.tipo || '').toLowerCase();
  const mime = (m.mimeType || '').toLowerCase();
  const nomeArq = (m.nomeArquivo || m.titulo || '').toLowerCase();
  const conteudo = (m.conteudo || '').toLowerCase();

  // 1. Explicit `tipo` check
  if (tipo === 'documento' || tipo === 'texto') return 'documentos';
  if (tipo === 'video') return 'videos';
  if (tipo === 'audio') return 'audios';
  if (tipo === 'fotografia') return 'fotografias';
  if (tipo === 'link') return 'links';

  // 2. MIME type & Data URL checks
  if (mime.startsWith('image/') || conteudo.startsWith('data:image/')) return 'fotografias';
  if (mime.startsWith('audio/') || conteudo.startsWith('data:audio/')) return 'audios';
  if (mime.startsWith('video/') || conteudo.startsWith('data:video/')) return 'videos';

  // 3. File extensions check
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(nomeArq)) return 'fotografias';
  if (/\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(nomeArq)) return 'audios';
  if (/\.(mp4|webm|mkv|avi|mov|3gp|flv)$/i.test(nomeArq)) return 'videos';
  if (/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx|rtf|csv|odt|epub)$/i.test(nomeArq)) return 'documentos';

  // 4. URL format check
  if (conteudo.startsWith('http://') || conteudo.startsWith('https://')) return 'links';

  return 'outros';
}

/**
  Check if a material was captured or added via Modo Aula
 */
export function isModoAulaMaterial(m: MaterialItem): boolean {
  if (m.origemModoAula) return true;
  const tituloLower = (m.titulo || '').toLowerCase();
  return (
    tituloLower.includes('modo aula') ||
    (tituloLower.includes('aula') &&
      (tituloLower.includes('áudio') ||
        tituloLower.includes('fotografia') ||
        tituloLower.includes('vídeo') ||
        tituloLower.includes('gravação')))
  );
}

/**
  Calculates item counts for each category
 */
export function getContadoresCategorias(
  materiais: MaterialItem[]
): Record<CategoriaMaterial | 'todas', number> {
  const counts: Record<CategoriaMaterial | 'todas', number> = {
    todas: materiais.length,
    documentos: 0,
    videos: 0,
    audios: 0,
    fotografias: 0,
    links: 0,
    outros: 0,
  };

  materiais.forEach((m) => {
    const cat = getCategoriaMaterial(m);
    counts[cat] = (counts[cat] || 0) + 1;
  });

  return counts;
}
