import JSZip from 'jszip';
import {
  getCursos,
  getDisciplinas,
  getMateriais,
  getApontamentos,
  getInformacoesImportantes,
  getSessoesAula,
  getHorario,
  getPerfil,
  notifyStorageChange,
  STORAGE_KEYS,
} from './storage';
import {
  Curso,
  Disciplina,
  MaterialItem,
  Apontamento,
  InformacaoImportante,
  SessaoAula,
  HorarioAula,
  PerfilEstudante,
} from '../types';

export interface BackupMetadata {
  versaoFormat: string;
  nomeAplicativo: string;
  dataCriacao: string;
  estatisticas: {
    totalCursos: number;
    totalDisciplinas: number;
    totalMateriais: number;
    totalApontamentos: number;
    totalInformacoes: number;
    totalSessoes: number;
    totalHorarios: number;
  };
  perfil: PerfilEstudante;
  cursos: Curso[];
  disciplinas: Disciplina[];
  materiais: (Omit<MaterialItem, 'conteudo'> & {
    caminhoArquivoInZip?: string;
    conteudoOriginal?: string; // used if link or text without physical file
  })[];
  apontamentos: Apontamento[];
  informacoesImportantes: InformacaoImportante[];
  sessoesAula: SessaoAula[];
  horarios: HorarioAula[];
}

export interface ProgressCallback {
  (mensagem: string, atual?: number, total?: number): void;
}

/**
 * Sanitiza nomes de pastas/arquivos para evitar caracteres inválidos do SO
 */
function sanitizarNomeArquivo(nome: string): string {
  return nome
    .trim()
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ');
}

/**
 * Converte Data URL Base64 ou Blob URL para Blob
 */
async function dataUrlParaBlob(dataUrl: string): Promise<Blob> {
  if (dataUrl.startsWith('data:')) {
    const arr = dataUrl.split(',');
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

  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * Converte Blob em Data URL Base64
 */
function blobParaDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Obter extensão padrão de acordo com tipo/mimeType
 */
function getExtensaoPorTipo(tipo: string, mimeType?: string, nomeArquivo?: string): string {
  if (nomeArquivo && nomeArquivo.includes('.')) {
    const parts = nomeArquivo.split('.');
    const ext = parts[parts.length - 1].toLowerCase();
    if (ext && ext.length <= 5) return ext;
  }
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('mp4')) return 'mp4';
    if (mimeType.includes('mp3')) return 'mp3';
    if (mimeType.includes('m4a')) return 'm4a';
    if (mimeType.includes('text/plain')) return 'txt';
  }
  switch (tipo) {
    case 'fotografia': return 'jpg';
    case 'video': return 'mp4';
    case 'audio': return 'm4a';
    case 'documento': return 'pdf';
    case 'texto': return 'txt';
    case 'link': return 'url';
    default: return 'bin';
  }
}

/**
 * 📤 EXPORTAR BACKUP COMPLETO
 */
export async function exportarBackup(
  onProgress?: ProgressCallback
): Promise<{ sucesso: boolean; mensagem: string; stats?: any }> {
  try {
    if (onProgress) onProgress('Preparando dados para exportação...');

    const zip = new JSZip();

    const perfil = getPerfil();
    const cursos = getCursos();
    const disciplinas = getDisciplinas();
    const materiais = getMateriais();
    const apontamentos = getApontamentos();
    const informacoes = getInformacoesImportantes();
    const sessoes = getSessoesAula();
    const horarios = getHorario();

    // Nome da pasta principal
    const dataAtual = new Date();
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const ano = dataAtual.getFullYear();
    const dataFormatada = `${dia}-${mes}-${ano}`;
    const nomePastaRaiz = `MyStudy Backup - ${dataFormatada}`;

    const pastaRaiz = zip.folder(nomePastaRaiz);
    if (!pastaRaiz) {
      throw new Error('Não foi possível criar a pasta raiz no ficheiro de backup.');
    }

    // Mapeamento de Cursos e Disciplinas para estruturar pastas
    const mapaCursos = new Map<string, string>();
    cursos.forEach((c) => mapaCursos.set(c.id, sanitizarNomeArquivo(c.nome)));

    const mapaDisciplinas = new Map<string, { nome: string; cursoId: string }>();
    disciplinas.forEach((d) =>
      mapaDisciplinas.set(d.id, {
        nome: sanitizarNomeArquivo(d.nome),
        cursoId: d.cursoId,
      })
    );

    // Preparar lista de metadados dos materiais sem conteúdo binário direto no JSON
    const materiaisMetadata: BackupMetadata['materiais'] = [];

    const totalArquivos = materiais.length;
    let processados = 0;

    for (const mat of materiais) {
      processados++;
      if (onProgress) {
        onProgress(
          `Exportando materiais... (${processados} de ${totalArquivos})`,
          processados,
          totalArquivos
        );
      }

      const discInfo = mapaDisciplinas.get(mat.disciplinaId);
      const cursoNome = discInfo ? mapaCursos.get(discInfo.cursoId) || 'Sem_Curso' : 'Sem_Curso';
      const discNome = discInfo ? discInfo.nome : 'Sem_Disciplina';

      // Copiar dados sem o campo 'conteudo'
      const { conteudo, ...matResto } = mat;

      if (mat.tipo === 'link') {
        materiaisMetadata.push({
          ...matResto,
          conteudoOriginal: mat.conteudo,
        });

        // Também salvar atalho .url na pasta da disciplina
        const pastaDisc = pastaRaiz.folder(cursoNome)?.folder(discNome);
        if (pastaDisc) {
          const nomeArquivoLink = `${sanitizarNomeArquivo(mat.titulo)}.url`;
          pastaDisc.file(nomeArquivoLink, `[InternetShortcut]\nURL=${mat.conteudo}\n`);
        }
      } else if (mat.tipo === 'texto' && (!mat.conteudo || !mat.conteudo.startsWith('data:'))) {
        materiaisMetadata.push({
          ...matResto,
          conteudoOriginal: mat.conteudo,
        });

        // Salvar ficheiro de texto .txt na pasta da disciplina
        const pastaDisc = pastaRaiz.folder(cursoNome)?.folder(discNome);
        if (pastaDisc) {
          const nomeArquivoTexto = `${sanitizarNomeArquivo(mat.titulo)}.txt`;
          pastaDisc.file(nomeArquivoTexto, mat.conteudo || '');
        }
      } else if (mat.conteudo) {
        // Ficheiro com conteúdo (data:URL, blob: ou Base64)
        try {
          const blob = await dataUrlParaBlob(mat.conteudo);
          const ext = getExtensaoPorTipo(mat.tipo, mat.mimeType || blob.type, mat.nomeArquivo);

          let nomeBase = mat.nomeArquivo || `${sanitizarNomeArquivo(mat.titulo)}.${ext}`;
          if (!nomeBase.includes('.')) nomeBase += `.${ext}`;
          nomeBase = `${mat.id.slice(0, 5)}_${sanitizarNomeArquivo(nomeBase)}`;

          const caminhoRelativo = `${cursoNome}/${discNome}/${nomeBase}`;

          const pastaDisc = pastaRaiz.folder(cursoNome)?.folder(discNome);
          if (pastaDisc) {
            pastaDisc.file(nomeBase, blob);
          }

          materiaisMetadata.push({
            ...matResto,
            caminhoArquivoInZip: caminhoRelativo,
          });
        } catch (fErr) {
          console.warn(`Erro ao processar ficheiro do material "${mat.titulo}":`, fErr);
          materiaisMetadata.push({
            ...matResto,
            conteudoOriginal: mat.conteudo,
          });
        }
      } else {
        materiaisMetadata.push(matResto);
      }
    }

    // Salvar Apontamentos como ficheiros .txt em cada pasta de disciplina para acesso externo
    if (onProgress) onProgress('Organizando apontamentos e horários...');
    for (const ap of apontamentos) {
      const discInfo = mapaDisciplinas.get(ap.disciplinaId);
      if (discInfo) {
        const cursoNome = mapaCursos.get(discInfo.cursoId) || 'Sem_Curso';
        const discNome = discInfo.nome;
        const pastaDisc = pastaRaiz.folder(cursoNome)?.folder(discNome);
        if (pastaDisc) {
          const nomeAp = `Apontamento_${sanitizarNomeArquivo(ap.titulo)}.txt`;
          const conteudoAp = `TÍTULO: ${ap.titulo}\nDATA: ${new Date(ap.dataCriacao).toLocaleString()}\n\n${ap.texto}\n`;
          pastaDisc.file(nomeAp, conteudoAp);
        }
      }
    }

    // Criar o arquivo de metadados oficial MyStudy_Backup_Info.json
    const metadata: BackupMetadata = {
      versaoFormat: '1.0',
      nomeAplicativo: 'MyStudy',
      dataCriacao: new Date().toISOString(),
      estatisticas: {
        totalCursos: cursos.length,
        totalDisciplinas: disciplinas.length,
        totalMateriais: materiais.length,
        totalApontamentos: apontamentos.length,
        totalInformacoes: informacoes.length,
        totalSessoes: sessoes.length,
        totalHorarios: horarios.length,
      },
      perfil,
      cursos,
      disciplinas,
      materiais: materiaisMetadata,
      apontamentos,
      informacoesImportantes: informacoes,
      sessoesAula: sessoes,
      horarios,
    };

    pastaRaiz.file('MyStudy_Backup_Info.json', JSON.stringify(metadata, null, 2));

    if (onProgress) onProgress('Gerando ficheiro de backup final...');

    // Gerar ficheiro ZIP final
    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadataZip) => {
      if (onProgress) {
        onProgress(
          `Comprimindo dados... ${Math.round(metadataZip.percent)}%`,
          Math.round(metadataZip.percent),
          100
        );
      }
    });

    // Descarregar ficheiro ZIP no dispositivo do utilizador
    const nomeFicheiroZip = `${nomePastaRaiz}.zip`;
    const objectUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = nomeFicheiroZip;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

    return {
      sucesso: true,
      mensagem: `Backup "${nomeFicheiroZip}" criado e guardado com sucesso!`,
      stats: metadata.estatisticas,
    };
  } catch (error: any) {
    console.error('Erro na exportação do backup:', error);
    return {
      sucesso: false,
      mensagem: error.message || 'Não foi possível exportar o backup.',
    };
  }
}

/**
 * 📥 VALIDAR E LER FICHEIRO DE BACKUP SELECIONADO
 */
export async function validarEAnalisarBackup(file: File): Promise<{
  valido: boolean;
  mensagem?: string;
  metadata?: BackupMetadata;
  zipObj?: JSZip;
}> {
  try {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);

    // Procurar por MyStudy_Backup_Info.json no zip
    let jsonFileEntry: JSZip.JSZipObject | null = null;
    let jsonPath = '';

    loadedZip.forEach((relativePath, zipEntry) => {
      if (relativePath.endsWith('MyStudy_Backup_Info.json')) {
        jsonFileEntry = zipEntry;
        jsonPath = relativePath;
      }
    });

    if (!jsonFileEntry) {
      return {
        valido: false,
        mensagem:
          'Este arquivo não contém o arquivo "MyStudy_Backup_Info.json". Não é um backup válido do MyStudy.',
      };
    }

    const jsonText = await (jsonFileEntry as JSZip.JSZipObject).async('text');
    let metadata: BackupMetadata;

    try {
      metadata = JSON.parse(jsonText);
    } catch {
      return {
        valido: false,
        mensagem:
          'O ficheiro de informações do backup está corrompido ou em formato inválido.',
      };
    }

    if (!metadata || metadata.nomeAplicativo !== 'MyStudy') {
      return {
        valido: false,
        mensagem: 'Este backup não é compatível com o MyStudy.',
      };
    }

    if (!metadata.cursos || !metadata.disciplinas) {
      return {
        valido: false,
        mensagem: 'A estrutura de dados do backup está incompleta ou inválida.',
      };
    }

    return {
      valido: true,
      metadata,
      zipObj: loadedZip,
    };
  } catch (err: any) {
    console.error('Erro ao ler ficheiro de backup:', err);
    return {
      valido: false,
      mensagem: 'Não foi possível ler o ficheiro de backup. Certifique-se de que é um ficheiro .zip válido.',
    };
  }
}

/**
 * 📥 RESTAURAR BACKUP NO APLICATIVO
 */
export async function restaurarBackup(
  zipObj: JSZip,
  metadata: BackupMetadata,
  modoConflito: 'substituir' | 'combinar',
  onProgress?: ProgressCallback
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    if (onProgress) onProgress('A processar restauração dos dados...');

    // Se o utilizador escolheu 'substituir', limpa o localStorage
    if (modoConflito === 'substituir') {
      localStorage.removeItem(STORAGE_KEYS.CURSOS);
      localStorage.removeItem(STORAGE_KEYS.DISCIPLINAS);
      localStorage.removeItem(STORAGE_KEYS.MATERIAIS);
      localStorage.removeItem(STORAGE_KEYS.APONTAMENTOS);
      localStorage.removeItem(STORAGE_KEYS.INFORMACOES);
      localStorage.removeItem(STORAGE_KEYS.SESSOES_AULA);
      localStorage.removeItem(STORAGE_KEYS.HORARIO);
    }

    // Carregar dados existentes no localStorage para mesclagem
    const cursosExistentes: Curso[] = modoConflito === 'substituir' ? [] : JSON.parse(localStorage.getItem(STORAGE_KEYS.CURSOS) || '[]');
    const discExistentes: Disciplina[] = modoConflito === 'substituir' ? [] : JSON.parse(localStorage.getItem(STORAGE_KEYS.DISCIPLINAS) || '[]');
    const matExistentes: MaterialItem[] = modoConflito === 'substituir' ? [] : JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIAIS) || '[]');
    const apExistentes: Apontamento[] = modoConflito === 'substituir' ? [] : JSON.parse(localStorage.getItem(STORAGE_KEYS.APONTAMENTOS) || '[]');
    const infExistentes: InformacaoImportante[] = modoConflito === 'substituir' ? [] : JSON.parse(localStorage.getItem(STORAGE_KEYS.INFORMACOES) || '[]');
    const sessExistentes: SessaoAula[] = modoConflito === 'substituir' ? [] : JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSOES_AULA) || '[]');
    const horExistentes: HorarioAula[] = modoConflito === 'substituir' ? [] : JSON.parse(localStorage.getItem(STORAGE_KEYS.HORARIO) || '[]');

    // 1. Cursos
    metadata.cursos.forEach((c) => {
      const idx = cursosExistentes.findIndex((ce) => ce.id === c.id || ce.nome.toLowerCase() === c.nome.toLowerCase());
      if (idx !== -1) {
        cursosExistentes[idx] = { ...cursosExistentes[idx], ...c };
      } else {
        cursosExistentes.push(c);
      }
    });

    // 2. Disciplinas
    metadata.disciplinas.forEach((d) => {
      const idx = discExistentes.findIndex((de) => de.id === d.id);
      if (idx !== -1) {
        discExistentes[idx] = { ...discExistentes[idx], ...d };
      } else {
        discExistentes.push(d);
      }
    });

    // 3. Materiais - Reconstruir ficheiros físicos do ZIP
    const totalMateriais = metadata.materiais.length;
    let matProcessados = 0;

    for (const matMeta of metadata.materiais) {
      matProcessados++;
      if (onProgress) {
        onProgress(
          `Restaurando ficheiros de materiais... (${matProcessados} de ${totalMateriais})`,
          matProcessados,
          totalMateriais
        );
      }

      let conteudoFinal = matMeta.conteudoOriginal || '';

      if (matMeta.caminhoArquivoInZip) {
        // Encontrar ficheiro no ZIP
        let zipEntry: JSZip.JSZipObject | null = null;

        zipObj.forEach((relativePath, entry) => {
          if (relativePath.endsWith(matMeta.caminhoArquivoInZip!) || relativePath.includes(matMeta.caminhoArquivoInZip!)) {
            zipEntry = entry;
          }
        });

        if (zipEntry) {
          try {
            const blob = await (zipEntry as JSZip.JSZipObject).async('blob');
            conteudoFinal = await blobParaDataUrl(blob);
          } catch (bErr) {
            console.warn(`Erro ao ler ficheiro ${matMeta.caminhoArquivoInZip} do backup:`, bErr);
          }
        }
      }

      const materialCompleto: MaterialItem = {
        id: matMeta.id,
        disciplinaId: matMeta.disciplinaId,
        titulo: matMeta.titulo,
        tipo: matMeta.tipo,
        conteudo: conteudoFinal,
        nomeArquivo: matMeta.nomeArquivo,
        mimeType: matMeta.mimeType,
        tamanho: matMeta.tamanho,
        dataCriacao: matMeta.dataCriacao,
        eImportante: matMeta.eImportante,
      };

      const idxMat = matExistentes.findIndex((me) => me.id === materialCompleto.id);
      if (idxMat !== -1) {
        matExistentes[idxMat] = materialCompleto;
      } else {
        matExistentes.push(materialCompleto);
      }
    }

    // 4. Apontamentos
    metadata.apontamentos.forEach((ap) => {
      const idx = apExistentes.findIndex((ae) => ae.id === ap.id);
      if (idx !== -1) {
        apExistentes[idx] = ap;
      } else {
        apExistentes.push(ap);
      }
    });

    // 5. Informações Importantes
    metadata.informacoesImportantes.forEach((inf) => {
      const idx = infExistentes.findIndex((ie) => ie.id === inf.id);
      if (idx !== -1) {
        infExistentes[idx] = inf;
      } else {
        infExistentes.push(inf);
      }
    });

    // 6. Sessões de Aula
    metadata.sessoesAula.forEach((sess) => {
      const idx = sessExistentes.findIndex((se) => se.id === sess.id);
      if (idx !== -1) {
        sessExistentes[idx] = sess;
      } else {
        sessExistentes.push(sess);
      }
    });

    // 7. Horários
    metadata.horarios.forEach((hor) => {
      const idx = horExistentes.findIndex((he) => he.id === hor.id);
      if (idx !== -1) {
        horExistentes[idx] = hor;
      } else {
        horExistentes.push(hor);
      }
    });

    // 8. Perfil
    if (metadata.perfil) {
      const perfilAtual = getPerfil();
      localStorage.setItem(
        STORAGE_KEYS.PERFIL,
        JSON.stringify({ ...perfilAtual, ...metadata.perfil, onboardingConcluido: true })
      );
    }

    // Gravar arrays atualizados de volta ao localStorage
    localStorage.setItem(STORAGE_KEYS.CURSOS, JSON.stringify(cursosExistentes));
    localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(discExistentes));
    localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(matExistentes));
    localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(apExistentes));
    localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(infExistentes));
    localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sessExistentes));
    localStorage.setItem(STORAGE_KEYS.HORARIO, JSON.stringify(horExistentes));

    notifyStorageChange();

    if (onProgress) onProgress('Restauração concluída!');

    return {
      sucesso: true,
      mensagem: 'Backup restaurado com sucesso no MyStudy!',
    };
  } catch (error: any) {
    console.error('Erro ao restaurar backup:', error);
    return {
      sucesso: false,
      mensagem: error.message || 'Erro ao restaurar os dados do backup.',
    };
  }
}
