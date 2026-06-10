import { translateExerciseName } from '../utils/exerciseTranslations';

const BASE_URL = 'https://api.workoutxapp.com/v1';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-WorkoutX-Key': import.meta.env.VITE_WORKOUTX_KEY,
  };
}

async function request(path) {
  const response = await fetch(`${BASE_URL}${path}`, { headers: getHeaders() });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Erro ${response.status}: ${path}`);
  }
  return response.json();
}

export function getAllExercises() {
  return request('/exercises');
}

export function getExercisesByBodyPart(bodyPart) {
  return request(`/exercises?bodyPart=${encodeURIComponent(bodyPart)}`);
}

export function getExercisesByTarget(muscle) {
  return request(`/exercises?target=${encodeURIComponent(muscle)}`);
}

export async function searchExercisesByName(name, options = {}) {
  const nameEn = translateExerciseName(name);
  const params = new URLSearchParams({ name: nameEn });
  if (options.source) params.set('source', options.source);
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

export function getExerciseById(id) {
  return request(`/exercises/${encodeURIComponent(id)}`);
}
