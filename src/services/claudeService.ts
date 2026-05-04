import { UserProfile, Workout } from '../types';

export interface AIProfile {
  trainingDays: number;
  experience: string;
  limitations: string;
  priorityMuscles: string[];
  sessionDuration: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function buildWorkoutContext(workouts: Workout[], plan: string): string {
  const filtered = workouts.filter(w => {
    if (plan === 'Elite') return true;
    if (plan === 'Pro') return w.planRequired === 'Pro' || w.planRequired === 'Iniciante';
    return w.planRequired === 'Iniciante';
  });

  return filtered
    .map(w => {
      const exercises = w.exercises
        .map(e => `${e.name} (${e.series}x${e.reps}, descanso ${e.restTime})`)
        .join(', ');
      return `• [${w.id}] ${w.name} | ${w.muscleGroup} | ${w.level} | ${w.duration}\n  Exercícios: ${exercises}`;
    })
    .join('\n');
}

function buildSystemPrompt(profile: UserProfile, aiProfile: AIProfile, workouts: Workout[]): string {
  return `Você é o Iron Coach, personal trainer e nutricionista virtual do IronSaaS. Responda sempre em português brasileiro de forma direta, motivadora e prática.

## Perfil do usuário
- Nome: ${profile.name}
- Objetivo: ${profile.goal}
- Plano: ${profile.plano}
- Dias de treino por semana: ${aiProfile.trainingDays}
- Experiência: ${aiProfile.experience}
- Limitações físicas: ${aiProfile.limitations || 'Nenhuma'}
- Músculos prioritários: ${aiProfile.priorityMuscles.join(', ')}
- Tempo disponível por treino: ${aiProfile.sessionDuration}

## Treinos disponíveis no plano
${buildWorkoutContext(workouts, profile.plano)}

## Regras
- Recomende treinos da lista acima pelo nome exato
- Adapte sempre ao perfil, objetivo e limitações do usuário
- Se relatar dor intensa ou lesão, oriente a consultar um profissional de saúde
- Seja motivador, prático e conciso
- Para sugestões de variação, baseie-se nos exercícios existentes nos planos`;
}

export async function sendMessage(
  profile: UserProfile,
  aiProfile: AIProfile,
  workouts: Workout[],
  history: Message[],
  userMessage: string
): Promise<string> {
  const messages = [
    ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await fetch('/.netlify/functions/iron-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt: buildSystemPrompt(profile, aiProfile, workouts),
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao conectar com o Iron Coach');
  }

  return data.text;
}
