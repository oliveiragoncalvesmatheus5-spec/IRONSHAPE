import { translateExerciseName } from '../utils/exerciseTranslations';

export async function searchExercisesByName(name) {
  const nameEn = translateExerciseName(name);
  const params = new URLSearchParams({ name: nameEn });
  const res = await fetch(`/api/workout-gif?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Erro ${res.status}`);
  }
  const data = await res.json();
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { ...data, query: nameEn };
  }
  return data;
}
