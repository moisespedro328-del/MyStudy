import {
  Curso,
  Disciplina,
  MaterialItem,
  Apontamento,
  InformacaoImportante,
  SessaoAula,
  HorarioAula,
  PerfilEstudante,
  ItemLixeira,
} from '../types';

export const STORAGE_KEYS = {
  PERFIL: 'org_estudante_perfil_v1',
  CURSOS: 'org_estudante_cursos_v1',
  DISCIPLINAS: 'org_estudante_disciplinas_v1',
  MATERIAIS: 'org_estudante_materiais_v1',
  APONTAMENTOS: 'org_estudante_apontamentos_v1',
  INFORMACOES: 'org_estudante_informacoes_v1',
  SESSOES_AULA: 'org_estudante_sessoes_aula_v1',
  HORARIO: 'org_estudante_horario_v1',
  LIXEIRA: 'org_estudante_lixeira_v1',
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

export function notifyStorageChange() {
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

/**
  * Obter cursos ordenados pelas alterações mais recentes em suas disciplinas, materiais, apontamentos ou sessões.
  */
export function getCursosComAlteracoesRecentes(limit = 3): Curso[] {
  const cursos = getCursos();
  if (cursos.length === 0) return [];

  const disciplinas = getDisciplinas();
  const materiais = getMateriais();
  const apontamentos = getApontamentos();
  const informacoes = getInformacoesImportantes();
  const sessoes = getSessoesAula();

  const parseTime = (dateStr?: string) => {
    if (!dateStr) return 0;
    const t = new Date(dateStr).getTime();
    return isNaN(t) ? 0 : t;
  };

  const cursosComUltimaAtividade = cursos.map((curso) => {
    let maxTime = parseTime(curso.dataCriacao);

    const discDoCurso = disciplinas.filter((d) => d.cursoId === curso.id);
    const discIds = new Set(discDoCurso.map((d) => d.id));

    discDoCurso.forEach((d) => {
      const t = parseTime(d.dataCriacao);
      if (t > maxTime) maxTime = t;
    });

    materiais.forEach((m) => {
      if (discIds.has(m.disciplinaId)) {
        const t = parseTime(m.dataCriacao);
        if (t > maxTime) maxTime = t;
      }
    });

    apontamentos.forEach((a) => {
      if (discIds.has(a.disciplinaId)) {
        const t = parseTime(a.dataAtualizacao || a.dataCriacao);
        if (t > maxTime) maxTime = t;
      }
    });

    informacoes.forEach((i) => {
      if (discIds.has(i.disciplinaId)) {
        const t = parseTime(i.dataCriacao);
        if (t > maxTime) maxTime = t;
      }
    });

    sessoes.forEach((s) => {
      if (discIds.has(s.disciplinaId)) {
        const t = parseTime(s.dataInicio);
        if (t > maxTime) maxTime = t;
      }
    });

    return { curso, maxTime };
  });

  // Sort descending by maxTime
  cursosComUltimaAtividade.sort((a, b) => b.maxTime - a.maxTime);

  return cursosComUltimaAtividade.slice(0, limit).map((item) => item.curso);
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
  idExistente?: string,
  sessaoId?: string
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
        sessaoId: sessaoId || apontamentos[idx].sessaoId,
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
    sessaoId,
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
      `Apontamento: ${disc?.nome || 'Disciplina'}`,
      sessaoId
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
  origem: string,
  sessaoId?: string,
  idExistente?: string
): InformacaoImportante {
  const informacoes = getInformacoesImportantes();

  if (idExistente) {
    const idx = informacoes.findIndex((i) => i.id === idExistente);
    if (idx !== -1) {
      informacoes[idx] = {
        ...informacoes[idx],
        disciplinaId,
        sessaoId: sessaoId || informacoes[idx].sessaoId,
        texto: texto.trim(),
        origem: origem.trim(),
      };
      localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(informacoes));
      notifyStorageChange();
      return informacoes[idx];
    }
  }

  const nova: InformacaoImportante = {
    id: idExistente || generateId(),
    disciplinaId,
    sessaoId,
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
      saveInformacaoImportante(
        sessao.disciplinaId,
        inf.texto,
        inf.origem || `Aula de ${new Date(sessao.dataInicio).toLocaleDateString()}`,
        novaSessao.id,
        inf.id
      );
    });

    sessao.notas.forEach((nota) => {
      saveApontamento(
        sessao.disciplinaId,
        `Nota da Aula (${new Date(sessao.dataInicio).toLocaleDateString()})`,
        nota.texto,
        [],
        [],
        false,
        undefined,
        novaSessao.id
      );
    });

    sessao.fotografias.forEach((foto, idx) => {
      saveMaterial({
        disciplinaId: sessao.disciplinaId,
        sessaoId: novaSessao.id,
        titulo: foto.titulo || `Fotografia ${idx + 1} - Aula`,
        tipo: 'fotografia',
        conteudo: foto.url,
        origemModoAula: true,
      });
    });

    sessao.audios.forEach((audio, idx) => {
      saveMaterial({
        disciplinaId: sessao.disciplinaId,
        sessaoId: novaSessao.id,
        titulo: audio.titulo || `Áudio ${idx + 1} - Aula`,
        tipo: 'audio',
        conteudo: audio.url,
        origemModoAula: true,
      });
    });

    sessao.videos.forEach((video, idx) => {
      saveMaterial({
        disciplinaId: sessao.disciplinaId,
        sessaoId: novaSessao.id,
        titulo: video.titulo || `Vídeo ${idx + 1} - Aula`,
        tipo: 'video',
        conteudo: video.url,
        origemModoAula: true,
      });
    });

    if (sessao.materiais) {
      sessao.materiais.forEach((mat) => {
        saveMaterial({
          ...mat,
          disciplinaId: sessao.disciplinaId,
          sessaoId: novaSessao.id,
          origemModoAula: true,
        });
      });
    }
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

// --- LIXEIRA ---

export function getLixeira(): ItemLixeira[] {
  const data = localStorage.getItem(STORAGE_KEYS.LIXEIRA);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
  return [];
}

export function saveItemLixeira(item: ItemLixeira): void {
  const lixeira = getLixeira();
  lixeira.unshift(item);
  localStorage.setItem(STORAGE_KEYS.LIXEIRA, JSON.stringify(lixeira));
  notifyStorageChange();
}

export function enviarCursoParaLixeira(cursoId: string): void {
  const cursos = getCursos();
  const curso = cursos.find((c) => c.id === cursoId);
  if (!curso) return;

  // Cascade step 1: Collect discipline IDs belonging to the course
  const disciplinas = getDisciplinasPorCurso(cursoId);
  const discIds = new Set(disciplinas.map((d) => d.id));

  // Cascade step 2: Collect session IDs belonging to these disciplines
  const sessoes = getSessoesAula().filter((s) => discIds.has(s.disciplinaId));
  const sessaoIds = new Set(sessoes.map((s) => s.id));

  // Cascade step 3: Collect materials, notes, key info, and schedules associated via discipline IDs or session IDs
  const todosMateriais = getMateriais();
  const materiais = todosMateriais.filter(
    (m) => discIds.has(m.disciplinaId) || (m.sessaoId && sessaoIds.has(m.sessaoId))
  );

  const todosApontamentos = getApontamentos();
  const apontamentos = todosApontamentos.filter(
    (a) => discIds.has(a.disciplinaId) || (a.sessaoId && sessaoIds.has(a.sessaoId))
  );

  const todasInformacoes = getInformacoesImportantes();
  const informacoes = todasInformacoes.filter(
    (i) => discIds.has(i.disciplinaId) || (i.sessaoId && sessaoIds.has(i.sessaoId))
  );

  const todosHorarios = getHorario();
  const horarios = todosHorarios.filter((h) => discIds.has(h.disciplinaId));

  // Move items out of active collections without deleting them permanently
  localStorage.setItem(STORAGE_KEYS.CURSOS, JSON.stringify(cursos.filter((c) => c.id !== cursoId)));
  localStorage.setItem(
    STORAGE_KEYS.DISCIPLINAS,
    JSON.stringify(getDisciplinas().filter((d) => d.cursoId !== cursoId && !discIds.has(d.id)))
  );
  localStorage.setItem(
    STORAGE_KEYS.MATERIAIS,
    JSON.stringify(todosMateriais.filter((m) => !discIds.has(m.disciplinaId) && (!m.sessaoId || !sessaoIds.has(m.sessaoId))))
  );
  localStorage.setItem(
    STORAGE_KEYS.APONTAMENTOS,
    JSON.stringify(todosApontamentos.filter((a) => !discIds.has(a.disciplinaId) && (!a.sessaoId || !sessaoIds.has(a.sessaoId))))
  );
  localStorage.setItem(
    STORAGE_KEYS.INFORMACOES,
    JSON.stringify(todasInformacoes.filter((i) => !discIds.has(i.disciplinaId) && (!i.sessaoId || !sessaoIds.has(i.sessaoId))))
  );
  localStorage.setItem(
    STORAGE_KEYS.SESSOES_AULA,
    JSON.stringify(todasSessoesFilter(discIds))
  );
  localStorage.setItem(
    STORAGE_KEYS.HORARIO,
    JSON.stringify(todosHorarios.filter((h) => !discIds.has(h.disciplinaId)))
  );

  saveItemLixeira({
    id: generateId(),
    idOriginal: curso.id,
    tipo: 'curso',
    nome: curso.nome,
    dataEliminacao: new Date().toISOString(),
    dadosOriginais: curso,
    dadosRelacionados: {
      disciplinas,
      materiais,
      apontamentos,
      informacoes,
      sessoes,
      horarios,
    },
  });
}

function todasSessoesFilter(discIds: Set<string>) {
  return getSessoesAula().filter((s) => !discIds.has(s.disciplinaId));
}

export function enviarDisciplinaParaLixeira(disciplinaId: string): void {
  const disciplinas = getDisciplinas();
  const disc = disciplinas.find((d) => d.id === disciplinaId);
  if (!disc) return;

  const sessoes = getSessoesPorDisciplina(disciplinaId);
  const sessaoIds = new Set(sessoes.map((s) => s.id));

  const todosMateriais = getMateriais();
  const materiais = todosMateriais.filter(
    (m) => m.disciplinaId === disciplinaId || (m.sessaoId && sessaoIds.has(m.sessaoId))
  );

  const todosApontamentos = getApontamentos();
  const apontamentos = todosApontamentos.filter(
    (a) => a.disciplinaId === disciplinaId || (a.sessaoId && sessaoIds.has(a.sessaoId))
  );

  const todasInformacoes = getInformacoesImportantes();
  const informacoes = todasInformacoes.filter(
    (i) => i.disciplinaId === disciplinaId || (i.sessaoId && sessaoIds.has(i.sessaoId))
  );

  const todosHorarios = getHorario();
  const horarios = todosHorarios.filter((h) => h.disciplinaId === disciplinaId);

  localStorage.setItem(
    STORAGE_KEYS.DISCIPLINAS,
    JSON.stringify(disciplinas.filter((d) => d.id !== disciplinaId))
  );
  localStorage.setItem(
    STORAGE_KEYS.MATERIAIS,
    JSON.stringify(todosMateriais.filter((m) => m.disciplinaId !== disciplinaId && (!m.sessaoId || !sessaoIds.has(m.sessaoId))))
  );
  localStorage.setItem(
    STORAGE_KEYS.APONTAMENTOS,
    JSON.stringify(todosApontamentos.filter((a) => a.disciplinaId !== disciplinaId && (!a.sessaoId || !sessaoIds.has(a.sessaoId))))
  );
  localStorage.setItem(
    STORAGE_KEYS.INFORMACOES,
    JSON.stringify(todasInformacoes.filter((i) => i.disciplinaId !== disciplinaId && (!i.sessaoId || !sessaoIds.has(i.sessaoId))))
  );
  localStorage.setItem(
    STORAGE_KEYS.SESSOES_AULA,
    JSON.stringify(getSessoesAula().filter((s) => s.disciplinaId !== disciplinaId))
  );
  localStorage.setItem(
    STORAGE_KEYS.HORARIO,
    JSON.stringify(todosHorarios.filter((h) => h.disciplinaId !== disciplinaId))
  );

  saveItemLixeira({
    id: generateId(),
    idOriginal: disc.id,
    tipo: 'disciplina',
    nome: disc.nome,
    dataEliminacao: new Date().toISOString(),
    dadosOriginais: disc,
    dadosRelacionados: {
      materiais,
      apontamentos,
      informacoes,
      sessoes,
      horarios,
    },
  });
}

export function enviarMaterialParaLixeira(materialId: string): void {
  const materiais = getMateriais();
  const mat = materiais.find((m) => m.id === materialId);
  if (!mat) return;

  deleteMaterial(materialId);

  saveItemLixeira({
    id: generateId(),
    idOriginal: mat.id,
    tipo: 'material',
    nome: mat.titulo,
    dataEliminacao: new Date().toISOString(),
    dadosOriginais: mat,
  });
}

export function enviarApontamentoParaLixeira(apontamentoId: string): void {
  const apontamentos = getApontamentos();
  const ap = apontamentos.find((a) => a.id === apontamentoId);
  if (!ap) return;

  deleteApontamento(apontamentoId);

  saveItemLixeira({
    id: generateId(),
    idOriginal: ap.id,
    tipo: 'apontamento',
    nome: ap.titulo || 'Apontamento',
    dataEliminacao: new Date().toISOString(),
    dadosOriginais: ap,
  });
}

export function enviarInformacaoParaLixeira(infoId: string): void {
  const informacoes = getInformacoesImportantes();
  let inf = informacoes.find((i) => i.id === infoId);

  // Search inside sessions if not found directly in INFORMACOES
  if (!inf) {
    const sessoes = getSessoesAula();
    for (const s of sessoes) {
      const foundInSess = s.informacoesImportantes?.find((i) => i.id === infoId);
      if (foundInSess) {
        inf = {
          ...foundInSess,
          disciplinaId: foundInSess.disciplinaId || s.disciplinaId,
          sessaoId: s.id,
        };
        break;
      }
    }
  }

  if (!inf) return;

  deleteInformacaoImportante(infoId);

  // If created or associated with a session, remove from session as well
  if (inf.sessaoId) {
    const sessoes = getSessoesAula();
    let sessModificada = false;
    const novaoSessoes = sessoes.map((s) => {
      if (s.id === inf!.sessaoId || s.informacoesImportantes?.some((i) => i.id === infoId)) {
        sessModificada = true;
        return {
          ...s,
          informacoesImportantes: (s.informacoesImportantes || []).filter((i) => i.id !== infoId),
        };
      }
      return s;
    });
    if (sessModificada) {
      localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(novaoSessoes));
    }
  }

  saveItemLixeira({
    id: generateId(),
    idOriginal: inf.id,
    tipo: 'informacao_importante',
    nome: inf.texto.slice(0, 40) + (inf.texto.length > 40 ? '...' : ''),
    dataEliminacao: new Date().toISOString(),
    dadosOriginais: inf,
  });

  notifyStorageChange();
}

export function enviarSessaoParaLixeira(sessaoId: string): void {
  const sessoes = getSessoesAula();
  const sess = sessoes.find((s) => s.id === sessaoId);
  if (!sess) return;

  deleteSessaoAula(sessaoId);

  // Collect associated media URLs
  const urlSet = new Set([
    ...sess.audios.map((a) => a.url),
    ...sess.fotografias.map((f) => f.url),
    ...sess.videos.map((v) => v.url),
    ...(sess.materiais || []).map((m) => m.conteudo),
  ]);

  const todosMateriais = getMateriais();
  const materiaisRelacionados = todosMateriais.filter(
    (m) => m.sessaoId === sessaoId || (sess.disciplinaId && m.disciplinaId === sess.disciplinaId && urlSet.has(m.conteudo))
  );

  const todosApontamentos = getApontamentos();
  const apontamentosRelacionados = todosApontamentos.filter(
    (a) => a.sessaoId === sessaoId
  );

  const todasInformacoes = getInformacoesImportantes();
  const informacoesRelacionadas = todasInformacoes.filter(
    (i) => i.sessaoId === sessaoId
  );

  // Remove related captured items from active storage
  const matRelIds = new Set(materiaisRelacionados.map((m) => m.id));
  const apRelIds = new Set(apontamentosRelacionados.map((a) => a.id));
  const infRelIds = new Set(informacoesRelacionadas.map((i) => i.id));

  if (matRelIds.size > 0) {
    localStorage.setItem(
      STORAGE_KEYS.MATERIAIS,
      JSON.stringify(todosMateriais.filter((m) => !matRelIds.has(m.id)))
    );
  }

  if (apRelIds.size > 0) {
    localStorage.setItem(
      STORAGE_KEYS.APONTAMENTOS,
      JSON.stringify(todosApontamentos.filter((a) => !apRelIds.has(a.id)))
    );
  }

  if (infRelIds.size > 0) {
    localStorage.setItem(
      STORAGE_KEYS.INFORMACOES,
      JSON.stringify(todasInformacoes.filter((i) => !infRelIds.has(i.id)))
    );
  }

  saveItemLixeira({
    id: generateId(),
    idOriginal: sess.id,
    tipo: 'sessao_aula',
    nome: sess.titulo,
    dataEliminacao: new Date().toISOString(),
    dadosOriginais: sess,
    dadosRelacionados: {
      materiais: materiaisRelacionados,
      apontamentos: apontamentosRelacionados,
      informacoes: informacoesRelacionadas,
    },
  });

  notifyStorageChange();
}

export function enviarHorarioParaLixeira(horarioId: string): void {
  const horarios = getHorario();
  const hor = horarios.find((h) => h.id === horarioId);
  if (!hor) return;

  deleteHorarioAula(horarioId);

  const disc = getDisciplinas().find((d) => d.id === hor.disciplinaId);

  saveItemLixeira({
    id: generateId(),
    idOriginal: hor.id,
    tipo: 'horario',
    nome: `Horário — ${disc?.nome || 'Disciplina'} (${hor.horaInicio} - ${hor.horaFim})`,
    dataEliminacao: new Date().toISOString(),
    dadosOriginais: hor,
  });
}

export function restaurarItemLixeira(idLixeira: string): void {
  const lixeira = getLixeira();
  const idx = lixeira.findIndex((item) => item.id === idLixeira);
  if (idx === -1) return;

  const item = lixeira[idx];
  lixeira.splice(idx, 1);
  localStorage.setItem(STORAGE_KEYS.LIXEIRA, JSON.stringify(lixeira));

  if (item.tipo === 'curso') {
    const cursos = getCursos();
    if (!cursos.some((c) => c.id === item.dadosOriginais.id)) {
      cursos.push(item.dadosOriginais);
      localStorage.setItem(STORAGE_KEYS.CURSOS, JSON.stringify(cursos));
    }
    if (item.dadosRelacionados) {
      const { disciplinas, materiais, apontamentos, informacoes, sessoes, horarios } = item.dadosRelacionados;
      if (disciplinas) {
        const dArr = getDisciplinas();
        disciplinas.forEach((d) => { if (!dArr.some((x) => x.id === d.id)) dArr.push(d); });
        localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(dArr));
      }
      if (materiais) {
        const mArr = getMateriais();
        materiais.forEach((m) => { if (!mArr.some((x) => x.id === m.id)) mArr.push(m); });
        localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(mArr));
      }
      if (apontamentos) {
        const aArr = getApontamentos();
        apontamentos.forEach((a) => { if (!aArr.some((x) => x.id === a.id)) aArr.push(a); });
        localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(aArr));
      }
      if (informacoes) {
        const iArr = getInformacoesImportantes();
        informacoes.forEach((i) => { if (!iArr.some((x) => x.id === i.id)) iArr.push(i); });
        localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(iArr));
      }
      if (sessoes) {
        const sArr = getSessoesAula();
        sessoes.forEach((s) => { if (!sArr.some((x) => x.id === s.id)) sArr.push(s); });
        localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sArr));
      }
      if (horarios) {
        const hArr = getHorario();
        horarios.forEach((h) => { if (!hArr.some((x) => x.id === h.id)) hArr.push(h); });
        localStorage.setItem(STORAGE_KEYS.HORARIO, JSON.stringify(hArr));
      }
    }
  } else if (item.tipo === 'disciplina') {
    const dArr = getDisciplinas();
    if (!dArr.some((d) => d.id === item.dadosOriginais.id)) {
      dArr.push(item.dadosOriginais);
      localStorage.setItem(STORAGE_KEYS.DISCIPLINAS, JSON.stringify(dArr));
    }
    if (item.dadosRelacionados) {
      const { materiais, apontamentos, informacoes, sessoes, horarios } = item.dadosRelacionados;
      if (materiais) {
        const mArr = getMateriais();
        materiais.forEach((m) => { if (!mArr.some((x) => x.id === m.id)) mArr.push(m); });
        localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(mArr));
      }
      if (apontamentos) {
        const aArr = getApontamentos();
        apontamentos.forEach((a) => { if (!aArr.some((x) => x.id === a.id)) aArr.push(a); });
        localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(aArr));
      }
      if (informacoes) {
        const iArr = getInformacoesImportantes();
        informacoes.forEach((i) => { if (!iArr.some((x) => x.id === i.id)) iArr.push(i); });
        localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(iArr));
      }
      if (sessoes) {
        const sArr = getSessoesAula();
        sessoes.forEach((s) => { if (!sArr.some((x) => x.id === s.id)) sArr.push(s); });
        localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sArr));
      }
      if (horarios) {
        const hArr = getHorario();
        horarios.forEach((h) => { if (!hArr.some((x) => x.id === h.id)) hArr.push(h); });
        localStorage.setItem(STORAGE_KEYS.HORARIO, JSON.stringify(hArr));
      }
    }
  } else if (item.tipo === 'material') {
    const mArr = getMateriais();
    if (!mArr.some((m) => m.id === item.dadosOriginais.id)) {
      mArr.unshift(item.dadosOriginais);
      localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(mArr));
    }
  } else if (item.tipo === 'apontamento') {
    const aArr = getApontamentos();
    if (!aArr.some((a) => a.id === item.dadosOriginais.id)) {
      aArr.unshift(item.dadosOriginais);
      localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(aArr));
    }
  } else if (item.tipo === 'informacao_importante') {
    const iArr = getInformacoesImportantes();
    if (!iArr.some((i) => i.id === item.dadosOriginais.id)) {
      iArr.unshift(item.dadosOriginais);
      localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(iArr));
    }
    if (item.dadosOriginais.sessaoId) {
      const sessoes = getSessoesAula();
      const sIdx = sessoes.findIndex((s) => s.id === item.dadosOriginais.sessaoId);
      if (sIdx !== -1) {
        if (!sessoes[sIdx].informacoesImportantes) {
          sessoes[sIdx].informacoesImportantes = [];
        }
        if (!sessoes[sIdx].informacoesImportantes.some((i) => i.id === item.dadosOriginais.id)) {
          sessoes[sIdx].informacoesImportantes.push(item.dadosOriginais);
          localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sessoes));
        }
      }
    }
  } else if (item.tipo === 'sessao_aula') {
    const sArr = getSessoesAula();
    if (!sArr.some((s) => s.id === item.dadosOriginais.id)) {
      sArr.unshift(item.dadosOriginais);
      localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sArr));
    }
    if (item.dadosRelacionados) {
      const { materiais, apontamentos, informacoes } = item.dadosRelacionados;
      if (materiais && materiais.length > 0) {
        const mArr = getMateriais();
        materiais.forEach((m) => { if (!mArr.some((x) => x.id === m.id)) mArr.unshift(m); });
        localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(mArr));
      }
      if (apontamentos && apontamentos.length > 0) {
        const aArr = getApontamentos();
        apontamentos.forEach((a) => { if (!aArr.some((x) => x.id === a.id)) aArr.unshift(a); });
        localStorage.setItem(STORAGE_KEYS.APONTAMENTOS, JSON.stringify(aArr));
      }
      if (informacoes && informacoes.length > 0) {
        const iArr = getInformacoesImportantes();
        informacoes.forEach((i) => { if (!iArr.some((x) => x.id === i.id)) iArr.unshift(i); });
        localStorage.setItem(STORAGE_KEYS.INFORMACOES, JSON.stringify(iArr));
      }
    }
  } else if (item.tipo === 'horario') {
    const hArr = getHorario();
    if (!hArr.some((h) => h.id === item.dadosOriginais.id)) {
      hArr.push(item.dadosOriginais);
      localStorage.setItem(STORAGE_KEYS.HORARIO, JSON.stringify(hArr));
    }
  }

  notifyStorageChange();
}

export function eliminarPermanentementeLixeira(idLixeira: string): void {
  const lixeira = getLixeira().filter((item) => item.id !== idLixeira);
  localStorage.setItem(STORAGE_KEYS.LIXEIRA, JSON.stringify(lixeira));
  notifyStorageChange();
}

export function esvaziarLixeira(): void {
  localStorage.setItem(STORAGE_KEYS.LIXEIRA, JSON.stringify([]));
  notifyStorageChange();
}

export function atualizarDisciplinaSessao(sessaoId: string, novaDisciplinaId: string): void {
  const sessoes = getSessoesAula();
  const idx = sessoes.findIndex((s) => s.id === sessaoId);
  if (idx !== -1) {
    const disciplinaAntigaId = sessoes[idx].disciplinaId;
    sessoes[idx].disciplinaId = novaDisciplinaId;

    // Update internal info items
    if (sessoes[idx].informacoesImportantes) {
      sessoes[idx].informacoesImportantes = sessoes[idx].informacoesImportantes.map((inf) => ({
        ...inf,
        disciplinaId: novaDisciplinaId,
      }));
    }

    localStorage.setItem(STORAGE_KEYS.SESSOES_AULA, JSON.stringify(sessoes));

    // Update materials created specifically for this session
    const materiais = getMateriais();
    let matModificado = false;

    const urlsSessao = new Set([
      ...sessoes[idx].audios.map((a) => a.url),
      ...sessoes[idx].fotografias.map((f) => f.url),
      ...sessoes[idx].videos.map((v) => v.url),
      ...(sessoes[idx].materiais || []).map((m) => m.conteudo),
    ]);

    materiais.forEach((m, mIdx) => {
      if (m.disciplinaId === disciplinaAntigaId && urlsSessao.has(m.conteudo)) {
        materiais[mIdx].disciplinaId = novaDisciplinaId;
        matModificado = true;
      }
    });

    if (matModificado) {
      localStorage.setItem(STORAGE_KEYS.MATERIAIS, JSON.stringify(materiais));
    }

    notifyStorageChange();
  }
}
