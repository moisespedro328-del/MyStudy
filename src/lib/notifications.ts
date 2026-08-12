/**
 * Helper for study tips and local class alerts
 */

export interface DicaEstudo {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: 'foco' | 'organizacao' | 'memorizacao' | 'bem_estar';
}

export const DICAS_ESTUDO: DicaEstudo[] = [
  {
    id: '1',
    titulo: 'Técnica Pomodoro',
    conteudo: 'Estude durante 25 minutos com foco total e faça uma pausa de 5 minutos. Após 4 ciclos, faça uma pausa mais longa de 15 a 30 minutos.',
    categoria: 'foco',
  },
  {
    id: '2',
    titulo: 'Efeito de Espaçamento',
    conteudo: 'Rever a matéria em intervalos espaçados (ex: 1 dia, 3 dias, 1 semana) é 3x mais eficaz do que estudar tudo na véspera do exame.',
    categoria: 'memorizacao',
  },
  {
    id: '3',
    titulo: 'O Princípio "O estudante adiciona. O aplicativo organiza"',
    conteudo: 'Capture suas notas e fotos rapidamente na aula. Depois consulte o material organizado diretamente por cada disciplina.',
    categoria: 'organizacao',
  },
  {
    id: '4',
    titulo: 'Regra dos 2 Minutos',
    conteudo: 'Se uma tarefa de estudo leva menos de 2 minutos para registrar ou organizar, faça-a imediatamente para liberar sua mente.',
    categoria: 'organizacao',
  },
  {
    id: '5',
    titulo: 'Técnica de Feynman',
    conteudo: 'Tente explicar um conceito complexo em termos simples como se estivesse ensinando a uma criança de 10 anos. Se travar, revise o conceito.',
    categoria: 'memorizacao',
  },
  {
    id: '6',
    titulo: 'Descanso Ativo',
    conteudo: 'Durante as pausas de estudo, evite olhar telas. Caminhe, beba água ou alongue-se para refrescar o cérebro.',
    categoria: 'bem_estar',
  },
];

export function getDicaAleatoria(): DicaEstudo {
  const index = Math.floor(Math.random() * DICAS_ESTUDO.length);
  return DICAS_ESTUDO[index];
}
