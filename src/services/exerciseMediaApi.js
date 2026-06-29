import { translateExerciseName } from '../utils/exerciseTranslations';

let mediaProviderBlockedUntil = 0;

export async function searchExercisesByName(name) {
  if (Date.now() < mediaProviderBlockedUntil) return [];

  const nameEn = translateExerciseName(name);
  const params = new URLSearchParams({ name: nameEn });
  const res = await fetch(`/api/workout-gif?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    if (res.status === 429) {
      mediaProviderBlockedUntil = Date.now() + 60 * 60 * 1000;
      return [];
    }
    throw new Error(error.error || error.message || `Erro ${res.status}`);
  }
  const data = await res.json();
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return { ...data, query: nameEn };
  }
  return data;
}
