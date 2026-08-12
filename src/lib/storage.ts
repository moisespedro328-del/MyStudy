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

const STORAGE_KEYS = {
  PERFIL: 'org_estudante_perfil_v1',
  CURSOS: 'org_estudante_cursos_v1',
  DISCIPLINAS: 'org_estudante_disciplinas_v1',
  MATERIAIS: 'org_estudante_materiais_v1',
  APONTAMENTOS: 'org_estudante_apontamentos_v1',
  INFORMACOES: 'org_estudante_informacoes_v1',
  SESSOES_AULA: 'org_estudante_sessoes_aula_v1',
  HORARIO: 'org_estudante_horario_v1',
};

// Event emitter to trigger UI re-renders on local data updates
type StorageListener = () => void;
const listeners = new Set<StorageListener>();

export function subscribeToStorage(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyStorageChange() {
  listeners.forEach((listener) => listener());
}

// Utility ID generator
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

// Default colors for Material 3 UI theme palette
export const CORES_PALETA = [
  '#3F51B5', // Indigo
  '#009688', // Teal
  '#4CAF50', // Green
  '#FF9800', // Amber
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#2196F3', // Blue
  '#795548', // Brown
];

// --- Perfil / Configurações ---

export function getPerfil(): PerfilEstudante {
  const data = localStorage.getItem(STORAGE_KEYS.PERFIL);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  return {
    nomeEstudante: 'Estudante',
    onboardingConcluido: false,
    notificacoesAtivas: true,
    lembreteAulasMinutos: 15,
    dicasEstudoAtivas: true,
  };
}

export function savePerfil(perfil: Partial<PerfilEstudante>): PerfilEstudante {
  const atual = getPerfil();
  const novoPerfil = { ...atual, ...perfil };
  localStorage.setItem(STORAGE_KEYS.PERFIL, JSON.stringify(novoPerfil));
  notifyStorageChange();
  return novoPerfil;
}

// --- Cursos ---

export function getCursos(): Curso[] {
  const data = localStorage.getItem(STORAGE_KEYS.CURSOS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveCurso(nome: string, descricao?: string, idExistente?: string): Curso {
  const cursos = getCursos();
  if (idExistente) {
    const index = cursos.findIndex((c) => c.id === idExistente);
    if (index !== -1) {
      cursos[index] = { ...cursos[index], nome, descricao: descricao || '' };
      localStorage.setItem(STORAGE_KEYS.CURSOS, JSON.stringify(cursos));
      notifyStorageChange();
      return cursos[index];
    }
  }

  const cor = CORES_PALETA[cursos.length % CORES_PALETA.length];
  const novoCurso: Curso = {
    id: generateId(),
    nome: nome.trim(),
    cor,
    descricao: descricao || '',
    dataCriacao: new Date().toISOString(),
  };

  cursos.push(novoCurso);
  localStorage.setItem(STORAGE_KEYS.CURSOS, JSON.stringify(cursos));
  notifyStorageChange();
  return novoCurso;
}

export function deleteCurso(cursoId: string): void {
  let cursos = getCursos();
  cursos = cursos.filter((c) => c.id !== cursoId);
  localStorage.setItem(STORAGE_KEYS.CURSOS, JSON.stringify(cursos));

  // Also remove associated disciplines and items
  const disciplinas = getDisciplinasPorCurso(cursoId);
  disciplinas.forEach((d) => deleteDisciplina(d.id));

  notifyStorageChange();
}

// --- Disciplinas ---

export function getDisciplinas(): Disciplina[] {
  const data = localStorage.getItem(STORAGE_KEYS.DISCIPLINAS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function getDisciplinasPorCurso(cursoId: string): Disciplina[] {
  return getDisciplinas().filter((d) => d.cursoId === cursoId);
}

export function saveDisciplina(
  cursoId: string,
  nome: string,
  codigo?: string,
  professor?: string,
  sala?: string,
  idExistente?: string
): Disciplina {
  const disciplinas = getDisciplinas();
  if (idExistente) {
    const index = disciplinas.findIndex((d) => d.id === idExistente);
    if (index !== -1) {
      disciplinas[index] = {
        ...disciplinas[index],
        nome: nome.trim(),
        codigo,
        professor,
        sala,
      };
      localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(disciplinas));
      notifyStorageChange();
      return disciplinas[index];
    }
  }

  const curso = getCursos().find((c) => c.id === cursoId);
  const cor = curso ? curso.cor : CORES_PALETA[0];

  const novaDisciplina: Disciplina = {
    id: generateId(),
    cursoId,
    nome: nome.trim(),
    codigo,
    professor,
    sala,
    cor,
    dataCriacao: new Date().toISOString(),
  };

  disciplinas.push(novaDisciplina);
  localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(disciplinas));
  notifyStorageChange();
  return novaDisciplina;
}

export function deleteDisciplina(disciplinaId: string): void {
  let disciplinas = getDisciplinas();
  disciplinas = disciplinas.filter((d) => d.id !== disciplinaId);
  localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(disciplinas));

  // Cascade delete related materials, notes, key info, sessions, timetable
  const materiais = getMateriaisPorDisciplina(disciplinaId);
  materiais.forEach((m) => deleteMaterial(m.id));

  let apontamentos = getApontamentos().filter((a) => a.disciplinaId !== disciplinaId);
  localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(apontamentos));

  let informacoes = getInformacoesImportantes().filter((i) => i.disciplinaId !== disciplinaId);
  localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(informacoes));

  let sessoes = getSessoesAula().filter((s) => s.disciplinaId !== disciplinaId);
  localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sessoes));

  let horarios = getHorario().filter((h) => h.disciplinaId !== disciplinaId);
  localStorage.setItem(STORAGE_KEYS.HORARIO, JSON.stringify(horarios));

  notifyStorageChange();
}

// --- Materiais ---

export function getMateriais(): MaterialItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.MATERIAIS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function getMateriaisPorDisciplina(disciplinaId: string): MaterialItem[] {
  return getMateriais().filter((m) => m.disciplinaId === disciplinaId);
}

export function saveMaterial(material: Omit<MaterialItem, 'id' | 'dataCriacao'>): MaterialItem {
  const materiais = getMateriais();
  const novoMaterial: MaterialItem = {
    ...material,
    id: generateId(),
    dataCriacao: new Date().toISOString(),
  };
  materiais.unshift(novoMaterial);
  localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(materiais));
  notifyStorageChange();
  return novoMaterial;
}

export function updateMaterial(materialId: string, updates: Partial<MaterialItem>): MaterialItem | null {
  const materiais = getMateriais();
  const idx = materiais.findIndex((m) => m.id === materialId);
  if (idx !== -1) {
    materiais[idx] = { ...materiais[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(materiais));
    notifyStorageChange();
    return materiais[idx];
  }
  return null;
}

export function toggleMaterialImportant(materialId: string): boolean {
  const materiais = getMateriais();
  const idx = materiais.findIndex((m) => m.id === materialId);
  if (idx !== -1) {
    const novoValor = !materiais[idx].eImportante;
    materiais[idx].eImportante = novoValor;
    localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(materiais));
    notifyStorageChange();
    return novoValor;
  }
  return false;
}

export function deleteMaterial(materialId: string): void {
  let materiais = getMateriais();
  materiais = materiais.filter((m) => m.id !== materialId);
  localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(materiais));
  notifyStorageChange();
}

// --- Apontamentos ---

export function getApontamentos(): Apontamento[] {
  const data = localStorage.getItem(STORAGE_KEYS.APONTAMENTOS);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function getApontamentosPorDisciplina(disciplinaId: string): Apontamento[] {
  return getApontamentos().filter((a) => a.disciplinaId === disciplinaId);
}

export function saveApontamento(
  disciplinaId: string,
  titulo: string,
  texto: string,
  imagens: string[] = [],
  links: string[] = [],
  eImportante = false,
  idExistente?: string
): Apontamento {
  const apontamentos = getApontamentos();
  const dataAtual = new Date().toISOString();

  if (idExistente) {
    const idx = apontamentos.findIndex((a) => a.id === idExistente);
    if (idx !== -1) {
      apontamentos[idx] = {
        ...apontamentos[idx],
        titulo: titulo.trim(),
        texto,
        imagens,
        links,
        eImportante,
        dataAtualizacao: dataAtual,
      };
      localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(apontamentos));
      notifyStorageChange();
      return apontamentos[idx];
    }
  }

  const novo: Apontamento = {
    id: generateId(),
    disciplinaId,
    titulo: titulo.trim(),
    texto,
    imagens,
    links,
    eImportante,
    dataCriacao: dataAtual,
    dataAtualizacao: dataAtual,
  };

  apontamentos.unshift(novo);
  localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(apontamentos));

  // If marked as important, also add to key information list automatically
  if (eImportante) {
    const disc = getDisciplinas().find((d) => d.id === disciplinaId);
    saveInformacaoImportante(
      disciplinaId,
      `${titulo}: ${texto.slice(0, 120)}${texto.length > 120 ? '...' : ''}`,
      `Apontamento: ${disc?.nome || 'Disciplina'}`
    );
  }

  notifyStorageChange();
  return novo;
}

export function deleteApontamento(apontamentoId: string): void {
  let apontamentos = getApontamentos();
  apontamentos = apontamentos.filter((a) => a.id !== apontamentoId);
  localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(apontamentos));
  notifyStorageChange();
}

// --- Informações Importantes ---

export function getInformacoesImportantes(): InformacaoImportante[] {
  const data = localStorage.getItem(STORAGE_KEYS.INFORMACOES);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function getInformacoesPorDisciplina(disciplinaId: string): InformacaoImportante[] {
  return getInformacoesImportantes().filter((i) => i.disciplinaId === disciplinaId);
}

export function saveInformacaoImportante(
  disciplinaId: string,
  texto: string,
  origem: string
): InformacaoImportante {
  const informacoes = getInformacoesImportantes();
  const nova: InformacaoImportante = {
    id: generateId(),
    disciplinaId,
    texto: texto.trim(),
    origem: origem.trim(),
    dataCriacao: new Date().toISOString(),
  };

  informacoes.unshift(nova);
  localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(informacoes));
  notifyStorageChange();
  return nova;
}

export function deleteInformacaoImportante(id: string): void {
  let informacoes = getInformacoesImportantes();
  informacoes = informacoes.filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(informacoes));
  notifyStorageChange();
}

// --- Sessões de Aula (Modo Aula) ---

export function getSessoesAula(): SessaoAula[] {
  const data = localStorage.getItem(STORAGE_KEYS.SESSOES_AULA);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function getSessoesPorDisciplina(disciplinaId: string): SessaoAula[] {
  return getSessoesAula().filter((s) => s.disciplinaId === disciplinaId);
}

export function saveSessaoAula(sessao: Omit<SessaoAula, 'id'>): SessaoAula {
  const sessoes = getSessoesAula();
  const novaSessao: SessaoAula = {
    ...sessao,
    id: generateId(),
  };

  sessoes.unshift(novaSessao);
  localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sessoes));

  // Save captured items into corresponding materials/notes/key info of the subject
  if (sessao.disciplinaId) {
    sessao.informacoesImportantes.forEach((inf) => {
      saveInformacaoImportante(sessao.disciplinaId, inf.texto, inf.origem || `Aula de ${new Date(sessao.dataInicio).toLocaleDateString()}`);
    });

    sessao.notas.forEach((nota) => {
      saveApontamento(
        sessao.disciplinaId,
        `Nota da Aula (${new Date(sessao.dataInicio).toLocaleDateString()})`,
        nota.texto,
        [],
        [],
        false
      );
    });

    sessao.fotografias.forEach((foto, idx) => {
      saveMaterial({
        disciplinaId: sessao.disciplinaId,
        titulo: foto.titulo || `Fotografia ${idx + 1} - Aula`,
        tipo: 'fotografia',
        conteudo: foto.url,
      });
    });

    sessao.audios.forEach((audio, idx) => {
      saveMaterial({
        disciplinaId: sessao.disciplinaId,
        titulo: audio.titulo || `Áudio ${idx + 1} - Aula`,
        tipo: 'audio',
        conteudo: audio.url,
      });
    });

    sessao.videos.forEach((video, idx) => {
      saveMaterial({
        disciplinaId: sessao.disciplinaId,
        titulo: video.titulo || `Vídeo ${idx + 1} - Aula`,
        tipo: 'video',
        conteudo: video.url,
      });
    });
  }

  notifyStorageChange();
  return novaSessao;
}

export function deleteSessaoAula(sessaoId: string): void {
  let sessoes = getSessoesAula();
  sessoes = sessoes.filter((s) => s.id !== sessaoId);
  localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sessoes));
  notifyStorageChange();
}

// --- Horário ---

export function getHorario(): HorarioAula[] {
  const data = localStorage.getItem(STORAGE_KEYS.HORARIO);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveHorarioAula(
  disciplinaId: string,
  diaSemana: number,
  horaInicio: string,
  horaFim: string,
  sala?: string,
  idExistente?: string
): HorarioAula {
  const horarios = getHorario();

  if (idExistente) {
    const idx = horarios.findIndex((h) => h.id === idExistente);
    if (idx !== -1) {
      horarios[idx] = {
        ...horarios[idx],
        disciplinaId,
        diaSemana,
        horaInicio,
        horaFim,
        sala,
      };
      localStorage.setItem(STORAGE_KEYS.HORARIO, JSON.stringify(horarios));
      notifyStorageChange();
      return horarios[idx];
    }
  }

  const novoHorario: HorarioAula = {
    id: generateId(),
    disciplinaId,
    diaSemana,
    horaInicio,
    horaFim,
    sala,
  };

  horarios.push(novoHorario);
  localStorage.setItem(STORAGE_KEYS.HORARIO, JSON.stringify(horarios));
  notifyStorageChange();
  return novoHorario;
}

export function deleteHorarioAula(id: string): void {
  let horarios = getHorario();
  horarios = horarios.filter((h) => h.id !== id);
  localStorage.setItem(STORAGE_KEYS.HORARIO, JSON.stringify(horarios));
  notifyStorageChange();
}

// Helper to calculate upcoming class for home screen or auto-association
export function getProximasAulasHoje(): {
  horario: HorarioAula;
  disciplina?: Disciplina;
  curso?: Curso;
  estaEmAndamento: boolean;
}[] {
  const hoje = new Date();
  let diaSemana = hoje.getDay(); // 0 (Dom) to 6 (Sab)
  diaSemana = diaSemana === 0 ? 7 : diaSemana; // Convert to 1 (Seg) to 7 (Dom)

  const horaAtualString = `${String(hoje.getHours()).padStart(2, '0')}:${String(hoje.getMinutes()).padStart(2, '0')}`;

  const horariosHoje = getHorario().filter((h) => h.diaSemana === diaSemana);
  const disciplinas = getDisciplinas();
  const cursos = getCursos();

  return horariosHoje
    .map((h) => {
      const disciplina = disciplinas.find((d) => d.id === h.disciplinaId);
      const curso = disciplina ? cursos.find((c) => c.id === disciplina.cursoId) : undefined;
      const estaEmAndamento = horaAtualString >= h.horaInicio && horaAtualString <= h.horaFim;
      return {
        horario: h,
        disciplina,
        curso,
        estaEmAndamento,
      };
    })
    .sort((a, b) => a.horario.horaInicio.localeCompare(b.horario.horaInicio));
}

// Populate sample default structure if new user initializes or resets
export function seedDadosExemplo(): void {
  const curso1 = saveCurso('Contabilidade', 'Curso Superior de Gestão e Finanças');
  const curso2 = saveCurso('Gestão de Empresas', 'Licenciatura em Administração e Negócios');

  const disc1 = saveDisciplina(curso1.id, 'Contabilidade Geral', 'CG101', 'Prof. Alberto Silva', 'Sala 2.04');
  const disc2 = saveDisciplina(curso1.id, 'Contabilidade de Gestão', 'CG102', 'Prof. Maria Rocha', 'Anfiteatro B');
  const disc3 = saveDisciplina(curso1.id, 'Fiscalidade', 'FISC201', 'Prof. João Santos', 'Sala 1.12');
  const disc4 = saveDisciplina(curso1.id, 'Auditoria', 'AUD301', 'Prof. Ana Martins', 'Laboratório 3');

  saveDisciplina(curso2.id, 'Gestão de Recursos Humanos', 'GRH101', 'Prof. Carlos Mendes', 'Sala 4.02');
  saveDisciplina(curso2.id, 'Estratégia Empresarial', 'EE202', 'Prof. Laura Lima', 'Anfiteatro A');

  // Timetable
  saveHorarioAula(disc1.id, 1, '08:30', '10:30', 'Sala 2.04'); // Segunda
  saveHorarioAula(disc2.id, 1, '11:00', '13:00', 'Anfiteatro B'); // Segunda
  saveHorarioAula(disc3.id, 2, '09:00', '11:00', 'Sala 1.12'); // Terça
  saveHorarioAula(disc4.id, 3, '14:00', '16:00', 'Laboratório 3'); // Quarta

  // Key Info
  saveInformacaoImportante(
    disc1.id,
    'Ativo = Passivo + Capital Próprio',
    'Contabilidade Geral - Aula 01 - Equação Fundamental'
  );
  saveInformacaoImportante(
    disc1.id,
    'O IVA dedutível refere-se a compras de bens e serviços afetos à atividade da empresa.',
    'Fiscalidade - Aula 04'
  );

  // Note
  saveApontamento(
    disc1.id,
    'Métodos de Valorização de Inventários',
    'Existem três métodos principais de valorização de existências: FIFO (First In, First Out), LIFO e Custo Médio Ponderado (CMP). Na contabilidade atual, o CMP é amplamente recomendado.',
    [],
    ['https://moodle.universidade.edu'],
    true
  );

  savePerfil({ onboardingConcluido: true, nomeEstudante: 'Estudante' });
}

export function limparTodosDados(): void {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  notifyStorageChange();
}
