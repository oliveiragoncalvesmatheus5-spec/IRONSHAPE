export type Plan = 'Iniciante' | 'Pro' | 'Elite' | 'free' | 'Admin';
export type Level = 'Iniciante' | 'Intermediário' | 'Avançado';
export type MuscleGroup = 'Peito' | 'Costas' | 'Pernas' | 'Ombros' | 'Braços' | 'Abdômen' | 'Full Body';

export interface NutritionLog {
  id: string;
  user_id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: any[];
}

export interface NutritionPreferences {
  likedFoods: string;
  dislikedFoods: string;
  budget: 'Econômico' | 'Moderado' | 'Premium';
  restrictions: 'Nenhuma' | 'Vegetariano' | 'Vegano' | 'Sem glúten' | 'Sem lactose' | 'Outro';
  restrictionsOther?: string;
  mealsPerDay: 3 | 4 | 5 | 6;
}

export interface UserProfile {
  id: string; // Renamed from uid
  email: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  plano: Plan; // Renamed from plan
  role: 'user' | 'admin';
  subscriptionStatus: 'active' | 'inactive' | 'canceled';
  paymentCustomerId?: string;
  subscriptionPaidAt?: string;
  criado_em: string; // Renamed from createdAt
  updatedAt: string;
  points: number;
  streak: number;
  lastWorkoutDate?: string;
  nutrition_preferences?: NutritionPreferences;
  bio?: string;
  avatar_url?: string;
  social_private?: boolean;
}

export interface SocialFollow {
  follower_id: string;
  following_id: string;
  criado_em: string;
}

export interface SocialProfile {
  id: string;
  name: string;
  plano: Plan;
  bio?: string;
  avatar_url?: string;
  streak?: number;
  criado_em?: string;
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
  thumbnail?: string;
  instructions?: string[];
  proTips?: string[];
  commonErrors?: string[];
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
  user_id: string;
  user_name: string;
  user_avatar?: string;
  conteudo: string;
  imagem_url?: string;
  criado_em: string;
  likes: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface RankingEntry {
  uid: string;
  name: string;
  points: number;
  streak: number;
  avatar?: string;
}

export interface WeeklySchedule {
  day: string;
  workoutId: string;
  workoutName: string;
  muscleGroup: string;
}

export type AffiliateStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'bloqueado';

export interface Affiliate {
  id: string;
  user_id: string;
  nome: string;
  cpf: string;
  email: string;
  whatsapp: string;
  pix_chave: string;
  pix_tipo: string;
  codigo_afiliado: string;
  status: AffiliateStatus;
  criado_em: string;
  aprovado_em?: string;
}

export interface AffiliateClick {
  id: string;
  affiliate_id: string;
  ip?: string;
  created_at: string;
}

export interface AffiliateConversion {
  id: string;
  affiliate_id: string;
  user_id?: string;
  plano: string;
  valor_assinatura: number;
  valor_comissao: number;
  status_pagamento: 'pendente' | 'pago';
  created_at: string;
  paid_at?: string;
}

export type IronShopAvailabilityMode =
  | 'blocked'
  | 'admins'
  | 'testers'
  | 'group'
  | 'gradual'
  | 'all';

export interface IronShopAccessState {
  enabled: boolean;
  mode: IronShopAvailabilityMode;
  hasAccess: boolean;
  reason: 'public' | 'admin' | 'early_access' | 'blocked' | 'unauthenticated';
  message?: string;
}

export interface IronShopSettings {
  ironshop_enabled: boolean;
  availability_mode: IronShopAvailabilityMode;
  gradual_percentage: number;
  allowed_group?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface IronShopAuditEntry {
  id: string;
  admin_id?: string | null;
  admin_email?: string | null;
  previous_state: IronShopSettings;
  new_state: IronShopSettings;
  reason?: string | null;
  created_at: string;
}

export interface IronShopProduct {
  id: string;
  name: string;
  category: 'supplement' | 'apparel' | 'accessory';
  price: number;
  image: string;
  stock: number;
  featured?: boolean;
}
