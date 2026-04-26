export type Plan = 'Iniciante' | 'Pro' | 'Elite' | 'free' | 'Admin';
export type Level = 'Iniciante' | 'Intermediário' | 'Avançado';
export type MuscleGroup = 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Braços' | 'Abdômen' | 'Full Body';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  plan: Plan;
  role: 'user' | 'admin';
  subscriptionStatus: 'active' | 'inactive' | 'canceled';
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
  points: number;
  streak: number;
  lastWorkoutDate?: string;
}

export interface Exercise {
  id: string;
  name: string;
  series: number;
  reps: string;
  restTime: string;
  muscleGroup: string;
  description?: string;
  videoUrl?: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  muscleGroup: MuscleGroup;
  level: Level;
  duration: string;
  carga: 'Baixa' | 'Média' | 'Alta';
  exercises: Exercise[];
  planRequired: Plan;
  authorUid: string;
}

export interface WorkoutLog {
  id: string;
  userUid: string;
  workoutId: string;
  workoutName: string;
  completedAt: string;
  duration: number; // in minutes
}

export interface NutritionPlan {
  id: string;
  userUid: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: Meal[];
  planRequired: Plan;
}

export interface Meal {
  name: string;
  time: string;
  foods: string[];
}

export interface ProgressLog {
  id: string;
  userUid: string;
  weight: number;
  chest?: number;
  waist?: number;
  biceps?: number;
  thigh?: number;
  date: string;
}

export interface Post {
  id: string;
  userUid: string;
  userName: string;
  content: string;
  likes: string[]; // array of uids
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}
