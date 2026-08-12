import { MaterialItem } from '../types';

export interface ActionResult {
  sucesso: boolean;
  mensagem: string;
}

/**
 * Shared helper to format file extension from mime type or material type
 */
export function getExtensaoPorTipo(tipo: string, mimeType?: string, nomeArquivo?: string): string {
  if (nomeArquivo && nomeArquivo.includes('.')) {
    const parts = nomeArquivo.split('.');
    const ext = parts[parts.length - 1].toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }

  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('gif')) return 'gif';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('webm')) return 'webm';
    if (mimeType.includes('mp3')) return 'mp3';
    if (mimeType.includes('wav')) return 'wav';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('aac')) return 'aac';
    if (mimeType.includes('word') || mimeType.includes('docx')) return 'docx';
    if (mimeType.includes('text/plain')) return 'txt';
  }

  switch (tipo) {
    case 'fotografia':
      return 'jpg';
    case 'video':
      return 'mp4';
    case 'audio':
      return 'm4a';
    case 'documento':
      return 'pdf';
    case 'texto':
      return 'txt';
    case 'link':
      return 'url';
    default:
      return 'bin';
  }
}

/**
 * Helper to convert Base64 data URL, Blob URL or HTTP URL to a Blob object
 */
async function obterBlobMaterial(conteudo: string): Promise<Blob> {
  if (conteudo.startsWith('data:')) {
    const arr = conteudo.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const res = await fetch(conteudo);
  return await res.blob();
}

/**
 * 📤 Partilhar material utilizando o sistema nativo de partilha (Web Share API)
 */
export async function compartilharMaterial(material: MaterialItem): Promise<ActionResult> {
  try {
    // 1. LINK
    if (material.tipo === 'link') {
      if (navigator.share) {
        await navigator.share({
          title: material.titulo,
          text: material.titulo,
          url: material.conteudo,
        });
        return { sucesso: true, mensagem: 'Link partilhado com sucesso!' };
      } else {
        await navigator.clipboard.writeText(material.conteudo);
        return {
          sucesso: true,
          mensagem: 'Endereço do link copiado para a área de transferência!',
        };
      }
    }

    // 2. TEXTO
    if (material.tipo === 'texto') {
      if (navigator.share) {
        await navigator.share({
          title: material.titulo,
          text: `${material.titulo}\n\n${material.conteudo}`,
        });
        return { sucesso: true, mensagem: 'Texto partilhado com sucesso!' };
      } else {
        await navigator.clipboard.writeText(material.conteudo);
        return {
          sucesso: true,
          mensagem: 'Texto copiado para a área de transferência!',
        };
      }
    }

    // 3. FICHEIROS (documento, fotografia, video, audio)
    if (!material.conteudo) {
      return { sucesso: false, mensagem: 'Ficheiro sem conteúdo para partilhar.' };
    }

    if (navigator.share) {
      try {
        const blob = await obterBlobMaterial(material.conteudo);
        const ext = getExtensaoPorTipo(material.tipo, material.mimeType || blob.type, material.nomeArquivo);
        
        let nomeFinal = material.nomeArquivo || `${material.titulo.toLowerCase().replace(/[^\w\s-]/g, '_')}.${ext}`;
        if (!nomeFinal.includes('.')) {
          nomeFinal += `.${ext}`;
        }

        const mimeFinal = material.mimeType || blob.type || 'application/octet-stream';
        const file = new File([blob], nomeFinal, { type: mimeFinal });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: material.titulo,
            text: material.titulo,
            files: [file],
          });
          return { sucesso: true, mensagem: 'Material partilhado com sucesso!' };
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { sucesso: true, mensagem: 'Partilha cancelada.' };
        }
        console.warn('Partilha direta de ficheiro falhou, a tentar método secundário:', shareErr);
      }
    }

    // Fallback: Se a partilha nativa de ficheiros não for suportada
    if (material.conteudo.startsWith('http') || material.conteudo.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = material.conteudo;
      a.download = material.nomeArquivo || material.titulo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return {
        sucesso: true,
        mensagem: 'Transferência do ficheiro iniciada para partilha no dispositivo.',
      };
    }

    return { sucesso: false, mensagem: 'Não foi possível partilhar este material.' };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { sucesso: true, mensagem: 'Partilha cancelada.' };
    }
    console.error('Erro ao partilhar material:', error);
    return { sucesso: false, mensagem: 'Não foi possível partilhar este material.' };
  }
}

/**
 * 💾 Guardar uma cópia do material no dispositivo
 */
export async function guardarNoDispositivo(material: MaterialItem): Promise<ActionResult> {
  try {
    // 1. LINK -> Copiar URL e descarregar ficheiro .url
    if (material.tipo === 'link') {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(material.conteudo);
      }

      const urlShortcut = `[InternetShortcut]\nURL=${material.conteudo}\n`;
      const blob = new Blob([urlShortcut], { type: 'text/plain' });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${material.titulo.replace(/[^\w\s-]/g, '_')}.url`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      return {
        sucesso: true,
        mensagem: 'Atalho do link guardado no dispositivo e copiado para a área de transferência!',
      };
    }

    // 2. TEXTO -> Descarregar ficheiro .txt
    if (material.tipo === 'texto') {
      const blob = new Blob([material.conteudo], { type: 'text/plain;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${material.titulo.replace(/[^\w\s-]/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      return {
        sucesso: true,
        mensagem: 'Ficheiro de texto guardado no dispositivo com sucesso!',
      };
    }

    // 3. FICHEIROS (documento, fotografia, video, audio)
    if (!material.conteudo) {
      return { sucesso: false, mensagem: 'Conteúdo do material não encontrado.' };
    }

    const blob = await obterBlobMaterial(material.conteudo);
    const ext = getExtensaoPorTipo(material.tipo, material.mimeType || blob.type, material.nomeArquivo);

    let nomeFinal = material.nomeArquivo || `${material.titulo.replace(/[^\w\s-]/g, '_')}.${ext}`;
    if (!nomeFinal.includes('.')) {
      nomeFinal += `.${ext}`;
    }

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = nomeFinal;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    return {
      sucesso: true,
      mensagem: `Cópia do material "${nomeFinal}" guardada no dispositivo!`,
    };
  } catch (error) {
    console.error('Erro ao guardar material:', error);
    return { sucesso: false, mensagem: 'Não foi possível guardar este material.' };
  }
}
