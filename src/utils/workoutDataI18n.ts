import type { Exercise, Level, MuscleGroup, Workout } from '../types';
import { translateExerciseName as translateExerciseNameToEnglish } from './exerciseTranslations';

export type WorkoutDataLanguage = 'pt-BR' | 'en' | 'es';

type Dictionary = Record<string, string>;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[“”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const titleCase = (value: string) =>
  value.replace(/\p{L}[\p{L}'-]*/gu, word => {
    const lower = word.toLowerCase();
    if (['and', 'or', 'of', 'with', 'for', 'to', 'the', 'a', 'an', 'de', 'del', 'con', 'para', 'y', 'o'].includes(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const applyDictionary = (value: string, dictionary: Dictionary) => {
  let translated = value;
  const entries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
  for (const [source, target] of entries) {
    translated = translated.replace(new RegExp(escapeRegExp(source), 'gi'), target);
  }
  return translated
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
};

const groupTranslations: Record<Exclude<WorkoutDataLanguage, 'pt-BR'>, Record<MuscleGroup | 'Todos', string>> = {
  en: {
    Peito: 'Chest',
    Costas: 'Back',
    Pernas: 'Legs',
    Ombros: 'Shoulders',
    Braços: 'Arms',
    Abdômen: 'Core',
    'Full Body': 'Full Body',
    Todos: 'All',
  },
  es: {
    Peito: 'Pecho',
    Costas: 'Espalda',
    Pernas: 'Piernas',
    Ombros: 'Hombros',
    Braços: 'Brazos',
    Abdômen: 'Abdomen',
    'Full Body': 'Cuerpo Completo',
    Todos: 'Todos',
  },
};

const levelTranslations: Record<Exclude<WorkoutDataLanguage, 'pt-BR'>, Record<Level, string>> = {
  en: {
    Iniciante: 'Beginner',
    Intermediário: 'Intermediate',
    Avançado: 'Advanced',
  },
  es: {
    Iniciante: 'Principiante',
    Intermediário: 'Intermedio',
    Avançado: 'Avanzado',
  },
};

const loadTranslations: Record<Exclude<WorkoutDataLanguage, 'pt-BR'>, Record<Workout['carga'], string>> = {
  en: {
    Baixa: 'Low',
    Média: 'Medium',
    Alta: 'High',
  },
  es: {
    Baixa: 'Baja',
    Média: 'Media',
    Alta: 'Alta',
  },
};

const enNameDictionary: Dictionary = {
  'Corpo Inteiro': 'Full Body',
  'Peito': 'Chest',
  'Costas': 'Back',
  'Pernas': 'Legs',
  'Glúteos': 'Glutes',
  'Ombros': 'Shoulders',
  'Braços': 'Arms',
  'Bíceps': 'Biceps',
  'Tríceps': 'Triceps',
  'Abdômen': 'Core',
  'Abdominal': 'Core',
  'Quadríceps': 'Quads',
  'Posterior': 'Hamstrings',
  'Panturrilha': 'Calves',
  'Lombar': 'Lower Back',
  'Básico': 'Basics',
  'Básica': 'Basics',
  'Completo': 'Complete',
  'Completa': 'Complete',
  'Fortes': 'Strong',
  'Forte': 'Strong',
  'Leves': 'Light',
  'Leve': 'Light',
  'Intermediário': 'Intermediate',
  'Avançado': 'Advanced',
  'Iniciante': 'Beginner',
  'Inclinado': 'Incline',
  'Declinado': 'Decline',
  'Reto': 'Flat',
  'Sentado': 'Seated',
  'Sentada': 'Seated',
  'Deitado': 'Lying',
  'Deitada': 'Lying',
  'Unilateral': 'Single-Side',
  'Alternado': 'Alternating',
  'Alternada': 'Alternating',
  'Controle': 'Control',
  'Pausa': 'Pause',
  'Ritmo': 'Tempo',
  'Postura': 'Posture',
  'Mobilidade': 'Mobility',
  'Alongamento': 'Stretching',
  'Relaxamento': 'Relaxation',
  'Recuperação': 'Recovery',
  'Cadeira': 'Chair',
  'Garrafas': 'Bottles',
  'Apoio': 'Support',
  'Chão': 'Floor',
  'Parede': 'Wall',
  'Carga Máxima': 'Max Load',
  'Alta Carga': 'High Load',
  'Drop-set': 'Drop Set',
  'Cadência Lenta': 'Slow Tempo',
  'Força': 'Strength',
  'Hipertrofia': 'Hypertrophy',
  'Massa': 'Mass',
  'Largura': 'Width',
  'Espessura': 'Thickness',
  'Inferior': 'Lower',
  'Superior': 'Upper',
  'Medial': 'Medial',
  'Anterior': 'Front',
  'Posterior e': 'Hamstrings and',
  'Atleta': 'Athlete',
  'Centro do Corpo': 'Core Center',
  'Estabilidade do Corpo': 'Body Stability',
};

const esNameDictionary: Dictionary = {
  'Corpo Inteiro': 'Cuerpo Completo',
  'Peito': 'Pecho',
  'Costas': 'Espalda',
  'Pernas': 'Piernas',
  'Glúteos': 'Glúteos',
  'Ombros': 'Hombros',
  'Braços': 'Brazos',
  'Bíceps': 'Bíceps',
  'Tríceps': 'Tríceps',
  'Abdômen': 'Abdomen',
  'Abdominal': 'Abdominal',
  'Quadríceps': 'Cuádriceps',
  'Posterior': 'Isquiotibiales',
  'Panturrilha': 'Pantorrilla',
  'Lombar': 'Zona Lumbar',
  'Básico': 'Básico',
  'Básica': 'Básica',
  'Completo': 'Completo',
  'Completa': 'Completa',
  'Fortes': 'Fuertes',
  'Forte': 'Fuerte',
  'Leves': 'Livianos',
  'Leve': 'Liviano',
  'Intermediário': 'Intermedio',
  'Avançado': 'Avanzado',
  'Iniciante': 'Principiante',
  'Inclinado': 'Inclinado',
  'Declinado': 'Declinado',
  'Reto': 'Plano',
  'Sentado': 'Sentado',
  'Sentada': 'Sentada',
  'Deitado': 'Acostado',
  'Deitada': 'Acostada',
  'Unilateral': 'Unilateral',
  'Alternado': 'Alternado',
  'Alternada': 'Alternada',
  'Controle': 'Control',
  'Pausa': 'Pausa',
  'Ritmo': 'Ritmo',
  'Postura': 'Postura',
  'Mobilidade': 'Movilidad',
  'Alongamento': 'Estiramiento',
  'Relaxamento': 'Relajación',
  'Recuperação': 'Recuperación',
  'Cadeira': 'Silla',
  'Garrafas': 'Botellas',
  'Apoio': 'Apoyo',
  'Chão': 'Suelo',
  'Parede': 'Pared',
  'Carga Máxima': 'Carga Máxima',
  'Alta Carga': 'Carga Alta',
  'Drop-set': 'Drop Set',
  'Cadência Lenta': 'Cadencia Lenta',
  'Força': 'Fuerza',
  'Hipertrofia': 'Hipertrofia',
  'Massa': 'Masa',
  'Largura': 'Anchura',
  'Espessura': 'Espesor',
  'Inferior': 'Inferior',
  'Superior': 'Superior',
  'Medial': 'Medial',
  'Anterior': 'Anterior',
  'Atleta': 'Atleta',
  'Centro do Corpo': 'Centro del Cuerpo',
  'Estabilidade do Corpo': 'Estabilidad Corporal',
};

const enTextDictionary: Dictionary = {
  'Foco em': 'Focus on',
  'Protocolo de': 'Protocol for',
  'Protocolo com': 'Protocol with',
  'Combinação de': 'Combination of',
  'Sequência curta para': 'Short sequence to',
  'Rotina leve para': 'Light routine to',
  'Rotina de baixo impacto': 'Low-impact routine',
  'Movimentos leves para': 'Light movements for',
  'Movimentos simples para': 'Simple movements to',
  'Treino em casa': 'home workout',
  'sem impacto': 'low impact',
  'movimentos simples': 'simple movements',
  'Ajuste a amplitude': 'Adjust the range of motion',
  'use apoio': 'use support',
  'pare se sentir dor': 'stop if you feel pain',
  'técnica': 'technique',
  'consciência corporal': 'body awareness',
  'iniciantes': 'beginners',
  'máxima ativação': 'maximum activation',
  'ganho de força': 'strength gain',
  'volume': 'muscle volume',
  'hipertrofia': 'hypertrophy',
  'sobrecarga': 'overload',
  'amplitude': 'range of motion',
  'controle': 'control',
  'postura': 'posture',
  'segurança': 'safety',
  'recuperação': 'recovery',
  'respiração': 'breathing',
  'articulações': 'joints',
  'Mantenha': 'Keep',
  'Segure': 'Hold',
  'Deite-se': 'Lie down',
  'Sente-se': 'Sit',
  'Posicione': 'Position',
  'Desça': 'Lower',
  'Suba': 'Rise',
  'Empurre': 'Push',
  'Puxe': 'Pull',
  'Retorne': 'Return',
  'Evite': 'Avoid',
  'Expire': 'Exhale',
  'Inspire': 'Inhale',
  'lentamente': 'slowly',
  'controladamente': 'with control',
  'sem pressa': 'without rushing',
  'sem forçar': 'without forcing',
  'sem dor': 'pain-free',
  'com apoio': 'with support',
  'com controle': 'with control',
  'os pés firmes no chão': 'your feet planted on the floor',
  'cotovelos': 'elbows',
  'joelhos': 'knees',
  'ombros': 'shoulders',
  'peito': 'chest',
  'costas': 'back',
  'quadril': 'hips',
  'lombar': 'lower back',
  'abdômen': 'core',
  'escápulas': 'shoulder blades',
};

const esTextDictionary: Dictionary = {
  'Foco em': 'Enfoque en',
  'Protocolo de': 'Protocolo de',
  'Protocolo com': 'Protocolo con',
  'Combinação de': 'Combinación de',
  'Sequência curta para': 'Secuencia corta para',
  'Rotina leve para': 'Rutina liviana para',
  'Rotina de baixo impacto': 'Rutina de bajo impacto',
  'Movimentos leves para': 'Movimientos livianos para',
  'Movimentos simples para': 'Movimientos simples para',
  'Treino em casa': 'entreno en casa',
  'sem impacto': 'sin impacto',
  'movimentos simples': 'movimientos simples',
  'Ajuste a amplitude': 'Ajusta la amplitud',
  'use apoio': 'usa apoyo',
  'pare se sentir dor': 'detente si sientes dolor',
  'técnica': 'técnica',
  'consciência corporal': 'conciencia corporal',
  'iniciantes': 'principiantes',
  'máxima ativação': 'máxima activación',
  'ganho de força': 'ganancia de fuerza',
  'volume': 'volumen',
  'hipertrofia': 'hipertrofia',
  'sobrecarga': 'sobrecarga',
  'amplitude': 'amplitud',
  'controle': 'control',
  'postura': 'postura',
  'segurança': 'seguridad',
  'recuperação': 'recuperación',
  'respiração': 'respiración',
  'articulações': 'articulaciones',
  'Mantenha': 'Mantén',
  'Segure': 'Sostén',
  'Deite-se': 'Acuéstate',
  'Sente-se': 'Siéntate',
  'Posicione': 'Posiciona',
  'Desça': 'Baja',
  'Suba': 'Sube',
  'Empurre': 'Empuja',
  'Puxe': 'Tira',
  'Retorne': 'Vuelve',
  'Evite': 'Evita',
  'Expire': 'Exhala',
  'Inspire': 'Inhala',
  'lentamente': 'lentamente',
  'controladamente': 'con control',
  'sem pressa': 'sin prisa',
  'sem forçar': 'sin forzar',
  'sem dor': 'sin dolor',
  'com apoio': 'con apoyo',
  'com controle': 'con control',
  'os pés firmes no chão': 'los pies firmes en el suelo',
  'cotovelos': 'codos',
  'joelhos': 'rodillas',
  'ombros': 'hombros',
  'peito': 'pecho',
  'costas': 'espalda',
  'quadril': 'cadera',
  'lombar': 'zona lumbar',
  'abdômen': 'abdomen',
  'escápulas': 'escápulas',
};

const exactText: Record<Exclude<WorkoutDataLanguage, 'pt-BR'>, Dictionary> = {
  en: {
    'Faça um aquecimento leve antes de começar.': 'Do a light warm-up before starting.',
    'Mantenha postura firme e amplitude confortável.': 'Keep a stable posture and a comfortable range of motion.',
    'Priorize controle e conforto articular antes de aumentar repetições.': 'Prioritize control and joint comfort before increasing reps.',
    'Use uma cadeira ou parede como apoio sempre que precisar de mais estabilidade.': 'Use a chair or wall for support whenever you need more stability.',
    'Garrafas com água podem servir como carga leve. Comece sem peso se estiver aprendendo o movimento.': 'Water bottles can work as light load. Start without weight if you are learning the movement.',
    'Apressar o movimento e perder alinhamento do corpo.': 'Rushing the movement and losing body alignment.',
    'Continuar mesmo sentindo dor, tontura ou falta de ar fora do normal.': 'Continuing despite pain, dizziness, or unusual shortness of breath.',
  },
  es: {
    'Faça um aquecimento leve antes de começar.': 'Haz un calentamiento liviano antes de comenzar.',
    'Mantenha postura firme e amplitude confortável.': 'Mantén una postura firme y una amplitud cómoda.',
    'Priorize controle e conforto articular antes de aumentar repetições.': 'Prioriza el control y la comodidad articular antes de aumentar repeticiones.',
    'Use uma cadeira ou parede como apoio sempre que precisar de mais estabilidade.': 'Usa una silla o pared como apoyo cuando necesites más estabilidad.',
    'Garrafas com água podem servir como carga leve. Comece sem peso se estiver aprendendo o movimento.': 'Las botellas con agua pueden servir como carga liviana. Empieza sin peso si estás aprendiendo el movimiento.',
    'Apressar o movimento e perder alinhamento do corpo.': 'Apresurar el movimiento y perder alineación corporal.',
    'Continuar mesmo sentindo dor, tontura ou falta de ar fora do normal.': 'Continuar aunque sientas dolor, mareo o falta de aire fuera de lo normal.',
  },
};

export function translateMuscleGroup(group: MuscleGroup | 'Todos' | string, language: WorkoutDataLanguage) {
  if (language === 'pt-BR') return group;
  return groupTranslations[language][group as MuscleGroup | 'Todos'] || group;
}

export function translateLevel(level: Level, language: WorkoutDataLanguage) {
  if (language === 'pt-BR') return level;
  return levelTranslations[language][level] || level;
}

export function translateLoad(load: Workout['carga'], language: WorkoutDataLanguage) {
  if (language === 'pt-BR') return load;
  return loadTranslations[language][load] || load;
}

export function translateWorkoutName(name: string, language: WorkoutDataLanguage) {
  if (language === 'pt-BR') return name;
  const dictionary = language === 'en' ? enNameDictionary : esNameDictionary;
  return titleCase(applyDictionary(name, dictionary));
}

export function translateExerciseNameForDisplay(name: string, language: WorkoutDataLanguage) {
  if (language === 'pt-BR') return name;
  if (language === 'en') return titleCase(translateExerciseNameToEnglish(name));
  return titleCase(applyDictionary(name, esNameDictionary));
}

export function translateWorkoutText(text: string | undefined, language: WorkoutDataLanguage) {
  if (!text || language === 'pt-BR') return text || '';
  const exact = exactText[language][text];
  if (exact) return exact;
  const dictionary = language === 'en' ? { ...enNameDictionary, ...enTextDictionary } : { ...esNameDictionary, ...esTextDictionary };
  return applyDictionary(text, dictionary);
}

export function translateExerciseTextList(items: string[] | undefined, language: WorkoutDataLanguage) {
  return (items || []).map(item => translateWorkoutText(item, language));
}

export function getWorkoutDisplay(workout: Workout, language: WorkoutDataLanguage) {
  return {
    name: translateWorkoutName(workout.name, language),
    description: translateWorkoutText(workout.description, language),
    muscleGroup: translateMuscleGroup(workout.muscleGroup, language),
    level: translateLevel(workout.level, language),
    carga: translateLoad(workout.carga, language),
  };
}

export function getExerciseDisplay(exercise: Exercise, language: WorkoutDataLanguage) {
  return {
    name: translateExerciseNameForDisplay(exercise.name, language),
    description: translateWorkoutText(exercise.description, language),
    muscleGroup: translateWorkoutText(exercise.muscleGroup, language),
    instructions: translateExerciseTextList(exercise.instructions, language),
    proTips: translateExerciseTextList(exercise.proTips, language),
    commonErrors: translateExerciseTextList(exercise.commonErrors, language),
  };
}
