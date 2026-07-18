import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import { withTimeout } from './lib/utils';
import { UserProfile, SocialProfile, NutritionPreferences, NutritionLog, Workout, WorkoutLog, ProgressLog, Post, Plan, Level, MuscleGroup, Exercise, RankingEntry, WeeklySchedule, Affiliate, AffiliateStatus, AffiliateConversion, IronShopAccessState, IronShopAuditEntry, IronShopAvailabilityMode, IronShopProduct, IronShopSettings } from './types';
import { ALL_WORKOUTS } from './data/workouts';
import { dataService } from './services/dataService';
import { searchExercisesByName } from './services/exerciseMediaApi';
import { getAnalyticsClientId, initAnalytics, trackEvent, trackPlanEvent } from './services/analytics';
import { getLocalExerciseMedia, translateExerciseName } from './utils/exerciseTranslations';
import { getExerciseDisplay, getWorkoutDisplay, translateMuscleGroup, translateWorkoutName } from './utils/workoutDataI18n';
import { installUiAutoTranslate } from './utils/uiAutoTranslate';
import AIChat from './AIChat';
import { DashboardMetricCard } from './components/dashboardCards';
import { LoadingScreen, ViewErrorBoundary } from './components/feedback';
import { MobileNavItem, NavItem } from './components/navigation';
import { PlanSimulator } from './components/PlanSimulator';
import { PHYSICAL_LIMITATION_OPTIONS } from './data/physicalLimitations';
import { ironshopService } from './services/ironshopService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Apple, 
  TrendingUp, 
  Users, 
  Settings, 
  LogOut, 
  Plus, 
  CheckCircle2, 
  ChevronRight,
  Trophy,
  Flame,
  Calendar,
  ArrowLeft,
  Clock,
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  X,
  ShieldCheck,
  Calculator,
  Utensils,
  ChefHat,
  Stethoscope,
  Info,
  Edit3,
  Play,
  PlayCircle,
  AlertTriangle,
  Timer,
  Pause,
  RotateCcw,
  BellRing,
  User as UserIcon,
  Camera,
  Image as ImageIcon,
  Send,
  Loader2,
  Activity,
  RefreshCw,
  Copy,
  ExternalLink,
  Check,
  Wallet,
  BarChart3,
  Link as LinkIcon,
  FileText,
  UserCheck,
  UserX,
  Ban,
  Bot,
  Ruler,
  Scale,
  ChevronLeft,
  ChevronDown,
  MoreHorizontal,
  Star,
  Trash2,
  PlusCircle,
  CalendarDays,
  Repeat2,
  CalendarPlus,
  SlidersHorizontal,
  Coffee,
  Share2,
  Grid3X3,
  UserPlus,
  UserMinus,
  Sun,
  Moon,
  Languages,
  ShoppingBag,
  Package,
  Shirt,
  Search,
  Heart,
  Truck,
  CreditCard,
  Headphones,
  ShieldAlert
} from 'lucide-react';
import { addMonths, format, formatDistanceToNow, isValid } from 'date-fns';
import { enUS, es, ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, ReferenceLine, LabelList } from 'recharts';

function getEntitledPlan(profile?: Pick<UserProfile, 'plano' | 'subscriptionStatus'> | null, simulatedPlan?: Plan | null): Plan {
  if (simulatedPlan) return simulatedPlan;
  const plan = profile?.plano || 'free';
  if ((plan === 'Pro' || plan === 'Elite') && profile?.subscriptionStatus !== 'active') {
    return 'Iniciante';
  }
  return plan;
}

function slugifyText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const AUTH_NAVIGATION_KEYS = [
  'code',
  'access_token',
  'refresh_token',
  'expires_in',
  'expires_at',
  'provider_token',
  'provider_refresh_token',
  'token_type',
  'type',
  'error',
  'error_code',
  'error_description',
];

type ThemeMode = 'dark' | 'light';
type LanguageCode = 'pt-BR' | 'en' | 'es';
type NutritionCalcGoal = 'lose' | 'maintain' | 'gain';

const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; short: string; label: string }> = [
  { code: 'pt-BR', short: 'PT', label: 'Português' },
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'es', short: 'ES', label: 'Español' },
];

const getLocaleCode = (language: LanguageCode) => language === 'pt-BR' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
const getDateFnsLocale = (language: LanguageCode) => language === 'pt-BR' ? ptBR : language === 'es' ? es : enUS;

const APP_TRANSLATIONS: Record<LanguageCode, {
  nav: Record<'home' | 'workouts' | 'nutrition' | 'progress' | 'social' | 'shop' | 'affiliates' | 'settings' | 'admin' | 'plans' | 'logout' | 'more' | 'close', string>;
  drawer: { title: string; subtitle: string; socialDesc: string; shopDesc: string; affiliatesDesc: string; settingsDesc: string; adminDesc: string };
  actions: { enableLight: string; enableDark: string; language: string };
  dashboard: {
    upgradeTitle: string;
    upgradeText: string;
    viewPlans: string;
    startProtocol: string;
    day: string;
    member: string;
    adminMode: string;
    greeting: string;
    weeklyQuote: string;
    weeklyProgress: (percent: number, count: number, target: number) => string;
    startTodayWorkout: string;
    weeklyGoal: string;
    weeklyWorkoutsTitle: string;
    weeklyWorkoutsSubtitle: string;
    organize: string;
    today: string;
    exercises: string;
    openWorkout: string;
    startNow: string;
    unmarkDone: string;
    markDone: string;
    restDay: string;
    restDayText: string;
    rest: string;
    noWorkout: string;
    organizeWeek: string;
    buildWeek: string;
    buildWeekText: string;
    chooseWorkouts: string;
    currentWeight: string;
    updateWeight: string;
    nextWorkout: string;
    dailyCalories: string;
    calorieDeficitGoal: string;
    calorieGoal: (goal: string) => string;
    viewNutrition: string;
    energyLevel: string;
    checkInToday: string;
    checkInPrompt: string;
    editCheckIn: string;
    doCheckIn: string;
    high: string;
    medium: string;
    low: string;
    notProvided: string;
    weekCalories: string;
    dailyGoal: (goal: string) => string;
    logMealsForChart: string;
    weeklyAverage: string;
    bestDay: string;
    nutrition: string;
    viewAll: string;
    calories: string;
    proteinShort: string;
    carbsShort: string;
    fatShort: string;
    nextMeal: string;
    logMeals: string;
    nutritionModule: string;
    previousWeightDelta: (delta: string) => string;
    weightRegisteredAt: (date: string) => string;
    weightEmpty: string;
    sleepCheckIn: (hours: string) => string;
  };
  workouts: {
    title: string;
    subtitle: (place: string, goal: string) => string;
    fallbackGoal: string;
    points: string;
    phaseGoal: (limit: string) => string;
    pointsGoal: (limit: string) => string;
    continueEvolution: string;
    homeActive: string;
    homeActiveText: (goal: string) => string;
    train: string;
    mobility: string;
    stretch: string;
    weeklyTitle: string;
    weeklySimpleText: string;
    weeklyAdvancedText: string;
    repeat: string;
    clear: string;
    open: string;
    done: string;
    markDone: string;
    removeWeekly: string;
    emptyWeekly: string;
    favorites: string;
    freeWeeklyLimit: (limit: number) => string;
    upgrade: string;
    protocol: string;
    workouts: string;
    loadLog: string;
    history: string;
    ranking: string;
    athleteSheet: string;
    earlyAccess: string;
    muscleGroup: string;
    all: string;
    mobilityRoutines: string;
    stretchingRoutines: string;
    emptyTitle: string;
    emptyText: string;
  };
  nutrition: {
    title: string;
    subtitle: string;
    editPreferences: string;
    mealsPerDay: (count: number) => string;
    metabolicCalculator: string;
    beginnerModule: string;
    weight: string;
    height: string;
    age: string;
    gender: string;
    male: string;
    female: string;
    activityLevel: string;
    activityOptions: Record<'sedentary' | 'light' | 'moderate' | 'very' | 'extra', string>;
    mainGoal: string;
    mainGoalHelp: string;
    lose: string;
    maintain: string;
    gain: string;
    priority: string;
    priorityHelp: string;
    localizedFatNote: string;
    calculateFor: (goal: string, focus: string) => string;
    choosePriority: string;
    waitingTitle: string;
    waitingText: string;
    estimatedDailyGoal: string;
    bmr: string;
    tdee: string;
    proteins: string;
    carbs: string;
    fats: string;
    protocolAnalysis: string;
    goalFocusOptions: Record<NutritionCalcGoal, Array<{ value: string; label: string }>>;
  };
}> = {
  'pt-BR': {
    nav: {
      home: 'Início',
      workouts: 'Treinos',
      nutrition: 'Dieta',
      progress: 'Progresso',
      social: 'Social',
      shop: 'Loja',
      affiliates: 'Afiliados',
      settings: 'Ajustes',
      admin: 'Admin',
      plans: 'Planos',
      logout: 'Sair',
      more: 'Mais',
      close: 'Fechar',
    },
    drawer: {
      title: 'Mais opções',
      subtitle: 'Acessos secundários e configurações',
      socialDesc: 'Feed e comunidade',
      shopDesc: 'Suplementos e acessórios',
      affiliatesDesc: 'Comissões e links',
      settingsDesc: 'Conta e preferências',
      adminDesc: 'Painel de administrador',
    },
    actions: {
      enableLight: 'Ativar modo claro',
      enableDark: 'Ativar modo escuro',
      language: 'Selecionar idioma',
    },
    dashboard: {
      upgradeTitle: 'Desbloqueie seu Potencial Máximo',
      upgradeText: 'Assine o plano PRO ou ELITE e tenha acesso a treinos com IA e dietas personalizadas.',
      viewPlans: 'Ver Planos',
      startProtocol: 'Começar Protocolo',
      day: 'Dia',
      member: 'MEMBER',
      adminMode: 'ADMIN MODE',
      greeting: 'BOM TRABALHO',
      weeklyQuote: '"A disciplina é a ponte entre metas e realizações."',
      weeklyProgress: (percent, count, target) => `Você já completou ${percent}% da sua meta semanal (${count}/${target} treinos).`,
      startTodayWorkout: 'INICIAR TREINO DE HOJE',
      weeklyGoal: 'Meta Semanal',
      weeklyWorkoutsTitle: 'Seus treinos da semana',
      weeklyWorkoutsSubtitle: 'Sua rotina organizada para abrir e começar sem precisar procurar.',
      organize: 'Organizar',
      today: 'Hoje',
      exercises: 'exercícios',
      openWorkout: 'Abrir treino',
      startNow: 'Começar agora',
      unmarkDone: 'Desmarcar treino concluído',
      markDone: 'Marcar treino como concluído',
      restDay: 'Dia de descanso',
      restDayText: 'Recupere o corpo e mantenha sua rotina.',
      rest: 'Descanso',
      noWorkout: 'Sem treino',
      organizeWeek: 'Organizar semana',
      buildWeek: 'Monte sua semana',
      buildWeekText: 'Escolha seus treinos uma vez e encontre cada dia pronto aqui na tela inicial.',
      chooseWorkouts: 'Escolher treinos',
      currentWeight: 'Peso Atual',
      updateWeight: 'Atualizar peso',
      nextWorkout: 'Próximo Treino',
      dailyCalories: 'Calorias Diárias',
      calorieDeficitGoal: 'Meta em déficit calórico',
      calorieGoal: goal => `Meta: ${goal} kcal`,
      viewNutrition: 'Ver nutrição',
      energyLevel: 'Nível de Energia',
      checkInToday: 'check-in de hoje',
      checkInPrompt: 'Toque para fazer seu check-in',
      editCheckIn: 'Editar check-in',
      doCheckIn: 'Fazer check-in',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
      notProvided: 'Não informado',
      weekCalories: 'Calorias da semana',
      dailyGoal: goal => `Meta: ${goal} kcal/dia`,
      logMealsForChart: 'Registre suas refeições para ver o gráfico',
      weeklyAverage: 'Média da semana',
      bestDay: 'Melhor dia',
      nutrition: 'Nutrição',
      viewAll: 'Ver Tudo',
      calories: 'Calorias',
      proteinShort: 'Prot',
      carbsShort: 'Carb',
      fatShort: 'Gord',
      nextMeal: 'Próxima Refeição',
      logMeals: 'Registre refeições',
      nutritionModule: 'no módulo de Nutrição',
      previousWeightDelta: delta => `${delta} kg desde o registro anterior`,
      weightRegisteredAt: date => `Registrado em ${date}`,
      weightEmpty: 'Registre seu peso e acompanhe a evolução',
      sleepCheckIn: hours => `${hours}h de sono • check-in de hoje`,
    },
    workouts: {
      title: 'Meus Treinos',
      subtitle: (place, goal) => `Protocolos de treinamento personalizados para ${place.toLowerCase()} e objetivo: ${goal}.`,
      fallbackGoal: 'evolução',
      points: 'Pontos',
      phaseGoal: limit => `Fase 1: ${limit} pts`,
      pointsGoal: limit => `Meta ${limit} pts`,
      continueEvolution: 'Continuar evolução',
      homeActive: 'Treino em casa ativado',
      homeActiveText: goal => `Sessões práticas para o objetivo ${goal}, com progressão segura e rotina adaptada ao seu espaço.`,
      train: 'Treinar',
      mobility: 'Mobilidade',
      stretch: 'Alongar',
      weeklyTitle: 'Treinos da Semana',
      weeklySimpleText: 'Monte uma rotina simples com seus treinos favoritos.',
      weeklyAdvancedText: 'Organize sua semana sem perder o acesso aos protocolos avançados.',
      repeat: 'Repetir',
      clear: 'Limpar',
      open: 'Abrir',
      done: 'Feito',
      markDone: 'Marcar feito',
      removeWeekly: 'Remover treino da semana',
      emptyWeekly: 'Adicione treinos pelos cards abaixo para montar sua semana.',
      favorites: 'Favoritos',
      freeWeeklyLimit: limit => `Free libera ${limit} treinos por semana. Pro libera 5 e Elite libera a rotina completa.`,
      upgrade: 'Fazer upgrade',
      protocol: 'Protocolo',
      workouts: 'Treinos',
      loadLog: 'Registro',
      history: 'Histórico',
      ranking: 'Ranking',
      athleteSheet: 'Planilha Atleta',
      earlyAccess: 'Acesso Antecipado',
      muscleGroup: 'Grupo Muscular',
      all: 'Todos',
      mobilityRoutines: 'Rotinas de mobilidade',
      stretchingRoutines: 'Rotinas de alongamento',
      emptyTitle: 'Nenhum treino encontrado',
      emptyText: 'Tente ajustar seus filtros para encontrar outros protocolos.',
    },
    nutrition: {
      title: 'Nutrição & Dieta',
      subtitle: 'Otimize sua performance com protocolos nutricionais baseados em ciência e adaptados ao seu metabolismo.',
      editPreferences: 'Editar Preferências',
      mealsPerDay: count => `${count} refeições/dia`,
      metabolicCalculator: 'Calculadora Metabólica',
      beginnerModule: 'MÓDULO INICIANTE',
      weight: 'Peso (kg)',
      height: 'Altura (cm)',
      age: 'Idade',
      gender: 'Sexo',
      male: 'Masculino',
      female: 'Feminino',
      activityLevel: 'Nível de Atividade',
      activityOptions: {
        sedentary: 'Sedentário (Pouco ou nenhum exercício)',
        light: 'Levemente Ativo (1-3 dias/semana)',
        moderate: 'Moderadamente Ativo (3-5 dias/semana)',
        very: 'Muito Ativo (6-7 dias/semana)',
        extra: 'Extra Ativo (Treino pesado 2x/dia)',
      },
      mainGoal: 'Objetivo principal',
      mainGoalHelp: 'Escolha a direção do seu protocolo.',
      lose: 'PERDER',
      maintain: 'MANTER',
      gain: 'GANHAR',
      priority: 'Sua prioridade',
      priorityHelp: 'Qual resultado é mais importante para você agora?',
      localizedFatNote: 'O protocolo favorece a redução de gordura corporal total; não existe perda de gordura localizada.',
      calculateFor: (goal, focus) => `CALCULAR PARA ${goal} ${focus}`,
      choosePriority: 'ESCOLHA SUA PRIORIDADE',
      waitingTitle: 'Aguardando Parâmetros',
      waitingText: 'Preencha suas informações biométricas para gerar seu protocolo nutricional.',
      estimatedDailyGoal: 'META DIÁRIA ESTIMADA',
      bmr: 'TMB',
      tdee: 'GET',
      proteins: 'Proteínas',
      carbs: 'Carboidratos',
      fats: 'Gorduras',
      protocolAnalysis: 'Análise do Protocolo',
      goalFocusOptions: {
        lose: [
          { value: 'body_fat', label: 'Gordura corporal' },
          { value: 'body_weight', label: 'Peso corporal' },
          { value: 'waist_measurements', label: 'Medidas abdominais' },
          { value: 'muscle_definition', label: 'Definição muscular' },
          { value: 'not_sure', label: 'Não tenho certeza' },
        ],
        maintain: [
          { value: 'muscle_mass', label: 'Massa muscular' },
          { value: 'body_weight', label: 'Peso corporal' },
          { value: 'body_fat_percentage', label: 'Percentual de gordura' },
          { value: 'health_wellbeing', label: 'Saúde e bem-estar' },
          { value: 'not_sure', label: 'Não tenho certeza' },
        ],
        gain: [
          { value: 'muscle_mass', label: 'Massa muscular' },
          { value: 'body_weight', label: 'Peso corporal' },
          { value: 'strength_performance', label: 'Força e desempenho' },
          { value: 'body_composition', label: 'Composição corporal' },
          { value: 'not_sure', label: 'Não tenho certeza' },
        ],
      },
    },
  },
  en: {
    nav: {
      home: 'Home',
      workouts: 'Workouts',
      nutrition: 'Nutrition',
      progress: 'Progress',
      social: 'Social',
      shop: 'Shop',
      affiliates: 'Affiliates',
      settings: 'Settings',
      admin: 'Admin',
      plans: 'Plans',
      logout: 'Log out',
      more: 'More',
      close: 'Close',
    },
    drawer: {
      title: 'More options',
      subtitle: 'Secondary access and settings',
      socialDesc: 'Feed and community',
      shopDesc: 'Supplements and accessories',
      affiliatesDesc: 'Commissions and links',
      settingsDesc: 'Account and preferences',
      adminDesc: 'Admin dashboard',
    },
    actions: {
      enableLight: 'Turn on light mode',
      enableDark: 'Turn on dark mode',
      language: 'Select language',
    },
    dashboard: {
      upgradeTitle: 'Unlock Your Maximum Potential',
      upgradeText: 'Subscribe to PRO or ELITE and get access to AI workouts and personalized diets.',
      viewPlans: 'View Plans',
      startProtocol: 'Start Protocol',
      day: 'Day',
      member: 'MEMBER',
      adminMode: 'ADMIN MODE',
      greeting: 'GREAT WORK',
      weeklyQuote: '"Discipline is the bridge between goals and results."',
      weeklyProgress: (percent, count, target) => `You have completed ${percent}% of your weekly goal (${count}/${target} workouts).`,
      startTodayWorkout: "START TODAY'S WORKOUT",
      weeklyGoal: 'Weekly Goal',
      weeklyWorkoutsTitle: 'Your weekly workouts',
      weeklyWorkoutsSubtitle: 'Your routine is organized so you can open and start without searching.',
      organize: 'Organize',
      today: 'Today',
      exercises: 'exercises',
      openWorkout: 'Open workout',
      startNow: 'Start now',
      unmarkDone: 'Unmark workout as done',
      markDone: 'Mark workout as done',
      restDay: 'Rest day',
      restDayText: 'Recover your body and keep your routine.',
      rest: 'Rest',
      noWorkout: 'No workout',
      organizeWeek: 'Organize week',
      buildWeek: 'Build your week',
      buildWeekText: 'Choose your workouts once and find each day ready here on the home screen.',
      chooseWorkouts: 'Choose workouts',
      currentWeight: 'Current Weight',
      updateWeight: 'Update weight',
      nextWorkout: 'Next Workout',
      dailyCalories: 'Daily Calories',
      calorieDeficitGoal: 'Calorie deficit goal',
      calorieGoal: goal => `Goal: ${goal} kcal`,
      viewNutrition: 'View nutrition',
      energyLevel: 'Energy Level',
      checkInToday: "today's check-in",
      checkInPrompt: 'Tap to do your check-in',
      editCheckIn: 'Edit check-in',
      doCheckIn: 'Do check-in',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      notProvided: 'Not provided',
      weekCalories: 'Weekly calories',
      dailyGoal: goal => `Goal: ${goal} kcal/day`,
      logMealsForChart: 'Log your meals to see the chart',
      weeklyAverage: 'Weekly average',
      bestDay: 'Best day',
      nutrition: 'Nutrition',
      viewAll: 'View All',
      calories: 'Calories',
      proteinShort: 'Prot',
      carbsShort: 'Carb',
      fatShort: 'Fat',
      nextMeal: 'Next Meal',
      logMeals: 'Log meals',
      nutritionModule: 'in the Nutrition module',
      previousWeightDelta: delta => `${delta} kg since the previous log`,
      weightRegisteredAt: date => `Logged on ${date}`,
      weightEmpty: 'Log your weight and track progress',
      sleepCheckIn: hours => `${hours}h of sleep • today's check-in`,
    },
    workouts: {
      title: 'My Workouts',
      subtitle: (place, goal) => `Personalized training protocols for ${place.toLowerCase()} and goal: ${goal}.`,
      fallbackGoal: 'progress',
      points: 'Points',
      phaseGoal: limit => `Phase 1: ${limit} pts`,
      pointsGoal: limit => `Goal ${limit} pts`,
      continueEvolution: 'Continue progress',
      homeActive: 'Home training enabled',
      homeActiveText: goal => `Practical sessions for the goal ${goal}, with safe progression and a routine adapted to your space.`,
      train: 'Train',
      mobility: 'Mobility',
      stretch: 'Stretch',
      weeklyTitle: 'Weekly Workouts',
      weeklySimpleText: 'Build a simple routine with your favorite workouts.',
      weeklyAdvancedText: 'Organize your week while keeping access to advanced protocols.',
      repeat: 'Repeat',
      clear: 'Clear',
      open: 'Open',
      done: 'Done',
      markDone: 'Mark done',
      removeWeekly: 'Remove workout from week',
      emptyWeekly: 'Add workouts from the cards below to build your week.',
      favorites: 'Favorites',
      freeWeeklyLimit: limit => `Free unlocks ${limit} workouts per week. Pro unlocks 5 and Elite unlocks the full routine.`,
      upgrade: 'Upgrade',
      protocol: 'Protocol',
      workouts: 'Workouts',
      loadLog: 'Load Log',
      history: 'History',
      ranking: 'Ranking',
      athleteSheet: 'Athlete Sheet',
      earlyAccess: 'Early Access',
      muscleGroup: 'Muscle Group',
      all: 'All',
      mobilityRoutines: 'Mobility routines',
      stretchingRoutines: 'Stretching routines',
      emptyTitle: 'No workout found',
      emptyText: 'Try adjusting your filters to find other protocols.',
    },
    nutrition: {
      title: 'Nutrition & Diet',
      subtitle: 'Optimize your performance with science-based nutrition protocols adapted to your metabolism.',
      editPreferences: 'Edit Preferences',
      mealsPerDay: count => `${count} meals/day`,
      metabolicCalculator: 'Metabolic Calculator',
      beginnerModule: 'BEGINNER MODULE',
      weight: 'Weight (kg)',
      height: 'Height (cm)',
      age: 'Age',
      gender: 'Sex',
      male: 'Male',
      female: 'Female',
      activityLevel: 'Activity Level',
      activityOptions: {
        sedentary: 'Sedentary (little or no exercise)',
        light: 'Lightly Active (1-3 days/week)',
        moderate: 'Moderately Active (3-5 days/week)',
        very: 'Very Active (6-7 days/week)',
        extra: 'Extra Active (hard training 2x/day)',
      },
      mainGoal: 'Main goal',
      mainGoalHelp: 'Choose the direction of your protocol.',
      lose: 'LOSE',
      maintain: 'MAINTAIN',
      gain: 'GAIN',
      priority: 'Your priority',
      priorityHelp: 'Which result matters most to you right now?',
      localizedFatNote: 'The protocol supports total body fat reduction; spot fat loss is not possible.',
      calculateFor: (goal, focus) => `CALCULATE FOR ${goal} ${focus}`,
      choosePriority: 'CHOOSE YOUR PRIORITY',
      waitingTitle: 'Waiting for Parameters',
      waitingText: 'Fill in your biometric information to generate your nutrition protocol.',
      estimatedDailyGoal: 'ESTIMATED DAILY GOAL',
      bmr: 'BMR',
      tdee: 'TDEE',
      proteins: 'Proteins',
      carbs: 'Carbohydrates',
      fats: 'Fats',
      protocolAnalysis: 'Protocol Analysis',
      goalFocusOptions: {
        lose: [
          { value: 'body_fat', label: 'Body fat' },
          { value: 'body_weight', label: 'Body weight' },
          { value: 'waist_measurements', label: 'Waist measurements' },
          { value: 'muscle_definition', label: 'Muscle definition' },
          { value: 'not_sure', label: 'Not sure' },
        ],
        maintain: [
          { value: 'muscle_mass', label: 'Muscle mass' },
          { value: 'body_weight', label: 'Body weight' },
          { value: 'body_fat_percentage', label: 'Body fat percentage' },
          { value: 'health_wellbeing', label: 'Health and wellbeing' },
          { value: 'not_sure', label: 'Not sure' },
        ],
        gain: [
          { value: 'muscle_mass', label: 'Muscle mass' },
          { value: 'body_weight', label: 'Body weight' },
          { value: 'strength_performance', label: 'Strength and performance' },
          { value: 'body_composition', label: 'Body composition' },
          { value: 'not_sure', label: 'Not sure' },
        ],
      },
    },
  },
  es: {
    nav: {
      home: 'Inicio',
      workouts: 'Entrenos',
      nutrition: 'Dieta',
      progress: 'Progreso',
      social: 'Social',
      shop: 'Tienda',
      affiliates: 'Afiliados',
      settings: 'Ajustes',
      admin: 'Admin',
      plans: 'Planes',
      logout: 'Salir',
      more: 'Más',
      close: 'Cerrar',
    },
    drawer: {
      title: 'Más opciones',
      subtitle: 'Accesos secundarios y configuración',
      socialDesc: 'Feed y comunidad',
      shopDesc: 'Suplementos y accesorios',
      affiliatesDesc: 'Comisiones y enlaces',
      settingsDesc: 'Cuenta y preferencias',
      adminDesc: 'Panel de administrador',
    },
    actions: {
      enableLight: 'Activar modo claro',
      enableDark: 'Activar modo oscuro',
      language: 'Seleccionar idioma',
    },
    dashboard: {
      upgradeTitle: 'Desbloquea tu Máximo Potencial',
      upgradeText: 'Suscríbete al plan PRO o ELITE y accede a entrenos con IA y dietas personalizadas.',
      viewPlans: 'Ver Planes',
      startProtocol: 'Comenzar Protocolo',
      day: 'Día',
      member: 'MEMBER',
      adminMode: 'ADMIN MODE',
      greeting: 'BUEN TRABAJO',
      weeklyQuote: '"La disciplina es el puente entre metas y resultados."',
      weeklyProgress: (percent, count, target) => `Ya completaste ${percent}% de tu meta semanal (${count}/${target} entrenos).`,
      startTodayWorkout: 'INICIAR ENTRENO DE HOY',
      weeklyGoal: 'Meta Semanal',
      weeklyWorkoutsTitle: 'Tus entrenos de la semana',
      weeklyWorkoutsSubtitle: 'Tu rutina organizada para abrir y empezar sin buscar.',
      organize: 'Organizar',
      today: 'Hoy',
      exercises: 'ejercicios',
      openWorkout: 'Abrir entreno',
      startNow: 'Comenzar ahora',
      unmarkDone: 'Desmarcar entreno completado',
      markDone: 'Marcar entreno como completado',
      restDay: 'Día de descanso',
      restDayText: 'Recupera el cuerpo y mantén tu rutina.',
      rest: 'Descanso',
      noWorkout: 'Sin entreno',
      organizeWeek: 'Organizar semana',
      buildWeek: 'Arma tu semana',
      buildWeekText: 'Elige tus entrenos una vez y encuentra cada día listo aquí en la pantalla inicial.',
      chooseWorkouts: 'Elegir entrenos',
      currentWeight: 'Peso Actual',
      updateWeight: 'Actualizar peso',
      nextWorkout: 'Próximo Entreno',
      dailyCalories: 'Calorías Diarias',
      calorieDeficitGoal: 'Meta en déficit calórico',
      calorieGoal: goal => `Meta: ${goal} kcal`,
      viewNutrition: 'Ver nutrición',
      energyLevel: 'Nivel de Energía',
      checkInToday: 'check-in de hoy',
      checkInPrompt: 'Toca para hacer tu check-in',
      editCheckIn: 'Editar check-in',
      doCheckIn: 'Hacer check-in',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
      notProvided: 'No informado',
      weekCalories: 'Calorías de la semana',
      dailyGoal: goal => `Meta: ${goal} kcal/día`,
      logMealsForChart: 'Registra tus comidas para ver el gráfico',
      weeklyAverage: 'Promedio semanal',
      bestDay: 'Mejor día',
      nutrition: 'Nutrición',
      viewAll: 'Ver Todo',
      calories: 'Calorías',
      proteinShort: 'Prot',
      carbsShort: 'Carb',
      fatShort: 'Grasa',
      nextMeal: 'Próxima Comida',
      logMeals: 'Registra comidas',
      nutritionModule: 'en el módulo de Nutrición',
      previousWeightDelta: delta => `${delta} kg desde el registro anterior`,
      weightRegisteredAt: date => `Registrado el ${date}`,
      weightEmpty: 'Registra tu peso y sigue tu evolución',
      sleepCheckIn: hours => `${hours}h de sueño • check-in de hoy`,
    },
    workouts: {
      title: 'Mis Entrenos',
      subtitle: (place, goal) => `Protocolos de entrenamiento personalizados para ${place.toLowerCase()} y objetivo: ${goal}.`,
      fallbackGoal: 'evolución',
      points: 'Puntos',
      phaseGoal: limit => `Fase 1: ${limit} pts`,
      pointsGoal: limit => `Meta ${limit} pts`,
      continueEvolution: 'Continuar evolución',
      homeActive: 'Entreno en casa activado',
      homeActiveText: goal => `Sesiones prácticas para el objetivo ${goal}, con progresión segura y rutina adaptada a tu espacio.`,
      train: 'Entrenar',
      mobility: 'Movilidad',
      stretch: 'Estirar',
      weeklyTitle: 'Entrenos de la Semana',
      weeklySimpleText: 'Arma una rutina simple con tus entrenos favoritos.',
      weeklyAdvancedText: 'Organiza tu semana sin perder acceso a los protocolos avanzados.',
      repeat: 'Repetir',
      clear: 'Limpiar',
      open: 'Abrir',
      done: 'Hecho',
      markDone: 'Marcar hecho',
      removeWeekly: 'Eliminar entreno de la semana',
      emptyWeekly: 'Agrega entrenos desde las tarjetas de abajo para armar tu semana.',
      favorites: 'Favoritos',
      freeWeeklyLimit: limit => `Free libera ${limit} entrenos por semana. Pro libera 5 y Elite libera la rutina completa.`,
      upgrade: 'Mejorar plan',
      protocol: 'Protocolo',
      workouts: 'Entrenos',
      loadLog: 'Registro',
      history: 'Historial',
      ranking: 'Ranking',
      athleteSheet: 'Planilla Atleta',
      earlyAccess: 'Acceso Anticipado',
      muscleGroup: 'Grupo Muscular',
      all: 'Todos',
      mobilityRoutines: 'Rutinas de movilidad',
      stretchingRoutines: 'Rutinas de estiramiento',
      emptyTitle: 'No se encontró ningún entreno',
      emptyText: 'Intenta ajustar tus filtros para encontrar otros protocolos.',
    },
    nutrition: {
      title: 'Nutrición & Dieta',
      subtitle: 'Optimiza tu rendimiento con protocolos nutricionales basados en ciencia y adaptados a tu metabolismo.',
      editPreferences: 'Editar Preferencias',
      mealsPerDay: count => `${count} comidas/día`,
      metabolicCalculator: 'Calculadora Metabólica',
      beginnerModule: 'MÓDULO INICIANTE',
      weight: 'Peso (kg)',
      height: 'Altura (cm)',
      age: 'Edad',
      gender: 'Sexo',
      male: 'Masculino',
      female: 'Femenino',
      activityLevel: 'Nivel de Actividad',
      activityOptions: {
        sedentary: 'Sedentario (poco o ningún ejercicio)',
        light: 'Ligeramente Activo (1-3 días/semana)',
        moderate: 'Moderadamente Activo (3-5 días/semana)',
        very: 'Muy Activo (6-7 días/semana)',
        extra: 'Extra Activo (entreno fuerte 2x/día)',
      },
      mainGoal: 'Objetivo principal',
      mainGoalHelp: 'Elige la dirección de tu protocolo.',
      lose: 'PERDER',
      maintain: 'MANTENER',
      gain: 'GANAR',
      priority: 'Tu prioridad',
      priorityHelp: '¿Qué resultado es más importante para ti ahora?',
      localizedFatNote: 'El protocolo favorece la reducción de grasa corporal total; no existe pérdida localizada de grasa.',
      calculateFor: (goal, focus) => `CALCULAR PARA ${goal} ${focus}`,
      choosePriority: 'ELIGE TU PRIORIDAD',
      waitingTitle: 'Esperando Parámetros',
      waitingText: 'Completa tu información biométrica para generar tu protocolo nutricional.',
      estimatedDailyGoal: 'META DIARIA ESTIMADA',
      bmr: 'TMB',
      tdee: 'GET',
      proteins: 'Proteínas',
      carbs: 'Carbohidratos',
      fats: 'Grasas',
      protocolAnalysis: 'Análisis del Protocolo',
      goalFocusOptions: {
        lose: [
          { value: 'body_fat', label: 'Grasa corporal' },
          { value: 'body_weight', label: 'Peso corporal' },
          { value: 'waist_measurements', label: 'Medidas abdominales' },
          { value: 'muscle_definition', label: 'Definición muscular' },
          { value: 'not_sure', label: 'No estoy seguro' },
        ],
        maintain: [
          { value: 'muscle_mass', label: 'Masa muscular' },
          { value: 'body_weight', label: 'Peso corporal' },
          { value: 'body_fat_percentage', label: 'Porcentaje de grasa' },
          { value: 'health_wellbeing', label: 'Salud y bienestar' },
          { value: 'not_sure', label: 'No estoy seguro' },
        ],
        gain: [
          { value: 'muscle_mass', label: 'Masa muscular' },
          { value: 'body_weight', label: 'Peso corporal' },
          { value: 'strength_performance', label: 'Fuerza y rendimiento' },
          { value: 'body_composition', label: 'Composición corporal' },
          { value: 'not_sure', label: 'No estoy seguro' },
        ],
      },
    },
  },
};

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('ironshape_theme');
  return saved === 'light' || saved === 'dark' ? saved : 'dark';
}

function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'pt-BR';
  const saved = localStorage.getItem('ironshape_language');
  if (saved === 'pt-BR' || saved === 'en' || saved === 'es') return saved;
  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith('en')) return 'en';
  if (browserLanguage.startsWith('es')) return 'es';
  return 'pt-BR';
}

function isAuthNavigationUrl() {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return window.location.pathname === '/auth/callback'
    || AUTH_NAVIGATION_KEYS.some(key => search.has(key) || hash.has(key));
}

async function getAuthenticatedJsonHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

function buildExercise(
  id: string,
  name: string,
  muscleGroup: MuscleGroup,
  series: number,
  reps: string,
  restTime: string,
  description: string,
  limitation?: string
): Exercise {
  const hasLimitation = !!limitation && limitation !== 'Nenhuma';
  return {
    id,
    name,
    muscleGroup,
    series,
    reps,
    restTime,
    description,
    instructions: [
      'Faça um aquecimento leve antes de começar.',
      `Execute ${name.toLowerCase()} devagar, respirando normalmente e usando apenas uma amplitude confortável.`,
      hasLimitation ? `Respeite a limitação marcada: ${limitation}. Pare se sentir dor.` : 'Mantenha postura firme e amplitude confortável.',
    ],
    proTips: [
      hasLimitation
        ? 'Priorize controle e conforto articular antes de aumentar repetições.'
        : 'Use uma cadeira ou parede como apoio sempre que precisar de mais estabilidade.',
      'Garrafas com água podem servir como carga leve. Comece sem peso se estiver aprendendo o movimento.',
    ],
    commonErrors: [
      'Apressar o movimento e perder alinhamento do corpo.',
      'Continuar mesmo sentindo dor, tontura ou falta de ar fora do normal.',
    ],
  };
}

type HomeWorkoutTemplate = {
  name: string;
  exercises: string[];
};

const HOME_PRO_WORKOUTS: Record<MuscleGroup, HomeWorkoutTemplate[]> = {
  Peito: [
    { name: 'Peito com Apoio', exercises: ['Flexão na parede', 'Pressão das mãos', 'Abertura dos braços'] },
    { name: 'Peito na Cadeira', exercises: ['Flexão inclinada na cadeira', 'Pressão com garrafas', 'Flexão curta com apoio'] },
    { name: 'Peito no Chão', exercises: ['Supino no chão com garrafas', 'Crucifixo no chão', 'Pressão das mãos deitado'] },
  ],
  Costas: [
    { name: 'Costas e Postura', exercises: ['Remada com toalha', 'Retração dos ombros', 'Braços em W'] },
    { name: 'Costas com Garrafas', exercises: ['Remada curvada com garrafas', 'Remada unilateral apoiada', 'Abertura inversa'] },
    { name: 'Costas sem Equipamento', exercises: ['Puxada isométrica com toalha', 'Superman alternado', 'Deslizamento na parede'] },
  ],
  Pernas: [
    { name: 'Pernas com Cadeira', exercises: ['Sentar e levantar da cadeira', 'Extensão de joelho sentado', 'Elevação de panturrilha com apoio'] },
    { name: 'Pernas e Glúteos', exercises: ['Agachamento com apoio', 'Elevação pélvica no chão', 'Abertura lateral da perna'] },
    { name: 'Pernas com Equilíbrio', exercises: ['Marcha parada com apoio', 'Passo para trás com apoio', 'Panturrilha apoiada'] },
  ],
  Ombros: [
    { name: 'Ombros Leves', exercises: ['Elevação frontal sem carga', 'Elevação lateral sem carga', 'Círculos com os braços'] },
    { name: 'Ombros com Garrafas', exercises: ['Desenvolvimento sentado com garrafas', 'Elevação lateral com garrafas', 'Abertura inversa apoiada'] },
    { name: 'Ombros e Mobilidade', exercises: ['Deslizamento na parede', 'Braços em Y', 'Retração dos ombros'] },
  ],
  Braços: [
    { name: 'Bíceps em Casa', exercises: ['Rosca com garrafas', 'Rosca martelo com garrafas', 'Contração de bíceps com toalha'] },
    { name: 'Tríceps em Casa', exercises: ['Extensão acima da cabeça', 'Tríceps para trás', 'Pressão de tríceps na parede'] },
    { name: 'Braços Completos', exercises: ['Rosca alternada', 'Extensão de tríceps sentado', 'Aperto de toalha'] },
  ],
  Abdômen: [
    { name: 'Abdômen na Cadeira', exercises: ['Elevação alternada dos joelhos', 'Inclinação lateral sentada', 'Contração abdominal sentada'] },
    { name: 'Abdômen no Chão', exercises: ['Inseto morto', 'Elevação pélvica no chão', 'Toque alternado nos calcanhares'] },
    { name: 'Abdômen com Apoio', exercises: ['Prancha na parede', 'Marcha com abdômen contraído', 'Rotação de tronco sentada'] },
  ],
  'Full Body': [
    { name: 'Corpo Inteiro com Cadeira', exercises: ['Sentar e levantar da cadeira', 'Flexão na parede', 'Marcha parada com apoio'] },
    { name: 'Corpo Inteiro sem Impacto', exercises: ['Agachamento apoiado', 'Remada com toalha', 'Joelhos alternados em pé'] },
    { name: 'Movimento Completo', exercises: ['Elevação de panturrilha', 'Pressão com garrafas', 'Elevação pélvica no chão'] },
  ],
};

const HOME_ELITE_WORKOUTS: Record<MuscleGroup, HomeWorkoutTemplate[]> = {
  Peito: [
    { name: 'Peito com Ritmo', exercises: ['Flexão inclinada lenta', 'Pressão das mãos', 'Supino com garrafas', 'Crucifixo no chão'] },
    { name: 'Peito com Pausa', exercises: ['Flexão na parede com pausa', 'Supino no chão', 'Abertura dos braços', 'Pressão isométrica das mãos'] },
    { name: 'Peito e Tríceps', exercises: ['Flexão inclinada', 'Supino fechado com garrafas', 'Extensão de tríceps sentado', 'Pressão das mãos'] },
    { name: 'Peito Completo', exercises: ['Flexão adaptada', 'Supino alternado com garrafas', 'Crucifixo no chão', 'Flexão na parede'] },
  ],
  Costas: [
    { name: 'Costas Fortes', exercises: ['Remada com garrafas', 'Remada unilateral apoiada', 'Braços em W', 'Retração dos ombros'] },
    { name: 'Costas e Postura', exercises: ['Remada com toalha', 'Deslizamento na parede', 'Abertura inversa', 'Superman alternado'] },
    { name: 'Costas com Controle', exercises: ['Remada lenta com garrafas', 'Puxada isométrica com toalha', 'Elevação alternada dos braços', 'Retração escapular'] },
    { name: 'Costas Completas', exercises: ['Remada unilateral', 'Abertura inversa apoiada', 'Braços em Y', 'Puxada de toalha'] },
  ],
  Pernas: [
    { name: 'Pernas Fortes', exercises: ['Sentar e levantar lentamente', 'Elevação pélvica', 'Extensão de joelho sentado', 'Elevação de panturrilha'] },
    { name: 'Pernas e Glúteos', exercises: ['Agachamento apoiado', 'Passo para trás com apoio', 'Abertura lateral da perna', 'Elevação pélvica'] },
    { name: 'Pernas com Controle', exercises: ['Agachamento com pausa', 'Flexão de joelho em pé', 'Marcha lenta com apoio', 'Elevação de panturrilha'] },
    { name: 'Pernas Completas', exercises: ['Sentar e levantar', 'Elevação lateral da perna', 'Extensão de quadril em pé', 'Panturrilha unilateral apoiada'] },
  ],
  Ombros: [
    { name: 'Ombros Fortes', exercises: ['Desenvolvimento sentado', 'Elevação frontal', 'Elevação lateral', 'Abertura inversa'] },
    { name: 'Ombros e Postura', exercises: ['Deslizamento na parede', 'Braços em Y', 'Braços em W', 'Retração escapular'] },
    { name: 'Ombros com Controle', exercises: ['Elevação lateral lenta', 'Desenvolvimento com garrafas', 'Círculos com os braços', 'Rotação externa sem carga'] },
    { name: 'Ombros Completos', exercises: ['Elevação frontal alternada', 'Elevação lateral', 'Abertura inversa apoiada', 'Pressão acima da cabeça'] },
  ],
  Braços: [
    { name: 'Bíceps Completo', exercises: ['Rosca direta com garrafas', 'Rosca alternada', 'Rosca martelo', 'Contração com toalha'] },
    { name: 'Tríceps Completo', exercises: ['Extensão acima da cabeça', 'Tríceps para trás', 'Supino fechado no chão', 'Pressão na parede'] },
    { name: 'Braços Alternados', exercises: ['Rosca com garrafas', 'Extensão de tríceps', 'Rosca martelo', 'Aperto de toalha'] },
    { name: 'Braços com Controle', exercises: ['Rosca lenta', 'Tríceps com pausa', 'Rosca sentada', 'Extensão unilateral'] },
  ],
  Abdômen: [
    { name: 'Centro do Corpo', exercises: ['Inseto morto', 'Prancha na parede', 'Elevação pélvica', 'Contração abdominal'] },
    { name: 'Abdômen Sentado', exercises: ['Joelhos alternados sentado', 'Inclinação lateral sentada', 'Rotação controlada', 'Contração com respiração'] },
    { name: 'Abdômen no Chão', exercises: ['Toque nos calcanhares', 'Inseto morto alternado', 'Elevação pélvica', 'Braços e pernas alternados'] },
    { name: 'Estabilidade do Corpo', exercises: ['Prancha inclinada', 'Marcha parada', 'Equilíbrio com apoio', 'Pressão das mãos nos joelhos'] },
  ],
  'Full Body': [
    { name: 'Corpo Inteiro Forte', exercises: ['Sentar e levantar', 'Flexão inclinada', 'Remada com garrafas', 'Marcha parada'] },
    { name: 'Corpo Inteiro com Cadeira', exercises: ['Agachamento apoiado', 'Desenvolvimento sentado', 'Extensão de joelhos', 'Retração dos ombros'] },
    { name: 'Corpo Inteiro com Garrafas', exercises: ['Remada com garrafas', 'Supino no chão', 'Agachamento apoiado', 'Rosca alternada'] },
    { name: 'Corpo Inteiro e Equilíbrio', exercises: ['Marcha com apoio', 'Passo para trás', 'Flexão na parede', 'Elevação de panturrilha'] },
  ],
};

function buildHomeWorkouts(
  profile: UserProfile,
  onboarding: any,
  plan: Plan,
  level: Level
): Workout[] {
  const goalLabel = profile.goal || 'melhorar a saúde';
  const limitation = onboarding?.limitations || 'Nenhuma';
  const series = level === 'Avançado' ? 4 : level === 'Intermediário' ? 3 : 2;
  const duration = level === 'Avançado' ? '45 min' : level === 'Intermediário' ? '35 min' : '25 min';
  const carga: Workout['carga'] = level === 'Iniciante' ? 'Baixa' : 'Média';
  const reps = level === 'Avançado' ? '12-15 reps' : level === 'Intermediário' ? '10-12 reps' : '8-10 reps';
  const rest = level === 'Avançado' ? '40s' : '60s';
  const planRequired = plan === 'free' ? 'Iniciante' : plan;
  const groups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Full Body'];
  const beginnerTemplates: Record<MuscleGroup, HomeWorkoutTemplate[]> = Object.fromEntries(
    groups.map(group => [group, HOME_PRO_WORKOUTS[group].slice(0, 1)])
  ) as Record<MuscleGroup, HomeWorkoutTemplate[]>;
  const templates = plan === 'Elite' || plan === 'Admin'
    ? HOME_ELITE_WORKOUTS
    : plan === 'Pro'
      ? HOME_PRO_WORKOUTS
      : beginnerTemplates;

  return groups.flatMap(group => templates[group].map((template, workoutIndex) => ({
    id: `home-${slugifyText(plan)}-${slugifyText(group)}-${workoutIndex + 1}`,
    name: template.name,
    description: `${template.name} para ${goalLabel.toLowerCase()}: treino em casa, sem impacto e com movimentos simples. Ajuste a amplitude, use apoio e pare se sentir dor.`,
    muscleGroup: group,
    level,
    duration,
    carga,
    exercises: template.exercises.map((exerciseName, exerciseIndex) => buildExercise(
      `home-${slugifyText(plan)}-${slugifyText(group)}-${workoutIndex + 1}-${exerciseIndex + 1}`,
      exerciseName,
      group,
      series,
      reps,
      rest,
      `Movimento doméstico de baixo impacto para trabalhar ${group.toLowerCase()} com controle e segurança.`,
      limitation
    )),
    planRequired,
    authorUid: `home-${slugifyText(plan)}-${workoutIndex}`,
  })));
}

type HomeTrainingMode = 'training' | 'mobility' | 'stretching';

function buildHomeRecoveryWorkouts(
  onboarding: any,
  plan: Plan,
  level: Level,
  mode: Exclude<HomeTrainingMode, 'training'>
): Workout[] {
  const limitation = onboarding?.limitations || 'Nenhuma';
  const planRequired = plan === 'free' ? 'Iniciante' : plan;
  const recoveryExercise = (
    id: string,
    name: string,
    reps: string,
    description: string
  ) => buildExercise(id, name, 'Full Body', 1, reps, '15s', description, limitation);

  if (mode === 'mobility') {
    const mobilityWorkouts: Workout[] = [
      {
        id: 'home-mobility-morning',
        name: 'Despertar do Corpo',
        description: 'Sequência curta para começar o dia com menos rigidez e mais disposição.',
        muscleGroup: 'Full Body',
        level,
        duration: '6 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-neck', 'Mobilidade cervical suave', '40s', 'Movimente o pescoço sem pressa e sem forçar a amplitude.'),
          recoveryExercise('mob-shoulders', 'Círculos de ombros', '45s', 'Aquece ombros e parte superior das costas.'),
          recoveryExercise('mob-cat-cow', 'Mobilidade de coluna em quatro apoios', '60s', 'Alterna flexão e extensão confortável da coluna.'),
          recoveryExercise('mob-hips', 'Círculos de quadril em pé', '45s', 'Libera quadril e prepara o corpo para caminhar ou treinar.'),
        ],
        planRequired,
        authorUid: 'home-mobility',
      },
      {
        id: 'home-mobility-training',
        name: 'Preparação para Treinar',
        description: 'Aquecimento articular completo antes do treino em casa.',
        muscleGroup: 'Full Body',
        level,
        duration: '10 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-ankle', 'Mobilidade de tornozelo na parede', '45s por lado', 'Melhora conforto no agachamento e em movimentos de pernas.'),
          recoveryExercise('mob-hip-flexor', 'Mobilidade dinâmica de quadril', '45s por lado', 'Prepara quadril e glúteos para exercícios de pernas.'),
          recoveryExercise('mob-thoracic', 'Rotação torácica em quatro apoios', '45s por lado', 'Ativa a região média das costas e melhora postura.'),
          recoveryExercise('mob-wall-slide', 'Wall slide', '10 reps', 'Prepara ombros e escápulas para empurrar e puxar.'),
          recoveryExercise('mob-squat', 'Agachamento assistido com pausa', '8 reps', 'Ensina amplitude confortável antes do treino principal.'),
        ],
        planRequired,
        authorUid: 'home-mobility',
      },
      {
        id: 'home-mobility-posture',
        name: 'Postura e Ombros',
        description: 'Movimentos leves para quem passa muito tempo sentado.',
        muscleGroup: 'Full Body',
        level,
        duration: '8 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-chin', 'Retração cervical na parede', '10 reps', 'Ajuda a alinhar cabeça e pescoço.'),
          recoveryExercise('mob-scapula', 'Retração escapular em pé', '12 reps', 'Ativa musculatura postural das costas.'),
          recoveryExercise('mob-wall-slide-posture', 'Wall slide', '10 reps', 'Trabalha mobilidade de ombros com controle.'),
          recoveryExercise('mob-thoracic-standing', 'Rotação torácica em pé', '45s por lado', 'Reduz rigidez da parte superior das costas.'),
        ],
        planRequired,
        authorUid: 'home-mobility',
      },
      {
        id: 'home-mobility-low-impact',
        name: 'Quadril e Lombar Leve',
        description: 'Rotina de baixo impacto com amplitudes confortáveis e controle respiratório.',
        muscleGroup: 'Full Body',
        level,
        duration: '9 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-breath', 'Respiração diafragmática deitado', '60s', 'Reduz tensão antes de movimentar a lombar.'),
          recoveryExercise('mob-pelvis', 'Inclinação pélvica deitado', '12 reps', 'Mobiliza a pelve com movimento pequeno e controlado.'),
          recoveryExercise('mob-knee-hug', 'Joelho ao peito alternado', '45s', 'Alivia rigidez de quadril e lombar sem impacto.'),
          recoveryExercise('mob-bridge', 'Elevação pélvica curta', '10 reps', 'Ativa glúteos para apoiar melhor a lombar.'),
        ],
        planRequired,
        authorUid: 'home-mobility',
      },
      {
        id: 'home-mobility-full-body',
        name: 'Mobilidade do Corpo Inteiro',
        description: 'Movimentos simples para despertar as articulações e movimentar o corpo sem impacto.',
        muscleGroup: 'Full Body',
        level,
        duration: '10 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-full-march', 'Marcha leve no lugar', '60s', 'Caminhe sem sair do lugar e use uma cadeira como apoio se precisar.'),
          recoveryExercise('mob-full-shoulders', 'Círculos de ombros', '40s', 'Faça círculos pequenos e confortáveis para frente e para trás.'),
          recoveryExercise('mob-full-trunk', 'Rotação suave do tronco', '40s', 'Gire o tronco sem movimentar rápido ou forçar a lombar.'),
          recoveryExercise('mob-full-hips', 'Mobilidade de quadril com apoio', '40s por lado', 'Segure em uma cadeira e movimente o quadril com controle.'),
          recoveryExercise('mob-full-ankles', 'Mobilidade de tornozelos', '40s por lado', 'Movimente cada tornozelo em uma amplitude confortável.'),
        ],
        planRequired,
        authorUid: 'home-mobility-pro',
      },
      {
        id: 'home-mobility-knees-ankles',
        name: 'Joelhos e Tornozelos',
        description: 'Rotina sentada e com apoio para melhorar o movimento das pernas com segurança.',
        muscleGroup: 'Full Body',
        level,
        duration: '9 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-knee-extension', 'Extensão de joelho sentado', '10 reps por lado', 'Estenda uma perna por vez sem travar o joelho.'),
          recoveryExercise('mob-knee-flexion', 'Flexão leve de joelho com apoio', '10 reps por lado', 'Dobre o joelho levando o calcanhar para trás com apoio firme.'),
          recoveryExercise('mob-heel-raise', 'Elevação dos calcanhares', '12 reps', 'Suba e desça os calcanhares devagar usando apoio.'),
          recoveryExercise('mob-toe-raise', 'Elevação das pontas dos pés', '12 reps', 'Mantenha os calcanhares no chão e levante a parte da frente dos pés.'),
          recoveryExercise('mob-ankle-circle', 'Círculos de tornozelo sentado', '8 por lado', 'Desenhe círculos lentos com cada pé.'),
        ],
        planRequired,
        authorUid: 'home-mobility-pro',
      },
      {
        id: 'home-mobility-balance',
        name: 'Mobilidade e Equilíbrio',
        description: 'Movimentos assistidos para coordenação, estabilidade e confiança no dia a dia.',
        muscleGroup: 'Full Body',
        level,
        duration: '12 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-balance-march', 'Marcha lenta com apoio', '60s', 'Segure em uma cadeira e eleve um pé de cada vez.'),
          recoveryExercise('mob-balance-one-leg', 'Apoio em um pé assistido', '20s por lado', 'Retire um pé do chão mantendo as mãos próximas do apoio.'),
          recoveryExercise('mob-balance-side-step', 'Passo lateral controlado', '8 por lado', 'Dê passos curtos para o lado mantendo o tronco firme.'),
          recoveryExercise('mob-balance-knee', 'Elevação alternada dos joelhos', '10 por lado', 'Eleve os joelhos somente até uma altura confortável.'),
          recoveryExercise('mob-balance-weight', 'Transferência de peso entre as pernas', '12 reps', 'Leve o peso de uma perna para a outra sem tirar os pés do chão.'),
        ],
        planRequired,
        authorUid: 'home-mobility-elite',
      },
      {
        id: 'home-mobility-spine-hips',
        name: 'Coluna e Quadril',
        description: 'Sequência controlada para reduzir rigidez e melhorar movimentos do tronco e do quadril.',
        muscleGroup: 'Full Body',
        level,
        duration: '12 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-spine-pelvis', 'Inclinação pélvica deitado', '12 reps', 'Movimente a pelve lentamente mantendo os ombros relaxados.'),
          recoveryExercise('mob-spine-knees', 'Rotação de joelhos deitado', '8 por lado', 'Leve os joelhos juntos para cada lado sem forçar.'),
          recoveryExercise('mob-spine-bridge', 'Elevação pélvica curta', '10 reps', 'Eleve o quadril apenas até uma altura confortável.'),
          recoveryExercise('mob-spine-thoracic', 'Rotação torácica em quatro apoios', '8 por lado', 'Gire a parte superior das costas com o quadril estável.'),
          recoveryExercise('mob-spine-hip-seated', 'Mobilidade de quadril sentado', '10 reps', 'Abra e feche os joelhos de forma leve e controlada.'),
        ],
        planRequired,
        authorUid: 'home-mobility-elite',
      },
      {
        id: 'home-mobility-free-arms',
        name: 'Ombros e Braços Livres',
        description: 'Rotina leve para movimentar braços, ombros e escápulas sem precisar de equipamentos.',
        muscleGroup: 'Full Body',
        level,
        duration: '10 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-arms-circles', 'Círculos pequenos com os braços', '40s', 'Mantenha os braços confortáveis e faça círculos pequenos.'),
          recoveryExercise('mob-arms-alternate', 'Elevação alternada dos braços', '10 por lado', 'Eleve um braço de cada vez sem arquear a lombar.'),
          recoveryExercise('mob-arms-wall', 'Deslizamento na parede', '10 reps', 'Deslize os braços mantendo contato confortável com a parede.'),
          recoveryExercise('mob-arms-external', 'Rotação externa dos ombros', '12 reps', 'Mantenha os cotovelos junto ao corpo e abra os antebraços.'),
          recoveryExercise('mob-arms-open', 'Abertura e fechamento dos braços', '12 reps', 'Abra o peito e depois aproxime os braços sem impulso.'),
        ],
        planRequired,
        authorUid: 'home-mobility-elite',
      },
      {
        id: 'home-mobility-active',
        name: 'Mobilidade Ativa Completa',
        description: 'Combinação de movimentos cotidianos para trabalhar o corpo inteiro com apoio e controle.',
        muscleGroup: 'Full Body',
        level,
        duration: '14 min',
        carga: 'Baixa',
        exercises: [
          recoveryExercise('mob-active-chair', 'Sentar e levantar com controle', '10 reps', 'Use uma cadeira firme e ajude com as mãos se necessário.'),
          recoveryExercise('mob-active-squat', 'Agachamento curto com apoio', '10 reps', 'Desça somente até onde conseguir manter conforto e equilíbrio.'),
          recoveryExercise('mob-active-step', 'Passo para trás assistido', '8 por lado', 'Dê um passo curto para trás segurando em um apoio.'),
          recoveryExercise('mob-active-trunk', 'Rotação suave do tronco', '8 por lado', 'Gire lentamente mantendo os pés firmes no chão.'),
          recoveryExercise('mob-active-reach', 'Alcance alternado acima da cabeça', '10 por lado', 'Alcance para cima sem elevar os ombros ou sentir dor.'),
        ],
        planRequired,
        authorUid: 'home-mobility-elite',
      },
    ];
    if (plan === 'Elite' || plan === 'Admin') {
      return [...mobilityWorkouts.slice(0, 4), ...mobilityWorkouts.slice(6, 10)];
    }
    return mobilityWorkouts.slice(0, plan === 'Pro' ? 6 : 4);
  }

  const stretchingWorkouts: Workout[] = [
    {
      id: 'home-stretch-post-workout',
      name: 'Pós-treino Corpo Inteiro',
      description: 'Alongamentos simples para desacelerar e iniciar a recuperação.',
      muscleGroup: 'Full Body',
      level,
      duration: '8 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-chest', 'Alongamento de peitoral na parede', '40s por lado', 'Abra o peito sem forçar o ombro.'),
        recoveryExercise('stretch-hamstring', 'Alongamento de posterior sentado', '45s por lado', 'Alongue a parte de trás das pernas com coluna confortável.'),
        recoveryExercise('stretch-quad', 'Alongamento de quadríceps em pé', '40s por lado', 'Mantenha os joelhos próximos e use apoio se necessário.'),
        recoveryExercise('stretch-back', 'Postura da criança', '60s', 'Relaxe costas, quadril e respiração.'),
      ],
      planRequired,
      authorUid: 'home-stretching',
    },
    {
      id: 'home-stretch-back',
      name: 'Lombar e Posterior',
      description: 'Rotina leve para reduzir rigidez depois de um dia sentado.',
      muscleGroup: 'Full Body',
      level,
      duration: '10 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-breath', 'Respiração diafragmática deitado', '60s', 'Respire lentamente antes de alongar.'),
        recoveryExercise('stretch-knee', 'Joelhos ao peito deitado', '45s', 'Relaxe a lombar com amplitude confortável.'),
        recoveryExercise('stretch-hamstring-lying', 'Alongamento de posterior deitado', '45s por lado', 'Use uma toalha se precisar manter a perna elevada.'),
        recoveryExercise('stretch-glute', 'Alongamento de glúteo deitado', '45s por lado', 'Evite pressionar demais o joelho.'),
        recoveryExercise('stretch-child', 'Postura da criança', '60s', 'Finalize com respiração tranquila.'),
      ],
      planRequired,
      authorUid: 'home-stretching',
    },
    {
      id: 'home-stretch-upper',
      name: 'Pescoço e Ombros',
      description: 'Pausa rápida para aliviar tensão da parte superior do corpo.',
      muscleGroup: 'Full Body',
      level,
      duration: '6 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-neck-side', 'Inclinação lateral suave do pescoço', '30s por lado', 'Não puxe a cabeça com força.'),
        recoveryExercise('stretch-shoulder', 'Alongamento de ombro cruzado', '40s por lado', 'Mantenha o ombro longe da orelha.'),
        recoveryExercise('stretch-triceps', 'Alongamento de tríceps acima da cabeça', '40s por lado', 'Evite arquear a lombar.'),
        recoveryExercise('stretch-chest-door', 'Abertura de peito na parede', '45s', 'Respire fundo e mantenha amplitude confortável.'),
      ],
      planRequired,
      authorUid: 'home-stretching',
    },
    {
      id: 'home-stretch-sleep',
      name: 'Relaxar antes de Dormir',
      description: 'Sequência tranquila para baixar o ritmo no fim do dia.',
      muscleGroup: 'Full Body',
      level,
      duration: '12 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-sleep-breath', 'Respiração lenta deitado', '90s', 'Alongue a expiração e relaxe os ombros.'),
        recoveryExercise('stretch-sleep-glute', 'Alongamento de glúteo deitado', '45s por lado', 'Mantenha a respiração constante.'),
        recoveryExercise('stretch-sleep-back', 'Rotação lombar deitado', '45s por lado', 'Faça um movimento leve e sem dor.'),
        recoveryExercise('stretch-sleep-child', 'Postura da criança', '60s', 'Finalize sem pressa.'),
      ],
      planRequired,
      authorUid: 'home-stretching',
    },
    {
      id: 'home-stretch-full-body',
      name: 'Alongamento do Corpo Inteiro',
      description: 'Sequência tranquila para alongar as principais regiões do corpo sem movimentos difíceis.',
      muscleGroup: 'Full Body',
      level,
      duration: '11 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-full-chest', 'Alongamento de peito na parede', '40s por lado', 'Gire o corpo devagar até sentir um alongamento leve no peito.'),
        recoveryExercise('stretch-full-side', 'Alongamento lateral do tronco', '35s por lado', 'Incline o tronco sem girar ou perder o equilíbrio.'),
        recoveryExercise('stretch-full-hamstring', 'Alongamento de posterior sentado', '40s por lado', 'Estenda uma perna e incline o tronco somente até onde for confortável.'),
        recoveryExercise('stretch-full-calf', 'Alongamento de panturrilha na parede', '40s por lado', 'Mantenha o calcanhar de trás apoiado no chão.'),
        recoveryExercise('stretch-full-breath', 'Respiração lenta', '60s', 'Inspire pelo nariz e solte o ar lentamente.'),
      ],
      planRequired,
      authorUid: 'home-stretching-pro',
    },
    {
      id: 'home-stretch-legs-hips',
      name: 'Pernas e Quadril',
      description: 'Alongamentos com apoio para aliviar a rigidez das pernas e do quadril.',
      muscleGroup: 'Full Body',
      level,
      duration: '12 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-legs-quad', 'Alongamento de quadríceps com apoio', '35s por lado', 'Segure em uma cadeira e aproxime o calcanhar sem puxar com força.'),
        recoveryExercise('stretch-legs-towel', 'Alongamento de posterior com toalha', '40s por lado', 'Use a toalha para sustentar a perna sem travar o joelho.'),
        recoveryExercise('stretch-legs-glute', 'Alongamento de glúteos sentado', '40s por lado', 'Cruze uma perna e incline o tronco suavemente.'),
        recoveryExercise('stretch-legs-calf', 'Alongamento de panturrilha', '40s por lado', 'Mantenha os pés apontados para frente e o calcanhar apoiado.'),
        recoveryExercise('stretch-legs-hip', 'Relaxamento do quadril deitado', '60s', 'Deixe os joelhos relaxarem em uma posição confortável.'),
      ],
      planRequired,
      authorUid: 'home-stretching-pro',
    },
    {
      id: 'home-stretch-posture',
      name: 'Alongamento e Postura',
      description: 'Pausa guiada para aliviar tensões e recuperar uma postura confortável.',
      muscleGroup: 'Full Body',
      level,
      duration: '10 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-posture-neck', 'Retração cervical suave', '10 reps', 'Leve o queixo para trás sem inclinar a cabeça.'),
        recoveryExercise('stretch-posture-chest', 'Abertura do peito na parede', '40s por lado', 'Abra o peito mantendo o ombro relaxado.'),
        recoveryExercise('stretch-posture-shoulder', 'Alongamento de ombro cruzado', '35s por lado', 'Aproxime o braço do peito sem pressionar a articulação.'),
        recoveryExercise('stretch-posture-side', 'Alongamento lateral sentado', '35s por lado', 'Mantenha os dois pés apoiados enquanto inclina o tronco.'),
        recoveryExercise('stretch-posture-breath', 'Respiração postural', '60s', 'Cresça a coluna ao inspirar e relaxe ao soltar o ar.'),
      ],
      planRequired,
      authorUid: 'home-stretching-elite',
    },
    {
      id: 'home-stretch-back-hips',
      name: 'Costas e Quadril',
      description: 'Alongamentos adaptáveis para relaxar costas, glúteos e quadril.',
      muscleGroup: 'Full Body',
      level,
      duration: '13 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-back-child', 'Postura da criança adaptada', '50s', 'Apoie os braços em uma cadeira se o chão não for confortável.'),
        recoveryExercise('stretch-back-knee', 'Joelho ao peito deitado', '40s por lado', 'Aproxime uma perna de cada vez sem pressionar o joelho.'),
        recoveryExercise('stretch-back-rotation', 'Rotação lombar suave', '40s por lado', 'Deixe os joelhos caírem juntos em uma amplitude pequena.'),
        recoveryExercise('stretch-back-glute', 'Alongamento de glúteos deitado', '40s por lado', 'Mantenha cabeça e ombros relaxados no chão.'),
        recoveryExercise('stretch-back-hip', 'Alongamento do quadril com apoio', '40s por lado', 'Use uma cadeira para manter equilíbrio e conforto.'),
      ],
      planRequired,
      authorUid: 'home-stretching-elite',
    },
    {
      id: 'home-stretch-leg-recovery',
      name: 'Recuperação das Pernas',
      description: 'Rotina leve para descansar pernas e tornozelos depois das atividades do dia.',
      muscleGroup: 'Full Body',
      level,
      duration: '12 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-recovery-quad', 'Alongamento de quadríceps apoiado', '35s por lado', 'Segure em um apoio e mantenha os joelhos próximos.'),
        recoveryExercise('stretch-recovery-hamstring', 'Alongamento de posterior sentado', '40s por lado', 'Incline o tronco sem curvar demais as costas.'),
        recoveryExercise('stretch-recovery-inner', 'Alongamento da parte interna das pernas', '45s', 'Afaste os pés apenas até sentir tensão leve.'),
        recoveryExercise('stretch-recovery-calf', 'Alongamento de panturrilha na parede', '40s por lado', 'Mantenha o pé de trás totalmente apoiado.'),
        recoveryExercise('stretch-recovery-ankle', 'Movimentação suave dos tornozelos', '40s por lado', 'Movimente os pés lentamente antes de finalizar.'),
      ],
      planRequired,
      authorUid: 'home-stretching-elite',
    },
    {
      id: 'home-stretch-complete-relaxation',
      name: 'Relaxamento Completo',
      description: 'Sequência calma para desacelerar, respirar e relaxar o corpo inteiro.',
      muscleGroup: 'Full Body',
      level,
      duration: '14 min',
      carga: 'Baixa',
      exercises: [
        recoveryExercise('stretch-relax-breath', 'Respiração diafragmática', '90s', 'Deixe o abdômen subir ao inspirar e relaxar ao expirar.'),
        recoveryExercise('stretch-relax-neck', 'Alongamento suave do pescoço', '30s por lado', 'Incline a cabeça sem usar as mãos para puxar.'),
        recoveryExercise('stretch-relax-arms', 'Abertura dos braços deitado', '50s', 'Abra os braços e relaxe os ombros no chão.'),
        recoveryExercise('stretch-relax-trunk', 'Rotação de tronco deitado', '40s por lado', 'Mova os joelhos juntos e mantenha os ombros apoiados.'),
        recoveryExercise('stretch-relax-full', 'Alongamento do corpo inteiro', '60s', 'Alongue braços e pernas sem prender a respiração.'),
      ],
      planRequired,
      authorUid: 'home-stretching-elite',
    },
  ];
  if (plan === 'Elite' || plan === 'Admin') {
    return [...stretchingWorkouts.slice(0, 4), ...stretchingWorkouts.slice(6, 10)];
  }
  return stretchingWorkouts.slice(0, plan === 'Pro' ? 6 : 4);
}

export default function App() {
  const { user, profile, loading, profileLoading, authError, initSession, signInWithGoogle, logout, isAdmin, simulatedPlan, setSimulatedPlan, updatePlan, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPricing, setShowPricing] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [initTimeout, setInitTimeout] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
  const [language, setLanguage] = useState<LanguageCode>(getInitialLanguage);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const authHistoryGuardedRef = useRef(false);
  const [ironShopAccess, setIronShopAccess] = useState<IronShopAccessState>({
    enabled: false,
    mode: 'blocked',
    hasAccess: false,
    reason: 'blocked',
    message: 'A IronShop está chegando!',
  });
  const [ironShopNotice, setIronShopNotice] = useState(false);
  const text = APP_TRANSLATIONS[language];

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
    localStorage.setItem('ironshape_theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('ironshape_language', language);
  }, [language]);

  useEffect(() => {
    return installUiAutoTranslate(language);
  }, [language, activeTab, showPricing, drawerOpen, ironShopNotice]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    trackEvent('app_screen_view', { screen_name: activeTab });
  }, [activeTab]);

  useEffect(() => {
    if (!user?.id) return;
    ironshopService.getAccess().then(setIronShopAccess);
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      authHistoryGuardedRef.current = false;
      return;
    }

    const keepUserInsideApp = () => {
      setShowPricing(false);
      setCheckoutPlan(null);
      setDrawerOpen(false);
      setActiveTab('dashboard');
      window.history.replaceState({ ironshapeScreen: 'dashboard' }, document.title, '/');
    };

    if (isAuthNavigationUrl()) {
      keepUserInsideApp();
    }

    if (!authHistoryGuardedRef.current) {
      window.history.replaceState({ ironshapeScreen: 'dashboard' }, document.title, '/');
      window.history.pushState({ ironshapeScreen: 'dashboard-safe-back' }, document.title, '/');
      authHistoryGuardedRef.current = true;
    }

    const onPopState = () => {
      keepUserInsideApp();
      window.history.pushState({ ironshapeScreen: 'dashboard-safe-back' }, document.title, '/');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [user]);

  const effectivePlan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null);

  const openPricing = (source: string, plan?: Plan | null) => {
    if (plan) setCheckoutPlan(plan);
    else setCheckoutPlan(null);
    trackEvent('click_upgrade', {
      source,
      plan: plan || 'not_selected',
      current_plan: effectivePlan,
    });
    setShowPricing(true);
  };

  const openIronShop = async () => {
    const latestAccess = await ironshopService.getAccess();
    setIronShopAccess(latestAccess);
    if (!latestAccess.hasAccess) {
      setIronShopNotice(true);
      trackEvent('ironshop_locked_click', {
        mode: latestAccess.mode,
        reason: latestAccess.reason,
      });
      return;
    }
    setDrawerOpen(false);
    setActiveTab('shop');
  };
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    // Last-resort escape hatch: if loading is still true after 5s, force past it
    const timer = setTimeout(() => {
      setInitTimeout(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('affiliate_ref', ref);
      // Track click asynchronously
      const trackClick = async () => {
        try {
          const { data } = await supabase
            .from('affiliates')
            .select('id')
            .eq('codigo_afiliado', ref)
            .single();
          
          if (data) {
            await supabase.from('affiliate_clicks').insert([{ affiliate_id: data.id }]);
          }
        } catch (e) {
          console.error('Error tracking referral:', e);
        }
      };
      trackClick();
    }
  }, []);

  // Simple routing for auth callback
  const isAuthCallback = window.location.pathname === '/auth/callback';

  if (isAuthCallback) {
    return <AuthCallback />;
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-white/5 shadow-2xl text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-red-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Configuração Necessária</h2>
          <p className="text-text-muted mb-8">
            As chaves do Supabase não foram encontradas. Se você estiver usando o Netlify, adicione as seguintes variáveis de ambiente nas configurações do site:
          </p>
          <div className="space-y-4 text-left mb-8">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <code className="text-xs text-primary">VITE_SUPABASE_URL</code>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <code className="text-xs text-primary">VITE_SUPABASE_ANON_KEY</code>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Após adicionar as variáveis, faça um novo deploy ou reinicie o servidor.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !initTimeout) {
    return <LoadingScreen onRetry={() => initSession()} />;
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 rounded-full bg-error/10 border border-error/20 mb-6">
          <AlertTriangle className="text-error" size={48} />
        </div>
        <h2 className="text-2xl font-black mb-2">Ops! Algo deu errado</h2>
        <p className="text-text-muted mb-8 max-w-xs mx-auto">
          {authError === 'Timeout na requisição' 
            ? 'A conexão com o servidor demorou muito. Verifique sua internet.' 
            : authError}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => initSession()}
            className="bg-primary text-text-primary px-8 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2 justify-center"
          >
            <RefreshCw size={20} />
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-white/5 text-text-primary px-8 py-4 rounded-2xl font-black border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 justify-center"
          >
            <RefreshCw size={20} />
            Recarregar Página
          </button>
        </div>
        <button 
          onClick={async () => {
            try {
              localStorage.clear();
              await logout();
              window.location.reload();
            } catch (e) {
              console.error('Error during logout:', e);
              window.location.reload();
            }
          }}
          className="mt-8 text-text-muted hover:text-error transition-colors text-sm font-bold flex items-center gap-2 mx-auto"
        >
          <LogOut size={16} />
          Limpar Cache e Sair
        </button>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLogin={signInWithGoogle} />;
  }

  // Profile is still being fetched from DB — show spinner instead of flashing onboarding
  if (!profile && profileLoading) {
    return <LoadingScreen onRetry={() => initSession()} />;
  }

  if (!profile || profile.age === 0) {
    return (
      <OnboardingView
        user={user}
        profile={profile}
        onComplete={(plan) => {
          if (plan !== 'Iniciante') {
            openPricing('onboarding', plan);
          }
        }}
      />
    );
  }

  if (showPricing) {
    return (
      <PricingView
        onBack={() => {
          setCheckoutPlan(null);
          setShowPricing(false);
        }}
        onUpgrade={updatePlan}
        currentPlan={effectivePlan}
        initialCheckoutPlan={checkoutPlan}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans selection:bg-primary/30">
      {isAdmin && (
        <PlanSimulator
          currentPlan={effectivePlan}
          onPlanChange={setSimulatedPlan}
        />
      )}
      <button
        type="button"
        aria-label={themeMode === 'dark' ? text.actions.enableLight : text.actions.enableDark}
        aria-pressed={themeMode === 'light'}
        onClick={() => setThemeMode(current => current === 'dark' ? 'light' : 'dark')}
        className="md:hidden fixed right-4 z-[55] w-11 h-11 rounded-2xl border border-white/10 bg-surface/90 text-text-primary shadow-xl shadow-black/10 backdrop-blur-xl flex items-center justify-center active:scale-95 transition-all"
        style={{ top: 'calc(12px + env(safe-area-inset-top))' }}
      >
        {themeMode === 'dark' ? <Sun size={20} className="text-primary" /> : <Moon size={20} className="text-primary" />}
      </button>
      <div
        className="md:hidden fixed right-[68px] z-[55]"
        style={{ top: 'calc(12px + env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          aria-label={text.actions.language}
          aria-expanded={languageMenuOpen}
          onClick={() => setLanguageMenuOpen(open => !open)}
          className="w-11 h-11 rounded-2xl border border-white/10 bg-surface/90 text-text-primary shadow-xl shadow-black/10 backdrop-blur-xl flex items-center justify-center active:scale-95 transition-all"
        >
          <span className="relative flex items-center justify-center">
            <Languages size={20} className="text-primary" />
            <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-primary leading-none">
              {LANGUAGE_OPTIONS.find(option => option.code === language)?.short}
            </span>
          </span>
        </button>
        <AnimatePresence>
          {languageMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/10 bg-surface/95 shadow-2xl shadow-black/20 backdrop-blur-xl overflow-hidden p-1"
            >
              {LANGUAGE_OPTIONS.map(option => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    setLanguage(option.code);
                    setLanguageMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    language === option.code ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  }`}
                >
                  <span className="text-xs font-black">{option.short}</span>
                  <span className="text-xs font-bold truncate">{option.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar / Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-0 md:left-0 md:right-auto md:w-24 md:flex md:flex-col md:items-center md:border-r md:border-white/5 md:bg-surface/90 md:backdrop-blur-2xl"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* ── Desktop Branding ── */}
        <div className="hidden md:flex items-center justify-center h-24 w-full border-b border-white/5 mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Dumbbell className="text-text-primary" size={28} />
          </div>
        </div>

        {/* ── Desktop Nav Items ── */}
        <div className="hidden md:flex md:flex-col md:gap-8 md:py-4 w-full items-center">
          <NavItem icon={<TrendingUp size={20} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label={text.nav.home} />
          <NavItem icon={<Dumbbell size={20} />} active={activeTab === 'workouts'} onClick={() => setActiveTab('workouts')} label={text.nav.workouts} />
          <NavItem icon={<Apple size={20} />} active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} label={text.nav.nutrition} />
          <NavItem icon={<BarChart3 size={20} />} active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} label={text.nav.progress} />
          <NavItem icon={<Users size={20} />} active={activeTab === 'community'} onClick={() => setActiveTab('community')} label={text.nav.social} />
          <NavItem icon={<span className="relative flex"><ShoppingBag size={20} />{!ironShopAccess.hasAccess && <Lock size={11} className="absolute -right-2 -top-2 text-primary" />}</span>} active={activeTab === 'shop'} onClick={openIronShop} label={text.nav.shop} />
          <NavItem icon={<Wallet size={20} />} active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} label={text.nav.affiliates} />
        </div>

        <div className="hidden md:flex md:flex-col md:gap-8 md:mt-auto md:mb-12 w-full items-center">
          <button
            onClick={() => openPricing('desktop_sidebar')}
            className={`p-3 rounded-2xl transition-all duration-300 ${effectivePlan === 'free' ? 'text-primary bg-primary/10 animate-pulse' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
            title={text.nav.plans}
          >
            <Zap size={24} />
          </button>
          <NavItem icon={<Settings size={24} />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label={text.nav.settings} />
          {isAdmin && <NavItem icon={<ShieldCheck size={20} />} active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label={text.nav.admin} />}
          <button
            onClick={logout}
            className="p-3 rounded-2xl text-text-muted hover:text-error hover:bg-error/10 transition-all duration-300"
            title={text.nav.logout}
          >
            <LogOut size={24} />
          </button>
        </div>

        {/* ── Mobile Bottom Bar (5 slots) ── */}
        <div
          className="md:hidden flex items-center w-full"
          style={{
            height: 'calc(76px + env(safe-area-inset-bottom))',
            paddingBottom: 'env(safe-area-inset-bottom)',
            background: themeMode === 'light' ? 'rgba(255,255,255,0.94)' : 'rgba(13,13,15,0.96)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderTop: themeMode === 'light' ? '1px solid rgba(17,24,39,0.1)' : '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <MobileNavItem icon={<TrendingUp size={23} />} label={text.nav.home} active={activeTab === 'dashboard'}  onClick={() => { setDrawerOpen(false); setActiveTab('dashboard'); }} />
          <MobileNavItem icon={<Dumbbell size={23} />}   label={text.nav.workouts} active={activeTab === 'workouts'}   onClick={() => { setDrawerOpen(false); setActiveTab('workouts'); }} />
          <MobileNavItem icon={<Apple size={23} />}      label={text.nav.nutrition} active={activeTab === 'nutrition'}  onClick={() => { setDrawerOpen(false); setActiveTab('nutrition'); }} />
          <MobileNavItem icon={<BarChart3 size={23} />}  label={text.nav.progress} active={activeTab === 'progress'}   onClick={() => { setDrawerOpen(false); setActiveTab('progress'); }} />
          {/* "Mais" slot */}
          <button
            onClick={() => setDrawerOpen(v => !v)}
            className="flex-1 flex flex-col items-center justify-center gap-[5px] relative h-full"
            aria-label={drawerOpen ? text.nav.close : text.drawer.title}
          >
            {drawerOpen && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                style={{ width: 28, height: 3, background: 'var(--color-primary)' }}
              />
            )}
            <span
              className="transition-transform duration-300"
              style={{
                display: 'flex',
                color: drawerOpen ? 'var(--color-primary)' : 'var(--color-text-muted)',
                transform: drawerOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              {drawerOpen ? <X size={23} /> : <MoreHorizontal size={23} />}
            </span>
            <span
              className="text-[11px] font-bold leading-none"
              style={{ color: drawerOpen ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: drawerOpen ? 700 : 500 }}
            >
              {drawerOpen ? text.nav.close : text.nav.more}
            </span>
          </button>
        </div>
      </nav>

      {/* ── Drawer Overlay (mobile only) ── */}
      <div
        className="md:hidden fixed inset-0 z-40 pointer-events-none"
        style={{
          bottom: 'calc(76px + env(safe-area-inset-bottom))',
          background: themeMode === 'light' ? 'rgba(17,24,39,0.22)' : 'rgba(0,0,0,0.45)',
          backdropFilter: drawerOpen ? 'blur(4px)' : 'none',
          WebkitBackdropFilter: drawerOpen ? 'blur(4px)' : 'none',
          opacity: drawerOpen ? 1 : 0,
          transition: 'opacity .35s cubic-bezier(.32,.72,.32,1)',
          pointerEvents: drawerOpen ? 'auto' : 'none',
        }}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ── Drawer Sheet (mobile only) ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={text.drawer.title}
        className="md:hidden fixed left-0 right-0 z-40"
        style={{
          bottom: 'calc(76px + env(safe-area-inset-bottom))',
          background: 'var(--color-surface)',
          borderRadius: '24px 24px 0 0',
          boxShadow: themeMode === 'light' ? '0 -18px 44px -18px rgba(17,24,39,0.28)' : '0 -20px 40px -10px rgba(0,0,0,0.5)',
          transform: drawerOpen ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform .35s cubic-bezier(.32,.72,.32,1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: 'min(76vh, 560px)',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          visibility: drawerOpen ? 'visible' : 'hidden',
        }}
        onTouchStart={(e) => { (e.currentTarget as any)._ty = e.touches[0].clientY; }}
        onTouchMove={(e) => {
          const delta = e.touches[0].clientY - ((e.currentTarget as any)._ty ?? 0);
          if (delta > 60) setDrawerOpen(false);
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="rounded-full" style={{ width: 44, height: 4, background: themeMode === 'light' ? 'rgba(17,24,39,0.16)' : 'rgba(255,255,255,0.18)' }} />
        </div>

        <div className="px-4 sm:px-5 pt-3 pb-6 space-y-5">
          {/* Header */}
          <div>
            <p className="text-base font-bold text-text-primary">{text.drawer.title}</p>
            <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{text.drawer.subtitle}</p>
          </div>

          {/* Grid of items */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
            {[
              { tab: 'community',  icon: <Users size={20} />,      label: text.nav.social,    desc: text.drawer.socialDesc },
              { tab: 'shop', icon: <span className="relative flex"><ShoppingBag size={20} />{!ironShopAccess.hasAccess && <Lock size={10} className="absolute -right-2 -top-2 text-primary" />}</span>, label: text.nav.shop, desc: text.drawer.shopDesc, locked: !ironShopAccess.hasAccess },
              { tab: 'affiliates', icon: <Wallet size={20} />,     label: text.nav.affiliates, desc: text.drawer.affiliatesDesc },
              { tab: 'settings',   icon: <Settings size={20} />,   label: text.nav.settings,   desc: text.drawer.settingsDesc },
              ...(isAdmin ? [{ tab: 'admin', icon: <ShieldCheck size={20} />, label: text.nav.admin, desc: text.drawer.adminDesc }] : []),
            ].map(item => (
              <button
                key={item.tab}
                onClick={() => { item.tab === 'shop' ? openIronShop() : (setActiveTab(item.tab), setDrawerOpen(false)); }}
                className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-95 min-h-[68px]"
                style={{
                  background: themeMode === 'light' ? 'rgba(17,24,39,0.035)' : 'rgba(255,255,255,0.04)',
                  border: activeTab === item.tab
                    ? '1px solid rgba(255,107,26,0.4)'
                    : themeMode === 'light' ? '1px solid rgba(17,24,39,0.08)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: themeMode === 'light' ? 'rgba(17,24,39,0.045)' : 'rgba(255,255,255,0.05)', color: activeTab === item.tab ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13.5px] font-bold text-text-primary truncate">{item.label}</span>
                    {activeTab === item.tab && <span className="flex-shrink-0 rounded-full" style={{ width: 6, height: 6, background: 'var(--color-primary)' }} />}
                    {'locked' in item && item.locked && <Lock size={10} className="text-primary shrink-0" />}
                  </div>
                  <p className="text-[10.5px] truncate" style={{ color: 'var(--color-text-muted)' }}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:pl-24 md:pb-0 min-h-screen overflow-x-hidden" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`px-4 py-5 sm:p-6 md:p-8 max-w-7xl mx-auto${isAdmin ? ' pt-16 md:pt-16' : ''}`}
          >
            {activeTab === 'dashboard' && (
              <DashboardView 
                profile={profile} 
                language={language}
                onUpgrade={() => openPricing('dashboard')}
                onStartWorkout={(workoutId, mode) => {
                  if (workoutId) {
                    localStorage.setItem('pending_workout_selection', JSON.stringify({ workoutId, mode }));
                  }
                  setActiveTab('workouts');
                }}
                onViewNutrition={() => setActiveTab('nutrition')}
                onViewProgress={() => setActiveTab('progress')}
              />
            )}
            {activeTab === 'workouts' && <ViewErrorBoundary><WorkoutsView profile={profile} language={language} onUpgrade={() => openPricing('workouts')} /></ViewErrorBoundary>}
            {activeTab === 'nutrition' && (
              <NutritionView
                profile={profile}
                language={language}
                onUpgrade={() => openPricing('nutrition_iron_coach')}
                updateProfile={updateProfile}
                onOpenIronCoach={(prompt) => {
                  localStorage.setItem(`ironcoach_pending_prompt_${profile.id}`, prompt);
                  localStorage.setItem('ironshape_pending_workouts_tab', 'ia');
                  setActiveTab('workouts');
                }}
              />
            )}
            {activeTab === 'progress' && <BodyProgressView userId={profile.id} language={language} />}
            {activeTab === 'community' && <CommunityView profile={profile} language={language} />}
            {activeTab === 'shop' && <IronShopView access={ironShopAccess} language={language} />}
            {activeTab === 'affiliates' && <AffiliateView profile={profile} language={language} />}
            {activeTab === 'settings' && <SettingsView profile={profile} language={language} logout={logout} onUpgrade={() => openPricing('settings')} />}
            {activeTab === 'admin' && isAdmin && <AdminView language={language} />}
          </motion.div>
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {ironShopNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-6"
          >
            <button
              aria-label="Fechar aviso da IronShop"
              className="absolute inset-0 bg-background/85 backdrop-blur-md"
              onClick={() => setIronShopNotice(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 34, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 34, scale: 0.98 }}
              className="relative w-full sm:max-w-md bg-surface border border-white/10 rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-7"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-5">
                <Lock size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tight">A IronShop está chegando!</h3>
              <p className="text-sm text-text-secondary leading-relaxed mt-3">
                Em breve, você poderá encontrar suplementos, roupas e acessórios selecionados para ajudar na sua evolução.
              </p>
              <button
                onClick={() => setIronShopNotice(false)}
                className="mt-7 w-full min-h-[48px] rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IronShopView({ access, language }: { access: IronShopAccessState; language: LanguageCode }) {
  const locale = getLocaleCode(language);
  const [products, setProducts] = useState<IronShopProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(access.hasAccess);
  const [shopError, setShopError] = useState('');

  useEffect(() => {
    if (!access.hasAccess) {
      setProducts([]);
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);
    setShopError('');
    ironshopService.getProducts()
      .then(setProducts)
      .catch((error: any) => setShopError(error?.message || 'Não foi possível carregar a IronShop.'))
      .finally(() => setLoadingProducts(false));
  }, [access.hasAccess]);

  if (!access.hasAccess) {
    return (
      <div className="max-w-3xl mx-auto min-h-[70vh] flex items-center justify-center">
        <section className="w-full bg-[#111111] border border-[#232323] rounded-[32px] p-8 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-6">
            <Lock size={28} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary mb-3">IronShop</p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">A IronShop está chegando!</h1>
          <p className="text-text-secondary max-w-xl mx-auto mt-4 leading-relaxed">
            Em breve, você poderá encontrar suplementos, roupas e acessórios selecionados para ajudar na sua evolução.
          </p>
        </section>
      </div>
    );
  }

  const featuredProducts = products.length > 0 ? products : [];
  const firstProductImage = featuredProducts[0]?.image || '';
  const secondProductImage = featuredProducts[1]?.image || firstProductImage;
  const thirdProductImage = featuredProducts[2]?.image || firstProductImage;
  const fourthProductImage = featuredProducts[3]?.image || secondProductImage;
  const categoryCards = [
    { name: 'Suplementos', image: firstProductImage, icon: <ShoppingBag size={22} /> },
    { name: 'Roupas', image: secondProductImage, icon: <Shirt size={22} /> },
    { name: 'Acessórios', image: thirdProductImage, icon: <Package size={22} /> },
    { name: 'Kits', image: fourthProductImage, icon: <Star size={22} /> }
  ];
  const benefits = [
    { label: 'Frete grátis', icon: <Truck size={22} /> },
    { label: 'Compra segura', icon: <ShieldCheck size={22} /> },
    { label: 'Parcelamento', icon: <CreditCard size={22} /> },
    { label: 'Suporte', icon: <Headphones size={22} /> }
  ];
  const productCategoryLabel = (category: IronShopProduct['category']) => (
    category === 'supplement' ? 'Suplemento' : category === 'apparel' ? 'Roupa' : 'Acessório'
  );

  return (
    <div className="bg-[#090909] text-white space-y-10 pb-8">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-[42px] sm:text-5xl font-black leading-[0.95] tracking-normal">Loja IronShape</h1>
          <p className="text-lg font-normal text-[#AFAFAF] mt-4 max-w-2xl">
            Tudo o que você precisa para evoluir seus resultados.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <div className="flex-1 xl:w-[360px] h-14 rounded-2xl border border-[#232323] bg-[#111111] px-5 flex items-center gap-3 text-[#6F6F6F]">
            <Search size={20} className="text-[#AFAFAF]" />
            <span className="text-sm font-semibold">Buscar suplementos, roupas e kits</span>
          </div>
          <button className="w-14 h-14 rounded-2xl border border-[#232323] bg-[#111111] text-white flex items-center justify-center hover:border-primary hover:text-primary transition-all duration-200" aria-label="Carrinho">
            <ShoppingBag size={22} />
          </button>
          <button className="w-14 h-14 rounded-2xl border border-[#232323] bg-[#111111] text-white flex items-center justify-center hover:border-primary hover:text-primary transition-all duration-200" aria-label="Usuário">
            <UserIcon size={22} />
          </button>
        </div>
      </header>

      {shopError && (
        <div className="bg-[#111111] border border-[#232323] rounded-3xl p-5 flex items-center gap-3 text-white">
          <AlertTriangle size={20} />
          <p className="text-sm font-bold">{shopError}</p>
        </div>
      )}

      {loadingProducts ? (
        <div className="bg-[#111111] border border-[#232323] rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 text-[#AFAFAF]">
          <Loader2 className="animate-spin text-primary" size={34} />
          <span className="text-xs font-black uppercase tracking-widest">Carregando vitrine premium...</span>
        </div>
      ) : (
        <>
          <section className="min-h-[420px] rounded-[28px] border border-[#232323] bg-[#111111] overflow-hidden grid lg:grid-cols-[45%_55%]">
            <div className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-primary mb-5">SUPLEMENTOS</p>
              <h2 className="text-[40px] sm:text-[48px] font-black leading-[0.98] tracking-normal max-w-xl">
                DE QUALIDADE<br />PARA RESULTADOS REAIS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 text-sm font-bold text-[#D7D7D7]">
                {['Produtos selecionados', 'Entrega rápida', 'Compra segura', 'Parcelamento'].map(item => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={17} className="text-primary" />
                    {item}
                  </span>
                ))}
              </div>
              <button className="mt-9 w-fit min-h-[52px] px-8 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF7E1F] hover:scale-[1.03] transition-all duration-200">
                Ver Produtos
              </button>
            </div>
            <div className="relative min-h-[280px] bg-[#090909]">
              {firstProductImage && <img src={firstProductImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />}
              <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-[#111111]/25 to-transparent" />
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-[26px] font-black tracking-normal">Categorias</h2>
            <div className="flex md:grid md:grid-cols-4 gap-5 overflow-x-auto pb-2 snap-x">
              {categoryCards.map(category => (
                <article key={category.name} className="min-w-[250px] md:min-w-0 h-[300px] rounded-3xl border border-[#232323] bg-[#111111] overflow-hidden group hover:border-primary hover:shadow-[0_24px_80px_rgba(255,106,0,0.14)] hover:-translate-y-1 transition-all duration-200 snap-start">
                  <div className="h-[205px] bg-[#090909] overflow-hidden">
                    {category.image && <img src={category.image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200" />}
                  </div>
                  <div className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-11 h-11 rounded-2xl bg-[#090909] border border-[#232323] text-primary flex items-center justify-center">{category.icon}</span>
                      <h3 className="text-lg font-black">{category.name}</h3>
                    </div>
                    <button className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:text-[#FF7E1F] transition-colors duration-200">
                      Ver produtos <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-5">
            <h2 className="text-[26px] font-black tracking-normal">Mais vendidos</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 sm:gap-5">
              {products.map(product => (
                <article key={product.id} className="group min-h-[420px] rounded-3xl border border-[#232323] bg-[#111111] overflow-hidden hover:border-primary hover:shadow-[0_24px_80px_rgba(255,106,0,0.14)] hover:-translate-y-1 hover:scale-[1.03] transition-all duration-200">
                  <div className="relative h-[70%] min-h-[270px] bg-[#090909] overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200" />
                    <button className="absolute top-4 right-4 w-11 h-11 rounded-full bg-[#111111]/90 border border-[#232323] text-white flex items-center justify-center hover:text-primary hover:border-primary transition-all duration-200" aria-label="Favoritar">
                      <Heart size={19} />
                    </button>
                  </div>
                  <div className="p-4 sm:p-5 space-y-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#6F6F6F]">{productCategoryLabel(product.category)}</p>
                    <h3 className="text-lg font-black leading-tight min-h-[44px]">{product.name}</h3>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[26px] sm:text-[30px] font-black text-white leading-none">{product.price.toLocaleString(locale, { style: 'currency', currency: 'BRL' })}</span>
                      <button className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center hover:bg-[#FF7E1F] hover:scale-[1.03] transition-all duration-200" aria-label="Adicionar">
                        <Plus size={22} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid lg:grid-cols-2 gap-5">
            {[
              { title: 'Roupas IronShape', image: secondProductImage },
              { title: 'Kits Promocionais', image: fourthProductImage }
            ].map(banner => (
              <article key={banner.title} className="min-h-[260px] rounded-3xl border border-[#232323] bg-[#111111] overflow-hidden grid sm:grid-cols-2 group hover:border-primary hover:shadow-[0_24px_80px_rgba(255,106,0,0.14)] transition-all duration-200">
                <div className="p-7 flex flex-col justify-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-3">IronShape</p>
                  <h3 className="text-3xl font-black leading-tight">{banner.title}</h3>
                  <button className="mt-7 w-fit min-h-[46px] px-6 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-[#FF7E1F] hover:scale-[1.03] transition-all duration-200">
                    Ver mais
                  </button>
                </div>
                <div className="min-h-[220px] bg-[#090909] overflow-hidden">
                  {banner.image && <img src={banner.image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200" />}
                </div>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-3xl border border-[#232323] bg-[#111111] p-4 sm:p-5">
            {benefits.map(benefit => (
              <div key={benefit.label} className="min-h-[96px] rounded-2xl bg-[#090909] border border-[#232323] flex items-center gap-4 px-5">
                <span className="w-12 h-12 rounded-2xl bg-[#111111] border border-[#232323] text-primary flex items-center justify-center">{benefit.icon}</span>
                <span className="text-sm sm:text-base font-black">{benefit.label}</span>
              </div>
            ))}
          </section>

          <footer className="border-t border-[#232323] pt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 text-[#6F6F6F]">
            <div>
              <h2 className="text-2xl font-black text-white">IronShape</h2>
              <p className="text-xs font-semibold mt-2">Performance, tecnologia e evolução em cada detalhe.</p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-black uppercase tracking-widest">
              {['Política', 'Privacidade', 'Trocas', 'Contato', 'Termos'].map(link => (
                <span key={link} className="hover:text-primary transition-colors duration-200">{link}</span>
              ))}
            </nav>
          </footer>
        </>
      )}
    </div>
  );
}

function AffiliateView({ profile, language: _language }: { profile: UserProfile | null; language: LanguageCode }) {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [metrics, setMetrics] = useState({ clicks: 0, conversions: 0, pending: 0, total: 0 });
  const [history, setHistory] = useState<AffiliateConversion[]>([]);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nome: profile?.name || '',
    cpf: '',
    email: profile?.email || '',
    whatsapp: '',
    pix_chave: '',
    pix_tipo: 'CPF'
  });

  useEffect(() => {
    fetchAffiliateData();
  }, [profile]);

  const fetchAffiliateData = async () => {
    if (!profile) return;
    setLoading(true);
      try {
        const { data, error } = await withTimeout(
          () => supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', profile.id)
            .single(),
          15000,
          2
        ) as any;

        if (data) {
          setAffiliate(data);
          // Fetch metrics
          const { data: clicks } = await withTimeout(
            () => supabase
              .from('affiliate_clicks')
              .select('id', { count: 'exact' })
              .eq('affiliate_id', data.id),
            15000,
            2
          ) as any;
          
          const { data: conversions } = await withTimeout(
            () => supabase
              .from('affiliate_conversions')
              .select('*')
              .eq('affiliate_id', data.id),
            15000,
            2
          ) as any;

        if (conversions) {
          const total = conversions.reduce((acc: number, curr: any) => acc + Number(curr.valor_comissao), 0);
          const pending = conversions
            .filter((c: any) => c.status_pagamento === 'pendente')
            .reduce((acc: number, curr: any) => acc + Number(curr.valor_comissao), 0);
          
          setMetrics({
            clicks: clicks?.length || 0,
            conversions: conversions.length,
            pending,
            total
          });
          setHistory(conversions);
        }
      }
    } catch (err) {
      console.error('Error fetching affiliate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setRegistering(true);

    try {
      const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { error } = await supabase
        .from('affiliates')
        .insert([{
          ...formData,
          user_id: profile.id,
          codigo_afiliado: codigo,
          status: 'ativo'
        }]);

      if (error) throw error;

      await fetchAffiliateData();
    } catch (err) {
      console.error('Error registering affiliate:', err);
      alert('Erro ao realizar cadastro.');
    } finally {
      setRegistering(false);
    }
  };

  const copyLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}?ref=${affiliate.codigo_afiliado}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">Seja um Afiliado</h2>
          <p className="text-text-muted">Ganhe comissões indicando o IronShape para seus alunos.</p>
        </div>

        <form onSubmit={handleRegister} className="bg-surface rounded-3xl p-8 border border-white/5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Nome Completo</label>
              <input 
                type="text" 
                required
                value={formData.nome}
                onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">CPF</label>
              <input 
                type="text" 
                required
                value={formData.cpf}
                onChange={e => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Email</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">WhatsApp</label>
              <input 
                type="text" 
                required
                value={formData.whatsapp}
                onChange={e => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Tipo de Chave PIX</label>
              <select 
                value={formData.pix_tipo}
                onChange={e => setFormData(prev => ({ ...prev, pix_tipo: e.target.value }))}
                className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none"
              >
                <option value="CPF">CPF</option>
                <option value="Email">Email</option>
                <option value="Telefone">Telefone</option>
                <option value="Aleatória">Chave Aleatória</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted">Chave PIX</label>
              <input 
                type="text" 
                required
                value={formData.pix_chave}
                onChange={e => setFormData(prev => ({ ...prev, pix_chave: e.target.value }))}
                className="w-full bg-background border border-white/5 rounded-xl px-4 py-3 focus:border-primary transition-colors outline-none"
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={registering || uploading}
              className="w-full bg-primary text-text-primary py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all disabled:opacity-50"
            >
              {registering ? 'Enviando...' : 'Solicitar Afiliação'}
            </button>
          </div>
        </form>
      </div>
    );
  }


  if (affiliate.status === 'rejeitado' || affiliate.status === 'bloqueado') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-error/10 rounded-3xl flex items-center justify-center border border-error/20">
          <AlertTriangle className="text-error" size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tight">Conta {affiliate.status.toUpperCase()}</h2>
          <p className="text-text-muted max-w-md">
            Sua conta de afiliado foi {affiliate.status}. Entre em contato com o suporte para mais informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tight">Painel do Afiliado</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-green-500">Conta Ativa</span>
          </div>
        </div>
        
        <div className="bg-surface rounded-2xl p-4 border border-white/5 flex items-center gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Seu Link</p>
            <p className="text-sm font-mono text-primary truncate max-w-[200px]">
              {window.location.origin}?ref={affiliate.codigo_afiliado}
            </p>
          </div>
          <button
            onClick={copyLink}
            className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-text-primary"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AffiliateMetricCard icon={<LinkIcon size={20} />} label="Cliques" value={metrics.clicks} />
        <AffiliateMetricCard icon={<UserIcon size={20} />} label="Vendas" value={metrics.conversions} />
        <AffiliateMetricCard icon={<Clock size={20} />} label="Pendente" value={`R$ ${metrics.pending.toFixed(2)}`} color="text-yellow-500" />
        <AffiliateMetricCard icon={<Wallet size={20} />} label="Total" value={`R$ ${metrics.total.toFixed(2)}`} color="text-green-500" />
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-black uppercase tracking-tight">Histórico de Conversões</h3>
        <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Plano</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Comissão</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-text-muted text-sm italic">
                      Nenhuma conversão registrada ainda.
                    </td>
                  </tr>
                ) : (
                  history.map((conv) => (
                    <tr key={conv.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">
                        {new Date(conv.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black uppercase tracking-widest px-2 py-1 bg-primary/10 text-primary rounded-lg">
                          {conv.plano}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-black">
                        R$ {Number(conv.valor_comissao).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                          conv.status_pagamento === 'pago' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {conv.status_pagamento}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AffiliateMetricCard({ icon, label, value, color = "text-primary" }: { icon: React.ReactNode, label: string, value: string | number, color?: string }) {
  return (
    <div className="bg-surface rounded-3xl p-6 border border-white/5 space-y-4">
      <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}

function AdminAffiliatesView() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const { data, error } = await withTimeout(
        () => supabase
          .from('affiliates')
          .select('*')
          .order('criado_em', { ascending: false }),
        15000,
        2
      ) as any;
      
      if (error) throw error;
      setAffiliates(data || []);
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AffiliateStatus) => {
    try {
      const { error } = await withTimeout(
        () => supabase
          .from('affiliates')
          .update({ 
            status: newStatus,
            aprovado_em: newStatus === 'aprovado' ? new Date().toISOString() : null
          })
          .eq('id', id),
        15000,
        2
      ) as any;

      if (error) throw error;
      fetchAffiliates();
      setSelectedAffiliate(null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Erro ao atualizar status.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tight">Gestão de Afiliados</h2>
        <p className="text-text-muted">Aprove, rejeite ou gerencie os parceiros do app.</p>
      </div>

      <div className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Afiliado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Cadastro</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {affiliates.map((aff) => (
                <tr key={aff.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold">{aff.nome}</span>
                      <span className="text-xs text-text-muted">{aff.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                      aff.status === 'aprovado' ? 'bg-green-500/10 text-green-500' :
                      aff.status === 'pendente' ? 'bg-yellow-500/10 text-yellow-500' :
                      'bg-error/10 text-error'
                    }`}>
                      {aff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-muted">
                    {new Date(aff.criado_em).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedAffiliate(aff)}
                      className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedAffiliate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAffiliate(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface rounded-[40px] border border-white/10 p-8 shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Detalhes do Afiliado</h3>
                  <p className="text-text-muted">{selectedAffiliate.nome}</p>
                </div>
                <button onClick={() => setSelectedAffiliate(null)} className="p-2 bg-white/5 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">Informações</h4>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="text-text-muted">CPF:</span> {selectedAffiliate.cpf}</p>
                      <p className="text-sm"><span className="text-text-muted">WhatsApp:</span> {selectedAffiliate.whatsapp}</p>
                      <p className="text-sm"><span className="text-text-muted">PIX:</span> {selectedAffiliate.pix_chave} ({selectedAffiliate.pix_tipo})</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary">Ações</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleStatusChange(selectedAffiliate.id, 'aprovado')}
                        className="flex items-center justify-center gap-2 bg-green-500 text-text-primary py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                      >
                        <UserCheck size={16} /> Aprovar
                      </button>
                      <button 
                        onClick={() => handleStatusChange(selectedAffiliate.id, 'rejeitado')}
                        className="flex items-center justify-center gap-2 bg-error text-text-primary py-3 rounded-xl font-black text-[10px] uppercase tracking-widest"
                      >
                        <UserX size={16} /> Rejeitar
                      </button>
                      <button 
                        onClick={() => handleStatusChange(selectedAffiliate.id, 'bloqueado')}
                        className="col-span-2 flex items-center justify-center gap-2 bg-white/5 text-text-primary py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10"
                      >
                        <Ban size={16} /> Bloquear Conta
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando confirmação...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data, error } = await withTimeout(() => supabase.auth.getSession(), 15000, 2);
        if (error) throw error;
        if (data.session) {
          setStatus('success');
          setMessage('Login confirmado com sucesso!');
          setTimeout(() => {
            try { window.close(); } catch (e) {}
            window.location.replace('/');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Não foi possível concluir o login. Tente novamente.');
          setTimeout(() => { window.location.replace('/'); }, 3000);
        }
      } catch (err: any) {
        console.warn('Auth callback failed:', err?.message || err);
        setStatus('error');
        setMessage('Não foi possível concluir o login. Tente novamente.');
        setTimeout(() => { window.location.replace('/'); }, 3000);
      }
    };
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface p-10 rounded-[40px] border border-white/10 shadow-2xl space-y-8"
      >
        <div className="flex justify-center">
          <div className={`p-5 rounded-3xl bg-primary/10 border border-primary/20 ${status === 'loading' ? 'animate-pulse' : ''}`}>
            {status === 'loading' && <Loader2 className="text-primary animate-spin" size={48} />}
            {status === 'success' && <CheckCircle2 className="text-success" size={48} />}
            {status === 'error' && <AlertTriangle className="text-error" size={48} />}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black uppercase tracking-tight">
            {status === 'loading' ? 'Verificando...' : status === 'success' ? 'Sucesso!' : 'Ops!'}
          </h2>
          <p className="text-text-secondary font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {status === 'success' && (
          <div className="pt-4">
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: "linear" }}
                className="h-full bg-primary"
              />
            </div>
            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mt-4">
              Redirecionando em instantes...
            </p>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => window.location.replace('/')}
            className="w-full py-4 bg-white/5 text-text-primary rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
          >
            Voltar para o Início
          </button>
        )}
      </motion.div>
    </div>
  );
}

function LoginView({ onLogin }: { onLogin: () => void }) {
  const { signInWithEmail, signUpWithEmail, resetPassword, signInWithGoogle, resendConfirmationEmail } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'email-sent'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (mode === 'signup') {
      if (!name.trim()) {
        setError('O nome é obrigatório.');
        return;
      }
    }

    if (!email.trim()) {
      setError('O email é obrigatório.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido.');
      return;
    }

    if (!password.trim()) {
      setError('A senha é obrigatória.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        const data = await signUpWithEmail(email, password, name);
        if (data?.user && !data?.session) {
          setMode('email-sent');
        } else {
          setSuccess('Conta criada com sucesso! Redirecionando...');
        }
      }
    } catch (err: any) {
      console.error('Registration/Login error details:', err);
      const message = err.message || '';
      
      if (message.includes('rate limit exceeded')) {
        setError('Limite de tentativas excedido. Por favor, aguarde alguns minutos antes de tentar novamente.');
      } else if (message.includes('Email not confirmed') || err.code === 'email_not_confirmed') {
        setMode('email-sent');
      } else if (message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos. Se você acabou de criar sua conta, confirme o email antes de entrar.');
      } else {
        setError(message || 'Ocorreu um erro ao processar sua solicitação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.warn('Google login error:', err?.message || err);
      setError('Não foi possível iniciar o login com Google. Tente novamente.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await resetPassword(recoveryEmail);
      setRecoverySuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar link de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/40 rounded-full blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex p-4 rounded-3xl bg-primary/10 border border-primary/20">
            <Dumbbell className="text-primary" size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 bg-gradient-to-b from-text-primary to-text-muted bg-clip-text text-transparent">
            IRONSHAPE
          </h1>
          <p className="text-text-muted text-sm">A evolução definitiva do seu treino.</p>
        </div>

        <div className="bg-surface p-8 rounded-[40px] border border-white/5 shadow-2xl">
          {mode === 'email-sent' ? (
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                <Mail className="text-primary" size={32} />
              </div>
              <h3 className="text-xl font-black mb-2">Confirme seu Email</h3>
              <p className="text-text-muted text-sm mb-1 leading-relaxed">Enviamos um link de confirmação para</p>
              <p className="font-bold text-sm mb-6 text-text-primary">{email}</p>
              <p className="text-text-muted text-xs mb-8 leading-relaxed">
                Abra o email e clique no link para ativar sua conta. Verifique também a pasta de spam.
              </p>
              {error && (
                <p className="text-error text-xs font-medium mb-4 p-3 bg-error/10 rounded-xl border border-error/20">{error}</p>
              )}
              {success && (
                <p className="text-success text-xs font-medium mb-4 p-3 bg-success/10 rounded-xl border border-success/20">{success}</p>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    setSuccess(null);
                    await resendConfirmationEmail(email);
                    setSuccess('Email reenviado com sucesso!');
                  } catch (err: any) {
                    setError(err.message || 'Erro ao reenviar email.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full bg-white/5 text-text-primary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5 mb-3 disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Reenviar Email'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                className="w-full bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20"
              >
                Já confirmei — Entrar
              </button>
            </div>
          ) : (
          <>
          <div className="flex gap-4 mb-8 p-1 bg-white/5 rounded-2xl">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'login' ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-secondary'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'signup' ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-secondary'}`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Nome</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input 
                    type="text" 
                    placeholder="Digite seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-text-primary outline-none focus:border-primary transition-all"
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="email" 
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-text-primary text-base outline-none focus:border-primary transition-all min-h-[56px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">{mode === 'signup' ? 'Criar Senha' : 'Senha'}</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setRecoveryModalOpen(true)}
                    className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={mode === 'signup' ? "Crie sua senha" : "Digite sua senha"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-text-primary text-base outline-none focus:border-primary transition-all min-h-[56px]"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium space-y-2"
              >
                <p>{error}</p>
                {error.includes('ainda não foi confirmado') && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await resendConfirmationEmail(email);
                        setSuccess('Email de confirmação reenviado!');
                        setError(null);
                      } catch (err: any) {
                        setError(err.message || 'Erro ao reenviar email.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-primary hover:underline font-bold block"
                  >
                    Reenviar Email de Confirmação
                  </button>
                )}
              </motion.div>
            )}

            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-medium"
              >
                {success}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="bg-surface px-4 text-text-muted">Ou continue com</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full bg-white/5 text-text-primary font-bold py-4 px-8 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all border border-white/5 disabled:opacity-50"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
                Google
              </>
            )}
          </button>
          </>
          )}
        </div>
      </motion.div>

      {/* Recovery Modal */}
      <AnimatePresence>
        {recoveryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRecoveryModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface p-8 rounded-[40px] border border-white/5 w-full max-w-md relative z-10 shadow-2xl"
            >
              <button 
                onClick={() => setRecoveryModalOpen(false)}
                className="absolute top-6 right-6 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-black mb-2">Recuperar Senha</h2>
              <p className="text-text-muted text-sm mb-8 leading-relaxed">
                Digite seu email para receber um link de recuperação de senha.
              </p>

              {recoverySuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-success/20">
                    <CheckCircle2 className="text-success" size={32} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">Email Enviado!</h3>
                  <p className="text-text-muted text-sm mb-8">
                    Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.
                  </p>
                  <button 
                    onClick={() => setRecoveryModalOpen(false)}
                    className="w-full bg-white/5 text-text-primary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5"
                  >
                    Voltar ao Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecovery} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                      <input 
                        type="email" 
                        required
                        placeholder="Digite seu email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-text-primary outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Enviar link de recuperação
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OnboardingView({ user, profile, onComplete }: { user: any, profile: UserProfile | null, onComplete?: (plan: Plan) => void }) {
  const { updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || user.user_metadata?.full_name || '',
    age: (profile?.age && profile.age > 0) ? profile.age : 25,
    weight: (profile?.weight && profile.weight > 0) ? profile.weight : 70,
    height: (profile?.height && profile.height > 0) ? profile.height : 175,
    goal: profile?.goal || 'Hipertrofia',
    trainingPlace: 'home' as 'home' | 'gym' | 'hybrid',
    experience: 'Iniciante',
    daysPerWeek: 3,
    sessionDuration: '30-45 min',
    homeEquipment: [] as string[],
    gymFocus: [] as string[],
    limitations: 'Nenhuma',
    plano: getEntitledPlan(profile) === 'free' ? 'Iniciante' : getEntitledPlan(profile) as Plan
  });

  const toggleListValue = (key: 'homeEquipment' | 'gymFocus', value: string, max = 4) => {
    setFormData(prev => {
      const current = prev[key];
      if (value === 'Nenhum') return { ...prev, [key]: current.includes('Nenhum') ? [] : ['Nenhum'] };
      const cleaned = current.filter(v => v !== 'Nenhum');
      if (cleaned.includes(value)) return { ...prev, [key]: cleaned.filter(v => v !== value) };
      return { ...prev, [key]: [...cleaned, value].slice(0, max) };
    });
  };

  const recommendation = (() => {
    const home = formData.trainingPlace === 'home';
    const hybrid = formData.trainingPlace === 'hybrid';
    const hasEquipment = formData.homeEquipment.some(e => e !== 'Nenhum');
    const isBeginner = formData.experience === 'Iniciante';
    const hasLimitation = formData.limitations !== 'Nenhuma';
    const title = home
      ? `Protocolo Casa ${isBeginner ? 'Base' : 'Performance'}`
      : hybrid
      ? 'Protocolo Híbrido Inteligente'
      : `Protocolo Academia ${formData.goal}`;
    const weeklySplit = home
      ? ['Mobilidade + Full Body', 'Core + Condicionamento', 'Pernas + Flexões']
      : hybrid
      ? ['Academia: Força Base', 'Casa: Mobilidade e Core', 'Academia: Hipertrofia', 'Casa: Cardio técnico']
      : formData.daysPerWeek >= 5
      ? ['Push', 'Pull', 'Legs', 'Upper', 'Braços/Core']
      : ['Full Body A', 'Full Body B', 'Pernas + Core'];
    const exercises = home
      ? [
          hasLimitation ? 'Mobilidade leve respeitando a limitação' : 'Mobilidade de quadril e tornozelo',
          hasEquipment ? 'Agachamento goblet ou mochila' : 'Agachamento livre controlado',
          'Flexão inclinada ou tradicional',
          'Prancha frontal',
          hasEquipment ? 'Remada com elástico/halter' : 'Superman + retração escapular',
        ]
      : [
          hasLimitation ? 'Aquecimento articular sem dor' : 'Aquecimento articular',
          'Exercício composto principal',
          'Acessório para grupo prioritário',
          'Core anti-rotação',
          'Finalizador metabólico leve',
        ];
    const baseWhy = home
      ? 'Escolhi baixo atrito, progressão por repetições e movimentos seguros para treinar sem depender de máquinas.'
      : hybrid
      ? 'Mistura estímulos fortes da academia com sessões em casa para manter consistência mesmo em semanas corridas.'
      : 'A divisão prioriza volume, máquinas/cargas e recuperação para evoluir com estrutura de academia.';
    const why = hasLimitation
      ? `${baseWhy} Como você marcou ${formData.limitations.toLowerCase()}, o treino deve evitar dor, impacto excessivo e amplitudes desconfortáveis.`
      : baseWhy;

    return {
      title,
      weeklySplit: weeklySplit.slice(0, formData.daysPerWeek),
      exercises,
      why,
      tags: [
        formData.trainingPlace === 'home' ? 'Casa' : formData.trainingPlace === 'gym' ? 'Academia' : 'Híbrido',
        formData.experience,
        `${formData.daysPerWeek}x/semana`,
        formData.sessionDuration,
        ...(hasLimitation ? [formData.limitations] : []),
      ],
    };
  })();

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { plano, trainingPlace, experience, daysPerWeek, sessionDuration, homeEquipment, gymFocus, limitations, ...rest } = formData;
      const isPaidPlan = plano === 'Pro' || plano === 'Elite';
      const activePlan: Plan = isPaidPlan ? 'Iniciante' : plano;
      const onboardingProfile = {
        trainingPlace,
        experience,
        daysPerWeek,
        sessionDuration,
        homeEquipment,
        gymFocus,
        limitations,
        requestedPlan: plano,
        activePlan,
        recommendation,
        savedAt: new Date().toISOString(),
      };
      if (user?.id) {
        localStorage.setItem(`training_onboarding_${user.id}`, JSON.stringify(onboardingProfile));
        if (isPaidPlan) localStorage.setItem(`pending_checkout_plan_${user.id}`, plano);
      }
      try {
        await updateProfile({
          name: formData.name,
          age: formData.age,
          weight: formData.weight,
          height: formData.height,
          goal: formData.goal,
          plano: activePlan,
          subscriptionStatus: 'inactive',
          updatedAt: new Date().toISOString()
        } as any);
      } catch (firstErr: any) {
        const msg = firstErr?.message || '';
        if (msg.includes('schema cache') || msg.includes('plano')) {
          try {
            await updateProfile({ ...rest, updatedAt: new Date().toISOString() } as any);
          } catch {
            // Perfil local já tem a recomendação salva; próxima visita tenta sincronizar novamente.
          }
          if (user && isPaidPlan) localStorage.setItem(`pending_checkout_plan_${user.id}`, plano);
        } else {
          throw firstErr;
        }
      }
      if (onComplete) onComplete(plano);
    } catch (err: any) {
      console.error("Error creating profile:", err);
      const msg = err?.message || '';
      if (msg.includes('schema cache') || msg.includes('column')) {
        setError('Erro de configuração no banco de dados. Contacte o suporte.');
      } else {
        setError(msg || 'Erro ao salvar perfil. Verifique sua conexão.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.name.trim().length > 0 && formData.age > 0;
  const isStep2Valid = formData.weight > 0 && formData.height > 0 && formData.goal.length > 0;
  const isStep3Valid = !!formData.trainingPlace;
  const isStep4Valid = formData.trainingPlace === 'gym' ? formData.gymFocus.length > 0 : formData.homeEquipment.length > 0;
  const isFormValid = isStep1Valid && isStep2Valid && isStep3Valid && isStep4Valid && formData.plano.length > 0;
  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-surface rounded-[32px] p-6 sm:p-8 border border-white/5 shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-start gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Monte seu treino ideal</h2>
            <p className="text-text-muted text-sm mt-2">Responda em menos de um minuto para receber um protocolo inicial.</p>
          </div>
          <span className="text-primary font-mono text-sm shrink-0">Passo {step}/{totalSteps}</span>
        </div>

        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Nome Completo</label>
              <input type="text" placeholder="Ex: João Silva" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base placeholder:text-text-muted focus:border-primary outline-none transition-all shadow-inner min-h-[56px]" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Idade</label>
              <input type="number" placeholder="Ex: 25" value={formData.age || ''} onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base placeholder:text-text-muted focus:border-primary outline-none transition-all shadow-inner min-h-[56px]" />
            </div>
            <button onClick={() => setStep(2)} disabled={!isStep1Valid} className="w-full bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-[0.98]">Próximo</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Peso (kg)</label>
                <input type="number" value={formData.weight || ''} onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base focus:border-primary outline-none transition-all shadow-inner min-h-[56px]" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Altura (cm)</label>
                <input type="number" value={formData.height || ''} onChange={(e) => setFormData({...formData, height: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base focus:border-primary outline-none transition-all shadow-inner min-h-[56px]" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Seu objetivo principal</label>
              <div className="grid grid-cols-2 gap-3">
                {['Hipertrofia', 'Emagrecimento', 'Condicionamento', 'Força', 'Mobilidade', 'Saúde geral'].map(goal => (
                  <button key={goal} onClick={() => setFormData({...formData, goal})} className={`min-h-[52px] rounded-2xl border px-4 text-sm font-black transition-all ${formData.goal === goal ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}>
                    {goal}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/5 text-text-secondary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">Voltar</button>
              <button onClick={() => setStep(3)} disabled={!isStep2Valid} className="flex-1 bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-[0.98]">Próximo</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-3 font-bold">Onde você prefere treinar?</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'home', title: 'Em casa', desc: 'Sem depender de máquinas' },
                  { id: 'gym', title: 'Academia', desc: 'Cargas, máquinas e evolução' },
                  { id: 'hybrid', title: 'Os dois', desc: 'Flexível para rotina corrida' },
                ].map(option => (
                  <button key={option.id} onClick={() => setFormData({...formData, trainingPlace: option.id as any})} className={`p-5 rounded-2xl border text-left transition-all min-h-[132px] ${formData.trainingPlace === option.id ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}>
                    <Dumbbell size={22} className="mb-4" />
                    <div className="font-black text-lg">{option.title}</div>
                    <div className="text-xs text-text-muted mt-1">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Nível</label>
                <CustomSelect value={formData.experience} onChange={(v) => setFormData({...formData, experience: v})} options={['Iniciante', 'Intermediário', 'Avançado'].map(v => ({ value: v, label: v }))} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Dias/semana</label>
                <CustomSelect value={String(formData.daysPerWeek)} onChange={(v) => setFormData({...formData, daysPerWeek: parseInt(v)})} options={[3,4,5,6].map(v => ({ value: String(v), label: `${v} dias` }))} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Tempo</label>
                <CustomSelect value={formData.sessionDuration} onChange={(v) => setFormData({...formData, sessionDuration: v})} options={['20-30 min', '30-45 min', '45-60 min', '60+ min'].map(v => ({ value: v, label: v }))} />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 bg-white/5 text-text-secondary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">Voltar</button>
              <button onClick={() => setStep(4)} disabled={!isStep3Valid} className="flex-1 bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-30 shadow-lg shadow-primary/20">Próximo</button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {(formData.trainingPlace === 'home' || formData.trainingPlace === 'hybrid') && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-3 font-bold">O que você tem para treinar em casa?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Nenhum', 'Halteres', 'Elástico', 'Barra fixa', 'Banco/cadeira', 'Colchonete'].map(item => (
                    <button key={item} onClick={() => toggleListValue('homeEquipment', item)} className={`min-h-[54px] rounded-2xl border px-3 text-xs font-black uppercase tracking-widest transition-all ${formData.homeEquipment.includes(item) ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(formData.trainingPlace === 'gym' || formData.trainingPlace === 'hybrid') && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-3 font-bold">Quais grupos quer priorizar?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen'].map(item => (
                    <button key={item} onClick={() => toggleListValue('gymFocus', item, 3)} className={`min-h-[54px] rounded-2xl border px-3 text-xs font-black uppercase tracking-widest transition-all ${formData.gymFocus.includes(item) ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Alguma limitação física?</label>
              <CustomSelect value={formData.limitations} onChange={(v) => setFormData({...formData, limitations: v})} options={PHYSICAL_LIMITATION_OPTIONS.map(v => ({ value: v, label: v }))} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="flex-1 bg-white/5 text-text-secondary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">Voltar</button>
              <button onClick={() => setStep(5)} disabled={!isStep4Valid} className="flex-1 bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-30 shadow-lg shadow-primary/20">Ver protocolo</button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="bg-primary/10 border border-primary/20 rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {recommendation.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-background/60 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest">{tag}</span>
                ))}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{recommendation.title}</h3>
                <p className="text-sm text-text-secondary mt-2 leading-relaxed">{recommendation.why}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendation.weeklySplit.map((day, idx) => (
                  <div key={day} className="bg-background/50 border border-white/10 rounded-2xl p-4">
                    <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">Dia {idx + 1}</div>
                    <div className="font-black mt-1">{day}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">Primeiros exercícios sugeridos</div>
                {recommendation.exercises.map(ex => (
                  <div key={ex} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    {ex}
                  </div>
                ))}
              </div>
            </div>

            <label className="block text-xs uppercase tracking-widest text-text-muted font-bold">Plano inicial</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['Iniciante', 'Pro', 'Elite'] as Plan[]).map((p) => (
                <button key={p} onClick={() => setFormData({...formData, plano: p})} className={`p-4 rounded-2xl border transition-all text-left ${formData.plano === p ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}>
                  <div className="font-black">{p}</div>
                  <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">{p === 'Iniciante' ? 'Grátis' : p === 'Pro' ? 'Mais recursos' : 'Completo'}</div>
                </button>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setStep(4)} className="flex-1 bg-white/5 text-text-secondary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">Voltar</button>
              <button onClick={handleSubmit} disabled={!isFormValid || isSubmitting} className="flex-1 bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2">
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Começar'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

type WellnessLevel = 'low' | 'medium' | 'high';

type DailyWellnessCheckIn = {
  date: string;
  energy: WellnessLevel;
  sleepHours: number;
  sleepQuality: WellnessLevel;
  soreness: WellnessLevel;
  updatedAt: string;
};

type WellnessCheckInDraft = {
  energy: WellnessLevel | '';
  sleepHours: number;
  sleepQuality: WellnessLevel | '';
  soreness: WellnessLevel | '';
};

function DashboardView({ profile, language, onUpgrade, onStartWorkout, onViewNutrition, onViewProgress }: {
  profile: UserProfile,
  language: LanguageCode,
  onUpgrade: () => void,
  onStartWorkout: (workoutId?: string, mode?: HomeTrainingMode) => void,
  onViewNutrition: () => void,
  onViewProgress: () => void
}) {
  const { isAdmin, simulatedPlan, user, updateProfile } = useAuth();
  const effectivePlan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null);
  const dashboardText = APP_TRANSLATIONS[language].dashboard;
  const locale = language === 'pt-BR' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';

  const getFirstName = () => {
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || profile.name || 'Usuário';
    return fullName.split(' ')[0].toUpperCase();
  };

  const [weeklyCalData, setWeeklyCalData] = useState<{ day: string; date: string; calories: number; protein: number; carbs: number; fat: number; isToday: boolean; isFuture: boolean }[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [trainingOnboarding, setTrainingOnboarding] = useState<any>(null);
  const storageUserId = user?.id || profile.id || 'guest';
  const weeklyStorageKey = `weekly_workouts_${storageUserId}`;
  const weeklyDoneStorageKey = `weekly_workouts_done_${storageUserId}`;
  const wellnessStorageKey = `wellness_checkins_${storageUserId}`;
  const todayCheckInDate = format(new Date(), 'yyyy-MM-dd');
  const [savedWeeklyWorkouts, setSavedWeeklyWorkouts] = useState<WeeklyWorkoutSlot[]>(() => safeParseArray<WeeklyWorkoutSlot>(weeklyStorageKey));
  const [savedWeeklyDoneIds, setSavedWeeklyDoneIds] = useState<string[]>(() => safeParseArray<string>(weeklyDoneStorageKey));
  const [dashboardWorkoutPendingId, setDashboardWorkoutPendingId] = useState<string | null>(null);
  const [dailyCheckIn, setDailyCheckIn] = useState<DailyWellnessCheckIn | null>(() => {
    try {
      const history = JSON.parse(localStorage.getItem(wellnessStorageKey) || '{}') as Record<string, DailyWellnessCheckIn>;
      return history[todayCheckInDate] || null;
    } catch {
      return null;
    }
  });
  const [showWellnessCheckIn, setShowWellnessCheckIn] = useState(false);
  const [checkInDraft, setCheckInDraft] = useState<WellnessCheckInDraft>({
    energy: '',
    sleepHours: 0,
    sleepQuality: '',
    soreness: '',
  });
  const savedBodyMeasurements = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(`body_measurements_${storageUserId}`) || '[]') as BodyMeasurement[];
      return Array.isArray(parsed) ? parsed.filter(item => typeof item.weight === 'number').sort((a, b) => a.date.localeCompare(b.date)) : [];
    } catch {
      return [];
    }
  })();
  const latestWeightEntry = savedBodyMeasurements[savedBodyMeasurements.length - 1];
  const previousWeightEntry = savedBodyMeasurements[savedBodyMeasurements.length - 2];
  const displayedWeight = latestWeightEntry?.weight ?? profile.weight;
  const weightDifference = latestWeightEntry?.weight !== undefined && previousWeightEntry?.weight !== undefined
    ? latestWeightEntry.weight - previousWeightEntry.weight
    : null;
  const weightSubValue = weightDifference !== null
    ? dashboardText.previousWeightDelta(`${weightDifference > 0 ? '+' : ''}${weightDifference.toLocaleString(locale, { maximumFractionDigits: 1 })}`)
    : latestWeightEntry
      ? dashboardText.weightRegisteredAt(new Date(`${latestWeightEntry.date}T12:00:00`).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }))
      : dashboardText.weightEmpty;

  const openWellnessCheckIn = () => {
    setCheckInDraft({
      energy: dailyCheckIn?.energy || '',
      sleepHours: dailyCheckIn?.sleepHours || 0,
      sleepQuality: dailyCheckIn?.sleepQuality || '',
      soreness: dailyCheckIn?.soreness || '',
    });
    setShowWellnessCheckIn(true);
    trackEvent('dashboard_metric_card_click', { card: 'energy' });
    trackEvent('wellness_checkin_opened', { has_checkin_today: !!dailyCheckIn });
  };

  const openDashboardMetric = (card: 'weight' | 'workout' | 'nutrition', action: () => void) => {
    trackEvent('dashboard_metric_card_click', { card });
    action();
  };

  const wellnessLabel = (level?: WellnessLevel | '') => {
    if (level === 'high') return dashboardText.high;
    if (level === 'medium') return dashboardText.medium;
    if (level === 'low') return dashboardText.low;
    return dashboardText.notProvided;
  };

  const saveWellnessCheckIn = () => {
    if (!checkInDraft.energy || !checkInDraft.sleepQuality || !checkInDraft.soreness || checkInDraft.sleepHours <= 0) return;
    const nextCheckIn: DailyWellnessCheckIn = {
      date: todayCheckInDate,
      energy: checkInDraft.energy,
      sleepHours: checkInDraft.sleepHours,
      sleepQuality: checkInDraft.sleepQuality,
      soreness: checkInDraft.soreness,
      updatedAt: new Date().toISOString(),
    };

    try {
      const history = JSON.parse(localStorage.getItem(wellnessStorageKey) || '{}') as Record<string, DailyWellnessCheckIn>;
      history[todayCheckInDate] = nextCheckIn;
      const recentHistory = Object.fromEntries(Object.entries(history).sort(([a], [b]) => a.localeCompare(b)).slice(-60));
      localStorage.setItem(wellnessStorageKey, JSON.stringify(recentHistory));
    } catch {
      // O check-in continua disponível na sessão mesmo se o armazenamento local falhar.
    }

    setDailyCheckIn(nextCheckIn);
    setShowWellnessCheckIn(false);
    trackEvent('wellness_checkin_saved', {
      energy: nextCheckIn.energy,
      sleep_quality: nextCheckIn.sleepQuality,
      sleep_hours: nextCheckIn.sleepHours,
      soreness: nextCheckIn.soreness,
    });
  };

  useEffect(() => {
    if (!showWellnessCheckIn) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowWellnessCheckIn(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [showWellnessCheckIn]);

  const resolveWorkoutsByPlan = (plan: string | undefined) => {
    const p = plan || 'Iniciante';
    if (trainingOnboarding?.trainingPlace === 'home') {
      const level: Level = p === 'Elite' ? 'Avançado' : p === 'Pro' ? 'Intermediário' : 'Iniciante';
      return buildHomeWorkouts(profile, trainingOnboarding, p as Plan, level);
    }
    const filtered = ALL_WORKOUTS.filter(w =>
      w.planRequired === p ||
      (p === 'free' && w.planRequired === 'Iniciante') ||
      (p === 'Admin' && w.planRequired === 'Elite')
    );
    // Garante que sempre retorna pelo menos os treinos Iniciante
    return filtered.length > 0 ? filtered : ALL_WORKOUTS.filter(w => w.planRequired === 'Iniciante');
  };

  const resolveAllHomeWorkouts = () => {
    if (trainingOnboarding?.trainingPlace !== 'home') return [];
    const plan = (effectivePlan === 'free' ? 'Iniciante' : effectivePlan) as Plan;
    const level: Level = plan === 'Elite' || plan === 'Admin' ? 'Avançado' : plan === 'Pro' ? 'Intermediário' : 'Iniciante';
    return [
      ...buildHomeWorkouts(profile, trainingOnboarding, plan, level),
      ...buildHomeRecoveryWorkouts(trainingOnboarding, plan, level, 'mobility'),
      ...buildHomeRecoveryWorkouts(trainingOnboarding, plan, level, 'stretching'),
    ];
  };

  const dashboardWorkoutCatalog = [...resolveAllHomeWorkouts(), ...ALL_WORKOUTS];
  const scheduledWorkoutDetails = savedWeeklyWorkouts
    .map(slot => ({
      ...slot,
      workout: dashboardWorkoutCatalog.find(workout => workout.id === slot.workoutId),
    }))
    .filter((slot): slot is WeeklyWorkoutSlot & { workout: Workout } => Boolean(slot.workout))
    .sort((a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day));
  const todayName = WEEK_DAYS[(new Date().getDay() + 6) % 7];
  const todayScheduledWorkout = scheduledWorkoutDetails.find(slot => slot.day === todayName);

  const firstWorkout = resolveWorkoutsByPlan(effectivePlan || 'Iniciante')[0] ?? ALL_WORKOUTS[0];
  const [nextWorkout, setNextWorkout] = useState({
    name: firstWorkout?.name ?? 'Treino do Dia',
    muscleGroup: firstWorkout?.muscleGroup ?? '',
  });

  useEffect(() => {
    // Atualiza fallback sempre que o plano mudar
    const fallback = resolveWorkoutsByPlan(effectivePlan)[0] ?? ALL_WORKOUTS[0];
    if (fallback) setNextWorkout({ name: fallback.name, muscleGroup: fallback.muscleGroup });

    if (!user) return;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    supabase
      .from('workout_logs')
      .select('id, workoutId', { count: 'exact' })
      .eq('userUid', user.id)
      .gte('completedAt', monday.toISOString())
      .order('completedAt', { ascending: false })
      .then(({ data, count, error }) => {
        if (error) return;
        if (count !== null) setWeeklyCount(count);
        const planWorkouts = resolveWorkoutsByPlan(effectivePlan);
        const trainedIds = (data ?? []).map((l: any) => l.workoutId);
        const trainedGroups = new Set(
          ALL_WORKOUTS.filter(w => trainedIds.includes(w.id)).map(w => w.muscleGroup)
        );
        const next = planWorkouts.find(w => !trainedGroups.has(w.muscleGroup)) ?? planWorkouts[0];
        if (next) setNextWorkout({ name: next.name, muscleGroup: next.muscleGroup });
      })
      .then(undefined, () => {});
  }, [user, effectivePlan, trainingOnboarding]); // eslint-disable-line react-hooks/exhaustive-deps

  const WEEKLY_TARGET = 5;
  const weeklyPercent = Math.min(100, Math.round((weeklyCount / WEEKLY_TARGET) * 100));

  const getScheduledWorkoutMode = (workoutId: string): HomeTrainingMode => {
    if (workoutId.startsWith('home-mobility')) return 'mobility';
    if (workoutId.startsWith('home-stretch')) return 'stretching';
    return 'training';
  };

  const toggleDashboardWorkoutDone = async (workoutId: string) => {
    if (dashboardWorkoutPendingId) return;
    const alreadyDone = savedWeeklyDoneIds.includes(workoutId);
    const nextDoneIds = savedWeeklyDoneIds.includes(workoutId)
      ? savedWeeklyDoneIds.filter(id => id !== workoutId)
      : [...savedWeeklyDoneIds, workoutId];
    setSavedWeeklyDoneIds(nextDoneIds);
    localStorage.setItem(weeklyDoneStorageKey, JSON.stringify(nextDoneIds));
    window.dispatchEvent(new Event('ironshape:weekly-plan-updated'));

    if (alreadyDone || !user) return;
    const workout = dashboardWorkoutCatalog.find(item => item.id === workoutId);
    if (!workout) return;

    const completedIds = safeParseArray<string>('completedWorkouts');
    const awardedIds = safeParseArray<string>('awardedWorkoutPoints');
    const alreadyAwarded = awardedIds.includes(workoutId);
    const planPointsLimit = getPlanPointsLimit(effectivePlan);
    const nextPoints = alreadyAwarded
      ? profile.points || 0
      : Math.min(planPointsLimit, (profile.points || 0) + 100);

    setDashboardWorkoutPendingId(workoutId);
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = profile.lastWorkoutDate === yesterday.toISOString().split('T')[0];
      const nextStreak = profile.lastWorkoutDate === today ? profile.streak : isConsecutive ? profile.streak + 1 : 1;
      await dataService.addWorkoutLog({
        userUid: user.id,
        workoutId,
        workoutName: workout.name,
        completedAt: new Date().toISOString(),
        duration: parseInt(workout.duration) || 0,
      });
      await updateProfile({
        points: nextPoints,
        streak: nextStreak,
        lastWorkoutDate: today,
      });
      localStorage.setItem('completedWorkouts', JSON.stringify(Array.from(new Set([...completedIds, workoutId]))));
      if (!alreadyAwarded && nextPoints > (profile.points || 0)) {
        localStorage.setItem('awardedWorkoutPoints', JSON.stringify(Array.from(new Set([...awardedIds, workoutId]))));
      }
      setWeeklyCount(prev => prev + 1);
      trackEvent('workout_completed', {
        workout_id: workoutId,
        workout_name: workout.name,
        muscle_group: workout.muscleGroup,
        plan: effectivePlan,
        points_after: nextPoints,
        source: 'dashboard_weekly_plan',
      });
    } catch (error) {
      console.error('Erro ao concluir treino pela tela inicial:', error);
      const rollbackIds = nextDoneIds.filter(id => id !== workoutId);
      setSavedWeeklyDoneIds(rollbackIds);
      localStorage.setItem(weeklyDoneStorageKey, JSON.stringify(rollbackIds));
    } finally {
      setDashboardWorkoutPendingId(null);
      window.dispatchEvent(new Event('ironshape:weekly-plan-updated'));
    }
  };

  const calorieGoal = (() => {
    const w = profile.weight || 70;
    const h = profile.height || 175;
    const a = profile.age || 25;
    const bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    const tdee = bmr * 1.55;
    const g = (profile.goal || '').toLowerCase();
    if (g.includes('emagrec') || g.includes('perd') || g.includes('defin')) return Math.round(tdee - 500);
    if (g.includes('ganho') || g.includes('mass') || g.includes('hipert')) return Math.round(tdee + 300);
    return Math.round(tdee);
  })();

  useEffect(() => {
    if (!user?.id) return;
    const syncTrainingOnboarding = () => {
      try {
        setTrainingOnboarding(JSON.parse(localStorage.getItem(`training_onboarding_${user.id}`) || 'null'));
      } catch {
        setTrainingOnboarding(null);
      }
    };
    syncTrainingOnboarding();
    window.addEventListener('ironshape:training-place-changed', syncTrainingOnboarding);
    return () => window.removeEventListener('ironshape:training-place-changed', syncTrainingOnboarding);
  }, [user?.id]);

  useEffect(() => {
    const syncWeeklyPlan = () => {
      setSavedWeeklyWorkouts(safeParseArray<WeeklyWorkoutSlot>(weeklyStorageKey));
      setSavedWeeklyDoneIds(safeParseArray<string>(weeklyDoneStorageKey));
    };
    syncWeeklyPlan();
    window.addEventListener('storage', syncWeeklyPlan);
    window.addEventListener('ironshape:weekly-plan-updated', syncWeeklyPlan);
    return () => {
      window.removeEventListener('storage', syncWeeklyPlan);
      window.removeEventListener('ironshape:weekly-plan-updated', syncWeeklyPlan);
    };
  }, [weeklyStorageKey, weeklyDoneStorageKey]);

  useEffect(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    type DayLog = { calories: number; protein: number; carbs: number; fat: number };
    const build = (logMap: Map<string, DayLog>) =>
      setWeeklyCalData(weekDates.map((date, i) => {
        const log = logMap.get(date);
        return {
          day: labels[i], date,
          calories: log?.calories ?? 0,
          protein: log?.protein ?? 0,
          carbs: log?.carbs ?? 0,
          fat: log?.fat ?? 0,
          isToday: date === todayStr,
          isFuture: date > todayStr,
        };
      }));
    const fetchCals = async () => {
      if (!profile.id || !isSupabaseConfigured) { build(new Map()); return; }
      try {
        const { data } = await supabase
          .from('nutrition_logs')
          .select('date, calories, protein, carbs, fat')
          .eq('user_id', profile.id)
          .gte('date', weekDates[0])
          .lte('date', weekDates[6]);
        build(new Map((data ?? []).map((l: any) => [l.date, { calories: l.calories, protein: l.protein, carbs: l.carbs, fat: l.fat }])));
      } catch { build(new Map()); }
    };
    fetchCals();
  }, [profile.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      {effectivePlan === 'free' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
              <Zap className="text-primary" size={24} />
            </div>
            <div>
              <h4 className="font-black text-lg uppercase tracking-tight">{dashboardText.upgradeTitle}</h4>
              <p className="text-sm text-text-secondary">{dashboardText.upgradeText}</p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="bg-primary text-text-primary px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 whitespace-nowrap"
          >
            {dashboardText.viewPlans}
          </button>
        </motion.div>
      )}

      {trainingOnboarding?.recommendation && (
        <section className="bg-surface border border-primary/20 rounded-[32px] p-6 md:p-8 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {trainingOnboarding.recommendation.tags?.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest">{tag}</span>
                ))}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{trainingOnboarding.recommendation.title}</h2>
                <p className="text-sm text-text-secondary mt-2 max-w-3xl leading-relaxed">{trainingOnboarding.recommendation.why}</p>
              </div>
            </div>
            <button
              onClick={() => onStartWorkout()}
              className="bg-primary text-text-primary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all min-h-[48px]"
            >
              {dashboardText.startProtocol}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {trainingOnboarding.recommendation.weeklySplit?.slice(0, 3).map((day: string, idx: number) => (
              <div key={day} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">{dashboardText.day} {idx + 1}</div>
                <div className="font-black mt-1">{day}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[32px] md:rounded-[48px] bg-surface border border-white/5 p-6 md:p-12">
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20">
          <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-primary/30 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
                {effectivePlan} {dashboardText.member}
              </span>
              {isAdmin && (
                <span className="px-3 py-1 bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
                  {dashboardText.adminMode}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter leading-none">
              {dashboardText.greeting}, <br />
              <span className="text-primary">{getFirstName()}!</span>
            </h1>
            <p className="text-text-secondary text-base md:text-lg max-w-md leading-relaxed">
              {dashboardText.weeklyQuote} <span className="text-text-primary font-bold">{dashboardText.weeklyProgress(weeklyPercent, weeklyCount, WEEKLY_TARGET)}</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => todayScheduledWorkout
                  ? onStartWorkout(todayScheduledWorkout.workoutId, getScheduledWorkoutMode(todayScheduledWorkout.workoutId))
                  : onStartWorkout()}
                className="bg-primary text-text-primary px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary-hover hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[56px]"
              >
                {dashboardText.startTodayWorkout}
                <ArrowRight size={18} />
              </button>
              <div className="flex items-center justify-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/10 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-primary" />
                  <span className="font-black text-lg">{profile.streak}</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Trophy size={20} className="text-primary" />
                  <span className="font-black text-lg">{profile.points}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block relative">
            <div className="w-64 h-64 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
                <circle cx="128" cy="128" r="112" fill="none" stroke="rgba(255,106,0,0.15)" strokeWidth="8" />
                <circle
                  cx="128" cy="128" r="112" fill="none"
                  stroke="#FF6A00" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 112}`}
                  strokeDashoffset={`${2 * Math.PI * 112 * (1 - weeklyPercent / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="text-center z-10">
                <div className="text-5xl font-black">{weeklyPercent}%</div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">{dashboardText.weeklyGoal}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-white/10 rounded-[28px] md:rounded-[40px] p-4 sm:p-6 md:p-8 space-y-5 shadow-xl shadow-black/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <CalendarDays size={21} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight">{dashboardText.weeklyWorkoutsTitle}</h2>
                {scheduledWorkoutDetails.length > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-text-muted">
                    {savedWeeklyDoneIds.filter(id => scheduledWorkoutDetails.some(slot => slot.workoutId === id)).length}/{scheduledWorkoutDetails.length}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                {dashboardText.weeklyWorkoutsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => onStartWorkout()}
            className="hidden sm:flex min-h-[44px] px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-primary/30 transition-all items-center gap-2 shrink-0"
          >
            <SlidersHorizontal size={15} />
            {dashboardText.organize}
          </button>
        </div>

        {scheduledWorkoutDetails.length > 0 ? (
          <>
            <div className={`rounded-[24px] border p-4 sm:p-5 ${
              todayScheduledWorkout && savedWeeklyDoneIds.includes(todayScheduledWorkout.workoutId)
                ? 'bg-success/10 border-success/25'
                : 'bg-gradient-to-br from-primary/15 to-primary/[0.04] border-primary/25'
            }`}>
              {todayScheduledWorkout ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest">{dashboardText.today}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{todayName}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">{translateWorkoutName(todayScheduledWorkout.workout.name, language)}</h3>
                      <p className="text-xs sm:text-sm text-text-secondary mt-1">
                        {todayScheduledWorkout.workout.muscleGroup} • {todayScheduledWorkout.workout.duration} • {todayScheduledWorkout.workout.exercises.length} {dashboardText.exercises}
                      </p>
                    </div>
                    {savedWeeklyDoneIds.includes(todayScheduledWorkout.workoutId) && (
                      <div className="w-10 h-10 rounded-2xl bg-success text-white flex items-center justify-center shrink-0">
                        <Check size={20} />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <button
                      onClick={() => onStartWorkout(todayScheduledWorkout.workoutId, getScheduledWorkoutMode(todayScheduledWorkout.workoutId))}
                      className="min-h-[50px] rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Play size={17} />
                      {savedWeeklyDoneIds.includes(todayScheduledWorkout.workoutId) ? dashboardText.openWorkout : dashboardText.startNow}
                    </button>
                    <button
                      onClick={() => toggleDashboardWorkoutDone(todayScheduledWorkout.workoutId)}
                      disabled={dashboardWorkoutPendingId === todayScheduledWorkout.workoutId}
                      className={`min-w-[50px] min-h-[50px] rounded-2xl border flex items-center justify-center transition-all ${
                        savedWeeklyDoneIds.includes(todayScheduledWorkout.workoutId)
                          ? 'bg-success/15 border-success/30 text-success'
                          : 'bg-white/5 border-white/10 text-text-secondary hover:text-success'
                      }`}
                      aria-label={savedWeeklyDoneIds.includes(todayScheduledWorkout.workoutId) ? dashboardText.unmarkDone : dashboardText.markDone}
                    >
                      {dashboardWorkoutPendingId === todayScheduledWorkout.workoutId
                        ? <Loader2 size={20} className="animate-spin" />
                        : <CheckCircle2 size={20} />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-text-muted flex items-center justify-center shrink-0">
                    <Coffee size={20} />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-primary">{dashboardText.today}</div>
                    <h3 className="text-lg font-black">{dashboardText.restDay}</h3>
                    <p className="text-xs text-text-muted mt-1">{dashboardText.restDayText}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1">
              {WEEK_DAYS.map(day => {
                const slot = scheduledWorkoutDetails.find(item => item.day === day);
                const isToday = day === todayName;
                const isDone = !!slot && savedWeeklyDoneIds.includes(slot.workoutId);
                return (
                  <button
                    key={day}
                    onClick={() => slot && onStartWorkout(slot.workoutId, getScheduledWorkoutMode(slot.workoutId))}
                    disabled={!slot}
                    className={`shrink-0 w-[138px] sm:w-[160px] min-h-[118px] rounded-2xl border p-3.5 text-left snap-start transition-all ${
                      isDone
                        ? 'bg-success/10 border-success/25'
                        : isToday
                          ? 'bg-primary/10 border-primary/30'
                          : slot
                            ? 'bg-white/5 border-white/10 hover:border-white/20'
                            : 'bg-white/[0.02] border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-text-muted'}`}>{day.slice(0, 3)}</span>
                      {isDone && <CheckCircle2 size={15} className="text-success" />}
                    </div>
                    <div className="mt-3 text-sm font-black leading-tight line-clamp-2">{slot?.workout ? translateWorkoutName(slot.workout.name, language) : dashboardText.rest}</div>
                    <div className="mt-2 text-[9px] font-bold text-text-muted line-clamp-1">{slot ? slot.workout.muscleGroup : dashboardText.noWorkout}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onStartWorkout()}
              className="sm:hidden w-full min-h-[46px] rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-text-secondary flex items-center justify-center gap-2"
            >
              <SlidersHorizontal size={15} />
              {dashboardText.organizeWeek}
            </button>
          </>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <CalendarPlus size={25} />
            </div>
            <div>
              <h3 className="text-lg font-black">{dashboardText.buildWeek}</h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-md mx-auto leading-relaxed">{dashboardText.buildWeekText}</p>
            </div>
            <button
              onClick={() => onStartWorkout()}
              className="w-full sm:w-auto min-h-[50px] px-6 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all inline-flex items-center justify-center gap-2"
            >
              <PlusCircle size={17} />
              {dashboardText.chooseWorkouts}
            </button>
          </div>
        )}
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricCard 
          label={dashboardText.currentWeight}
          value={`${displayedWeight.toLocaleString(locale)} kg`}
          subValue={weightSubValue}
          icon={<TrendingUp size={20} />}
          onClick={() => openDashboardMetric('weight', onViewProgress)}
          actionLabel={dashboardText.updateWeight}
        />
        <DashboardMetricCard
          label={dashboardText.nextWorkout}
          value={todayScheduledWorkout ? translateWorkoutName(todayScheduledWorkout.workout.name, language) : translateWorkoutName(nextWorkout.name, language)}
          subValue={todayScheduledWorkout ? `${todayName} • ${translateMuscleGroup(todayScheduledWorkout.workout.muscleGroup, language)}` : translateMuscleGroup(nextWorkout.muscleGroup, language)}
          icon={<Calendar size={20} />}
          onClick={() => openDashboardMetric('workout', () => todayScheduledWorkout
            ? onStartWorkout(todayScheduledWorkout.workoutId, getScheduledWorkoutMode(todayScheduledWorkout.workoutId))
            : onStartWorkout())}
          actionLabel={dashboardText.openWorkout}
        />
        <DashboardMetricCard 
          label={dashboardText.dailyCalories}
          value={`${calorieGoal.toLocaleString(locale)} kcal`}
          subValue={profile.goal?.toLowerCase().includes('emagrec') ? dashboardText.calorieDeficitGoal : dashboardText.calorieGoal(calorieGoal.toLocaleString(locale))}
          icon={<Apple size={20} />} 
          onClick={() => openDashboardMetric('nutrition', onViewNutrition)}
          actionLabel={dashboardText.viewNutrition}
        />
        <DashboardMetricCard 
          label={dashboardText.energyLevel}
          value={wellnessLabel(dailyCheckIn?.energy)}
          subValue={dailyCheckIn
            ? dashboardText.sleepCheckIn(dailyCheckIn.sleepHours.toLocaleString(locale))
            : dashboardText.checkInPrompt}
          icon={<Zap size={20} />}
          onClick={openWellnessCheckIn}
          actionLabel={dailyCheckIn ? dashboardText.editCheckIn : dashboardText.doCheckIn}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calorias da Semana */}
        <div className="lg:col-span-2 bg-surface p-8 rounded-[40px] border border-white/5 space-y-6">
          <div>
            <h3 className="text-xl font-black tracking-tight uppercase">{dashboardText.weekCalories}</h3>
            <p className="text-sm text-text-muted">{dashboardText.dailyGoal(calorieGoal.toLocaleString(locale))}</p>
          </div>

          <div className="h-[280px] w-full relative">
            {weeklyCalData.every(d => d.calories === 0) && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <p className="text-sm text-text-muted font-bold text-center px-4">{dashboardText.logMealsForChart}</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyCalData} margin={{ top: 28, right: 4, left: -20, bottom: 0 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#6F6F6F"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#6F6F6F"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => v === 0 ? '' : `${v}`}
                  domain={[0, (dataMax: number) => Math.max(dataMax, calorieGoal) * 1.15]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121212', border: '1px solid #ffffff10', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={(value: number, _: string, props: any) => {
                    if (props.payload?.isFuture || value === 0) return ['—', dashboardText.calories];
                    return [`${value.toLocaleString(locale)} kcal`, dashboardText.calories];
                  }}
                />
                <ReferenceLine y={calorieGoal} stroke="#FF6A00" strokeDasharray="5 4" strokeOpacity={0.45} strokeWidth={1.5} />
                <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
                  {weeklyCalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isFuture || entry.calories === 0 ? '#2a2a2a' : entry.calories > calorieGoal ? '#E24B4A' : '#E05A00'}
                      fillOpacity={entry.isFuture ? 0.5 : 1}
                    />
                  ))}
                  <LabelList
                    dataKey="calories"
                    position="top"
                    content={(props: any) => {
                      const { x, y, width, value, index } = props;
                      const entry = weeklyCalData[index];
                      if (!entry?.isToday || !value) return null;
                      return (
                        <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#FF6A00" fontSize={11} fontWeight={700}>
                          {value.toLocaleString(locale)}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {weeklyCalData.some(d => d.calories > 0 && !d.isFuture) && (() => {
            const daysWithData = weeklyCalData.filter(d => d.calories > 0 && !d.isFuture);
            const avg = Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length);
            const best = Math.max(...daysWithData.map(d => d.calories));
            return (
              <div className="flex gap-8 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{dashboardText.weeklyAverage}</p>
                  <p className="text-base font-black mt-0.5">{avg.toLocaleString(locale)} <span className="text-text-muted text-xs font-bold">kcal</span></p>
                </div>
                <div className="w-px bg-white/5" />
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">{dashboardText.bestDay}</p>
                  <p className="text-base font-black mt-0.5">{best.toLocaleString(locale)} <span className="text-text-muted text-xs font-bold">kcal</span></p>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Nutrition Preview */}
        {(() => {
          const todayLog = weeklyCalData.find(d => d.isToday);
          const todayCals = todayLog?.calories ?? 0;
          const calPct = calorieGoal > 0 ? Math.min(100, Math.round((todayCals / calorieGoal) * 100)) : 0;
          return (
            <div className="bg-surface p-8 rounded-[40px] border border-white/5 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight uppercase">{dashboardText.nutrition}</h3>
                <button
                  onClick={onViewNutrition}
                  className="text-primary text-xs font-black uppercase tracking-widest hover:text-primary-hover transition-colors"
                >
                  {dashboardText.viewAll}
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-text-muted">{dashboardText.calories}</span>
                    <span className="text-text-primary">
                      {todayCals > 0 ? todayCals.toLocaleString(locale) : '—'} / {calorieGoal.toLocaleString(locale)} kcal
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${calPct}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: dashboardText.proteinShort, value: todayLog?.protein ?? 0, unit: 'g' },
                    { label: dashboardText.carbsShort, value: todayLog?.carbs ?? 0, unit: 'g' },
                    { label: dashboardText.fatShort, value: todayLog?.fat ?? 0, unit: 'g' },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-text-muted font-black uppercase mb-1">{label}</div>
                      <div className="text-sm font-black">{value > 0 ? `${value}g` : '—'}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-4">
                  <h4 className="text-xs font-black text-text-muted uppercase tracking-widest">{dashboardText.nextMeal}</h4>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Utensils size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-muted">{dashboardText.logMeals}</div>
                      <div className="text-[10px] text-text-muted">{dashboardText.nutritionModule}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <AnimatePresence>
        {showWellnessCheckIn && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWellnessCheckIn(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="wellness-checkin-title"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[32px] sm:rounded-[40px] border border-white/10 bg-surface p-5 sm:p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-7">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Zap size={24} />
                  </div>
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">Check-in diário</div>
                    <h2 id="wellness-checkin-title" className="text-2xl sm:text-3xl font-black tracking-tight">Como você está hoje?</h2>
                    <p className="mt-1 text-xs sm:text-sm text-text-muted leading-relaxed">Suas respostas ajudam a interpretar sua disposição antes do treino.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWellnessCheckIn(false)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-text-primary flex items-center justify-center shrink-0"
                  aria-label="Fechar check-in"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-7">
                <fieldset className="space-y-3">
                  <legend className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Seu nível de energia</legend>
                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      { value: 'low', label: 'Baixa', description: 'Pouca disposição' },
                      { value: 'medium', label: 'Média', description: 'Disposição normal' },
                      { value: 'high', label: 'Alta', description: 'Muita disposição' },
                    ] as { value: WellnessLevel; label: string; description: string }[]).map(option => (
                      <button
                        type="button"
                        key={option.value}
                        aria-pressed={checkInDraft.energy === option.value}
                        onClick={() => setCheckInDraft(current => ({ ...current, energy: option.value }))}
                        className={`min-h-[76px] rounded-2xl border p-3 text-left transition-all ${
                          checkInDraft.energy === option.value
                            ? 'bg-primary/15 border-primary text-primary shadow-lg shadow-primary/10'
                            : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/25'
                        }`}
                      >
                        <div className="text-sm font-black">{option.label}</div>
                        <div className="mt-1 text-[9px] leading-tight opacity-70">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="space-y-3">
                  <label htmlFor="wellness-sleep-hours" className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Quantas horas você dormiu?</label>
                  <div className="relative">
                    <input
                      id="wellness-sleep-hours"
                      type="number"
                      min="1"
                      max="14"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="Ex.: 7.5"
                      value={checkInDraft.sleepHours || ''}
                      onChange={(event) => setCheckInDraft(current => ({ ...current, sleepHours: Math.min(14, Math.max(0, Number(event.target.value))) }))}
                      className="w-full min-h-[56px] rounded-2xl border border-white/10 bg-white/5 px-5 pr-16 text-base font-black outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-text-muted">HORAS</span>
                  </div>
                </div>

                <fieldset className="space-y-3">
                  <legend className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Qualidade do sono</legend>
                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      { value: 'low', label: 'Ruim' },
                      { value: 'medium', label: 'Regular' },
                      { value: 'high', label: 'Boa' },
                    ] as { value: WellnessLevel; label: string }[]).map(option => (
                      <button
                        type="button"
                        key={option.value}
                        aria-pressed={checkInDraft.sleepQuality === option.value}
                        onClick={() => setCheckInDraft(current => ({ ...current, sleepQuality: option.value }))}
                        className={`min-h-[48px] rounded-2xl border px-3 text-xs font-black transition-all ${
                          checkInDraft.sleepQuality === option.value
                            ? 'bg-primary/15 border-primary text-primary'
                            : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/25'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-3">
                  <legend className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Cansaço muscular</legend>
                  <div className="grid grid-cols-3 gap-2.5">
                    {([
                      { value: 'low', label: 'Baixo' },
                      { value: 'medium', label: 'Moderado' },
                      { value: 'high', label: 'Alto' },
                    ] as { value: WellnessLevel; label: string }[]).map(option => (
                      <button
                        type="button"
                        key={option.value}
                        aria-pressed={checkInDraft.soreness === option.value}
                        onClick={() => setCheckInDraft(current => ({ ...current, soreness: option.value }))}
                        className={`min-h-[48px] rounded-2xl border px-3 text-xs font-black transition-all ${
                          checkInDraft.soreness === option.value
                            ? 'bg-primary/15 border-primary text-primary'
                            : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/25'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {checkInDraft.energy && checkInDraft.sleepQuality && checkInDraft.soreness && checkInDraft.sleepHours > 0 && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/[0.07] p-4 flex items-start gap-3">
                    <Info size={18} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm leading-relaxed text-text-secondary">
                      {checkInDraft.energy === 'low' || checkInDraft.soreness === 'high'
                        ? 'Seu relato indica recuperação reduzida. Considere diminuir a carga, alongar mais e respeitar qualquer sinal de dor.'
                        : checkInDraft.sleepHours < 6 || checkInDraft.sleepQuality === 'low'
                          ? 'Seu sono pode afetar a performance hoje. Faça um aquecimento gradual e ajuste o ritmo conforme sua disposição.'
                          : checkInDraft.energy === 'high' && checkInDraft.soreness === 'low'
                            ? 'Você relata boa disposição e pouco cansaço muscular para o treino de hoje.'
                            : 'Seu relato indica disposição moderada. Comece pelo aquecimento e ajuste a intensidade conforme se sentir.'}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={saveWellnessCheckIn}
                  disabled={!checkInDraft.energy || !checkInDraft.sleepQuality || !checkInDraft.soreness || checkInDraft.sleepHours <= 0}
                  className="w-full min-h-[56px] rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {dailyCheckIn ? 'Atualizar check-in' : 'Salvar check-in'}
                </button>
                <p className="text-[10px] text-center text-text-muted leading-relaxed">Dados informados por você e salvos neste dispositivo. Este check-in não substitui avaliação profissional.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

const WEEK_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DEFAULT_WEEK_DAYS = ['Segunda', 'Quarta', 'Sexta', 'Terça', 'Quinta', 'Sábado', 'Domingo'];

type WeeklyWorkoutSlot = WeeklySchedule & {
  assignedAt: string;
};

function getWeeklyWorkoutLimit(plan: Plan, isAdmin = false) {
  if (isAdmin || plan === 'Admin' || plan === 'Elite') return 7;
  if (plan === 'Pro') return 5;
  return 3;
}

function getPlanPointsLimit(plan: Plan) {
  if (plan === 'Elite' || plan === 'Admin') return 20000;
  if (plan === 'Pro') return 10000;
  return 2000;
}

function safeParseArray<T>(key: string, fallback: T[] = []): T[] {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function FreeTrainingPhaseGate({
  points,
  limit,
  onUpgrade,
  onPrepareTest,
  testStatus,
}: {
  points: number;
  limit: number;
  onUpgrade: () => void;
  onPrepareTest?: () => void | Promise<void>;
  testStatus?: string;
}) {
  useEffect(() => {
    trackEvent('upgrade_prompt_view', {
      source: 'free_phase_gate',
      points,
      limit,
    });
  }, [points, limit]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[32px] border border-primary/25 bg-surface p-5 sm:p-7 md:p-9 shadow-2xl shadow-primary/10"
    >
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20">
              <Trophy size={28} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Primeira fase concluída</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase leading-tight">
                Sua evolução continua no Pro ou Elite
              </h2>
            </div>
          </div>

          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl">
            Você chegou aos {limit} pontos e completou a jornada inicial do IronShape. Para liberar novos protocolos, mais pontos e uma rotina de evolução contínua, escolha um dos planos.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">Conquista</div>
              <div className="mt-1 text-2xl font-black text-primary">{Math.max(points, limit)} pts</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">Próxima etapa</div>
              <div className="mt-1 text-lg font-black text-text-primary">Pro ou Elite</div>
            </div>
          </div>

          <button
            onClick={() => {
              trackEvent('click_upgrade', {
                source: 'free_phase_gate',
                plan: 'not_selected',
                points,
                limit,
              });
              onUpgrade();
            }}
            className="w-full sm:w-auto min-h-[54px] px-7 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ShieldCheck size={17} />
            Continuar minha evolução
          </button>
          {onPrepareTest && (
            <div className="space-y-2">
              <button
                onClick={onPrepareTest}
                className="w-full sm:w-auto min-h-[48px] px-6 rounded-2xl bg-white/5 border border-white/10 text-text-secondary text-[10px] font-black uppercase tracking-widest hover:text-text-primary hover:border-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <RotateCcw size={15} />
                Voltar para 1900 pts
              </button>
              {testStatus && (
                <p className="text-xs font-bold text-text-muted leading-relaxed">{testStatus}</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[28px] bg-background/70 border border-white/10 p-5 space-y-4">
          {[
            'Protocolos Pro e Elite liberados',
            'Mais pontos, ranking e histórico de evolução',
            'Planilha do atleta e recursos avançados no Elite',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <div className="mt-0.5 w-7 h-7 rounded-xl bg-success/10 border border-success/20 text-success flex items-center justify-center shrink-0">
                <Check size={14} />
              </div>
              <p className="text-sm font-bold text-text-secondary leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function CelebrationFireworks() {
  const bursts = [
    { x: '16%', y: '18%', delay: 0 },
    { x: '82%', y: '16%', delay: 0.12 },
    { x: '24%', y: '72%', delay: 0.24 },
    { x: '78%', y: '72%', delay: 0.36 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bursts.map((burst, burstIndex) => (
        <div
          key={`${burst.x}-${burst.y}`}
          className="absolute"
          style={{ left: burst.x, top: burst.y }}
        >
          {[0, 1, 2, 3, 4, 5, 6, 7].map((spark) => (
            <motion.span
              key={spark}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0.9, 0],
                scale: [0.2, 1, 0.65, 0.15],
                x: Math.cos((spark / 8) * Math.PI * 2) * (44 + burstIndex * 8),
                y: Math.sin((spark / 8) * Math.PI * 2) * (44 + burstIndex * 8),
              }}
              transition={{
                duration: 1.35,
                delay: burst.delay + spark * 0.025,
                repeat: Infinity,
                repeatDelay: 1.7,
                ease: 'easeOut',
              }}
              className={`absolute w-1.5 h-1.5 rounded-full ${spark % 2 === 0 ? 'bg-primary' : 'bg-success'} shadow-[0_0_14px_rgba(255,106,0,0.75)]`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function WorkoutsView({ profile, language, onUpgrade }: { profile: UserProfile, language: LanguageCode, onUpgrade: () => void }) {
  const { isAdmin, simulatedPlan, user, updateProfile } = useAuth();
  const effectivePlan: Plan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null) || 'Iniciante';
  const workoutsText = APP_TRANSLATIONS[language].workouts;
  const locale = language === 'pt-BR' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US';
  const hasPro = effectivePlan === 'Pro' || effectivePlan === 'Elite' || isAdmin;
  const isFreePointsPlan = effectivePlan === 'free' || effectivePlan === 'Iniciante';
  const FREE_POINTS_LIMIT = 2000;
  const planPointsLimit = getPlanPointsLimit(effectivePlan);
  const storageUserId = user?.id || profile.id || 'guest';
  const weeklyStorageKey = `weekly_workouts_${storageUserId}`;
  const favoriteStorageKey = `favorite_workouts_${storageUserId}`;
  const weeklyDoneStorageKey = `weekly_workouts_done_${storageUserId}`;
  const weeklyWorkoutLimit = getWeeklyWorkoutLimit(effectivePlan, isAdmin);
  const [selectedPlanTab, setSelectedPlanTab] = useState<Plan>(
    (effectivePlan === 'free' || !effectivePlan) ? 'Iniciante' : effectivePlan
  );
  const initialLevel: Level = effectivePlan === 'Elite' ? 'Avançado' : effectivePlan === 'Pro' ? 'Intermediário' : 'Iniciante';
  const [selectedLevel, setSelectedLevel] = useState<Level>(initialLevel);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'Todos'>('Todos');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'workouts' | 'ia' | 'history' | 'ranking' | 'spreadsheet' | 'early' | 'registro'>('workouts');
  const [activeHomeMode, setActiveHomeMode] = useState<HomeTrainingMode>('training');
  const [favoriteWorkoutIds, setFavoriteWorkoutIds] = useState<string[]>(() => safeParseArray<string>(favoriteStorageKey));
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WeeklyWorkoutSlot[]>(() => safeParseArray<WeeklyWorkoutSlot>(weeklyStorageKey));
  const [weeklyCompletedIds, setWeeklyCompletedIds] = useState<string[]>(() => safeParseArray<string>(weeklyDoneStorageKey));
  const [adminWorkoutTestStatus, setAdminWorkoutTestStatus] = useState('');
  const [trainingOnboarding, setTrainingOnboarding] = useState<any>(null);
  const [livePoints, setLivePoints] = useState(profile.points || 0);
  const livePointsRef = useRef(profile.points || 0);
  const reconciledCompletedPointsRef = useRef(false);

  useEffect(() => {
    if (localStorage.getItem('ironshape_pending_workouts_tab') !== 'ia') return;
    localStorage.removeItem('ironshape_pending_workouts_tab');
    setSelectedPlanTab(effectivePlan === 'Elite' ? 'Elite' : 'Pro');
    setActiveSubTab('ia');
  }, [effectivePlan]);

  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completedWorkouts');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem('completedWorkouts');
      return [];
    }
  });
  const [awardedWorkoutPoints, setAwardedWorkoutPoints] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('awardedWorkoutPoints');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      localStorage.removeItem('awardedWorkoutPoints');
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
  }, [completedWorkouts]);

  useEffect(() => {
    localStorage.setItem('awardedWorkoutPoints', JSON.stringify(awardedWorkoutPoints));
  }, [awardedWorkoutPoints]);

  useEffect(() => {
    setFavoriteWorkoutIds(safeParseArray<string>(favoriteStorageKey));
    setWeeklyWorkouts(safeParseArray<WeeklyWorkoutSlot>(weeklyStorageKey));
    setWeeklyCompletedIds(safeParseArray<string>(weeklyDoneStorageKey));
  }, [favoriteStorageKey, weeklyStorageKey, weeklyDoneStorageKey]);

  useEffect(() => {
    localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteWorkoutIds));
    window.dispatchEvent(new Event('ironshape:weekly-plan-updated'));
  }, [favoriteStorageKey, favoriteWorkoutIds]);

  useEffect(() => {
    localStorage.setItem(weeklyStorageKey, JSON.stringify(weeklyWorkouts));
    window.dispatchEvent(new Event('ironshape:weekly-plan-updated'));
  }, [weeklyStorageKey, weeklyWorkouts]);

  useEffect(() => {
    localStorage.setItem(weeklyDoneStorageKey, JSON.stringify(weeklyCompletedIds));
    window.dispatchEvent(new Event('ironshape:weekly-plan-updated'));
  }, [weeklyDoneStorageKey, weeklyCompletedIds]);

  useEffect(() => {
    const profilePoints = profile.points || 0;
    livePointsRef.current = Math.max(livePointsRef.current, profilePoints);
    setLivePoints(prev => Math.max(prev, profilePoints));
  }, [profile.points]);

  useEffect(() => {
    if (!user?.id) return;
    const syncTrainingOnboarding = () => {
      try {
        setTrainingOnboarding(JSON.parse(localStorage.getItem(`training_onboarding_${user.id}`) || 'null'));
      } catch {
        setTrainingOnboarding(null);
      }
    };
    syncTrainingOnboarding();
    window.addEventListener('ironshape:training-place-changed', syncTrainingOnboarding);
    return () => window.removeEventListener('ironshape:training-place-changed', syncTrainingOnboarding);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || reconciledCompletedPointsRef.current) return;
    const missingAwards = completedWorkouts.filter(id => !awardedWorkoutPoints.includes(id));
    if (missingAwards.length === 0) return;

    const basePoints = Math.max(livePointsRef.current, profile.points || 0);
    const availablePoints = Math.max(0, planPointsLimit - basePoints);
    const awardsToApply = Math.min(missingAwards.length, Math.floor(availablePoints / 100));
    if (awardsToApply <= 0) return;

    reconciledCompletedPointsRef.current = true;
    const awardedIds = missingAwards.slice(0, awardsToApply);
    const nextPoints = basePoints + (awardsToApply * 100);

    livePointsRef.current = nextPoints;
    setLivePoints(nextPoints);
    setAwardedWorkoutPoints(prev => Array.from(new Set([...prev, ...awardedIds])));

    updateProfile({ points: nextPoints }).catch((error) => {
      console.error('Erro ao sincronizar pontos de treinos concluídos:', error);
      livePointsRef.current = basePoints;
      setLivePoints(basePoints);
      setAwardedWorkoutPoints(prev => prev.filter(id => !awardedIds.includes(id)));
      reconciledCompletedPointsRef.current = false;
    });
  }, [user?.id, completedWorkouts, awardedWorkoutPoints, profile.points, planPointsLimit, updateProfile]);

  const muscleGroups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Full Body'];
  const trainingPlace = trainingOnboarding?.trainingPlace;
  const usesHomeProtocol = trainingPlace === 'home';
  const usesHybridProtocol = trainingPlace === 'hybrid';
  const homeWorkouts = buildHomeWorkouts(profile, trainingOnboarding, selectedPlanTab, selectedLevel);
  const homeRecoveryWorkouts = activeHomeMode === 'training'
    ? []
    : buildHomeRecoveryWorkouts(trainingOnboarding, selectedPlanTab, selectedLevel, activeHomeMode);
  const allHomeWorkouts = usesHomeProtocol ? [
    ...homeWorkouts,
    ...buildHomeRecoveryWorkouts(trainingOnboarding, selectedPlanTab, selectedLevel, 'mobility'),
    ...buildHomeRecoveryWorkouts(trainingOnboarding, selectedPlanTab, selectedLevel, 'stretching'),
  ] : [];
  const workoutSource = usesHomeProtocol
    ? activeHomeMode === 'training' ? homeWorkouts : homeRecoveryWorkouts
    : ALL_WORKOUTS;
  const visibleMuscleGroups = usesHomeProtocol
    ? activeHomeMode === 'training'
      ? muscleGroups.filter(group => homeWorkouts.some(w => w.muscleGroup === group))
      : ['Full Body' as MuscleGroup]
    : muscleGroups;
  const placeLabel = usesHomeProtocol ? 'Casa' : usesHybridProtocol ? 'Híbrido' : 'Academia';
  const points = livePoints;
  const pointsProgress = Math.min(100, Math.round((points / planPointsLimit) * 100));
  const freePointsLimitReached = isFreePointsPlan && points >= FREE_POINTS_LIMIT;
  const freeTrainingPhaseComplete = freePointsLimitReached;
  const weeklyWorkoutIds = weeklyWorkouts.map(item => item.workoutId);
  const allAvailableWorkouts = [...allHomeWorkouts, ...workoutSource, ...ALL_WORKOUTS];
  const favoriteWorkouts = favoriteWorkoutIds
    .map(id => allAvailableWorkouts.find(workout => workout.id === id))
    .filter((workout): workout is Workout => Boolean(workout));
  const weeklyWorkoutDetails = weeklyWorkouts
    .map(slot => ({
      ...slot,
      workout: allAvailableWorkouts.find(workout => workout.id === slot.workoutId),
    }))
    .filter((slot): slot is WeeklyWorkoutSlot & { workout: Workout } => Boolean(slot.workout));
  const weeklyCompletedCount = weeklyWorkoutDetails.filter(slot => weeklyCompletedIds.includes(slot.workoutId)).length;

  useEffect(() => {
    const rawSelection = localStorage.getItem('pending_workout_selection');
    if (!rawSelection) return;
    try {
      const selection = JSON.parse(rawSelection) as { workoutId?: string; mode?: HomeTrainingMode };
      const workout = allAvailableWorkouts.find(item => item.id === selection.workoutId);
      if (!workout) return;
      if (usesHomeProtocol && selection.mode) setActiveHomeMode(selection.mode);
      setSelectedWorkout(workout);
      localStorage.removeItem('pending_workout_selection');
    } catch {
      localStorage.removeItem('pending_workout_selection');
    }
  }, [trainingOnboarding, selectedPlanTab, selectedLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setWeeklyWorkouts(prev => prev.length > weeklyWorkoutLimit ? prev.slice(0, weeklyWorkoutLimit) : prev);
  }, [weeklyWorkoutLimit]);

  useEffect(() => {
    if (selectedMuscleGroup !== 'Todos' && !visibleMuscleGroups.includes(selectedMuscleGroup)) {
      setSelectedMuscleGroup('Todos');
    }
  }, [selectedMuscleGroup, visibleMuscleGroups]);

  const hasAccess = (planId: Plan) => {
    const weights = { 'free': 0, 'Iniciante': 1, 'Pro': 2, 'Elite': 3, 'Admin': 4 };
    return weights[effectivePlan] >= weights[planId];
  };

  const toggleFavoriteWorkout = (workoutId: string) => {
    setFavoriteWorkoutIds(prev =>
      prev.includes(workoutId) ? prev.filter(id => id !== workoutId) : [...prev, workoutId]
    );
  };

  const addWorkoutToWeek = (workout: Workout) => {
    setWeeklyWorkouts(prev => {
      if (prev.some(item => item.workoutId === workout.id)) return prev.filter(item => item.workoutId !== workout.id);
      if (prev.length >= weeklyWorkoutLimit) return prev;

      const usedDays = new Set(prev.map(item => item.day));
      const nextDay = DEFAULT_WEEK_DAYS.find(day => !usedDays.has(day)) || WEEK_DAYS.find(day => !usedDays.has(day)) || 'Segunda';

      return [
        ...prev,
        {
          day: nextDay,
          workoutId: workout.id,
          workoutName: workout.name,
          muscleGroup: workout.muscleGroup,
          assignedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const moveWeeklyWorkout = (workoutId: string, day: string) => {
    setWeeklyWorkouts(prev => prev.map(item => item.workoutId === workoutId ? { ...item, day } : item));
  };

  const removeWorkoutFromWeek = (workoutId: string) => {
    setWeeklyWorkouts(prev => prev.filter(item => item.workoutId !== workoutId));
    setWeeklyCompletedIds(prev => prev.filter(id => id !== workoutId));
  };

  const clearWeeklyWorkouts = () => {
    setWeeklyWorkouts([]);
    setWeeklyCompletedIds([]);
  };

  const startFreshWeeklyCheckins = () => {
    setWeeklyCompletedIds([]);
  };

  const prepareAdminFreePhaseRetest = async () => {
    if (!isAdmin) return;
    setAdminWorkoutTestStatus('Preparando teste...');
    try {
      localStorage.removeItem('completedWorkouts');
      localStorage.removeItem('awardedWorkoutPoints');
      localStorage.removeItem(weeklyDoneStorageKey);
      setCompletedWorkouts([]);
      setAwardedWorkoutPoints([]);
      setWeeklyCompletedIds([]);
      livePointsRef.current = 1900;
      setLivePoints(1900);
      setSelectedWorkout(null);
      setSelectedPlanTab('Iniciante');
      setSelectedLevel('Iniciante');
      setActiveSubTab('workouts');
      await updateProfile({
        points: 1900,
        plano: 'Iniciante',
        subscriptionStatus: 'inactive',
      });
      setAdminWorkoutTestStatus('Pronto: complete um treino para bater 2000 pts e ver a mensagem.');
    } catch (error: any) {
      setAdminWorkoutTestStatus(error?.message || 'Não foi possível preparar o teste.');
    }
  };

  const completeWorkoutAndAwardPoints = async (workoutId: string): Promise<number | null> => {
    const alreadyAwarded = awardedWorkoutPoints.includes(workoutId);
    const alreadyCompleted = completedWorkouts.includes(workoutId);

    if (!alreadyCompleted) {
      setCompletedWorkouts(prev => prev.includes(workoutId) ? prev : [...prev, workoutId]);
    }

    if (!alreadyAwarded && user) {
      const basePoints = Math.max(livePointsRef.current, profile.points || 0);
      if (basePoints >= planPointsLimit) {
        return null;
      }

      const workout = workoutSource.find(w => w.id === workoutId) ?? ALL_WORKOUTS.find(w => w.id === workoutId);
      const today = new Date().toISOString().split('T')[0];
      const nextPoints = Math.min(planPointsLimit, basePoints + 100);
      const willCompleteFreePhase = isFreePointsPlan && nextPoints >= FREE_POINTS_LIMIT;

      livePointsRef.current = nextPoints;
      setLivePoints(nextPoints);
      setAwardedWorkoutPoints(prev => prev.includes(workoutId) ? prev : [...prev, workoutId]);
      trackEvent('workout_completed', {
        workout_id: workoutId,
        workout_name: workout?.name ?? workoutId,
        muscle_group: workout?.muscleGroup ?? 'unknown',
        plan: effectivePlan,
        points_after: nextPoints,
        points_awarded: 100,
      });
      if (willCompleteFreePhase) {
        trackEvent('free_phase_completed', {
          points: nextPoints,
          limit: FREE_POINTS_LIMIT,
          workout_id: workoutId,
          workout_name: workout?.name ?? workoutId,
        });
        window.dispatchEvent(new CustomEvent('ironshape:free-phase-completed', { detail: { points: nextPoints } }));
      }

      try {
        await dataService.addWorkoutLog({
          userUid: user.id,
          workoutId,
          workoutName: workout?.name ?? workoutId,
          completedAt: new Date().toISOString(),
          duration: parseInt(workout?.duration ?? '0') || 0,
        });
        const lastDate = profile.lastWorkoutDate;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const isConsecutive = lastDate === yesterday.toISOString().split('T')[0];
        const newStreak = lastDate === today ? profile.streak : isConsecutive ? profile.streak + 1 : 1;
        await updateProfile({
          points: nextPoints,
          streak: newStreak,
          lastWorkoutDate: today,
        });
        return nextPoints;
      } catch (e) {
        console.error('Erro ao salvar treino:', e);
        livePointsRef.current = basePoints;
        setLivePoints(basePoints);
        setAwardedWorkoutPoints(prev => prev.filter(id => id !== workoutId));
      }
    }
    return null;
  };

  const toggleComplete = async (workoutId: string): Promise<number | null> => {
    const alreadyDone = completedWorkouts.includes(workoutId);

    if (alreadyDone && awardedWorkoutPoints.includes(workoutId)) {
      return null;
    }

    return completeWorkoutAndAwardPoints(workoutId);
  };

  const markWeeklyWorkoutDone = async (workoutId: string) => {
    if (weeklyCompletedIds.includes(workoutId)) {
      setWeeklyCompletedIds(prev => prev.filter(id => id !== workoutId));
      return;
    }
    await completeWorkoutAndAwardPoints(workoutId);
    setWeeklyCompletedIds(prev => prev.includes(workoutId) ? prev : [...prev, workoutId]);
  };

  if (selectedWorkout) {
    return (
      <WorkoutDetailView 
        workout={selectedWorkout} 
        language={language}
        onBack={() => setSelectedWorkout(null)} 
        isCompleted={completedWorkouts.includes(selectedWorkout.id)}
        hasAwardedPoints={awardedWorkoutPoints.includes(selectedWorkout.id)}
        onToggleComplete={() => toggleComplete(selectedWorkout.id)}
        canEdit={hasAccess('Elite')}
        currentPoints={livePoints}
        isFreePointsPlan={isFreePointsPlan}
        freePointsLimit={FREE_POINTS_LIMIT}
        planPointsLimit={planPointsLimit}
        onUpgrade={onUpgrade}
      />
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">{workoutsText.title}</h1>
          </div>
          <p className="text-text-secondary text-base md:text-lg">
            {workoutsText.subtitle(placeLabel, profile.goal || workoutsText.fallbackGoal)}
          </p>
        </div>
        
        <div className="bg-surface border border-white/10 rounded-2xl p-4 shrink-0 w-full md:w-[320px] shadow-xl shadow-black/10">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <Trophy size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{workoutsText.points}</div>
                <div className="text-lg font-black leading-tight">{points.toLocaleString(locale)} pts</div>
              </div>
            </div>
            <span className="text-[10px] font-black text-primary uppercase tracking-widest shrink-0">
              {pointsProgress}%
            </span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pointsProgress}%` }}
              className="h-full bg-primary shadow-[0_0_15px_rgba(255,106,0,0.45)]"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[9px] font-black uppercase tracking-widest text-text-muted">
            <span>0</span>
            <span>{isFreePointsPlan ? workoutsText.phaseGoal(FREE_POINTS_LIMIT.toLocaleString(locale)) : workoutsText.pointsGoal(planPointsLimit.toLocaleString(locale))}</span>
          </div>
          {freeTrainingPhaseComplete && (
            <button
              onClick={onUpgrade}
              className="w-full mt-3 min-h-[42px] bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all"
            >
              {workoutsText.continueEvolution}
            </button>
          )}
        </div>
      </header>

      {freeTrainingPhaseComplete && (
        <FreeTrainingPhaseGate
          points={points}
          limit={FREE_POINTS_LIMIT}
          onUpgrade={onUpgrade}
          onPrepareTest={isAdmin ? prepareAdminFreePhaseRetest : undefined}
          testStatus={isAdmin ? adminWorkoutTestStatus : undefined}
        />
      )}

      {freeTrainingPhaseComplete ? null : (
        <>

      {usesHomeProtocol && (
        <section className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-[24px] p-5 flex flex-col gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">{workoutsText.homeActive}</div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {workoutsText.homeActiveText(profile.goal || workoutsText.fallbackGoal)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(trainingOnboarding?.homeEquipment || ['Nenhum']).map((item: string) => (
                <span key={item} className="px-3 py-1 rounded-lg bg-background/50 border border-white/10 text-[9px] font-black uppercase tracking-widest text-text-secondary">{item}</span>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {([
              { id: 'training', label: workoutsText.train, icon: <Dumbbell size={16} /> },
              { id: 'mobility', label: workoutsText.mobility, icon: <Activity size={16} /> },
              { id: 'stretching', label: workoutsText.stretch, icon: <RefreshCw size={16} /> },
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveHomeMode(item.id);
                  setActiveSubTab('workouts');
                  setSelectedMuscleGroup('Todos');
                  setSelectedWorkout(null);
                }}
                className={`min-h-[58px] rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase transition-all ${
                  activeHomeMode === item.id
                    ? 'bg-primary text-text-primary shadow-lg shadow-primary/20'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="bg-surface border border-white/10 rounded-[28px] p-5 md:p-6 space-y-5 shadow-xl shadow-black/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <CalendarDays size={22} />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">{workoutsText.weeklyTitle}</h2>
                <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-text-muted">
                  {weeklyWorkouts.length}/{weeklyWorkoutLimit}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {isFreePointsPlan
                  ? workoutsText.weeklySimpleText
                  : workoutsText.weeklyAdvancedText}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={startFreshWeeklyCheckins}
              disabled={weeklyWorkouts.length === 0}
              className="min-h-[40px] px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Repeat2 size={14} />
              {workoutsText.repeat}
            </button>
            <button
              onClick={clearWeeklyWorkouts}
              disabled={weeklyWorkouts.length === 0}
              className="min-h-[40px] px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Trash2 size={14} />
              {workoutsText.clear}
            </button>
          </div>
        </div>

        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${weeklyWorkoutDetails.length ? Math.round((weeklyCompletedCount / weeklyWorkoutDetails.length) * 100) : 0}%` }}
            className="h-full bg-success shadow-[0_0_15px_rgba(34,197,94,0.35)]"
          />
        </div>

        {weeklyWorkoutDetails.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {weeklyWorkoutDetails.map(({ workout, day, workoutId }) => {
              const isWeeklyDone = weeklyCompletedIds.includes(workoutId);
              return (
                <div key={workoutId} className={`rounded-2xl border p-4 space-y-4 transition-all ${isWeeklyDone ? 'bg-success/10 border-success/25' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <select
                        value={day}
                        onChange={(event) => moveWeeklyWorkout(workoutId, event.target.value)}
                        className="bg-background/80 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-primary outline-none"
                      >
                        {WEEK_DAYS.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <h3 className="mt-3 text-lg font-black tracking-tight text-text-primary leading-tight">{translateWorkoutName(workout.name, language)}</h3>
                      <p className="text-xs text-text-muted mt-1">{translateMuscleGroup(workout.muscleGroup, language)} • {workout.duration}</p>
                    </div>
                    <button
                      onClick={() => removeWorkoutFromWeek(workoutId)}
                      className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 transition-all flex items-center justify-center shrink-0"
                      aria-label={workoutsText.removeWeekly}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedWorkout(workout)}
                      className="min-h-[38px] rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all"
                    >
                      {workoutsText.open}
                    </button>
                    <button
                      onClick={() => markWeeklyWorkoutDone(workoutId)}
                      className={`min-h-[38px] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isWeeklyDone ? 'bg-success text-text-primary' : 'bg-primary text-text-primary hover:bg-primary-hover'}`}
                    >
                      {isWeeklyDone ? workoutsText.done : workoutsText.markDone}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center">
            <p className="text-sm font-bold text-text-secondary">{workoutsText.emptyWeekly}</p>
          </div>
        )}

        {favoriteWorkouts.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">{workoutsText.favorites}</div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {favoriteWorkouts.slice(0, 10).map(workout => (
                <button
                  key={workout.id}
                  onClick={() => addWorkoutToWeek(workout)}
                  disabled={!weeklyWorkoutIds.includes(workout.id) && weeklyWorkouts.length >= weeklyWorkoutLimit}
                  className={`min-h-[42px] px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${
                    weeklyWorkoutIds.includes(workout.id)
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'bg-white/5 border-white/10 text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <Star size={13} className={favoriteWorkoutIds.includes(workout.id) ? 'fill-current' : ''} />
                  {translateWorkoutName(workout.name, language)}
                </button>
              ))}
            </div>
          </div>
        )}

        {weeklyWorkouts.length >= weeklyWorkoutLimit && isFreePointsPlan && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-primary/10 border border-primary/20 p-4">
            <p className="text-xs text-text-secondary leading-relaxed">
              {workoutsText.freeWeeklyLimit(weeklyWorkoutLimit)}
            </p>
            <button
              onClick={onUpgrade}
              className="min-h-[40px] px-4 rounded-xl bg-primary text-text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all"
            >
              {workoutsText.upgrade}
            </button>
          </div>
        )}
      </section>

      {/* Main Plan Tabs */}
      {(!usesHomeProtocol || activeHomeMode === 'training') && <div className="flex flex-col gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">{workoutsText.protocol}</span>
        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {(['Iniciante', 'Pro', 'Elite'] as Plan[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setSelectedPlanTab(p);
                setActiveSubTab('workouts');
                setSelectedLevel(p === 'Elite' ? 'Avançado' : p === 'Pro' ? 'Intermediário' : 'Iniciante');
              }}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                selectedPlanTab === p 
                  ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' 
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>}

      {/* Sub-tabs for Pro and Elite */}
      {hasAccess(selectedPlanTab) && (
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          <SubTabButton 
            active={activeSubTab === 'workouts'} 
            onClick={() => setActiveSubTab('workouts')} 
            label={workoutsText.workouts}
            icon={<Dumbbell size={14} />} 
          />
          {selectedPlanTab === 'Pro' && (
            <>
              <SubTabButton
                active={activeSubTab === 'registro'}
                onClick={() => setActiveSubTab('registro')}
                label={workoutsText.loadLog}
                icon={<BarChart3 size={14} />}
              />
              <SubTabButton
                active={activeSubTab === 'ia'}
                onClick={() => setActiveSubTab('ia')}
                label="Iron Coach"
                icon={<Zap size={14} />}
              />
              <SubTabButton
                active={activeSubTab === 'history'}
                onClick={() => setActiveSubTab('history')}
                label={workoutsText.history}
                icon={<Calendar size={14} />}
              />
              <SubTabButton
                active={activeSubTab === 'ranking'}
                onClick={() => setActiveSubTab('ranking')}
                label={workoutsText.ranking}
                icon={<Trophy size={14} />}
              />
            </>
          )}
          {selectedPlanTab === 'Elite' && (
            <>
              <SubTabButton
                active={activeSubTab === 'registro'}
                onClick={() => setActiveSubTab('registro')}
                label={workoutsText.loadLog}
                icon={<BarChart3 size={14} />}
              />
              <SubTabButton
                active={activeSubTab === 'ia'}
                onClick={() => setActiveSubTab('ia')}
                label="Iron Coach"
                icon={<Zap size={14} />}
              />
              <SubTabButton
                active={activeSubTab === 'spreadsheet'}
                onClick={() => setActiveSubTab('spreadsheet')}
                label={workoutsText.athleteSheet}
                icon={<Calculator size={14} />}
              />
              <SubTabButton
                active={activeSubTab === 'early'}
                onClick={() => setActiveSubTab('early')}
                label={workoutsText.earlyAccess}
                icon={<Flame size={14} />}
              />
            </>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="relative min-h-[500px]">
        {!hasAccess(selectedPlanTab) ? (
          <LockedFeatureOverlay onUpgrade={onUpgrade} plan={selectedPlanTab} language={language} />
        ) : (
          <div className="space-y-12">
            {activeSubTab === 'workouts' && (
              <>
                {/* Filters Area */}
                {(!usesHomeProtocol || activeHomeMode === 'training') && <div className="space-y-8">
                  <div>
                    <div className="flex flex-col gap-3 max-w-4xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">{workoutsText.muscleGroup}</span>
                      <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                        <button
                          onClick={() => setSelectedMuscleGroup('Todos')}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                            selectedMuscleGroup === 'Todos' 
                              ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' 
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          {workoutsText.all}
                        </button>
                        {visibleMuscleGroups.map((group) => (
                          <button
                            key={group}
                            onClick={() => setSelectedMuscleGroup(group)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                              selectedMuscleGroup === group 
                                ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' 
                                : 'text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            {translateMuscleGroup(group, language)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>}

                <div className={usesHomeProtocol ? 'space-y-6' : 'space-y-16'}>
                  {visibleMuscleGroups.filter(g => selectedMuscleGroup === 'Todos' || g === selectedMuscleGroup).map((group) => {
                    const groupWorkouts = workoutSource.filter(w =>
                      w.planRequired === selectedPlanTab && 
                      w.level === selectedLevel && 
                      w.muscleGroup === group
                    );

                    if (groupWorkouts.length === 0) return null;

                    return (
                      <section key={group} className={usesHomeProtocol ? 'space-y-4' : 'space-y-8'}>
                        <div className="flex items-center gap-6">
                          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">
                            {usesHomeProtocol && activeHomeMode === 'mobility'
                              ? workoutsText.mobilityRoutines
                              : usesHomeProtocol && activeHomeMode === 'stretching'
                              ? workoutsText.stretchingRoutines
                              : group}
                          </h2>
                          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                        </div>
                        <div className={usesHomeProtocol
                          ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4'
                          : 'flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:snap-none'}>
                          {groupWorkouts.map((workout) => (
                            usesHomeProtocol ? (
                              <HomeRoutineCard
                                key={workout.id}
                                workout={workout}
                                language={language}
                                mode={activeHomeMode}
                                isCompleted={completedWorkouts.includes(workout.id)}
                                isFavorite={favoriteWorkoutIds.includes(workout.id)}
                                isInWeeklyPlan={weeklyWorkoutIds.includes(workout.id)}
                                weeklyLimitReached={weeklyWorkouts.length >= weeklyWorkoutLimit}
                                onClick={() => setSelectedWorkout(workout)}
                                onToggleFavorite={() => toggleFavoriteWorkout(workout.id)}
                                onToggleWeekly={() => addWorkoutToWeek(workout)}
                              />
                            ) : (
                              <div key={workout.id} className="shrink-0 w-[78vw] sm:w-[60vw] md:w-auto snap-start">
                                <WorkoutCard
                                  workout={workout}
                                  language={language}
                                  isCompleted={completedWorkouts.includes(workout.id)}
                                  isFavorite={favoriteWorkoutIds.includes(workout.id)}
                                  isInWeeklyPlan={weeklyWorkoutIds.includes(workout.id)}
                                  weeklyLimitReached={weeklyWorkouts.length >= weeklyWorkoutLimit}
                                  onClick={() => setSelectedWorkout(workout)}
                                  onToggleFavorite={() => toggleFavoriteWorkout(workout.id)}
                                  onToggleWeekly={() => addWorkoutToWeek(workout)}
                                />
                              </div>
                            )
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  
                  {visibleMuscleGroups.filter(g => selectedMuscleGroup === 'Todos' || g === selectedMuscleGroup).every(g =>
                    workoutSource.filter(w => w.planRequired === selectedPlanTab && w.level === selectedLevel && w.muscleGroup === g).length === 0
                  ) && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-text-muted">
                        <Dumbbell size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-bold">{workoutsText.emptyTitle}</p>
                        <p className="text-text-muted">{workoutsText.emptyText}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSubTab === 'registro' && <LoadTrackerView userId={user?.id || ''} language={language} />}
            {activeSubTab === 'ia' && (
              hasPro
                ? <IAAdaptativaView profile={profile} language={language} onUpgrade={onUpgrade} isAdmin={isAdmin} />
                : <LockedFeatureOverlay onUpgrade={onUpgrade} plan="Pro" language={language} title="Iron Coach IA" description="Seu personal trainer inteligente disponível 24h. Exclusivo para assinantes Pro e Elite." />
            )}
            {activeSubTab === 'history' && <WorkoutHistoryView userUid={user?.id || ''} language={language} />}
            {activeSubTab === 'ranking' && <GlobalRankingView language={language} />}
            {activeSubTab === 'spreadsheet' && <AthleteSpreadsheetView language={language} onSelectWorkout={setSelectedWorkout} />}
            {activeSubTab === 'early' && <EarlyAccessView language={language} onSelectWorkout={setSelectedWorkout} />}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}

function SubTabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border min-h-[44px] ${
        active 
          ? 'bg-primary/10 border-primary/30 text-primary shadow-lg shadow-primary/5' 
          : 'bg-white/5 border-white/5 text-text-muted hover:border-white/10 hover:text-text-secondary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function LockedFeatureOverlay({ onUpgrade, plan, language, title, description }: { onUpgrade: () => void, plan: Plan, language: LanguageCode, title?: string, description?: string }) {
  const lockedText = {
    'pt-BR': {
      title: 'Acesso Restrito',
      description: `O módulo ${plan} faz parte dos nossos protocolos premium de treinamento.`,
      button: `FAZER UPGRADE PARA ${(plan || '').toUpperCase()}`,
      ironCoachDescription: 'Seu personal trainer inteligente disponível 24h. Exclusivo para assinantes Pro e Elite.',
    },
    en: {
      title: 'Restricted Access',
      description: `The ${plan} module is part of our premium training protocols.`,
      button: `UPGRADE TO ${(plan || '').toUpperCase()}`,
      ironCoachDescription: 'Your smart personal trainer, available 24/7. Exclusive to Pro and Elite subscribers.',
    },
    es: {
      title: 'Acceso Restringido',
      description: `El módulo ${plan} forma parte de nuestros protocolos premium de entrenamiento.`,
      button: `MEJORAR A ${(plan || '').toUpperCase()}`,
      ironCoachDescription: 'Tu entrenador personal inteligente, disponible 24h. Exclusivo para suscriptores Pro y Elite.',
    },
  }[language];
  const defaultTitle = lockedText.title;
  const defaultDescription = description === 'Seu personal trainer inteligente disponível 24h. Exclusivo para assinantes Pro e Elite.'
    ? lockedText.ironCoachDescription
    : lockedText.description;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-12 bg-surface/40 backdrop-blur-xl rounded-[32px] sm:rounded-[48px] border border-white/5 overflow-hidden z-20"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
        <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-primary rounded-full blur-[120px]" />
      </div>
      
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/10 rounded-[24px] sm:rounded-[32px] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl rotate-12">
          <Lock className="text-primary w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase">{title || defaultTitle}</h3>
          <p className="text-text-secondary max-w-sm mx-auto text-base sm:text-lg leading-relaxed">
            {description || defaultDescription}
          </p>
        </div>
        <button 
          onClick={onUpgrade}
          className="bg-primary text-text-primary font-black px-8 sm:px-12 py-4 sm:py-5 rounded-[20px] sm:rounded-[24px] hover:bg-primary-hover hover:scale-105 transition-all shadow-2xl shadow-primary/30 active:scale-95 flex items-center gap-3 mx-auto text-xs sm:text-sm"
        >
          {lockedText.button}
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function WorkoutCard({
  workout,
  language,
  isCompleted,
  isFavorite,
  isInWeeklyPlan,
  weeklyLimitReached,
  onClick,
  onToggleFavorite,
  onToggleWeekly
}: {
  workout: Workout,
  language: LanguageCode,
  isCompleted: boolean,
  isFavorite: boolean,
  isInWeeklyPlan: boolean,
  weeklyLimitReached: boolean,
  onClick: () => void,
  onToggleFavorite: () => void,
  onToggleWeekly: () => void
}) {
  const workoutDisplay = getWorkoutDisplay(workout, language);
  const workoutCardLabels = {
    level: language === 'en' ? 'LEVEL' : language === 'es' ? 'NIVEL' : 'NÍVEL',
    exercises: language === 'en' ? 'Exercises' : language === 'es' ? 'Ejercicios' : 'Exercícios',
    duration: language === 'en' ? 'Duration' : language === 'es' ? 'Duración' : 'Duração',
    inWeek: language === 'en' ? 'In week' : language === 'es' ? 'En la semana' : 'Na semana',
    add: language === 'en' ? 'Add' : language === 'es' ? 'Agregar' : 'Adicionar',
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="w-full h-full bg-surface p-8 rounded-[40px] border border-primary/30 transition-all duration-500 relative overflow-hidden flex flex-col text-left"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 scale-110 transition-all duration-700">
        <Dumbbell size={100} />
      </div>

      {isCompleted && (
        <div className="absolute top-6 right-6 bg-success text-text-primary p-1.5 rounded-full z-20 shadow-lg shadow-success/20">
          <CheckCircle2 size={16} />
        </div>
      )}

      <div className={`absolute top-6 ${isCompleted ? 'right-16' : 'right-6'} z-30 flex gap-2`}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
            isFavorite
              ? 'bg-primary/15 border-primary/30 text-primary'
              : 'bg-background/80 border-white/10 text-text-muted hover:text-text-primary'
          }`}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar treino'}
        >
          <Star size={16} className={isFavorite ? 'fill-current' : ''} />
        </button>
      </div>

      <div className="relative z-10 flex-1 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${isCompleted ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
              {workoutCardLabels.level} {(workoutDisplay.level || '').toUpperCase()}
            </span>
            {isCompleted && <span className="text-[8px] font-black text-success uppercase tracking-widest">Concluído</span>}
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-tight text-primary">{workoutDisplay.name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
            <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">{workoutCardLabels.exercises}</div>
            <div className="text-lg font-black">{workout.exercises.length}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
            <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">{workoutCardLabels.duration}</div>
            <div className="text-lg font-black">{workout.duration}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-surface bg-surface-active flex items-center justify-center overflow-hidden">
                <img src={`https://picsum.photos/seed/${workout.id + i}/32/32`} alt="User" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-surface bg-surface-active flex items-center justify-center text-[8px] font-black text-text-muted">
              +12
            </div>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleWeekly();
            }}
            disabled={!isInWeeklyPlan && weeklyLimitReached}
            className={`min-h-[42px] px-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 ${
              isInWeeklyPlan
                ? 'bg-success/10 border-success/25 text-success'
                : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/15 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            {isInWeeklyPlan ? <CheckCircle2 size={15} /> : <PlusCircle size={15} />}
            {isInWeeklyPlan ? workoutCardLabels.inWeek : workoutCardLabels.add}
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeRoutineCard({
  workout,
  language,
  mode,
  isCompleted,
  isFavorite,
  isInWeeklyPlan,
  weeklyLimitReached,
  onClick,
  onToggleFavorite,
  onToggleWeekly,
}: {
  workout: Workout,
  language: LanguageCode,
  mode: HomeTrainingMode,
  isCompleted: boolean,
  isFavorite: boolean,
  isInWeeklyPlan: boolean,
  weeklyLimitReached: boolean,
  onClick: () => void,
  onToggleFavorite: () => void,
  onToggleWeekly: () => void,
}) {
  const workoutDisplay = getWorkoutDisplay(workout, language);
  const routineLabels = {
    mobility: language === 'en' ? 'Mobility' : language === 'es' ? 'Movilidad' : 'Mobilidade',
    stretching: language === 'en' ? 'Stretching' : language === 'es' ? 'Estiramiento' : 'Alongamento',
    home: language === 'en' ? 'Home workout' : language === 'es' ? 'Entreno en casa' : 'Treino em casa',
    movements: language === 'en' ? 'movements' : language === 'es' ? 'movimientos' : 'movimentos',
    inWeek: language === 'en' ? 'In week' : language === 'es' ? 'En la semana' : 'Na semana',
    add: language === 'en' ? 'Add' : language === 'es' ? 'Agregar' : 'Adicionar',
  };
  const config = mode === 'mobility'
    ? {
        label: routineLabels.mobility,
        benefit: 'Movimente melhor',
        icon: <Activity size={20} />,
        accent: 'text-success',
        soft: 'bg-success/10 border-success/20',
      }
    : mode === 'stretching'
    ? {
        label: routineLabels.stretching,
        benefit: 'Recupere com calma',
        icon: <RefreshCw size={20} />,
        accent: 'text-[#74b9ff]',
        soft: 'bg-[#74b9ff]/10 border-[#74b9ff]/20',
      }
    : {
        label: routineLabels.home,
        benefit: 'Evolua no seu ritmo',
        icon: <Dumbbell size={20} />,
        accent: 'text-primary',
        soft: 'bg-primary/10 border-primary/20',
      };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="w-full min-h-[184px] p-5 rounded-2xl bg-surface border border-white/10 text-left transition-all active:scale-[0.98] hover:border-white/20 flex flex-col justify-between gap-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${config.soft} ${config.accent}`}>
          {config.icon}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
              isFavorite
                ? 'bg-primary/15 border-primary/30 text-primary'
                : 'bg-background/70 border-white/10 text-text-muted hover:text-text-primary'
            }`}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Favoritar treino'}
          >
            <Star size={16} className={isFavorite ? 'fill-current' : ''} />
          </button>
          {isCompleted && <CheckCircle2 size={20} className="text-success shrink-0" />}
        </div>
      </div>
      <div>
        <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${config.accent}`}>{config.label}</p>
        <h3 className="text-xl font-black tracking-tight leading-tight text-text-primary">{workoutDisplay.name}</h3>
        <p className="text-xs text-text-secondary leading-relaxed mt-2 line-clamp-2">{workoutDisplay.description}</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-text-muted">
          <span className="flex items-center gap-1.5"><Clock size={13} />{workout.duration}</span>
          <span className="flex items-center gap-1.5"><Activity size={13} />{workout.exercises.length} {routineLabels.movements}</span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWeekly();
          }}
          disabled={!isInWeeklyPlan && weeklyLimitReached}
          className={`min-h-[42px] px-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shrink-0 ${
            isInWeeklyPlan
              ? 'bg-success/10 border-success/25 text-success'
              : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/15 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {isInWeeklyPlan ? <CheckCircle2 size={15} /> : <PlusCircle size={15} />}
          {isInWeeklyPlan ? routineLabels.inWeek : routineLabels.add}
        </button>
      </div>
      <span className="sr-only">{config.benefit}</span>
    </div>
  );
}

function RestTimer({ restTime, timerId, onStateChange }: { restTime: string, timerId: string, onStateChange?: (isActive: boolean) => void }) {
  const initialSeconds = parseInt(restTime.replace('s', '')) || 60;
  const storageKey = `ironshape_rest_timer_${timerId}`;
  const restoredTimer = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as {
        endAt?: number | null;
        remainingSeconds?: number;
        isActive?: boolean;
        isFinished?: boolean;
      } | null;
      if (!saved) return null;
      if (saved.isActive && saved.endAt) {
        const remainingSeconds = Math.max(0, Math.ceil((saved.endAt - Date.now()) / 1000));
        return {
          endAt: remainingSeconds > 0 ? saved.endAt : null,
          remainingSeconds,
          isActive: remainingSeconds > 0,
          isFinished: remainingSeconds === 0,
        };
      }
      return {
        endAt: null,
        remainingSeconds: Math.max(0, saved.remainingSeconds ?? initialSeconds),
        isActive: false,
        isFinished: !!saved.isFinished,
      };
    } catch {
      return null;
    }
  })();
  const [seconds, setSeconds] = useState(restoredTimer?.remainingSeconds ?? initialSeconds);
  const [endAt, setEndAt] = useState<number | null>(restoredTimer?.endAt ?? null);
  const [isActive, setIsActive] = useState(restoredTimer?.isActive ?? false);
  const [isFinished, setIsFinished] = useState(restoredTimer?.isFinished ?? false);

  useEffect(() => {
    onStateChange?.(isActive);
  }, [isActive, onStateChange]);

  const saveTimer = (timer: { endAt: number | null; remainingSeconds: number; isActive: boolean; isFinished: boolean }) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(timer));
    } catch {
      // O cronômetro continua funcionando mesmo quando o armazenamento está indisponível.
    }
  };

  useEffect(() => {
    if (!isActive || !endAt) return;

    const syncWithClock = () => {
      const remainingSeconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSeconds(remainingSeconds);
      if (remainingSeconds > 0) return;

      setIsActive(false);
      setIsFinished(true);
      setEndAt(null);
      saveTimer({ endAt: null, remainingSeconds: 0, isActive: false, isFinished: true });
      onStateChange?.(false);
      if (document.visibilityState === 'visible' && 'vibrate' in navigator) navigator.vibrate([180, 100, 180]);
    };

    syncWithClock();
    const interval = window.setInterval(syncWithClock, 500);
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') syncWithClock();
    };
    window.addEventListener('focus', syncWithClock);
    window.addEventListener('pageshow', syncWithClock);
    document.addEventListener('visibilitychange', syncWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', syncWithClock);
      window.removeEventListener('pageshow', syncWithClock);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [isActive, endAt, storageKey, onStateChange]);

  const toggleTimer = () => {
    if (isActive && endAt) {
      const remainingSeconds = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setSeconds(remainingSeconds);
      setEndAt(null);
      setIsActive(false);
      setIsFinished(remainingSeconds === 0);
      saveTimer({ endAt: null, remainingSeconds, isActive: false, isFinished: remainingSeconds === 0 });
      onStateChange?.(false);
      return;
    }

    const duration = isFinished || seconds <= 0 ? initialSeconds : seconds;
    const nextEndAt = Date.now() + duration * 1000;
    setSeconds(duration);
    setEndAt(nextEndAt);
    setIsFinished(false);
    setIsActive(true);
    saveTimer({ endAt: nextEndAt, remainingSeconds: duration, isActive: true, isFinished: false });
    onStateChange?.(true);
  };

  const resetTimer = () => {
    setSeconds(initialSeconds);
    setEndAt(null);
    setIsActive(false);
    setIsFinished(false);
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    onStateChange?.(false);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full md:w-56">
      <div className={`flex items-center justify-between p-5 rounded-2xl transition-all duration-500 ${
        isFinished ? 'bg-success/20 border border-success/30' : 
        isActive ? 'bg-primary/20 border border-primary/30 shadow-lg shadow-primary/10' : 
        'bg-white/5 border border-white/5'
      }`}>
        <div className="flex flex-col">
          <span className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">
            {isFinished ? 'Finalizado' : isActive ? 'Descansando' : 'Descanso'}
          </span>
          <span className={`text-2xl font-black font-mono leading-none ${
            isFinished ? 'text-success' : isActive ? 'text-primary' : 'text-text-primary'
          }`}>
            {formatTime(seconds)}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={toggleTimer}
            className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${
              isActive ? 'bg-primary text-text-primary' : 'bg-white/10 text-text-primary hover:bg-white/20'
            }`}
            title={isActive ? 'Pausar' : 'Iniciar'}
          >
            {isActive ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button
            onClick={resetTimer}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 text-text-primary hover:bg-white/20 transition-all"
            title="Resetar"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
      
      {isActive && (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${(seconds / initialSeconds) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
            className="h-full bg-primary"
          />
        </div>
      )}

      {isFinished && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-success text-[10px] font-black uppercase tracking-widest justify-center"
        >
          <BellRing size={12} />
          Voltar para a série!
        </motion.div>
      )}
    </div>
  );
}

type ExerciseAnimationType = 'press' | 'fly' | 'row' | 'pull' | 'squat' | 'lunge' | 'hinge' | 'bridge' | 'shoulder' | 'curl' | 'triceps' | 'core' | 'mobility' | 'stretch';
const EXERCISE_MEDIA_PLAYBACK_RATE = 1.75;

function setExerciseVideoSpeed(video: HTMLVideoElement) {
  video.defaultPlaybackRate = EXERCISE_MEDIA_PLAYBACK_RATE;
  video.playbackRate = EXERCISE_MEDIA_PLAYBACK_RATE;
}

function normalizeExerciseKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getExerciseAnimationType(name: string): ExerciseAnimationType | null {
  const key = normalizeExerciseKey(name);
  if (/alongamento|postura da crianca|respiracao|relaxamento|posterior|quadriceps|pescoco|peitoral|ombro cruzado|triceps acima/.test(key)) return 'stretch';
  if (/mobilidade|circulos|deslizamento|retracao|rotacao|wall slide|aquecimento/.test(key)) return 'mobility';
  if (/prancha|abdominal|russian|bicicleta|dead bug|inseto|calcanhar|joelho|abdomen|core|contracao/.test(key)) return 'core';
  if (/remada|puxada|pulldown|barra fixa|pull up|superman|pullover|costas|t-bar|pendlay/.test(key)) return key.includes('puxada') || key.includes('pulldown') || key.includes('barra fixa') ? 'pull' : 'row';
  if (/stiff|terra|good morning|romeno/.test(key)) return 'hinge';
  if (/elevacao pelvica|hip thrust|bridge|quadril|coice|abducao/.test(key)) return 'bridge';
  if (/agachamento|leg press|sentar|cadeira extensora|panturrilha|gemeos|passo|avanco|lunge|bulgaro|marcha|perna|joelho/.test(key)) return /passo|avanco|lunge|bulgaro/.test(key) ? 'lunge' : 'squat';
  if (/desenvolvimento|elevacao lateral|elevacao frontal|face pull|ombro|arnold|militar|posterior|crucifixo inverso|peck deck/.test(key)) return 'shoulder';
  if (/rosca|biceps|martelo|scott|concentrada|curl/.test(key)) return 'curl';
  if (/triceps|testa|frances|supino fechado|mergulho|dips|extensao/.test(key)) return 'triceps';
  if (/crucifixo|fly|abertura|cross over/.test(key)) return 'fly';
  if (/supino|flexao|pressao|peito|push|bench|chest/.test(key)) return 'press';
  return null;
}

function ExerciseAnimation({ type, label }: { type: ExerciseAnimationType, label: string }) {
  const bodyMotion = type === 'squat' || type === 'lunge'
    ? 'translate(0 0);translate(0 42);translate(0 0)'
    : type === 'hinge'
      ? 'translate(0 -6);translate(28 18);translate(0 -6)'
      : type === 'bridge'
        ? 'translate(0 24);translate(0 -8);translate(0 24)'
        : type === 'core'
          ? 'translate(-14 0);translate(14 0);translate(-14 0)'
          : 'translate(0 0);translate(0 -6);translate(0 0)';
  const armMotion = type === 'press' || type === 'shoulder' || type === 'triceps' || type === 'pull'
    ? 'translate(0 -34);translate(0 34);translate(0 -34)'
    : type === 'fly'
      ? 'translate(-42 0);translate(42 0);translate(-42 0)'
      : type === 'row' || type === 'curl'
        ? 'translate(38 0);translate(-24 0);translate(38 0)'
        : type === 'mobility' || type === 'stretch'
          ? 'translate(-24 -8);translate(24 8);translate(-24 -8)'
          : 'translate(0 0);translate(0 -12);translate(0 0)';
  const legMotion = type === 'lunge'
    ? 'translate(-26 0);translate(26 0);translate(-26 0)'
    : type === 'squat' || type === 'bridge'
      ? 'translate(0 0);translate(0 -18);translate(0 0)'
      : 'translate(0 0);translate(0 8);translate(0 0)';
  const showWeights = !['core', 'mobility', 'stretch', 'squat', 'lunge', 'bridge'].includes(type);

  return (
    <div className="relative w-full h-full min-h-[240px] bg-[#f7f7f7] overflow-hidden flex items-center justify-center">
      <svg viewBox="0 0 640 380" className="w-full h-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id="demoSkin" x1="0" x2="1">
            <stop offset="0%" stopColor="#c9c9c9" />
            <stop offset="100%" stopColor="#8f8f8f" />
          </linearGradient>
          <linearGradient id="demoMuscle" x1="0" x2="1">
            <stop offset="0%" stopColor="#ff6a00" />
            <stop offset="100%" stopColor="#b82916" />
          </linearGradient>
          <filter id="demoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000" floodOpacity="0.18" />
          </filter>
        </defs>

        <rect width="640" height="380" fill="#f7f7f7" />
        <ellipse cx="320" cy="326" rx="215" ry="22" fill="#000" opacity="0.08" />

        <g filter="url(#demoShadow)">
          <rect x="178" y="238" width="284" height="34" rx="17" fill="#1f1f1f" />
          <rect x="218" y="270" width="18" height="68" rx="6" fill="#2b2b2b" />
          <rect x="404" y="270" width="18" height="68" rx="6" fill="#2b2b2b" />
          <rect x="186" y="332" width="70" height="10" rx="5" fill="#2b2b2b" />
          <rect x="386" y="332" width="70" height="10" rx="5" fill="#2b2b2b" />
        </g>

        <g filter="url(#demoShadow)">
          <g>
            <animateTransform attributeName="transform" type="translate" values={bodyMotion} dur="1.25s" repeatCount="indefinite" />
            <ellipse cx="320" cy="222" rx="96" ry="42" fill="url(#demoSkin)" />
            <ellipse cx="320" cy="218" rx="50" ry="27" fill="url(#demoMuscle)" opacity="0.95" />
            <circle cx="456" cy="218" r="31" fill="url(#demoSkin)" />
            <path d="M432 218c20-28 53-18 58 6-17-11-36-12-58-6Z" fill="#222" />
            <rect x="194" y="240" width="96" height="24" rx="12" fill="#222" opacity="0.9" />
          </g>
        </g>

        <g strokeLinecap="round" strokeLinejoin="round" filter="url(#demoShadow)">
          <g>
            <animateTransform attributeName="transform" type="translate" values={armMotion} dur="1.15s" repeatCount="indefinite" />
            <line x1="275" y1="204" x2="242" y2="142" stroke="url(#demoSkin)" strokeWidth="20" />
            <line x1="242" y1="142" x2="242" y2="76" stroke="url(#demoSkin)" strokeWidth="18" />
            <line x1="365" y1="204" x2="398" y2="142" stroke="url(#demoSkin)" strokeWidth="20" />
            <line x1="398" y1="142" x2="398" y2="76" stroke="url(#demoSkin)" strokeWidth="18" />
          </g>
        </g>

        <g filter="url(#demoShadow)">
          <g opacity={showWeights ? 1 : 0}>
            <animateTransform attributeName="transform" type="translate" values={armMotion} dur="1.15s" repeatCount="indefinite" />
            <rect x="214" y="56" width="56" height="18" rx="9" fill="#191919" />
            <circle cx="214" cy="65" r="22" fill="#111" />
            <circle cx="270" cy="65" r="22" fill="#111" />
            <circle cx="214" cy="65" r="10" fill="#333" />
            <circle cx="270" cy="65" r="10" fill="#333" />
          </g>
          <g opacity={showWeights ? 1 : 0}>
            <animateTransform attributeName="transform" type="translate" values={armMotion} dur="1.15s" repeatCount="indefinite" />
            <rect x="370" y="56" width="56" height="18" rx="9" fill="#191919" />
            <circle cx="370" cy="65" r="22" fill="#111" />
            <circle cx="426" cy="65" r="22" fill="#111" />
            <circle cx="370" cy="65" r="10" fill="#333" />
            <circle cx="426" cy="65" r="10" fill="#333" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values={legMotion} dur="1.25s" repeatCount="indefinite" />
            <path d="M276 249c-28 20-49 43-64 76" fill="none" stroke="url(#demoSkin)" strokeWidth="24" strokeLinecap="round" />
            <path d="M364 249c28 20 49 43 64 76" fill="none" stroke="url(#demoSkin)" strokeWidth="24" strokeLinecap="round" />
          </g>
        </g>

        <path d="M231 92c-22 27-22 58 0 86" fill="none" stroke="#ff6a00" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        <path d="M409 92c22 27 22 58 0 86" fill="none" stroke="#ff6a00" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      </svg>
    </div>
  );
}

function ExecutionModal({
  exercise,
  language,
  onClose
}: {
  exercise: Exercise,
  language: LanguageCode,
  onClose: () => void
}) {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [apiVideoUrl, setApiVideoUrl] = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(true);
  const [curatedVideoFailed, setCuratedVideoFailed] = useState(false);
  const animationType = getExerciseAnimationType(exercise.name) ?? 'mobility';
  const exerciseDisplay = getExerciseDisplay(exercise, language);

  useEffect(() => {
    let cancelled = false;
    setGifUrl(null);
    setApiVideoUrl(null);
    setCuratedVideoFailed(false);
    setGifLoading(true);
    const localMedia = getLocalExerciseMedia(exercise.name);
    if (localMedia) {
      setGifUrl(localMedia);
      setGifLoading(false);
      return () => { cancelled = true; };
    }
    if (exercise.videoUrl && !curatedVideoFailed) {
      setGifLoading(false);
      return () => { cancelled = true; };
    }
    const searchName = translateExerciseName(exercise.name);
    searchExercisesByName(exercise.name)
      .then((results: any) => {
        if (cancelled) return;
        const list = Array.isArray(results) ? results : results?.data;
        if (Array.isArray(list) && list.length > 0) {
          setApiVideoUrl(list[0].videoUrl ?? list[0].video_url ?? null);
          setGifUrl(list[0].gifUrl ?? list[0].gif_url ?? null);
        } else {
          console.warn('[ExerciseModal] No GIF found for:', exercise.name, 'query:', searchName, results);
        }
      })
      .catch((err: any) => { console.error('[ExerciseModal] GIF fetch error:', err?.message); })
      .finally(() => { if (!cancelled) setGifLoading(false); });
    return () => { cancelled = true; };
  }, [exercise.name, exercise.videoUrl, animationType, curatedVideoFailed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-background/80 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-surface w-full max-w-5xl rounded-[48px] border border-white/10 overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
      >
        {/* Video Area */}
        <div className="lg:flex-1 bg-black relative aspect-video lg:aspect-auto">
          {gifLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : apiVideoUrl ? (
            <video
              src={apiVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls
              onLoadedMetadata={(event) => setExerciseVideoSpeed(event.currentTarget)}
              onError={() => setApiVideoUrl(null)}
              className="w-full h-full object-contain"
            />
          ) : gifUrl ? (
            <img src={gifUrl} alt={exerciseDisplay.name} onError={() => setGifUrl(null)} className="w-full h-full object-contain" />
          ) : exercise.videoUrl && !curatedVideoFailed ? (
            <video
              src={exercise.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls
              onLoadedMetadata={(event) => setExerciseVideoSpeed(event.currentTarget)}
              onError={() => setCuratedVideoFailed(true)}
              className="w-full h-full object-contain"
            />
          ) : animationType ? (
            <ExerciseAnimation type={animationType} label={exerciseDisplay.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted flex-col gap-5 p-8 text-center">
              <div className="w-20 h-20 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center">
                <PlayCircle size={44} className="text-primary" />
              </div>
              <div>
                <p className="font-black uppercase tracking-widest text-xs text-text-primary">Guia de execução</p>
                <p className="text-xs mt-2 max-w-xs leading-relaxed">
                  A API não retornou GIF para este exercício. Use as instruções ao lado para executar com segurança.
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 bg-black/50 backdrop-blur-md rounded-2xl text-text-primary hover:bg-primary transition-all z-10 lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        {/* Info Area */}
        <div className="lg:w-[400px] p-8 sm:p-12 overflow-y-auto space-y-10 border-l border-white/5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-3xl font-black tracking-tight uppercase">{exerciseDisplay.name}</h3>
              <p className="text-primary font-black text-xs uppercase tracking-[0.2em]">{exerciseDisplay.muscleGroup}</p>
            </div>
            <button 
              onClick={onClose}
              className="hidden lg:flex p-3 bg-white/5 rounded-2xl text-text-muted hover:text-primary transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Instructions */}
          {exercise.instructions && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Info size={18} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest">Instruções</h4>
              </div>
              <ul className="space-y-4">
                {exerciseDisplay.instructions.map((step, i) => (
                  <li key={i} className="flex gap-4 text-text-secondary leading-relaxed">
                    <span className="text-primary font-black">{i + 1}.</span>
                    <span className="text-sm font-medium">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pro Tips & Errors */}
          <div className="grid grid-cols-1 gap-6">
            {exercise.proTips && (
              <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Zap size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dica Pro</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium italic">
                  "{exerciseDisplay.proTips[0]}"
                </p>
              </div>
            )}

            {exercise.commonErrors && (
              <div className="p-6 bg-error/5 rounded-3xl border border-error/10 space-y-3">
                <div className="flex items-center gap-2 text-error">
                  <AlertTriangle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Erro Comum</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                  {exerciseDisplay.commonErrors[0]}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ExerciseCard({
  exercise,
  language,
  index,
  isEditing,
  isCompleted,
  onUpdate,
  onShowExecution,
  onToggleComplete,
  isActionPending = false
}: {
  exercise: Exercise,
  language: LanguageCode,
  index: number,
  isEditing: boolean,
  isCompleted: boolean,
  onUpdate: (field: keyof Exercise, value: any) => void,
  onShowExecution: () => void,
  onToggleComplete: () => void | Promise<void>,
  isActionPending?: boolean
}) {
  const [isResting, setIsResting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [apiVideoUrl, setApiVideoUrl] = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(false);
  const [curatedVideoFailed, setCuratedVideoFailed] = useState(false);
  const animationType = getExerciseAnimationType(exercise.name) ?? 'mobility';
  const exerciseDisplay = getExerciseDisplay(exercise, language);

  const fetchApiExerciseMedia = async () => {
    if (gifUrl || apiVideoUrl) return;
    const localMedia = getLocalExerciseMedia(exercise.name);
    if (localMedia) {
      setGifUrl(localMedia);
      return;
    }
    const searchName = translateExerciseName(exercise.name);
    setGifLoading(true);
    try {
      const results = await searchExercisesByName(exercise.name);
      const list = Array.isArray(results) ? results : results?.data;
      if (Array.isArray(list) && list.length > 0) {
        setApiVideoUrl(list[0].videoUrl ?? list[0].video_url ?? null);
        setGifUrl(list[0].gifUrl ?? list[0].gif_url ?? null);
      } else {
        console.warn('[ActiveExercise] No GIF found for:', exercise.name, 'query:', searchName, results);
      }
    } catch (err: any) {
      console.error('[ActiveExercise] GIF fetch error:', err?.message);
    } finally {
      setGifLoading(false);
    }
  };

  const handleToggleDetails = async () => {
    if (showDetails) {
      setShowDetails(false);
      return;
    }
    setShowDetails(true);
    setCuratedVideoFailed(false);
    if (gifUrl || apiVideoUrl) return;
    const localMedia = getLocalExerciseMedia(exercise.name);
    if (localMedia) {
      setGifUrl(localMedia);
      return;
    }
    if (exercise.videoUrl) {
      return;
    }
    await fetchApiExerciseMedia();
  };

  useEffect(() => {
    if (showDetails && curatedVideoFailed) {
      fetchApiExerciseMedia();
    }
  }, [showDetails, curatedVideoFailed]);

  return (
    <div className={`bg-surface rounded-[32px] md:rounded-[40px] border transition-all duration-500 overflow-hidden group ${
      isCompleted
        ? 'border-success/30 bg-success/5 shadow-2xl shadow-success/5'
        : isResting ? 'border-primary/40 bg-primary/5 shadow-2xl shadow-primary/5' : 'border-white/5 hover:border-white/10'
    }`}>
      {/* Main card row */}
      <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div className="flex items-start sm:items-center gap-6 md:gap-8 flex-1">
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[24px] flex items-center justify-center text-xl md:text-2xl font-black transition-all duration-500 border shrink-0 ${
            isCompleted
              ? 'bg-success text-white border-success/20'
              : isResting ? 'bg-primary text-text-primary border-primary/20 scale-110' : 'bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 border-white/5'
          }`}>
            {isCompleted ? <CheckCircle2 size={24} /> : index + 1}
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              {isEditing ? (
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => onUpdate('name', e.target.value)}
                  className="bg-transparent border-b border-primary/30 text-xl md:text-2xl font-black tracking-tight focus:outline-none w-full"
                />
              ) : (
                <h4 className="text-xl md:text-2xl font-black tracking-tight">{exerciseDisplay.name}</h4>
              )}
              {isResting && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-3 py-1 bg-primary text-text-primary text-[8px] font-black rounded-full uppercase tracking-widest"
                >
                  Descansando
                </motion.span>
              )}
              {isCompleted && (
                <span className="px-3 py-1 bg-success/10 text-success text-[8px] font-black rounded-full uppercase tracking-widest border border-success/20">
                  Concluído
                </span>
              )}
            </div>
            <p className="text-text-secondary text-sm md:text-base max-w-md leading-relaxed line-clamp-2">{exerciseDisplay.description}</p>

            {!isEditing && (
              <button
                onClick={handleToggleDetails}
                className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors group/btn pt-2 min-h-[44px]"
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover/btn:bg-primary/20 transition-all">
                  <PlayCircle size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {showDetails ? 'Fechar Execução' : 'Ver Execução'}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-12 w-full lg:w-auto">
          <div className="flex gap-8 md:gap-12 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-center space-y-1">
              <div className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Séries</div>
              {isEditing ? (
                <input
                  type="number"
                  value={exercise.series}
                  onChange={(e) => onUpdate('series', parseInt(e.target.value))}
                  className="bg-transparent border-b border-primary/30 text-2xl md:text-3xl font-black text-primary w-16 text-center focus:outline-none min-h-[44px]"
                />
              ) : (
                <div className="text-2xl md:text-3xl font-black text-primary">{exercise.series}</div>
              )}
            </div>
            <div className="text-center space-y-1">
              <div className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Reps</div>
              {isEditing ? (
                <input
                  type="text"
                  value={exercise.reps}
                  onChange={(e) => onUpdate('reps', e.target.value)}
                  className="bg-transparent border-b border-primary/30 text-2xl md:text-3xl font-black text-primary w-20 text-center focus:outline-none min-h-[44px]"
                />
              ) : (
                <div className="text-2xl md:text-3xl font-black text-primary">{exercise.reps}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 w-full sm:w-auto">
            {!isEditing && (
              <div className="h-12 w-px bg-white/10 hidden md:block" />
            )}

            {isEditing ? (
              <div className="text-center space-y-1 w-full sm:w-auto">
                <div className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Descanso</div>
                <input
                  type="text"
                  value={exercise.restTime}
                  onChange={(e) => onUpdate('restTime', e.target.value)}
                  className="bg-transparent border-b border-primary/30 text-2xl md:text-3xl font-black text-text-primary w-full sm:w-24 text-center focus:outline-none min-h-[44px]"
                />
              </div>
            ) : (
              <RestTimer restTime={exercise.restTime} timerId={String(exercise.id)} onStateChange={setIsResting} />
            )}
          </div>

          {!isEditing && (
            <button
              onClick={onToggleComplete}
              disabled={isActionPending}
              className={`w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isCompleted
                  ? 'bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white'
              } disabled:opacity-70 disabled:cursor-wait`}
            >
              {isActionPending ? <Loader2 size={15} className="animate-spin" /> : isCompleted ? <CheckCircle2 size={15} /> : <Check size={15} />}
              {isActionPending ? 'Registrando' : isCompleted ? 'Concluído' : 'Concluir'}
            </button>
          )}
        </div>
      </div>

      {/* Expandable demo panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/5"
          >
            <div className="flex flex-col lg:flex-row">
              {/* GIF / Video */}
              <div className="lg:w-1/2 bg-black aspect-video lg:aspect-auto min-h-[220px] flex items-center justify-center relative">
                {gifLoading ? (
                  <div className="flex flex-col items-center gap-4 text-text-muted">
                    <span className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Carregando...</p>
                  </div>
                ) : apiVideoUrl ? (
                  <video
                    src={apiVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    onLoadedMetadata={(event) => setExerciseVideoSpeed(event.currentTarget)}
                    onError={() => setApiVideoUrl(null)}
                    className="w-full h-full object-contain"
                  />
                ) : gifUrl ? (
                  <img
                    src={gifUrl}
                    alt={exerciseDisplay.name}
                    onError={() => setGifUrl(null)}
                    className="w-full h-full object-contain"
                  />
                ) : exercise.videoUrl && !curatedVideoFailed ? (
                  <video
                    src={exercise.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    onLoadedMetadata={(event) => setExerciseVideoSpeed(event.currentTarget)}
                    onError={() => setCuratedVideoFailed(true)}
                    className="w-full h-full object-contain"
                  />
                ) : animationType ? (
                  <ExerciseAnimation type={animationType} label={exerciseDisplay.name} />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-text-muted p-8 text-center">
                    <div className="w-16 h-16 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center">
                      <PlayCircle size={34} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-primary">Guia de execução</p>
                      <p className="text-xs mt-2 max-w-xs leading-relaxed opacity-70">
                        GIF não encontrado na API. Siga as instruções deste exercício.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="lg:w-1/2 p-8 space-y-8 overflow-y-auto max-h-[400px]">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tight uppercase">{exerciseDisplay.name}</h3>
                  <p className="text-primary font-black text-xs uppercase tracking-[0.2em]">{exerciseDisplay.muscleGroup}</p>
                </div>

                {exercise.instructions && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Info size={16} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest">Instruções</h4>
                    </div>
                    <ul className="space-y-3">
                      {exerciseDisplay.instructions.map((step, i) => (
                        <li key={i} className="flex gap-4 text-text-secondary leading-relaxed">
                          <span className="text-primary font-black shrink-0">{i + 1}.</span>
                          <span className="text-sm font-medium">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {exercise.proTips && (
                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Zap size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Dica Pro</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium italic">"{exerciseDisplay.proTips[0]}"</p>
                  </div>
                )}

                {exercise.commonErrors && (
                  <div className="p-5 bg-error/5 rounded-2xl border border-error/10 space-y-2">
                    <div className="flex items-center gap-2 text-error">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Erro Comum</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">{exerciseDisplay.commonErrors[0]}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkoutDetailView({
  workout,
  language,
  onBack,
  isCompleted,
  hasAwardedPoints,
  onToggleComplete,
  canEdit,
  currentPoints,
  isFreePointsPlan,
  freePointsLimit,
  planPointsLimit,
  onUpgrade
}: {
  workout: Workout,
  language: LanguageCode,
  onBack: () => void,
  isCompleted: boolean,
  hasAwardedPoints: boolean,
  onToggleComplete: () => Promise<number | null>,
  canEdit: boolean,
  currentPoints: number,
  isFreePointsPlan: boolean,
  freePointsLimit: number,
  planPointsLimit: number,
  onUpgrade: () => void
}) {
  const [exercises, setExercises] = useState(workout.exercises);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExerciseForVideo, setSelectedExerciseForVideo] = useState<Exercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [showPointsNotice, setShowPointsNotice] = useState(false);
  const [pointsNoticeMode, setPointsNoticeMode] = useState<'earned' | 'earnedLimit' | 'limit' | 'complete'>('earned');
  const [displayPoints, setDisplayPoints] = useState(currentPoints);
  const [isAwardingWorkout, setIsAwardingWorkout] = useState(false);
  const workoutDisplay = getWorkoutDisplay(workout, language);
  const locale = getLocaleCode(language);

  const POINTS_PER_WORKOUT = 100;

  useEffect(() => {
    setExercises(workout.exercises);
    setCompletedExercises(isCompleted ? workout.exercises.map(exercise => exercise.id) : []);
    setShowPointsNotice(false);
    setSelectedExerciseForVideo(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [workout.id, workout.exercises]);

  useEffect(() => {
    setDisplayPoints(currentPoints);
  }, [currentPoints]);

  useEffect(() => {
    if (!isFreePointsPlan) return;
    const handleFreePhaseCompleted = (event: Event) => {
      const points = (event as CustomEvent<{ points?: number }>).detail?.points || freePointsLimit;
      setDisplayPoints(points);
      setPointsNoticeMode('earnedLimit');
      setShowPointsNotice(true);
    };
    window.addEventListener('ironshape:free-phase-completed', handleFreePhaseCompleted);
    return () => window.removeEventListener('ironshape:free-phase-completed', handleFreePhaseCompleted);
  }, [isFreePointsPlan, freePointsLimit]);

  const completedCount = completedExercises.length;
  const totalExercises = exercises.length || 1;
  const workoutProgress = Math.round((completedCount / totalExercises) * 100);
  const milestoneProgress = Math.min(100, Math.round((displayPoints / planPointsLimit) * 100));
  const freeLimitReached = isFreePointsPlan && displayPoints >= freePointsLimit;
  const planLimitReached = displayPoints >= planPointsLimit;
  const isLimitNotice = pointsNoticeMode === 'limit';
  const isEarnedLimitNotice = pointsNoticeMode === 'earnedLimit';
  const isCompleteNotice = pointsNoticeMode === 'complete';
  const noticeReachedPoints = isEarnedLimitNotice ? freePointsLimit : displayPoints;

  const completeWorkout = async () => {
    if (isAwardingWorkout) return false;
    if (isCompleted && hasAwardedPoints) {
      setPointsNoticeMode('complete');
      setShowPointsNotice(true);
      setTimeout(() => setShowPointsNotice(false), 4500);
      return false;
    }
    if (planLimitReached && !hasAwardedPoints) {
      setPointsNoticeMode('limit');
      setShowPointsNotice(true);
      return false;
    }
    setIsAwardingWorkout(true);
    try {
      const nextPoints = await onToggleComplete();
      if (nextPoints !== null) {
        const willReachFreeLimit = isFreePointsPlan && nextPoints >= freePointsLimit;
        setDisplayPoints(nextPoints);
        setPointsNoticeMode(willReachFreeLimit ? 'earnedLimit' : 'earned');
        if (!willReachFreeLimit) setShowPointsNotice(true);
        if (!willReachFreeLimit) setTimeout(() => setShowPointsNotice(false), 4500);
      }
      return nextPoints !== null;
    } finally {
      setIsAwardingWorkout(false);
    }
  };

  const toggleExerciseComplete = async (exerciseId: string) => {
    const alreadyDone = completedExercises.includes(exerciseId);
    const next = alreadyDone
      ? completedExercises.filter(id => id !== exerciseId)
      : [...completedExercises, exerciseId];

    setCompletedExercises(next);

    if (!alreadyDone && next.length === exercises.length) {
      await completeWorkout();
    }
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 pb-56 md:pb-32"
    >
      <AnimatePresence>
        {selectedExerciseForVideo && (
          <ExecutionModal
            exercise={selectedExerciseForVideo}
            language={language}
            onClose={() => setSelectedExerciseForVideo(null)}
          />
        )}
      </AnimatePresence>

      {/* Header compacto */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
          >
            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Treinos</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                isEditing ? 'bg-primary text-white' : 'bg-white/5 border border-white/10 text-text-muted hover:text-white'
              }`}
            >
              <Edit3 size={13} />
              {isEditing ? 'Salvar' : 'Editar'}
            </button>
          )}
        </div>

        {/* Tags + título */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
              {workoutDisplay.muscleGroup}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
              {workoutDisplay.level}
            </span>
            {isCompleted && (
              <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-[0.2em] border border-success/20 flex items-center gap-1">
                <CheckCircle2 size={10} /> Concluído
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">{workoutDisplay.name}</h1>
        </div>

        {/* Métricas inline e compactas */}
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-text-muted">
            <Clock size={14} className="text-primary" />
            <span className="font-bold">{workout.duration}</span>
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="flex items-center gap-1.5 text-text-muted">
            <Zap size={14} className="text-primary" />
            <span className="font-bold">{workoutDisplay.carga}</span>
          </span>
          <span className="w-px h-4 bg-white/10" />
          <span className="flex items-center gap-1.5 text-text-muted">
            <Dumbbell size={14} className="text-primary" />
            <span className="font-bold">{workout.exercises.length} exercícios</span>
          </span>
        </div>
      </header>

      <AnimatePresence>
        {showPointsNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xl flex items-center justify-center p-5"
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-md bg-surface border border-primary/20 rounded-[36px] p-7 sm:p-8 shadow-2xl shadow-primary/10 relative overflow-hidden"
            >
              {(isLimitNotice || isEarnedLimitNotice) && <CelebrationFireworks />}
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 bg-primary/20 rounded-full blur-[90px] pointer-events-none" />
              <div className="relative z-10 space-y-6 text-center">
                <div className="relative w-24 h-24 mx-auto">
                  {[0, 1, 2, 3, 4, 5].map((spark) => (
                    <motion.span
                      key={spark}
                      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.4, 1, 0.2],
                        x: Math.cos((spark / 6) * Math.PI * 2) * 54,
                        y: Math.sin((spark / 6) * Math.PI * 2) * 54,
                      }}
                      transition={{ duration: 1.2, delay: 0.1 + spark * 0.05, ease: 'easeOut' }}
                      className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_16px_rgba(255,106,0,0.8)]"
                    />
                  ))}
                  <motion.div
                    initial={{ scale: 0.75, rotate: -8 }}
                    animate={{ scale: [0.75, 1.12, 1], rotate: [-8, 4, 0] }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-[28px] bg-primary text-white flex items-center justify-center shadow-2xl shadow-primary/30 border border-primary-hover/40"
                  >
                    <Trophy size={44} />
                  </motion.div>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Parabéns</div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">
                    {isLimitNotice
                      ? isFreePointsPlan ? 'Primeira fase concluída!' : 'Meta do plano concluída!'
                      : isEarnedLimitNotice ? 'Primeira fase concluída!'
                      : isCompleteNotice ? 'Treino já registrado!'
                      : 'Treino concluído!'}
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {isLimitNotice
                      ? isFreePointsPlan
                        ? `Você chegou aos ${freePointsLimit} pontos e completou sua jornada inicial. Assine Pro ou Elite para continuar com novos protocolos e evolução contínua.`
                        : `Você alcançou a meta máxima de ${planPointsLimit.toLocaleString(locale)} pontos do seu plano.`
                      : isEarnedLimitNotice
                      ? `Você ganhou +${POINTS_PER_WORKOUT} pontos e fechou a primeira fase do IronShape. Agora desbloqueie Pro ou Elite para seguir para a próxima etapa.`
                      : isCompleteNotice
                      ? 'Esse treino já está contando no seu ranking. Continue mantendo a sequência e volte amanhã para somar mais.'
                      : `Você ganhou +${POINTS_PER_WORKOUT} pts e alcançou ${noticeReachedPoints} pts. Continue concluindo treinos para subir no ranking.`}
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-primary/10 border border-primary/20 rounded-[28px] p-5"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Zap size={22} className="text-primary" />
                    <div className="text-5xl font-black text-primary tracking-tighter">
                      {isLimitNotice ? planPointsLimit.toLocaleString(locale) : isCompleteNotice ? displayPoints.toLocaleString(locale) : `+${POINTS_PER_WORKOUT}`}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-text-muted">pts</span>
                  </div>
                </motion.div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Seu progresso</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{displayPoints.toLocaleString(locale)} pts</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: `${Math.max(0, milestoneProgress - 10)}%` }}
                      animate={{ width: `${milestoneProgress}%` }}
                      transition={{ delay: 0.25, duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-primary shadow-[0_0_18px_rgba(255,106,0,0.55)]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-text-muted">
                    <span>0</span>
                    <span>{isFreePointsPlan ? `Fase 1: ${freePointsLimit.toLocaleString(locale)} pts` : `Meta ${planPointsLimit.toLocaleString(locale)} pts`}</span>
                  </div>
                </div>

                {(isLimitNotice && isFreePointsPlan) || isEarnedLimitNotice ? (
                  <button
                    onClick={onUpgrade}
                    className="w-full min-h-[52px] bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95"
                  >
                    Continuar minha evolução
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPointsNotice(false)}
                    className="w-full min-h-[52px] bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95"
                  >
                    Continuar
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="bg-surface border border-white/5 rounded-[28px] p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Progresso do treino</div>
            <div className="mt-1 text-lg font-black">{completedCount}/{exercises.length} exercícios concluídos</div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
            {workoutProgress}%
          </div>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${workoutProgress}%` }}
            className="h-full bg-primary shadow-[0_0_15px_rgba(255,106,0,0.45)]"
          />
        </div>

        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trophy size={18} className="text-primary" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Pontos</div>
                <div className="text-sm font-black">{displayPoints.toLocaleString(locale)} pts</div>
              </div>
            </div>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              {isFreePointsPlan ? `Fase 1: ${freePointsLimit.toLocaleString(locale)} pts` : `Meta ${planPointsLimit.toLocaleString(locale)} pts`}
            </span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${milestoneProgress}%` }}
              className="h-full bg-success"
            />
          </div>
          {freeLimitReached && (
            <button
              onClick={onUpgrade}
              className="w-full min-h-[44px] bg-primary/10 text-primary border border-primary/20 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
            >
              Continuar no Pro ou Elite
            </button>
          )}
        </div>
      </section>

      {/* Exercícios — direto, sem heading extra */}
      <div className="grid grid-cols-1 gap-4">
        {exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              language={language}
              index={index}
            isEditing={isEditing}
            isCompleted={completedExercises.includes(exercise.id)}
            onUpdate={(field, value) => updateExercise(index, field, value)}
            onShowExecution={() => setSelectedExerciseForVideo(exercise)}
            onToggleComplete={() => toggleExerciseComplete(exercise.id)}
            isActionPending={isAwardingWorkout}
          />
        ))}
      </div>

      {/* CTA fixo no rodapé */}
      <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-50 md:z-40 p-4 bg-background/80 backdrop-blur-xl border-t border-white/5">
        <button
          onClick={async () => {
            if (isAwardingWorkout) return;
            if (freeLimitReached && !hasAwardedPoints) {
              setPointsNoticeMode('limit');
              setShowPointsNotice(true);
              return;
            }
            if (!isCompleted || !hasAwardedPoints) {
              setCompletedExercises(exercises.map(exercise => exercise.id));
              await completeWorkout();
            } else {
              setPointsNoticeMode('complete');
              setShowPointsNotice(true);
              setTimeout(() => setShowPointsNotice(false), 4500);
            }
          }}
          className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 ${
            isCompleted
              ? 'bg-success text-white shadow-success/20'
              : 'bg-primary text-white shadow-primary/30 hover:bg-orange-400'
          }`}
          disabled={isAwardingWorkout}
        >
          {isAwardingWorkout ? (
            <><Loader2 size={18} className="animate-spin" /> Registrando</>
          ) : freeLimitReached && !hasAwardedPoints ? (
            <><Trophy size={18} /> Fazer Upgrade</>
          ) : isCompleted && hasAwardedPoints ? (
            <><CheckCircle2 size={18} /> Treino Concluído</>
          ) : isCompleted ? (
            <><Trophy size={18} /> Concluir Treino</>
          ) : (
            <><Play size={18} /> Concluir Treino de Hoje</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Selecione uma opção" 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  options: { value: string, label: string }[],
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-left flex items-center justify-between focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
      >
        <span className={selectedOption ? "text-text-primary" : "text-text-muted"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronRight 
          size={18} 
          className={`text-text-muted transition-transform duration-300 ${isOpen ? '-rotate-90' : 'rotate-90'}`} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto py-2">
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-6 py-3 text-sm font-bold text-left transition-colors hover:bg-primary hover:text-text-primary ${
                      value === opt.value ? 'bg-primary/20 text-primary' : 'text-text-secondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Body Progress ───────────────────────────────────────────────────────────

interface BodyMeasurement {
  date: string;
  weight?: number;
  bodyFat?: number;
  waist?: number;
  hip?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
}

const MEASURE_FIELDS: { key: keyof Omit<BodyMeasurement, 'date'>; label: string; unit: string; placeholder: string }[] = [
  { key: 'weight',  label: 'Peso',    unit: 'kg', placeholder: '70.5' },
  { key: 'bodyFat', label: '% Gordura', unit: '%', placeholder: '18' },
  { key: 'waist',   label: 'Cintura', unit: 'cm', placeholder: '80' },
  { key: 'hip',     label: 'Quadril', unit: 'cm', placeholder: '95' },
  { key: 'chest',   label: 'Peito',   unit: 'cm', placeholder: '100' },
  { key: 'arm',     label: 'Braço',   unit: 'cm', placeholder: '35' },
  { key: 'thigh',   label: 'Coxa',    unit: 'cm', placeholder: '55' },
];

function StepperControl({ field, step, value, onChange, onStep }: {
  field: typeof MEASURE_FIELDS[0];
  step: number;
  value: string;
  onChange: (key: string, val: string) => void;
  onStep: (key: string, step: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
        {field.label} <span className="text-primary/70">({field.unit})</span>
      </label>
      <div className="flex items-center bg-background border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary transition-all">
        <button
          type="button"
          onClick={() => onStep(field.key, -step)}
          className="w-14 flex items-center justify-center py-4 text-2xl font-black text-text-muted hover:text-primary hover:bg-white/5 transition-all active:scale-95 select-none"
        >
          −
        </button>
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <input
            type="number"
            step={step}
            value={value}
            onChange={e => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-20 bg-transparent text-center text-2xl font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm font-black text-text-muted">{field.unit}</span>
        </div>
        <button
          type="button"
          onClick={() => onStep(field.key, step)}
          className="w-14 flex items-center justify-center py-4 text-2xl font-black text-text-muted hover:text-primary hover:bg-white/5 transition-all active:scale-95 select-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

function BodyProgressView({ userId, language }: { userId: string; language: LanguageCode }) {
  const locale = getLocaleCode(language);
  const storageKey = `body_measurements_${userId}`;
  const todayKey = new Date().toISOString().split('T')[0];

  const readData = (): BodyMeasurement[] => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  };

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(readData);
  const [saved, setSaved] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [chartMetric, setChartMetric] = useState<keyof Omit<BodyMeasurement, 'date'>>('weight');

  const lastEntry = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  const [form, setForm] = useState<Partial<Record<keyof Omit<BodyMeasurement, 'date'>, string>>>(() => {
    if (!lastEntry) return {};
    const init: Partial<Record<keyof Omit<BodyMeasurement, 'date'>, string>> = {};
    for (const f of MEASURE_FIELDS) {
      if (lastEntry[f.key] !== undefined) init[f.key] = String(lastEntry[f.key]);
    }
    return init;
  });

  const todayEntry = measurements.find(m => m.date === todayKey);

  const updateField = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const stepField = (key: string, step: number) => {
    const current = parseFloat(form[key as keyof typeof form] || '0') || 0;
    const next = Math.round((current + step) * 10) / 10;
    if (next >= 0) updateField(key, String(next));
  };

  const saveMeasurement = () => {
    const entry: BodyMeasurement = { date: todayKey };
    let hasValue = false;
    for (const f of MEASURE_FIELDS) {
      const v = parseFloat(form[f.key] || '');
      if (!isNaN(v) && v > 0) { (entry as any)[f.key] = v; hasValue = true; }
    }
    if (!hasValue) return;

    const updated = measurements.filter(m => m.date !== todayKey);
    updated.push(entry);
    updated.sort((a, b) => a.date.localeCompare(b.date));
    setMeasurements(updated);
    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* ignore */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const chartData = measurements
    .filter(m => m[chartMetric] !== undefined)
    .map(m => ({
      date: new Date(m.date + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'short' }),
      value: m[chartMetric] as number,
    }));

  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const previous = measurements.length > 1 ? measurements[measurements.length - 2] : null;

  const diff = (key: keyof Omit<BodyMeasurement, 'date'>) => {
    if (!latest?.[key] || !previous?.[key]) return null;
    return ((latest[key] as number) - (previous[key] as number));
  };

  const fieldMeta = MEASURE_FIELDS.find(f => f.key === chartMetric)!;

  const primaryFields = MEASURE_FIELDS.filter(f => f.key === 'weight' || f.key === 'bodyFat');
  const optionalFields = MEASURE_FIELDS.filter(f => f.key !== 'weight' && f.key !== 'bodyFat');

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Progresso Corporal</h1>
        </div>
        <p className="text-text-secondary text-base ml-4">Acompanhe suas medidas e evolução ao longo do tempo.</p>
      </header>

      {/* Register today */}
      <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            {todayEntry ? 'Atualizar medidas de hoje' : 'Registrar medidas de hoje'}
          </span>
          <span className="text-[10px] text-text-muted font-bold">
            {new Date(todayKey + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Primary fields - Peso e % Gordura com stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {primaryFields.map(f => (
            <StepperControl key={f.key} field={f} step={f.key === 'weight' ? 0.1 : 0.5} value={form[f.key] || ''} onChange={updateField} onStep={stepField} />
          ))}
        </div>

        {/* Toggle medidas corporais opcionais */}
        <button
          type="button"
          onClick={() => setShowOptional(v => !v)}
          className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-text-secondary transition-colors"
        >
          <ChevronDown size={14} className={`transition-transform duration-300 ${showOptional ? 'rotate-180' : ''}`} />
          {showOptional ? 'Ocultar medidas corporais' : 'Adicionar medidas corporais'}
        </button>

        <div className={`overflow-hidden transition-all duration-300 ${showOptional ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {optionalFields.map(f => (
              <StepperControl key={f.key} field={f} step={0.5} value={form[f.key] || ''} onChange={updateField} onStep={stepField} />
            ))}
          </div>
        </div>

        <button
          onClick={saveMeasurement}
          className="w-full py-3.5 bg-primary text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
        >
          {saved ? <><Check size={14} /> Medidas Salvas!</> : <><Scale size={14} /> Salvar Medidas</>}
        </button>
      </div>

      {/* Sua evolução */}
      <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Sua evolução</p>
            <p className="text-[11px] text-text-secondary font-bold mt-0.5">
              {MEASURE_FIELDS.find(f => f.key === chartMetric)?.label ?? 'Peso'} ao longo do tempo
            </p>
          </div>
          {measurements.length >= 2 && (
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl flex-wrap">
              {MEASURE_FIELDS.filter(f => measurements.some(m => m[f.key] !== undefined)).map(f => (
                <button
                  key={f.key}
                  onClick={() => setChartMetric(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    chartMetric === f.key ? 'bg-primary text-text-primary' : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6A00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12, fontWeight: 700 }}
                formatter={(v: number) => [`${v} ${fieldMeta.unit}`, fieldMeta.label]}
              />
              <Area type="monotone" dataKey="value" stroke="#FF6A00" strokeWidth={2} fill="url(#bodyGrad)" dot={{ fill: '#FF6A00', strokeWidth: 0, r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-14 text-center space-y-3">
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-text-muted">
              <Ruler size={28} />
            </div>
            <p className="text-sm font-bold text-text-secondary">
              {measurements.length === 0 ? 'Nenhuma medida registrada ainda' : 'Registre pelo menos 2 datas para ver o gráfico'}
            </p>
            <p className="text-[11px] text-text-muted">Registre suas medidas acima para acompanhar sua evolução.</p>
          </div>
        )}
      </div>

      {/* Comparison latest vs previous */}
      {latest && (
        <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Última Medição</span>
            <span className="text-[10px] text-text-muted font-bold">
              {new Date(latest.date + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MEASURE_FIELDS.filter(f => latest[f.key] !== undefined).map(f => {
              const d = diff(f.key);
              const isGood = f.key === 'weight' || f.key === 'waist' || f.key === 'hip' ? d !== null && d <= 0 : d !== null && d >= 0;
              return (
                <div key={f.key} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">{f.label}</div>
                  <div className="text-xl font-black">{latest[f.key]}<span className="text-[11px] text-text-muted ml-1">{f.unit}</span></div>
                  {d !== null && (
                    <div className={`text-[10px] font-black mt-1 ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                      {d > 0 ? '+' : ''}{d.toFixed(1)} {f.unit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History table */}
      {measurements.length > 0 && (
        <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Histórico Completo</span>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-[10px] font-black text-text-muted uppercase tracking-widest pb-3 pr-4">Data</th>
                  {MEASURE_FIELDS.map(f => (
                    <th key={f.key} className="text-right text-[10px] font-black text-text-muted uppercase tracking-widest pb-3 px-2 whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...measurements].reverse().map((m, i) => (
                  <tr key={m.date} className={`border-b border-white/5 ${i === 0 ? 'text-text-primary' : 'text-text-secondary'}`}>
                    <td className="py-3 pr-4 font-black text-[11px] whitespace-nowrap">
                      {new Date(m.date + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'short', year: '2-digit' })}
                      {i === 0 && <span className="ml-2 text-[9px] text-primary font-black">HOJE</span>}
                    </td>
                    {MEASURE_FIELDS.map(f => (
                      <td key={f.key} className="py-3 px-2 text-right font-bold text-[12px]">
                        {m[f.key] !== undefined ? `${m[f.key]}${f.unit}` : <span className="text-white/20">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function NutritionView({ profile, language, onUpgrade, updateProfile, onOpenIronCoach }: {
  profile: UserProfile;
  language: LanguageCode;
  onUpgrade: () => void;
  updateProfile: (u: Partial<UserProfile>) => Promise<void>;
  onOpenIronCoach: (prompt: string) => void;
}) {
  const { isAdmin, simulatedPlan } = useAuth();
  const nutritionText = APP_TRANSLATIONS[language].nutrition;
  const locale = getLocaleCode(language);
  const effectivePlan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null);
  const hasIronCoachAccess = simulatedPlan
    ? simulatedPlan === 'Pro' || simulatedPlan === 'Elite' || simulatedPlan === 'Admin'
    : effectivePlan === 'Pro' || effectivePlan === 'Elite' || effectivePlan === 'Admin' || isAdmin;

  type MacroResults = {
    bmr: number;
    tdee: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  type NutritionCalcData = {
    weight: string;
    height: string;
    age: string;
    gender: 'male' | 'female';
    activityLevel: string;
    goal: 'lose' | 'maintain' | 'gain';
    goalFocus: string;
  };
  type GeneratedMealPlan = {
    time: string;
    name: string;
    icon: string;
    items: MealItem[];
  }[];

  const localStorageKey = `nutrition_prefs_${profile.id}`;
  const protocolStorageKey = `nutrition_protocol_${profile.id}`;
  const localPrefs = (() => {
    try { return JSON.parse(localStorage.getItem(localStorageKey) || 'null'); } catch { return null; }
  })();
  const savedProtocol = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(protocolStorageKey) || 'null') as {
        calcData?: NutritionCalcData;
        results?: MacroResults;
        mealPlan?: GeneratedMealPlan;
      } | null;
    } catch {
      return null;
    }
  })();
  const hasPrefs = !!(profile.nutrition_preferences || localPrefs);
  const [showPrefsForm, setShowPrefsForm] = useState(!hasPrefs);
  const [localNutritionPrefs, setLocalNutritionPrefs] = useState<NutritionPreferences | undefined>(
    profile.nutrition_preferences || localPrefs || undefined
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savePrefsError, setSavePrefsError] = useState('');

  const defaultCalcData: NutritionCalcData = {
    weight: profile.weight.toString(),
    height: profile.height.toString(),
    age: profile.age.toString(),
    gender: 'male' as 'male' | 'female',
    activityLevel: '1.55',
    goal: 'maintain' as 'lose' | 'maintain' | 'gain',
    goalFocus: ''
  };

  const [calcData, setCalcData] = useState<NutritionCalcData>(() => ({
    ...defaultCalcData,
    ...(savedProtocol?.calcData || {}),
    goalFocus: savedProtocol?.calcData?.goalFocus || '',
  }));
  const [results, setResults] = useState<MacroResults | null>(savedProtocol?.calcData?.goalFocus ? savedProtocol?.results || null : null);
  const [showCoachUpgradeModal, setShowCoachUpgradeModal] = useState(false);

  const goalFocusOptions = nutritionText.goalFocusOptions;
  const goalLabels: Record<NutritionCalcData['goal'], string> = {
    lose: nutritionText.lose,
    maintain: nutritionText.maintain,
    gain: nutritionText.gain,
  };
  const selectedGoalFocusLabel = goalFocusOptions[calcData.goal].find(option => option.value === calcData.goalFocus)?.label || '';
  const nutritionCoachCardText = {
    'pt-BR': {
      title: 'Ficou com alguma dúvida?',
      proBadge: 'Recurso Pro',
      description: 'O Iron Coach explica suas calorias e macros e ajuda a aplicar este protocolo na rotina.',
      talk: 'Conversar com o Iron Coach',
      unlock: 'Desbloquear Iron Coach',
      disclaimer: 'Orientações educativas. Para diagnóstico, condições clínicas ou plano alimentar individual, consulte um nutricionista.',
      analysisIntro: 'Analise meu protocolo nutricional e explique de forma simples.',
      professionalNote: 'Trate como orientação educativa e recomende acompanhamento profissional em caso de condição clínica.',
    },
    en: {
      title: 'Still have questions?',
      proBadge: 'Pro Feature',
      description: 'Iron Coach explains your calories and macros and helps you apply this protocol to your routine.',
      talk: 'Talk to Iron Coach',
      unlock: 'Unlock Iron Coach',
      disclaimer: 'Educational guidance. For diagnosis, clinical conditions, or an individual meal plan, consult a nutritionist.',
      analysisIntro: 'Analyze my nutrition protocol and explain it simply.',
      professionalNote: 'Treat this as educational guidance and recommend professional support for any clinical condition.',
    },
    es: {
      title: '¿Te quedó alguna duda?',
      proBadge: 'Recurso Pro',
      description: 'Iron Coach explica tus calorías y macros y te ayuda a aplicar este protocolo en la rutina.',
      talk: 'Conversar con Iron Coach',
      unlock: 'Desbloquear Iron Coach',
      disclaimer: 'Orientaciones educativas. Para diagnóstico, condiciones clínicas o un plan alimentario individual, consulta a un nutricionista.',
      analysisIntro: 'Analiza mi protocolo nutricional y explícalo de forma simple.',
      professionalNote: 'Trátalo como orientación educativa y recomienda acompañamiento profesional en caso de condición clínica.',
    },
  }[language];

  useEffect(() => {
    if (!showCoachUpgradeModal) return;
    trackEvent('nutrition_iron_coach_upgrade_view', {
      plan: effectivePlan,
      goal: calcData.goal,
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowCoachUpgradeModal(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showCoachUpgradeModal, effectivePlan, calcData.goal]);

  const mealPlanStorageKey = `meal_plan_${profile.id}`;
  const favoriteFoodsKey = `nutrition_favorites_${profile.id}`;

  const [mealPlan, setMealPlan] = useState<GeneratedMealPlan>(() => {
    if (savedProtocol?.mealPlan?.length) return savedProtocol.mealPlan;
    try { return JSON.parse(localStorage.getItem(`meal_plan_${profile.id}`) || '[]'); } catch { return []; }
  });

  const [favoriteFoods, setFavoriteFoods] = useState<MealItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(`nutrition_favorites_${profile.id}`) || '[]'); } catch { return []; }
  });
  const [nutritionHistory, setNutritionHistory] = useState<NutritionLog[]>([]);

  const [dailyTracker, setDailyTracker] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    meals: [] as { name: string, calories: number, protein: number, carbs: number, fat: number, timestamp: string }[]
  });

  const [isLoadingTracker, setIsLoadingTracker] = useState(true);
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [newMeal, setNewMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  });

  const persistMealPlan = (nextPlan: typeof mealPlan) => {
    setMealPlan(nextPlan);
    try { localStorage.setItem(mealPlanStorageKey, JSON.stringify(nextPlan)); } catch { /* ignore */ }
  };

  const persistFavoriteFoods = (nextFavorites: MealItem[]) => {
    setFavoriteFoods(nextFavorites);
    try { localStorage.setItem(favoriteFoodsKey, JSON.stringify(nextFavorites)); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!results) return;
    try {
      sessionStorage.setItem(protocolStorageKey, JSON.stringify({ calcData, results, mealPlan }));
    } catch { /* ignore */ }
  }, [protocolStorageKey, calcData, results, mealPlan]);

  const normalizeFavoriteKey = (item: MealItem) => `${item.name.trim().toLowerCase()}|${item.quantity.trim().toLowerCase()}`;

  const isFavoriteFood = (item: MealItem) => favoriteFoods.some(f => normalizeFavoriteKey(f) === normalizeFavoriteKey(item));

  const toggleFavoriteFood = (item: MealItem) => {
    const key = normalizeFavoriteKey(item);
    const exists = favoriteFoods.some(f => normalizeFavoriteKey(f) === key);
    persistFavoriteFoods(exists ? favoriteFoods.filter(f => normalizeFavoriteKey(f) !== key) : [item, ...favoriteFoods].slice(0, 18));
  };

  const upsertTodayHistory = (tracker: typeof dailyTracker) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLog: NutritionLog = {
      id: today,
      user_id: profile.id,
      date: today,
      calories: tracker.calories,
      protein: tracker.protein,
      carbs: tracker.carbs,
      fat: tracker.fat,
      meals: tracker.meals,
    };
    setNutritionHistory(prev => [todayLog, ...prev.filter(log => log.date !== today)].slice(0, 7));
  };

  const macroRemaining = (current: number, target: number, unit = '') => {
    const diff = target - current;
    if (diff > 0) return `faltam ${diff}${unit}`;
    if (diff < 0) return `${Math.abs(diff)}${unit} acima`;
    return 'meta batida';
  };

  useEffect(() => {
    const fetchTracker = async () => {
      if (!profile.id) return;
      setIsLoadingTracker(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [log, history] = await Promise.all([
          dataService.getNutritionLog(profile.id, today),
          dataService.getNutritionLogs(profile.id, 7)
        ]);
        setNutritionHistory(history || []);
        if (log) {
          setDailyTracker({
            calories: log.calories,
            protein: log.protein,
            carbs: log.carbs,
            fat: log.fat,
            meals: log.meals || []
          });
        }
      } catch (error) {
        console.error('Error fetching nutrition log:', error);
      } finally {
        setIsLoadingTracker(false);
      }
    };

    fetchTracker();
  }, [profile.id]);

  const saveTrackerToSupabase = async (tracker: typeof dailyTracker) => {
    if (!profile.id) return;
    upsertTodayHistory(tracker);
    try {
      const today = new Date().toISOString().split('T')[0];
      await dataService.updateNutritionLog({
        user_id: profile.id,
        date: today,
        calories: tracker.calories,
        protein: tracker.protein,
        carbs: tracker.carbs,
        fat: tracker.fat,
        meals: tracker.meals
      });
    } catch (error) {
      console.error('Error saving nutrition log:', error);
    }
  };

  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState('');

  const generateMealPlan = async (totalCals: number, p: number, c: number, f: number) => {
    setGeneratingPlan(true);
    setPlanError('');
    try {
      const headers = await getAuthenticatedJsonHeaders();
      const res = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          calories: totalCals,
          protein: p,
          carbs: c,
          fat: f,
          preferences: localNutritionPrefs ?? null
        })
      });
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Servidor não respondeu corretamente. Verifique se o servidor está rodando e tente novamente.');
      }
      if (!res.ok) throw new Error(data?.error || 'Erro ao gerar cardápio');
      if (!data?.meals?.length) throw new Error('Cardápio vazio retornado. Tente novamente.');
      persistMealPlan(data.meals);
    } catch (e: any) {
      setPlanError(e.message || 'Erro ao gerar cardápio. Tente novamente.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const calculateMacros = async () => {
    if (!calcData.goalFocus) return;

    const w = parseFloat(calcData.weight);
    const h = parseFloat(calcData.height);
    const a = parseFloat(calcData.age);
    const activity = parseFloat(calcData.activityLevel);

    if (isNaN(w) || isNaN(h) || isNaN(a)) return;

    // Mifflin-St Jeor Formula
    let bmr = 0;
    if (calcData.gender === 'male') {
      bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    } else {
      bmr = (10 * w) + (6.25 * h) - (5 * a) - 161;
    }

    const tdee = bmr * activity;
    let targetCalories = tdee;

    if (calcData.goal === 'lose') {
      targetCalories -= calcData.goalFocus === 'body_weight' ? 500 : 350;
    }
    if (calcData.goal === 'gain') {
      targetCalories += calcData.goalFocus === 'body_weight' ? 350 : calcData.goalFocus === 'body_composition' ? 200 : 300;
    }

    const calories = Math.round(targetCalories);
    const proteinMultiplier = calcData.goal === 'maintain' && calcData.goalFocus === 'health_wellbeing' ? 1.6 : 2;
    const protein = Math.round(w * proteinMultiplier);
    const fat = Math.round((calories * 0.25) / 9); // 25% of calories
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4);

    const nextResults = { 
      bmr: Math.round(bmr), 
      tdee: Math.round(tdee), 
      calories, 
      protein, 
      carbs, 
      fat 
    };

    trackEvent('nutrition_protocol_calculated', {
      goal: calcData.goal,
      goal_focus: calcData.goalFocus,
      activity_level: calcData.activityLevel,
    });
    setResults(nextResults);

    await generateMealPlan(calories, protein, carbs, fat);
  };

  const [manualMacros, setManualMacros] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    if (results) {
      setManualMacros({
        calories: results.calories,
        protein: results.protein,
        carbs: results.carbs,
        fat: results.fat
      });
    }
  }, [results]);

  const saveManualMacros = async () => {
    if (results) {
      const nextResults = {
        ...results,
        calories: manualMacros.calories,
        protein: manualMacros.protein,
        carbs: manualMacros.carbs,
        fat: manualMacros.fat
      };
      setResults(nextResults);
      await generateMealPlan(manualMacros.calories, manualMacros.protein, manualMacros.carbs, manualMacros.fat);
    }
  };

  const addFoodToTracker = (meal: any) => {
    const newTracker = {
      ...dailyTracker,
      calories: dailyTracker.calories + meal.calories,
      protein: dailyTracker.protein + meal.protein,
      carbs: dailyTracker.carbs + meal.carbs,
      fat: dailyTracker.fat + meal.fat,
      meals: [{ ...meal, timestamp: new Date().toLocaleTimeString() }, ...dailyTracker.meals]
    };
    setDailyTracker(newTracker);
    upsertTodayHistory(newTracker);
    saveTrackerToSupabase(newTracker);
  };

  const handleManualMealAdd = async () => {
    const calories = parseInt(newMeal.calories) || 0;
    const protein = parseInt(newMeal.protein) || 0;
    const carbs = parseInt(newMeal.carbs) || 0;
    const fat = parseInt(newMeal.fat) || 0;

    if (!newMeal.name) return;

    const mealData = {
      name: newMeal.name,
      calories,
      protein,
      carbs,
      fat,
      timestamp: new Date().toLocaleTimeString()
    };

    const newTracker = {
      ...dailyTracker,
      calories: dailyTracker.calories + calories,
      protein: dailyTracker.protein + protein,
      carbs: dailyTracker.carbs + carbs,
      fat: dailyTracker.fat + fat,
      meals: [mealData, ...dailyTracker.meals]
    };

    setDailyTracker(newTracker);
    upsertTodayHistory(newTracker);
    await saveTrackerToSupabase(newTracker);
    
    setIsAddMealModalOpen(false);
    setNewMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  const [aiFood, setAiFood] = useState('');
  const [aiQty, setAiQty] = useState('');
  const [aiPortionSize, setAiPortionSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<MealItem | null>(null);

  const AI_FREE_LIMIT = 3;
  const AI_PORTION_OPTIONS = [
    { value: 'small', label: 'Pouco', detail: 'lanche ou prato pequeno', grams: 180 },
    { value: 'medium', label: 'Normal', detail: 'prato comum', grams: 320 },
    { value: 'large', label: 'Bastante', detail: 'prato reforcado', grams: 480 },
  ] as const;
  const _todayKey = new Date().toISOString().split('T')[0];
  const aiAnalysisKey = `ai_food_analyses_${profile.id}_${_todayKey}`;
  const [aiAnalysesUsed, setAiAnalysesUsed] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(`ai_food_analyses_${profile.id}_${new Date().toISOString().split('T')[0]}`) || '0', 10); } catch { return 0; }
  });
  const isFreePlan = effectivePlan === 'Iniciante' || effectivePlan === 'free' || !effectivePlan;
  const aiLimitReached = isFreePlan && aiAnalysesUsed >= AI_FREE_LIMIT;
  const selectedAiPortion = AI_PORTION_OPTIONS.find(option => option.value === aiPortionSize) || AI_PORTION_OPTIONS[1];
  const canAnalyzeFood = !!aiFood.trim() && (isFreePlan || !!aiQty.trim());

  const analyzeWithAI = async () => {
    if (!canAnalyzeFood) return;
    if (aiLimitReached) return;
    setAiAnalyzing(true);
    setAiError('');
    setAiResult(null);
    const preciseQuantity = parseFloat(aiQty);
    const quantity = isFreePlan ? selectedAiPortion.grams : preciseQuantity;
    const foodDescription = isFreePlan
      ? `${aiFood.trim()} (porcao ${selectedAiPortion.label.toLowerCase()}: ${selectedAiPortion.detail})`
      : aiFood.trim();
    const quantityLabel = isFreePlan ? selectedAiPortion.label : `${aiQty}g/ml`;
    try {
      const headers = await getAuthenticatedJsonHeaders();
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          food: foodDescription,
          quantity,
          estimationMode: isFreePlan ? 'simple' : 'precise',
          portionLabel: isFreePlan ? selectedAiPortion.label : undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na análise');
      setAiResult({
        name: aiFood.trim(),
        quantity: quantityLabel,
        calories: Math.round(data.calorias),
        protein: Math.round(data.proteinas_g),
        carbs: Math.round(data.carboidratos_g),
        fat: Math.round(data.gorduras_g)
      });
      if (isFreePlan) {
        const newCount = aiAnalysesUsed + 1;
        setAiAnalysesUsed(newCount);
        try { localStorage.setItem(aiAnalysisKey, newCount.toString()); } catch { /* ignore */ }
      }
    } catch (e: any) {
      setAiError(e.message || 'Erro ao analisar. Verifique a chave da API.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const confirmAiResult = () => {
    if (!aiResult) return;
    addFoodToTracker(aiResult);
    setAiResult(null);
    setAiFood('');
    setAiQty('');
    setAiPortionSize('medium');
  };

  const hasPro = effectivePlan === 'Pro' || effectivePlan === 'Elite' || effectivePlan === 'Admin';
  const hasElite = effectivePlan === 'Elite' || effectivePlan === 'Admin';

  if (showPrefsForm) {
    return (
      <NutritionPreferencesForm
        initial={localNutritionPrefs || profile.nutrition_preferences}
        saving={savingPrefs}
        saveError={savePrefsError}
        onSave={async (prefs) => {
          setSavingPrefs(true);
          setSavePrefsError('');
          // Always save to localStorage first so user can proceed
          try { localStorage.setItem(localStorageKey, JSON.stringify(prefs)); } catch { /* ignore */ }
          setLocalNutritionPrefs(prefs);
          // Try Supabase — don't block on failure
          try {
            await updateProfile({ nutrition_preferences: prefs });
          } catch (e: any) {
            setSavePrefsError('Preferências salvas localmente. Para sincronizar, adicione a coluna nutrition_preferences (jsonb) na tabela profiles do Supabase.');
          } finally {
            setSavingPrefs(false);
          }
          // Always proceed
          setShowPrefsForm(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-32">
      {savePrefsError && (
        <MigrationBanner
          onDismiss={() => setSavePrefsError('')}
          onSuccess={() => {
            setSavePrefsError('');
            // Re-save prefs now that column exists
            if (localNutritionPrefs) updateProfile({ nutrition_preferences: localNutritionPrefs }).catch(() => {});
          }}
        />
      )}

      <header className="space-y-4 px-2 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase">{nutritionText.title}</h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-text-secondary text-base sm:text-lg max-w-2xl leading-relaxed">
            {nutritionText.subtitle}
          </p>
          {localNutritionPrefs && (
            <button
              onClick={() => setShowPrefsForm(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 text-text-muted border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-text-primary transition-all"
            >
              <Edit3 size={13} />
              {nutritionText.editPreferences}
            </button>
          )}
        </div>
        {localNutritionPrefs && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg border border-primary/20 uppercase tracking-widest">
              {nutritionText.mealsPerDay(localNutritionPrefs.mealsPerDay)}
            </span>
            <span className="px-3 py-1 bg-white/5 text-text-muted text-[9px] font-black rounded-lg border border-white/10 uppercase tracking-widest">
              {localNutritionPrefs.budget}
            </span>
            {localNutritionPrefs.restrictions !== 'Nenhuma' && (
              <span className="px-3 py-1 bg-white/5 text-text-muted text-[9px] font-black rounded-lg border border-white/10 uppercase tracking-widest">
                {localNutritionPrefs.restrictions}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Calculadora de Macros */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 sm:px-0">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <Calculator size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">{nutritionText.metabolicCalculator}</h2>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
            {nutritionText.beginnerModule}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          <div className="lg:col-span-5 bg-surface p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-white/5 space-y-6 sm:space-y-8 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">{nutritionText.weight}</label>
                <input 
                  type="number" 
                  value={calcData.weight}
                  onChange={(e) => setCalcData({...calcData, weight: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">{nutritionText.height}</label>
                <input 
                  type="number" 
                  value={calcData.height}
                  onChange={(e) => setCalcData({...calcData, height: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">{nutritionText.age}</label>
                <input 
                  type="number" 
                  value={calcData.age}
                  onChange={(e) => setCalcData({...calcData, age: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">{nutritionText.gender}</label>
                <CustomSelect 
                  value={calcData.gender}
                  onChange={(val) => setCalcData({...calcData, gender: val as any})}
                  options={[
                    { value: 'male', label: nutritionText.male },
                    { value: 'female', label: nutritionText.female }
                  ]}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">{nutritionText.activityLevel}</label>
              <CustomSelect 
                value={calcData.activityLevel}
                onChange={(val) => setCalcData({...calcData, activityLevel: val})}
                options={[
                  { value: '1.2', label: nutritionText.activityOptions.sedentary },
                  { value: '1.375', label: nutritionText.activityOptions.light },
                  { value: '1.55', label: nutritionText.activityOptions.moderate },
                  { value: '1.725', label: nutritionText.activityOptions.very },
                  { value: '1.9', label: nutritionText.activityOptions.extra }
                ]}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-1 ml-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{nutritionText.mainGoal}</label>
                <p className="text-xs text-text-muted">{nutritionText.mainGoalHelp}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(['lose', 'maintain', 'gain'] as const).map((g) => (
                  <button
                    type="button"
                    key={g}
                    aria-pressed={calcData.goal === g}
                    onClick={() => {
                      setCalcData({...calcData, goal: g, goalFocus: ''});
                      setResults(null);
                    }}
                    className={`py-4 rounded-2xl text-[10px] font-black transition-all border duration-500 ${
                      calcData.goal === g 
                        ? 'bg-primary border-primary text-text-primary shadow-xl shadow-primary/20' 
                        : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                    }`}
                  >
                    {goalLabels[g]}
                  </button>
                ))}
              </div>

              <motion.div
                key={calcData.goal}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-white/10 bg-white/[0.025] p-4 sm:p-5 space-y-4"
              >
                <div className="space-y-1">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{nutritionText.priority}</div>
                  <p className="text-xs text-text-secondary">{nutritionText.priorityHelp}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {goalFocusOptions[calcData.goal].map((option, index) => {
                    const isSelected = calcData.goalFocus === option.value;
                    const isLastOddOption = index === goalFocusOptions[calcData.goal].length - 1 && goalFocusOptions[calcData.goal].length % 2 !== 0;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setCalcData({...calcData, goalFocus: option.value});
                          setResults(null);
                        }}
                        className={`min-h-[48px] px-4 py-3 rounded-2xl border text-left text-xs font-bold transition-all ${isLastOddOption ? 'sm:col-span-2 sm:text-center' : ''} ${
                          isSelected
                            ? 'bg-primary/15 border-primary text-primary shadow-lg shadow-primary/10'
                            : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/25 hover:bg-white/[0.07]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-white/25'}`}>
                            {isSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                          </span>
                          <span>{option.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {calcData.goal === 'lose' && calcData.goalFocus === 'waist_measurements' && (
                  <p className="text-[10px] leading-relaxed text-text-muted">
                    {nutritionText.localizedFatNote}
                  </p>
                )}
              </motion.div>
            </div>

            <button 
              onClick={calculateMacros}
              disabled={!calcData.goalFocus}
              className="w-full min-h-[56px] px-4 py-3 bg-primary text-text-primary rounded-[24px] font-black text-sm sm:text-base leading-tight text-center shadow-2xl shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
            >
              {calcData.goalFocus
                ? nutritionText.calculateFor(goalLabels[calcData.goal], selectedGoalFocusLabel.toUpperCase())
                : nutritionText.choosePriority}
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="lg:col-span-7 bg-surface p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-white/5 flex flex-col justify-center relative overflow-hidden shadow-2xl min-h-[400px]">
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-10">
              <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-primary rounded-full blur-[120px]" />
            </div>

            {!results ? (
              <div className="relative z-10 text-center space-y-6 py-12 sm:py-20">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-[24px] sm:rounded-[32px] flex items-center justify-center mx-auto text-text-muted border border-white/5 shadow-inner">
                  <Info className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase">{nutritionText.waitingTitle}</h3>
                  <p className="text-text-secondary max-w-xs mx-auto text-base sm:text-lg leading-relaxed">
                    {nutritionText.waitingText}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 space-y-8 sm:space-y-10">
                <div className="text-center space-y-4">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">{nutritionText.estimatedDailyGoal}</div>
                  <div className="text-5xl sm:text-7xl md:text-8xl font-black text-primary tracking-tighter leading-none break-words">
                    {results.calories} 
                    <span className="text-xl sm:text-2xl text-text-muted font-black ml-2 uppercase tracking-widest">kcal</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                      <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">{nutritionText.bmr}</div>
                      <div className="text-lg font-black text-text-primary">{results.bmr} <span className="text-[10px] opacity-50">kcal</span></div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                      <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">{nutritionText.tdee}</div>
                      <div className="text-lg font-black text-text-primary">{results.tdee} <span className="text-[10px] opacity-50">kcal</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <MacroResultCard label={nutritionText.proteins} value={results.protein} unit="g" color="bg-primary" icon="🥩" />
                  <MacroResultCard label={nutritionText.carbs} value={results.carbs} unit="g" color="bg-white/10" icon="🍚" />
                  <MacroResultCard label={nutritionText.fats} value={results.fat} unit="g" color="bg-white/10" icon="🥑" />
                </div>

                <div className="p-6 sm:p-8 bg-white/5 rounded-[24px] sm:rounded-[32px] border border-white/10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 backdrop-blur-md">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0">
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base sm:text-lg font-black uppercase tracking-tight">{nutritionText.protocolAnalysis}</h4>
                    <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
                      Este protocolo foi otimizado para <span className="text-text-primary font-black uppercase">{calcData.goal === 'lose' ? 'Déficit Calórico' : calcData.goal === 'gain' ? 'Superávit Calórico' : 'Manutenção'}</span>, com prioridade em <span className="text-primary font-black">{selectedGoalFocusLabel.toLowerCase()}</span>.
                      Mantenha a consistência por pelo menos 14 dias para observar as primeiras adaptações metabólicas.
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-7 rounded-[24px] sm:rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary/10 via-white/[0.03] to-transparent shadow-xl shadow-primary/5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0 self-start">
                      {hasIronCoachAccess ? <Zap size={26} /> : <Lock size={26} />}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black uppercase tracking-tight">{nutritionCoachCardText.title}</h4>
                        {!hasIronCoachAccess && (
                          <span className="px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                            {nutritionCoachCardText.proBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {nutritionCoachCardText.description}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        trackEvent('nutrition_iron_coach_click', {
                          plan: effectivePlan,
                          goal: calcData.goal,
                          goal_focus: calcData.goalFocus,
                          has_access: hasIronCoachAccess,
                        });
                        if (!hasIronCoachAccess) {
                          setShowCoachUpgradeModal(true);
                          return;
                        }
                        const goalLabel = calcData.goal === 'lose' ? 'emagrecer' : calcData.goal === 'gain' ? 'ganhar massa' : 'manter o peso';
                        onOpenIronCoach(
                          `${nutritionCoachCardText.analysisIntro} Meu objetivo é ${goalLabel}, com prioridade em ${selectedGoalFocusLabel.toLowerCase()}. ` +
                          `Dados: ${calcData.weight} kg, ${calcData.height} cm, ${calcData.age} anos, ` +
                          `atividade ${calcData.activityLevel}, TMB ${results.bmr} kcal, TDEE ${results.tdee} kcal, ` +
                          `meta ${results.calories} kcal, proteínas ${results.protein} g, carboidratos ${results.carbs} g e gorduras ${results.fat} g. ` +
                          `Explique por que esses valores foram sugeridos, como distribuí-los nas refeições e quais sinais indicam necessidade de ajuste. ` +
                          nutritionCoachCardText.professionalNote
                        );
                      }}
                      className="w-full sm:w-auto min-h-[50px] px-5 rounded-2xl bg-primary text-text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      {hasIronCoachAccess ? nutritionCoachCardText.talk : nutritionCoachCardText.unlock}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                  <p className="mt-4 text-[10px] sm:text-xs text-text-muted leading-relaxed border-t border-white/5 pt-4">
                    {nutritionCoachCardText.disclaimer}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Controle Total da Nutrição - Tracker Diário */}
      {results && (
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 sm:px-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5">
                <Activity size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Analisador de Alimentos</h2>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
              CONTROLE DIÁRIO
            </span>
          </div>

          <div className="bg-surface p-4 sm:p-10 rounded-[28px] sm:rounded-[48px] border border-white/5 shadow-2xl space-y-8 sm:space-y-10 relative z-10 h-auto overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Calorias */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Calorias</span>
                    <div className="text-2xl font-black text-primary">{dailyTracker.calories} <span className="text-xs text-text-muted">/ {results.calories}</span></div>
                  </div>
                  <div className="text-[10px] font-black text-text-muted">{Math.round((dailyTracker.calories / results.calories) * 100)}%</div>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (dailyTracker.calories / results.calories) * 100)}%` }}
                    className="h-full bg-primary shadow-[0_0_15px_rgba(255,106,0,0.5)]"
                  />
                </div>
              </div>

              {/* Proteínas */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Proteínas 🥩</span>
                    <div className="text-2xl font-black text-text-primary">{dailyTracker.protein}g <span className="text-xs text-text-muted">/ {results.protein}g</span></div>
                  </div>
                  <div className="text-[10px] font-black text-text-muted">{Math.round((dailyTracker.protein / results.protein) * 100)}%</div>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (dailyTracker.protein / results.protein) * 100)}%` }}
                    className="h-full bg-primary/60"
                  />
                </div>
              </div>

              {/* Carboidratos */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Carbos 🍚</span>
                    <div className="text-2xl font-black text-text-primary">{dailyTracker.carbs}g <span className="text-xs text-text-muted">/ {results.carbs}g</span></div>
                  </div>
                  <div className="text-[10px] font-black text-text-muted">{Math.round((dailyTracker.carbs / results.carbs) * 100)}%</div>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (dailyTracker.carbs / results.carbs) * 100)}%` }}
                    className="h-full bg-white/20"
                  />
                </div>
              </div>

              {/* Gorduras */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Gorduras 🥑</span>
                    <div className="text-2xl font-black text-text-primary">{dailyTracker.fat}g <span className="text-xs text-text-muted">/ {results.fat}g</span></div>
                  </div>
                  <div className="text-[10px] font-black text-text-muted">{Math.round((dailyTracker.fat / results.fat) * 100)}%</div>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (dailyTracker.fat / results.fat) * 100)}%` }}
                    className="h-full bg-white/10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[
                { label: 'Calorias', value: macroRemaining(dailyTracker.calories, results.calories, ' kcal'), color: dailyTracker.calories > results.calories ? 'text-error' : 'text-primary' },
                { label: 'Proteína', value: macroRemaining(dailyTracker.protein, results.protein, 'g'), color: dailyTracker.protein >= results.protein ? 'text-success' : 'text-primary' },
                { label: 'Carboidrato', value: macroRemaining(dailyTracker.carbs, results.carbs, 'g'), color: dailyTracker.carbs > results.carbs ? 'text-error' : 'text-text-primary' },
                { label: 'Gordura', value: macroRemaining(dailyTracker.fat, results.fat, 'g'), color: dailyTracker.fat > results.fat ? 'text-error' : 'text-text-primary' },
              ].map(item => (
                <div key={item.label} className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3">
                  <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">{item.label}</div>
                  <div className={`text-sm font-black mt-1 ${item.color}`}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className="pt-5 sm:pt-6 border-t border-white/5">
              <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-3 mb-5 sm:mb-6">
                <h4 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-text-muted">Refeições registradas hoje</h4>
                <button
                  onClick={() => setIsAddMealModalOpen(true)}
                  className="w-full min-[380px]:w-auto min-h-[42px] flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest hover:bg-primary hover:text-text-primary transition-all active:scale-95"
                >
                  <Plus size={14} />
                  Adicionar Refeição
                </button>
              </div>

              {favoriteFoods.length > 0 && (
                <div className="mb-6 bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-[10px] font-black uppercase tracking-widest text-text-muted">Favoritos rápidos</h5>
                      <p className="text-[10px] text-text-muted mt-1">Toque para lançar no tracker de hoje.</p>
                    </div>
                    <span className="text-[10px] font-black text-primary">{favoriteFoods.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {favoriteFoods.slice(0, 6).map((item) => (
                      <button
                        key={normalizeFavoriteKey(item)}
                        onClick={() => addFoodToTracker(item)}
                        className="text-left p-4 rounded-2xl bg-background border border-white/10 hover:border-primary/30 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-sm truncate group-hover:text-primary transition-colors">{item.name}</span>
                          <span className="text-[10px] text-primary font-black">{item.calories} kcal</span>
                        </div>
                        <div className="mt-1 text-[10px] text-text-muted font-bold">{item.quantity} • P:{item.protein}g C:{item.carbs}g G:{item.fat}g</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Food Analyzer — always visible */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Zap size={16} />
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest text-primary leading-relaxed">
                        {isFreePlan ? 'Registrar refeição com IA' : 'Calcular macros com IA'}
                      </span>
                      <p className="text-[9px] sm:text-[10px] text-text-muted mt-1 leading-relaxed">
                        {isFreePlan
                          ? 'Descreva o que comeu e escolha uma porção. A IA estima os macros para voce.'
                          : 'Use gramas/ml para uma analise mais precisa de proteinas, carboidratos e gorduras.'}
                      </p>
                    </div>
                  </div>
                  <div className={`self-start px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] ${
                    isFreePlan ? 'bg-white/5 border-white/10 text-text-muted' : 'bg-primary/10 border-primary/20 text-primary'
                  }`}>
                    {isFreePlan ? 'Modo simples' : 'Modo preciso Pro'}
                  </div>
                </div>

                {isFreePlan && (
                  <div className="bg-background/70 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-text-primary">Quer pesar em gramas?</div>
                      <p className="text-[10px] text-text-muted mt-1">O registro exato por g/ml fica liberado nos planos Pro e Elite.</p>
                    </div>
                    <button
                      onClick={onUpgrade}
                      className="w-full sm:w-auto min-h-[42px] px-4 py-2 bg-white/5 text-primary border border-primary/20 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest hover:bg-primary hover:text-text-primary transition-all"
                    >
                      Liberar precisao
                    </button>
                  </div>
                )}

                <div className={isFreePlan ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                      {isFreePlan ? 'O que voce comeu?' : 'Alimento'}
                    </label>
                    <input
                      type="text"
                      placeholder={isFreePlan ? 'Ex: Arroz, feijao, frango e salada' : 'Ex: Frango grelhado'}
                      value={aiFood}
                      onChange={(e) => { setAiFood(e.target.value); setAiResult(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && analyzeWithAI()}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                    />
                  </div>

                  {isFreePlan ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Tamanho da porcao</label>
                      <div className="grid grid-cols-3 gap-2">
                        {AI_PORTION_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => { setAiPortionSize(option.value); setAiResult(null); }}
                            className={`min-h-[68px] rounded-xl border px-3 py-2 text-left transition-all ${
                              aiPortionSize === option.value
                                ? 'bg-primary text-text-primary border-primary shadow-lg shadow-primary/20'
                                : 'bg-background border-white/10 text-text-muted hover:border-primary/30'
                            }`}
                          >
                            <div className="text-[11px] font-black uppercase tracking-widest">{option.label}</div>
                            <div className={`text-[9px] mt-1 font-bold leading-snug ${aiPortionSize === option.value ? 'text-text-primary/80' : 'text-text-muted'}`}>
                              {option.detail}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Quantidade exata (g ou ml)</label>
                      <input
                        type="number"
                        placeholder="Ex: 150"
                        value={aiQty}
                        onChange={(e) => { setAiQty(e.target.value); setAiResult(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && analyzeWithAI()}
                        className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
                {aiError && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{aiError}</p>
                )}
                {aiResult ? (
                  <div className="space-y-3">
                    <div className="bg-background border border-white/10 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black uppercase tracking-tight">{aiResult.name}</span>
                        <span className="text-primary font-black text-sm">{aiResult.calories} kcal</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <div className="text-[9px] text-text-muted uppercase tracking-widest font-black">Proteínas</div>
                          <div className="text-lg font-black text-primary mt-1">{aiResult.protein}g</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <div className="text-[9px] text-text-muted uppercase tracking-widest font-black">Carboidratos</div>
                          <div className="text-lg font-black mt-1">{aiResult.carbs}g</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 text-center">
                          <div className="text-[9px] text-text-muted uppercase tracking-widest font-black">Gorduras</div>
                          <div className="text-lg font-black mt-1">{aiResult.fat}g</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={confirmAiResult}
                        className="flex-1 py-3 bg-primary text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                      >
                        <Plus size={14} />
                        Adicionar ao Tracker
                      </button>
                      <button
                        onClick={() => toggleFavoriteFood(aiResult)}
                        className="px-4 py-3 bg-white/5 text-text-muted border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-primary transition-all"
                        title="Salvar favorito"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => { setAiResult(null); setAiFood(''); setAiQty(''); setAiPortionSize('medium'); }}
                        className="px-4 py-3 bg-white/5 text-text-muted border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : aiLimitReached ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Limite diário atingido</span>
                      <span className="text-[10px] font-black text-primary">{AI_FREE_LIMIT}/{AI_FREE_LIMIT} análises</span>
                    </div>
                    <button
                      onClick={onUpgrade}
                      className="w-full py-3 bg-primary text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Zap size={14} />
                      Fazer Upgrade para Pro — Análises Ilimitadas
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {isFreePlan && (
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Análises hoje</span>
                        <span className="text-[10px] font-black text-text-muted">{aiAnalysesUsed}/{AI_FREE_LIMIT}</span>
                      </div>
                    )}
                    <button
                      onClick={analyzeWithAI}
                      disabled={aiAnalyzing || !canAnalyzeFood}
                      className="w-full py-3 bg-primary text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {aiAnalyzing ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <RefreshCw size={14} />
                          </motion.div>
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Zap size={14} />
                          Analisar com IA
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {dailyTracker.meals.length > 0 ? (
                  dailyTracker.meals.map((meal, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xs">
                          {meal.timestamp.split(':')[0]}:{meal.timestamp.split(':')[1]}
                        </div>
                        <div>
                          <div className="font-bold text-sm uppercase tracking-tight">{meal.name}</div>
                          <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">
                            {meal.calories} kcal • P:{meal.protein}g C:{meal.carbs}g G:{meal.fat}g
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const newTracker = {
                            ...dailyTracker,
                            calories: dailyTracker.calories - meal.calories,
                            protein: dailyTracker.protein - meal.protein,
                            carbs: dailyTracker.carbs - meal.carbs,
                            fat: dailyTracker.fat - meal.fat,
                            meals: dailyTracker.meals.filter((_, i) => i !== idx)
                          };
                          setDailyTracker(newTracker);
                          await saveTrackerToSupabase(newTracker);
                        }}
                        className="p-3 text-text-muted hover:text-error transition-colors min-h-[48px] flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-background/45 px-4 py-6 sm:p-7 text-center">
                    <div className="w-11 h-11 mx-auto rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                      <Utensils size={20} />
                    </div>
                    <h5 className="mt-4 text-sm sm:text-base font-black tracking-tight text-text-primary">Nenhuma refeição registrada</h5>
                    <p className="mt-1.5 mx-auto max-w-[260px] text-[11px] sm:text-xs leading-relaxed text-text-muted">
                      Registre sua primeira refeição para acompanhar calorias e macros do dia.
                    </p>
                    <button
                      onClick={() => setIsAddMealModalOpen(true)}
                      className="mt-4 w-full sm:w-auto min-h-[44px] px-5 rounded-xl bg-white/5 border border-white/10 text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest hover:bg-primary hover:text-white transition-all inline-flex items-center justify-center gap-2"
                    >
                      <Plus size={14} />
                      Registrar refeição
                    </button>
                  </div>
                )}
              </div>

              {nutritionHistory.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Histórico recente</h4>
                    <span className="text-[10px] font-black text-text-muted">{nutritionHistory.length} dias</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {nutritionHistory.slice(0, 4).map((log) => (
                      <div key={log.date} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                            {new Date(log.date + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[10px] font-black text-primary">{log.meals?.length || 0} itens</span>
                        </div>
                        <div className="text-2xl font-black">{log.calories} <span className="text-xs text-text-muted">kcal</span></div>
                        <div className="mt-2 text-[10px] text-text-muted font-bold">P:{log.protein}g C:{log.carbs}g G:{log.fat}g</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isAddMealModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsAddMealModalOpen(false)}
                  className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-lg max-h-[86vh] overflow-y-auto bg-zinc-900 border border-white/10 rounded-[32px] shadow-2xl"
                >
                  <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                          <Plus size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Nova Refeição</h3>
                      </div>
                      <button 
                        onClick={() => setIsAddMealModalOpen(false)}
                        className="p-2 text-text-muted hover:text-text-primary transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Nome da Refeição</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Frango com Arroz"
                          value={newMeal.name}
                          onChange={(e) => setNewMeal({...newMeal, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Calorias (kcal)</label>
                          <input 
                            type="number" 
                            value={newMeal.calories}
                            onChange={(e) => setNewMeal({...newMeal, calories: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Proteína (g)</label>
                          <input 
                            type="number" 
                            value={newMeal.protein}
                            onChange={(e) => setNewMeal({...newMeal, protein: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Carboidrato (g)</label>
                          <input 
                            type="number" 
                            value={newMeal.carbs}
                            onChange={(e) => setNewMeal({...newMeal, carbs: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Gordura (g)</label>
                          <input 
                            type="number" 
                            value={newMeal.fat}
                            onChange={(e) => setNewMeal({...newMeal, fat: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button 
                        onClick={handleManualMealAdd}
                        className="flex-1 py-4 bg-primary text-text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
                      >
                        SALVAR REFEIÇÃO
                      </button>
                      <button 
                        onClick={() => setIsAddMealModalOpen(false)}
                        className="flex-1 py-4 bg-white/5 text-text-muted rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                      >
                        CANCELAR
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Dieta Personalizada */}
      {results && (
        <section className="space-y-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 sm:px-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5">
                <Utensils size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Dieta Personalizada</h2>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
              PLANO ESTRATÉGICO
            </span>
          </div>

          <div className="bg-surface rounded-[32px] sm:rounded-[48px] border border-white/5 overflow-visible shadow-2xl relative z-10 h-auto">
            <div className="p-6 sm:p-10 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Sugestão de Cardápio</h3>
                <p className="text-text-secondary text-sm sm:text-base font-medium">Personalizado para <span className="text-primary font-black">{profile.name.split(' ')[0]}</span> • Meta: <span className="font-bold">{profile.goal || 'Condicionamento'}</span> • <span className="font-bold">{results?.calories} kcal/dia</span></p>
              </div>
              <button
                onClick={() => generateMealPlan(results.calories, results.protein, results.carbs, results.fat)}
                disabled={generatingPlan}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 min-h-[52px] bg-primary text-text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <motion.div animate={generatingPlan ? { rotate: 360 } : { rotate: 0 }} transition={{ repeat: generatingPlan ? Infinity : 0, duration: 1, ease: 'linear' }}>
                  <RefreshCw size={18} />
                </motion.div>
                {generatingPlan ? 'Gerando...' : 'Gerar Nova Dieta'}
              </button>
            </div>
            {planError && (
              <div className="mx-6 sm:mx-10 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">{planError}</p>
              </div>
            )}
            <div className="divide-y divide-white/5">
              {generatingPlan ? (
                <div className="p-20 flex flex-col items-center gap-4 text-text-muted">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                    <RefreshCw size={32} className="text-primary" />
                  </motion.div>
                  <span className="font-black text-xs uppercase tracking-widest">IA gerando seu cardápio personalizado...</span>
                </div>
              ) : mealPlan.length > 0 ? (
                mealPlan.map((meal, idx) => (
                  <MealRow
                    key={idx}
                    time={meal.time}
                    name={`${meal.icon} ${meal.name}`}
                    items={meal.items}
                    onAddItem={(item) => {
                      persistMealPlan(mealPlan.map((m, i) =>
                        i === idx ? { ...m, items: [...m.items, item] } : m
                      ));
                    }}
                    onUpdateItem={(itemIndex, item) => {
                      persistMealPlan(mealPlan.map((m, i) =>
                        i === idx ? { ...m, items: m.items.map((oldItem, oldIndex) => oldIndex === itemIndex ? item : oldItem) } : m
                      ));
                    }}
                    onRemoveItem={(itemIndex) => {
                      persistMealPlan(mealPlan.map((m, i) =>
                        i === idx ? { ...m, items: m.items.filter((_, oldIndex) => oldIndex !== itemIndex) } : m
                      ));
                    }}
                    onAddToTracker={addFoodToTracker}
                    onToggleFavorite={toggleFavoriteFood}
                    isFavorite={isFavoriteFood}
                  />
                ))
              ) : (
                <div className="p-20 text-center text-text-muted font-bold uppercase tracking-widest">
                  Calcule seu protocolo para gerar a dieta
                </div>
              )}
            </div>
          </div>
        </section>
      )}


      {/* Ajustes Avançados */}
      {results && (
        <section className="space-y-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2 sm:px-0">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5">
                <ChefHat size={24} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Ajustes de Alta Performance</h2>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
              MÓDULO AVANÇADO
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 relative z-10 h-auto overflow-visible">
            <div className="bg-surface p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-white/5 space-y-6 sm:space-y-8 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Settings size={20} />
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase">Ajuste Manual de Macros</h3>
              </div>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white/5 rounded-2xl border border-white/5 gap-2">
                  <span className="text-[10px] sm:text-sm font-black text-text-secondary uppercase tracking-widest">Calorias Totais</span>
                  <input
                    type="number"
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-full sm:w-28 text-left sm:text-right text-base sm:text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    value={manualMacros.calories || ''}
                    onChange={(e) => setManualMacros({...manualMacros, calories: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white/5 rounded-2xl border border-white/5 gap-2">
                  <span className="text-[10px] sm:text-sm font-black text-text-secondary uppercase tracking-widest">Proteínas (g)</span>
                  <input
                    type="number"
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-full sm:w-28 text-left sm:text-right text-base sm:text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    value={manualMacros.protein || ''}
                    onChange={(e) => setManualMacros({...manualMacros, protein: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white/5 rounded-2xl border border-white/5 gap-2">
                  <span className="text-[10px] sm:text-sm font-black text-text-secondary uppercase tracking-widest">Carboidratos (g)</span>
                  <input
                    type="number"
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-full sm:w-28 text-left sm:text-right text-base sm:text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    value={manualMacros.carbs || ''}
                    onChange={(e) => setManualMacros({...manualMacros, carbs: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white/5 rounded-2xl border border-white/5 gap-2">
                  <span className="text-[10px] sm:text-sm font-black text-text-secondary uppercase tracking-widest">Gorduras (g)</span>
                  <input
                    type="number"
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-full sm:w-28 text-left sm:text-right text-base sm:text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    value={manualMacros.fat || ''}
                    onChange={(e) => setManualMacros({...manualMacros, fat: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <button 
                onClick={saveManualMacros}
                className="w-full py-5 bg-white/5 border border-white/10 rounded-[24px] font-black text-[10px] sm:text-xs tracking-widest uppercase hover:bg-white/10 transition-all active:scale-95"
              >
                SALVAR PROTOCOLO PERSONALIZADO
              </button>
            </div>

            <div className="bg-surface p-6 sm:p-8 rounded-[32px] sm:rounded-[48px] border border-white/5 flex flex-col gap-6 shadow-2xl relative overflow-hidden min-h-[300px]">
              <div className="absolute -right-10 -bottom-10 opacity-5">
                <Stethoscope size={200} />
              </div>
              {/* Header */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0">
                  <Stethoscope size={20} />
                </div>
                <h3 className="text-base font-black tracking-tight uppercase leading-tight">
                  Acompanhamento<br />Profissional
                </h3>
              </div>
              {/* Content */}
              <div className="relative z-10 flex-1 flex flex-col gap-4 bg-primary/5 rounded-[24px] border border-primary/10 p-5">
                <div className="inline-flex">
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.25em]">
                    Em Breve
                  </span>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Integração direta com nutricionistas parceiros para ajustes em tempo real e consultoria personalizada via chat.
                </p>
                <button className="mt-auto w-full py-3 bg-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed opacity-50">
                  Notificar-me no Lançamento
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {showCoachUpgradeModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCoachUpgradeModal(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 48, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="nutrition-coach-upgrade-title"
              className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-zinc-950 border border-white/10 border-b-0 sm:border-b rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 sm:p-8"
            >
              <button
                onClick={() => setShowCoachUpgradeModal(false)}
                aria-label="Fechar"
                className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-text-primary hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <X size={18} />
              </button>

              <div className="space-y-6 pr-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-lg shadow-primary/10">
                  <Lock size={25} />
                </div>
                <div className="space-y-3">
                  <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.2em]">
                    Recurso exclusivo Pro
                  </span>
                  <h3 id="nutrition-coach-upgrade-title" className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight">
                    Entenda seu protocolo com o Iron Coach
                  </h3>
                  <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
                    Seu protocolo já está pronto. No plano Pro, o Iron Coach explica suas calorias e macros, responde suas dúvidas e ajuda você a aplicar tudo na rotina.
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                <button
                  onClick={() => {
                    trackEvent('nutrition_iron_coach_upgrade_confirm', {
                      plan: effectivePlan,
                      goal: calcData.goal,
                    });
                    setShowCoachUpgradeModal(false);
                    onUpgrade();
                  }}
                  className="w-full min-h-[52px] px-5 rounded-2xl bg-primary text-text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                >
                  Desbloquear Iron Coach
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => setShowCoachUpgradeModal(false)}
                  className="w-full min-h-[48px] px-5 rounded-2xl bg-white/5 border border-white/10 text-text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-text-primary transition-all"
                >
                  Continuar com meu protocolo
                </button>
              </div>

              <p className="mt-6 pt-5 border-t border-white/5 text-[10px] sm:text-xs text-text-muted leading-relaxed">
                Orientações educativas que não substituem o acompanhamento de um nutricionista.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MigrationBanner({ onDismiss, onSuccess }: { onDismiss: () => void; onSuccess: () => void }) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-yellow-400 font-black text-sm uppercase tracking-wide">
            Coluna ausente no Supabase
          </p>
          <p className="text-yellow-400/70 text-xs leading-relaxed">
            Preferências salvas localmente. Para sincronizar entre dispositivos, rode a migration abaixo direto no SQL Editor do Supabase.
          </p>
        </div>
        <button onClick={onDismiss} className="text-yellow-400/50 hover:text-yellow-400 transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>

      <div className="bg-black/30 rounded-xl p-4 font-mono text-xs text-yellow-300/80 border border-yellow-500/10">
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nutrition_preferences jsonb DEFAULT NULL;
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={`https://supabase.com/dashboard/project/${(import.meta as any).env?.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0] ?? '_'}/sql/new`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500/20 transition-all text-center flex items-center justify-center gap-1.5"
        >
          <ExternalLink size={11} />
          Abrir SQL Editor
        </a>
        <button
          onClick={onSuccess}
          className="flex-1 py-2.5 bg-white/5 text-text-muted border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all text-center flex items-center justify-center gap-1.5"
        >
          <RefreshCw size={11} />
          Já executei, tentar sincronizar
        </button>
      </div>
    </div>
  );
}

function NutritionPreferencesForm({
  initial,
  saving,
  saveError,
  onSave
}: {
  initial?: NutritionPreferences;
  saving: boolean;
  saveError?: string;
  onSave: (prefs: NutritionPreferences) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<NutritionPreferences>(initial ?? {
    likedFoods: '',
    dislikedFoods: '',
    budget: 'Moderado',
    restrictions: 'Nenhuma',
    restrictionsOther: '',
    mealsPerDay: 5
  });

  const steps = [
    { n: 1, label: 'Preferências' },
    { n: 2, label: 'Restrições' },
    { n: 3, label: 'Estilo' },
  ];

  const budgetOptions: NutritionPreferences['budget'][] = ['Econômico', 'Moderado', 'Premium'];
  const budgetDesc: Record<string, string> = {
    'Econômico': 'Arroz, feijão, ovos, frango',
    'Moderado': 'Equilíbrio custo-benefício',
    'Premium': 'Salmão, quinoa, whey importado'
  };
  const restrictionOptions: NutritionPreferences['restrictions'][] = ['Nenhuma', 'Vegetariano', 'Vegano', 'Sem glúten', 'Sem lactose', 'Outro'];
  const mealOptions: NutritionPreferences['mealsPerDay'][] = [3, 4, 5, 6];

  return (
    <div className="space-y-10 pb-32">
      <header className="space-y-4 px-2 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase">Avaliação Nutricional</h1>
        </div>
        <p className="text-text-secondary text-base max-w-2xl leading-relaxed">
          Responda para que a IA monte um cardápio 100% compatível com você.
        </p>
      </header>

      {/* Step indicators */}
      <div className="flex items-center gap-3 px-2 sm:px-0">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              step === s.n ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' :
              step > s.n ? 'bg-primary/20 text-primary border border-primary/30' :
              'bg-white/5 text-text-muted border border-white/10'
            }`}>
              {step > s.n ? <CheckCircle2 size={12} /> : <span>{s.n}</span>}
              {s.label}
            </div>
            {i < steps.length - 1 && <div className={`h-px w-8 ${step > s.n ? 'bg-primary/40' : 'bg-white/10'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-[32px] sm:rounded-[48px] border border-white/5 shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">

          {/* Step 1: Liked / Disliked */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="p-8 sm:p-12 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Utensils size={22} />
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase">Suas Preferências Alimentares</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">
                    Quais alimentos você gosta? <span className="text-primary">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: frango, arroz integral, ovos, banana, aveia, batata doce..."
                    value={prefs.likedFoods}
                    onChange={(e) => setPrefs({ ...prefs, likedFoods: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-text-muted"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">
                    Quais alimentos você NÃO gosta ou não come? <span className="text-primary">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ex: brócolis, fígado, peixe, leite, glúten..."
                    value={prefs.dislikedFoods}
                    onChange={(e) => setPrefs({ ...prefs, dislikedFoods: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-text-muted"
                  />
                  <p className="text-[10px] text-text-muted ml-1">Esses alimentos <span className="text-primary font-black">NUNCA</span> aparecerão no seu cardápio.</p>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-5 bg-primary text-text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                Próximo
                <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {/* Step 2: Restrictions */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="p-8 sm:p-12 space-y-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <AlertTriangle size={22} />
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase">Restrições Alimentares</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {restrictionOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setPrefs({ ...prefs, restrictions: opt })}
                    className={`p-4 rounded-2xl border text-sm font-black uppercase tracking-tight transition-all text-left ${
                      prefs.restrictions === opt
                        ? 'bg-primary/10 border-primary/40 text-primary shadow-lg shadow-primary/10'
                        : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20 hover:text-text-primary'
                    }`}
                  >
                    {prefs.restrictions === opt && <CheckCircle2 size={14} className="mb-2 text-primary" />}
                    {opt}
                  </button>
                ))}
              </div>

              {prefs.restrictions === 'Outro' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Descreva sua restrição</label>
                  <input
                    type="text"
                    placeholder="Ex: alergia a amendoim, intolerância a frutose..."
                    value={prefs.restrictionsOther ?? ''}
                    onChange={(e) => setPrefs({ ...prefs, restrictionsOther: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-medium focus:border-primary outline-none transition-all placeholder:text-text-muted"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-5 bg-white/5 text-text-muted border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-5 bg-primary text-text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  Próximo
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Budget + Meals per day */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="p-8 sm:p-12 space-y-10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                  <Wallet size={22} />
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase">Orçamento e Rotina</h2>
              </div>

              {/* Budget */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Orçamento semanal para alimentação</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {budgetOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setPrefs({ ...prefs, budget: opt })}
                      className={`p-5 rounded-2xl border text-left transition-all space-y-1 ${
                        prefs.budget === opt
                          ? 'bg-primary/10 border-primary/40 shadow-lg shadow-primary/10'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`text-sm font-black uppercase tracking-tight ${prefs.budget === opt ? 'text-primary' : 'text-text-primary'}`}>
                        {opt}
                      </div>
                      <div className="text-[10px] text-text-muted font-medium">{budgetDesc[opt]}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meals per day */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Quantas refeições por dia prefere?</label>
                <div className="grid grid-cols-4 gap-3">
                  {mealOptions.map(n => (
                    <button
                      key={n}
                      onClick={() => setPrefs({ ...prefs, mealsPerDay: n })}
                      className={`py-5 rounded-2xl border font-black text-xl transition-all ${
                        prefs.mealsPerDay === n
                          ? 'bg-primary/10 border-primary/40 text-primary shadow-lg shadow-primary/10'
                          : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20 hover:text-text-primary'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted">O cardápio será dividido em {prefs.mealsPerDay} refeições ao longo do dia.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-5 bg-white/5 text-text-muted border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Voltar
                </button>
                <button
                  onClick={() => onSave(prefs)}
                  disabled={saving}
                  className="flex-1 py-5 bg-primary text-text-primary rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <RefreshCw size={18} />
                      </motion.div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Salvar e Continuar
                    </>
                  )}
                </button>
              </div>
              {saveError && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                  <p className="text-[10px] text-yellow-400 font-bold leading-relaxed">{saveError}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MacroResultCard({ label, value, unit, color, icon }: { label: string, value: number, unit: string, color: string, icon?: string }) {
  return (
    <div className="bg-white/5 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-white/5 text-center space-y-2 sm:space-y-3 group hover:border-primary/30 transition-all duration-500">
      <div className="flex flex-col items-center gap-2">
        {icon && <span className="text-2xl mb-1">{icon}</span>}
        <div className="text-[8px] sm:text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">{label}</div>
      </div>
      <div className="text-2xl sm:text-4xl font-black group-hover:text-primary transition-colors duration-500">{value}{unit}</div>
      <div className={`h-1 sm:h-1.5 w-8 sm:w-12 mx-auto rounded-full ${color} shadow-[0_0_10px_rgba(255,106,0,0.3)]`} />
    </div>
  );
}

function MacroCard({ label, value, unit, color }: { label: string, value: string, unit: string, color: string }) {
  return (
    <div className="bg-surface p-6 rounded-3xl border border-white/5">
      <div className="text-text-muted text-[10px] uppercase tracking-widest font-bold mb-1">{label}</div>
      <div className={`text-2xl font-black ${color}`}>{value} <span className="text-xs font-normal opacity-50">{unit}</span></div>
    </div>
  );
}

type MealItem = { name: string; quantity: string; calories: number; protein: number; carbs: number; fat: number };

function FoodItemCard({
  item,
  onEdit,
  onRemove,
  onAddToTracker,
  onToggleFavorite,
  isFavorite,
}: {
  item: MealItem;
  onEdit?: () => void;
  onRemove?: () => void;
  onAddToTracker?: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-sm text-text-primary truncate">{item.name}</span>
        <span className="shrink-0 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg border border-primary/20">{item.quantity}</span>
      </div>
      <div className="text-[10px] text-text-muted font-bold">{item.calories} kcal</div>
      <div className="flex gap-1.5 flex-wrap">
        <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[9px] font-black rounded-md border border-orange-500/20">Prot. {item.protein}g</span>
        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded-md border border-blue-500/20">Carb. {item.carbs}g</span>
        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[9px] font-black rounded-md border border-yellow-500/20">Gord. {item.fat}g</span>
      </div>
      {(onEdit || onRemove || onAddToTracker || onToggleFavorite) && (
        <div className="flex items-center gap-2 pt-2 flex-wrap">
          {onAddToTracker && (
            <button onClick={onAddToTracker} className="flex-[1_1_88px] min-h-[36px] rounded-xl bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-text-primary transition-all">
              Lançar
            </button>
          )}
          {onToggleFavorite && (
            <button onClick={onToggleFavorite} className={`min-h-[34px] min-w-[34px] rounded-xl border text-[9px] font-black transition-all ${isFavorite ? 'bg-primary text-text-primary border-primary' : 'bg-white/5 text-text-muted border-white/10 hover:text-primary'}`} title="Favorito">
              <Check size={13} className="mx-auto" />
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="min-h-[34px] min-w-[34px] rounded-xl bg-white/5 text-text-muted border border-white/10 hover:text-primary transition-all" title="Editar">
              <Edit3 size={13} className="mx-auto" />
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} className="min-h-[34px] min-w-[34px] rounded-xl bg-white/5 text-text-muted border border-white/10 hover:text-error transition-all" title="Remover">
              <X size={13} className="mx-auto" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MealRow({ time, name, items, onAddItem, onUpdateItem, onRemoveItem, onAddToTracker, onToggleFavorite, isFavorite }: {
  time: string;
  name: string;
  items: MealItem[];
  onAddItem?: (item: MealItem) => void;
  onUpdateItem?: (index: number, item: MealItem) => void;
  onRemoveItem?: (index: number) => void;
  onAddToTracker?: (item: MealItem) => void;
  onToggleFavorite?: (item: MealItem) => void;
  isFavorite?: (item: MealItem) => boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [foodInput, setFoodInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<MealItem | null>(null);
  const [error, setError] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<MealItem | null>(null);

  const totalCals = items.reduce((s, i) => s + i.calories, 0);

  const analyze = async () => {
    if (!foodInput.trim() || !qtyInput.trim()) return;
    setAnalyzing(true);
    setError('');
    setPreview(null);
    try {
      const headers = await getAuthenticatedJsonHeaders();
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers,
        body: JSON.stringify({ food: foodInput.trim(), quantity: parseFloat(qtyInput) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na análise');
      setPreview({
        name: foodInput.trim(),
        quantity: `${qtyInput}g`,
        calories: Math.round(data.calorias),
        protein: Math.round(data.proteinas_g),
        carbs: Math.round(data.carboidratos_g),
        fat: Math.round(data.gorduras_g)
      });
    } catch (e: any) {
      setError(e.message || 'Erro ao analisar. Tente novamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const confirm = () => {
    if (!preview || !onAddItem) return;
    onAddItem(preview);
    setPreview(null);
    setFoodInput('');
    setQtyInput('');
    setShowForm(false);
  };

  const cancel = () => {
    setShowForm(false);
    setPreview(null);
    setFoodInput('');
    setQtyInput('');
    setError('');
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 group hover:bg-white/[0.02] transition-colors duration-500">
      {/* Left column: time + add button */}
      <div className="md:w-28 flex md:flex-col justify-between items-center md:items-start gap-4 shrink-0">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-block px-3 py-1.5 bg-white/5 rounded-xl text-text-primary font-black text-sm border border-white/10">
            {time}
          </div>
          <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">{totalCals} kcal</div>
        </div>
        {onAddItem && (
          <button
            onClick={() => setShowForm(v => !v)}
            className={`p-3 rounded-xl transition-all border active:scale-90 min-h-[44px] min-w-[44px] flex items-center justify-center ${
              showForm
                ? 'bg-white/10 text-text-muted border-white/10'
                : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-text-primary'
            }`}
            title="Adicionar alimento"
          >
            {showForm ? <X size={18} /> : <Plus size={20} />}
          </button>
        )}
      </div>

      {/* Right column: meal content */}
      <div className="flex-1 space-y-4">
        <h4 className="text-lg sm:text-xl font-black tracking-tight group-hover:text-primary transition-colors duration-500 uppercase">{name}</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item, i) => (
            editingIndex === i && editDraft ? (
              <div key={i} className="bg-background border border-primary/20 rounded-2xl p-4 space-y-3">
                <input
                  value={editDraft.name}
                  onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold focus:border-primary outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input value={editDraft.quantity} onChange={(e) => setEditDraft({ ...editDraft, quantity: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none" placeholder="Qtd" />
                  <input type="number" value={editDraft.calories || ''} onChange={(e) => setEditDraft({ ...editDraft, calories: parseInt(e.target.value) || 0 })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none" placeholder="Kcal" />
                  <input type="number" value={editDraft.protein || ''} onChange={(e) => setEditDraft({ ...editDraft, protein: parseInt(e.target.value) || 0 })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none" placeholder="Prot" />
                  <input type="number" value={editDraft.carbs || ''} onChange={(e) => setEditDraft({ ...editDraft, carbs: parseInt(e.target.value) || 0 })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none" placeholder="Carb" />
                  <input type="number" value={editDraft.fat || ''} onChange={(e) => setEditDraft({ ...editDraft, fat: parseInt(e.target.value) || 0 })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold focus:border-primary outline-none" placeholder="Gord" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (editDraft && onUpdateItem) onUpdateItem(i, editDraft);
                      setEditingIndex(null);
                      setEditDraft(null);
                    }}
                    className="flex-1 py-2 bg-primary text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => { setEditingIndex(null); setEditDraft(null); }}
                    className="px-4 py-2 bg-white/5 text-text-muted border border-white/10 rounded-xl font-black text-[10px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <FoodItemCard
                key={i}
                item={item}
                onAddToTracker={onAddToTracker ? () => onAddToTracker(item) : undefined}
                onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item) : undefined}
                isFavorite={isFavorite ? isFavorite(item) : false}
                onEdit={onUpdateItem ? () => { setEditingIndex(i); setEditDraft(item); } : undefined}
                onRemove={onRemoveItem ? () => onRemoveItem(i) : undefined}
              />
            )
          ))}
        </div>

        {/* Inline AI form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4 mt-2">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Adicionar Alimento com IA</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Alimento</label>
                    <input
                      type="text"
                      placeholder="Ex: Frango grelhado"
                      value={foodInput}
                      onChange={(e) => { setFoodInput(e.target.value); setPreview(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && analyze()}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Quantidade (g ou ml)</label>
                    <input
                      type="number"
                      placeholder="Ex: 150"
                      value={qtyInput}
                      onChange={(e) => { setQtyInput(e.target.value); setPreview(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && analyze()}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{error}</p>
                )}

                {/* Preview result */}
                {preview && (
                  <div className="bg-background border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black uppercase tracking-tight">{preview.name} ({preview.quantity})</span>
                      <span className="text-primary font-black text-sm">{preview.calories} kcal</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-[10px] font-black rounded-lg border border-orange-500/20">Prot. {preview.protein}g</span>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/20">Carb. {preview.carbs}g</span>
                      <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-[10px] font-black rounded-lg border border-yellow-500/20">Gord. {preview.fat}g</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={confirm}
                        className="flex-1 py-2.5 bg-primary text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={13} />
                        Adicionar à Refeição
                      </button>
                      <button
                        onClick={() => { setPreview(null); setFoodInput(''); setQtyInput(''); }}
                        className="px-4 py-2.5 bg-white/5 text-text-muted border border-white/10 rounded-xl font-black text-[10px] hover:bg-white/10 transition-all"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {!preview && (
                  <div className="flex gap-2">
                    <button
                      onClick={analyze}
                      disabled={analyzing || !foodInput.trim() || !qtyInput.trim()}
                      className="flex-1 py-2.5 bg-primary text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {analyzing ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                            <RefreshCw size={13} />
                          </motion.div>
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Zap size={13} />
                          Analisar com IA
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancel}
                      className="px-4 py-2.5 bg-white/5 text-text-muted border border-white/10 rounded-xl font-black text-[10px] hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
  context.closePath();
}

function drawStoryText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }
    if (currentLine) lines.push(currentLine);
    currentLine = word;
    if (lines.length === maxLines) break;
  }
  if (currentLine && lines.length < maxLines) lines.push(currentLine);

  if (words.length > 0 && lines.length === maxLines) {
    const renderedWords = lines.join(' ').split(/\s+/).length;
    if (renderedWords < words.length) {
      while (lines[maxLines - 1].length > 1 && context.measureText(`${lines[maxLines - 1]}...`).width > maxWidth) {
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
      }
      lines[maxLines - 1] = `${lines[maxLines - 1].trim()}...`;
    }
  }

  lines.forEach((line, index) => context.fillText(line, x, y + (index * lineHeight)));
}

async function createCommunityStory(post: Post) {
  if (!post.imagem_url) throw new Error('Esta publicação não possui uma foto para compartilhar.');

  const response = await fetch(post.imagem_url);
  if (!response.ok) throw new Error('Não foi possível carregar a foto desta publicação.');
  const sourceBlob = await response.blob();
  const objectUrl = URL.createObjectURL(sourceBlob);
  const image = new Image();
  image.src = objectUrl;
  await image.decode();

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a imagem.');

    context.fillStyle = '#080808';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const glow = context.createRadialGradient(930, 140, 20, 930, 140, 760);
    glow.addColorStop(0, 'rgba(255, 102, 0, 0.34)');
    glow.addColorStop(1, 'rgba(255, 102, 0, 0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#ff6600';
    context.font = '900 34px Arial, sans-serif';
    context.letterSpacing = '5px';
    context.fillText('MINHA EVOLUÇÃO', 72, 105);
    context.letterSpacing = '0px';
    context.fillStyle = '#ffffff';
    context.font = '900 78px Arial, sans-serif';
    context.fillText('IRONSHAPE', 72, 185);
    context.fillStyle = 'rgba(255,255,255,0.64)';
    context.font = '500 28px Arial, sans-serif';
    context.fillText('Disciplina que aparece nos resultados.', 74, 235);

    const frameX = 72;
    const frameY = 300;
    const frameWidth = 936;
    const frameHeight = 1120;
    context.save();
    drawRoundedRect(context, frameX, frameY, frameWidth, frameHeight, 48);
    context.clip();
    context.fillStyle = '#131313';
    context.fillRect(frameX, frameY, frameWidth, frameHeight);

    const backgroundScale = Math.max(frameWidth / image.width, frameHeight / image.height);
    const backgroundWidth = image.width * backgroundScale;
    const backgroundHeight = image.height * backgroundScale;
    context.globalAlpha = 0.3;
    context.filter = 'blur(28px)';
    context.drawImage(
      image,
      frameX + ((frameWidth - backgroundWidth) / 2),
      frameY + ((frameHeight - backgroundHeight) / 2),
      backgroundWidth,
      backgroundHeight,
    );
    context.filter = 'none';
    context.globalAlpha = 1;
    context.fillStyle = 'rgba(0,0,0,0.24)';
    context.fillRect(frameX, frameY, frameWidth, frameHeight);

    const imageScale = Math.min(frameWidth / image.width, frameHeight / image.height);
    const imageWidth = image.width * imageScale;
    const imageHeight = image.height * imageScale;
    context.drawImage(
      image,
      frameX + ((frameWidth - imageWidth) / 2),
      frameY + ((frameHeight - imageHeight) / 2),
      imageWidth,
      imageHeight,
    );
    context.restore();

    context.fillStyle = '#ffffff';
    context.font = '900 36px Arial, sans-serif';
    context.fillText(post.user_name || 'Atleta IronShape', 72, 1505);
    if (post.conteudo?.trim()) {
      context.fillStyle = 'rgba(255,255,255,0.76)';
      context.font = '500 30px Arial, sans-serif';
      drawStoryText(context, post.conteudo, 72, 1560, 936, 42, 3);
    }

    drawRoundedRect(context, 72, 1750, 936, 96, 32);
    context.fillStyle = '#ff6600';
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = '900 30px Arial, sans-serif';
    context.fillText('TREINE COMIGO EM IRONSHAPE.ONLINE', 132, 1811);

    const storyBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível gerar a arte.')), 'image/png', 0.94);
    });
    return storyBlob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function CommunityView({ profile, language }: { profile: UserProfile; language: LanguageCode }) {
  const dateFnsLocale = getDateFnsLocale(language);
  const { updateProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postProfiles, setPostProfiles] = useState<Record<string, SocialProfile>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postError, setPostError] = useState<string | null>(null);
  const [sharingPostId, setSharingPostId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [activeSocialProfile, setActiveSocialProfile] = useState<SocialProfile | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowingProfile, setIsFollowingProfile] = useState(false);
  const [followSaving, setFollowSaving] = useState(false);
  const [showSocialList, setShowSocialList] = useState<'followers' | 'following' | null>(null);
  const [socialListProfiles, setSocialListProfiles] = useState<SocialProfile[]>([]);
  const [socialListLoading, setSocialListLoading] = useState(false);
  const [showEditSocialProfile, setShowEditSocialProfile] = useState(false);
  const [editSocialName, setEditSocialName] = useState(profile.name || '');
  const [editSocialBio, setEditSocialBio] = useState(profile.bio || '');
  const [editSocialAvatar, setEditSocialAvatar] = useState<File | null>(null);
  const [editSocialAvatarPreview, setEditSocialAvatarPreview] = useState(profile.avatar_url || '');
  const [savingSocialProfile, setSavingSocialProfile] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    
    // Create a safety timeout to force loading to false after 5 seconds
    const safetyTimeout = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.warn('Community fetch safety timeout reached');
          return false;
        }
        return currentLoading;
      });
    }, 5000);

    try {
      const { data, error } = await withTimeout(
        () => supabase
          .from('posts')
          .select('*')
          .order('criado_em', { ascending: false }),
        15000,
        2
      ) as any;

      if (error) throw error;
      const nextPosts = (data || []) as Post[];
      setPosts(nextPosts);

      const userIds = Array.from(new Set(nextPosts.map(post => post.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('social_profiles')
          .select('*')
          .in('id', userIds);
        if (!profilesError && profilesData) {
          setPostProfiles(Object.fromEntries((profilesData as SocialProfile[]).map(item => [item.id, item])));
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      clearTimeout(safetyTimeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Realtime subscription
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPostError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        setPostError('A imagem deve ter no máximo 5MB.');
        return;
      }

      setNewPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;

    setIsPublishing(true);
    setPostError(null);
    setUploadProgress(0);
    
    try {
      let imageUrl = '';

      if (newPostImage) {
        const fileExt = newPostImage.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        // Simulated progress since Supabase client doesn't expose it easily
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) return prev;
            return prev + 10;
          });
        }, 300);

        try {
          const { error: uploadError } = await withTimeout(
            () => supabase.storage
              .from('post-images')
              .upload(filePath, newPostImage),
            30000,
            1
          );

          clearInterval(progressInterval);
          setUploadProgress(100);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            setPostError('Falha no upload da imagem. Publicando apenas o texto...');
            // We'll continue without the image
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('post-images')
              .getPublicUrl(filePath);
            
            imageUrl = publicUrl;
          }
        } catch (err: any) {
          clearInterval(progressInterval);
          console.error('Image upload failed:', err);
          setPostError('Erro no upload da imagem. Publicando apenas o texto...');
          // Continue without image
        }
      }

      try {
        const { error } = await withTimeout(
          () => supabase.from('posts').insert({
            user_id: profile.id,
            user_name: profile.name,
            user_avatar: profile.name[0],
            conteudo: newPostContent,
            imagem_url: imageUrl,
            likes: 0
          }),
          15000,
          2
        ) as any;

        if (error) throw error;

        // Force reload feed
        await fetchPosts();

        setNewPostContent('');
        setNewPostImage(null);
        setImagePreview(null);
        setShowCreateModal(false);
        setUploadProgress(0);
      } catch (insertError: any) {
        console.error('Insert error:', insertError);
        setPostError(insertError.message || 'Erro ao salvar publicação. Tente novamente.');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      setPostError(error.message || 'Erro ao publicar. Tente novamente.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLike = async (postId: string, currentLikes: number) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ likes: currentLikes + 1 })
        .eq('id', postId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const loadSocialStats = async (targetProfile: SocialProfile) => {
    setSocialLoading(true);
    setSocialError(null);
    try {
      const [followersResult, followingResult, relationshipResult] = await Promise.all([
        supabase.from('social_follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', targetProfile.id),
        supabase.from('social_follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', targetProfile.id),
        targetProfile.id === profile.id
          ? Promise.resolve({ data: null, error: null })
          : supabase.from('social_follows').select('follower_id').eq('follower_id', profile.id).eq('following_id', targetProfile.id).maybeSingle(),
      ]);

      const firstError = followersResult.error || followingResult.error || relationshipResult.error;
      if (firstError) throw firstError;
      setFollowersCount(followersResult.count || 0);
      setFollowingCount(followingResult.count || 0);
      setIsFollowingProfile(Boolean(relationshipResult.data));
    } catch (error: any) {
      console.error('Error loading social profile stats:', error);
      setFollowersCount(0);
      setFollowingCount(0);
      setIsFollowingProfile(false);
      setSocialError('A área social precisa ser ativada no banco para liberar seguidores.');
    } finally {
      setSocialLoading(false);
    }
  };

  const openSocialProfile = async (targetUserId: string, fallback?: Partial<SocialProfile>) => {
    setSocialLoading(true);
    setSocialError(null);
    try {
      const knownProfile: SocialProfile | undefined = targetUserId === profile.id ? profile : postProfiles[targetUserId];
      let targetProfile = knownProfile;
      if (!targetProfile) {
        const { data, error } = await supabase.from('social_profiles').select('*').eq('id', targetUserId).maybeSingle();
        if (error) throw error;
        targetProfile = data as SocialProfile | null;
      }
      if (!targetProfile) {
        targetProfile = {
          id: targetUserId,
          name: fallback?.name || 'Atleta IronShape',
          plano: fallback?.plano || 'free',
          avatar_url: fallback?.avatar_url || '',
        };
      }
      setActiveSocialProfile(targetProfile);
      await loadSocialStats(targetProfile);
    } catch (error: any) {
      console.error('Error opening social profile:', error);
      setSocialError('Não foi possível abrir este perfil agora.');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!activeSocialProfile || activeSocialProfile.id === profile.id || followSaving) return;
    setFollowSaving(true);
    setSocialError(null);
    try {
      if (isFollowingProfile) {
        const { error } = await supabase
          .from('social_follows')
          .delete()
          .eq('follower_id', profile.id)
          .eq('following_id', activeSocialProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('social_follows').insert({
          follower_id: profile.id,
          following_id: activeSocialProfile.id,
        });
        if (error) throw error;
      }
      setIsFollowingProfile(current => !current);
      setFollowersCount(current => Math.max(0, current + (isFollowingProfile ? -1 : 1)));
    } catch (error: any) {
      console.error('Error toggling follow:', error);
      setSocialError('Não foi possível atualizar este vínculo. Tente novamente.');
    } finally {
      setFollowSaving(false);
    }
  };

  const openSocialList = async (type: 'followers' | 'following') => {
    if (!activeSocialProfile) return;
    setShowSocialList(type);
    setSocialListLoading(true);
    setSocialListProfiles([]);
    try {
      const column = type === 'followers' ? 'following_id' : 'follower_id';
      const idColumn = type === 'followers' ? 'follower_id' : 'following_id';
      const { data, error } = await supabase
        .from('social_follows')
        .select(idColumn)
        .eq(column, activeSocialProfile.id)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      const ids = (data || []).map((item: any) => item[idColumn]).filter(Boolean);
      if (ids.length === 0) return;
      const { data: profilesData, error: profilesError } = await supabase.from('social_profiles').select('*').in('id', ids);
      if (profilesError) throw profilesError;
      setSocialListProfiles((profilesData || []) as SocialProfile[]);
    } catch (error: any) {
      console.error('Error loading social list:', error);
      setSocialError('Não foi possível carregar esta lista.');
    } finally {
      setSocialListLoading(false);
    }
  };

  const openSocialProfileEditor = () => {
    const target = activeSocialProfile || profile;
    setEditSocialName(target.name || '');
    setEditSocialBio(target.bio || '');
    setEditSocialAvatar(null);
    setEditSocialAvatarPreview(target.avatar_url || '');
    setShowEditSocialProfile(true);
  };

  const handleSocialAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSocialError('A foto de perfil deve ter no máximo 5MB.');
      return;
    }
    setEditSocialAvatar(file);
    setEditSocialAvatarPreview(URL.createObjectURL(file));
  };

  const saveSocialProfile = async () => {
    if (!editSocialName.trim()) return;
    setSavingSocialProfile(true);
    setSocialError(null);
    try {
      let avatarUrl = activeSocialProfile?.avatar_url || profile.avatar_url || '';
      if (editSocialAvatar) {
        const extension = editSocialAvatar.name.split('.').pop() || 'jpg';
        const filePath = `${profile.id}/profile/avatar-${Date.now()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('post-images').upload(filePath, editSocialAvatar, { upsert: true });
        if (uploadError) throw uploadError;
        avatarUrl = supabase.storage.from('post-images').getPublicUrl(filePath).data.publicUrl;
      }

      const updates = {
        name: editSocialName.trim().slice(0, 60),
        bio: editSocialBio.trim().slice(0, 160),
        avatar_url: avatarUrl,
      };
      await updateProfile(updates);
      await supabase.from('posts').update({ user_name: updates.name, user_avatar: avatarUrl || updates.name[0] }).eq('user_id', profile.id);

      const updatedProfile = { ...profile, ...updates };
      setActiveSocialProfile(updatedProfile);
      setPostProfiles(current => ({ ...current, [profile.id]: updatedProfile }));
      setPosts(current => current.map(post => post.user_id === profile.id
        ? { ...post, user_name: updates.name, user_avatar: avatarUrl || updates.name[0] }
        : post));
      setShowEditSocialProfile(false);
    } catch (error: any) {
      console.error('Error saving social profile:', error);
      setSocialError(error?.message || 'Não foi possível salvar o perfil social.');
    } finally {
      setSavingSocialProfile(false);
    }
  };

  const handleShareEvolution = async (post: Post) => {
    setSharingPostId(post.id);
    setShareFeedback(null);
    try {
      const storyBlob = await createCommunityStory(post);
      const fileName = `ironshape-evolucao-${post.id}.png`;
      const storyFile = new File([storyBlob], fileName, { type: 'image/png' });
      const shareData = {
        files: [storyFile],
        title: 'Minha evolução no IronShape',
        text: 'Minha evolução com o IronShape 💪 https://ironshape.online',
      };

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [storyFile] }))) {
        await navigator.share(shareData);
        setShareFeedback('Arte pronta! Escolha o Instagram para publicar no Story.');
      } else {
        const downloadUrl = URL.createObjectURL(storyBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        setShareFeedback('Arte baixada. Abra o Instagram e adicione a imagem ao seu Story.');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Error sharing community post:', error);
        setShareFeedback(error?.message || 'Não foi possível preparar o compartilhamento.');
      }
    } finally {
      setSharingPostId(null);
    }
  };

  if (activeSocialProfile) {
    const isOwnSocialProfile = activeSocialProfile.id === profile.id;
    const socialPosts = posts.filter(post => post.user_id === activeSocialProfile.id);
    const socialAvatar = activeSocialProfile.avatar_url || '';
    const planName = activeSocialProfile.plano === 'Iniciante' || activeSocialProfile.plano === 'free'
      ? 'Free'
      : activeSocialProfile.plano;

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <header className="flex items-center gap-4">
          <button
            onClick={() => {
              setActiveSocialProfile(null);
              setSocialError(null);
            }}
            className="w-11 h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-text-muted hover:text-white hover:border-primary/40 transition-all"
            aria-label="Voltar para a comunidade"
          >
            <ArrowLeft size={21} />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Perfil social</p>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">{activeSocialProfile.name}</h1>
          </div>
        </header>

        <section className="bg-surface rounded-[28px] md:rounded-[36px] border border-white/5 overflow-hidden">
          <div className="h-24 md:h-32 bg-gradient-to-r from-primary/25 via-primary/5 to-transparent border-b border-white/5" />
          <div className="px-5 md:px-8 pb-6 md:pb-8">
            <div className="-mt-12 md:-mt-14 flex items-end justify-between gap-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-[28px] bg-primary border-4 border-surface overflow-hidden flex items-center justify-center text-3xl font-black text-white shadow-xl">
                {socialAvatar ? (
                  <img src={socialAvatar} alt={`Foto de ${activeSocialProfile.name}`} className="w-full h-full object-cover" />
                ) : (
                  activeSocialProfile.name?.[0]?.toUpperCase() || 'I'
                )}
              </div>
              {isOwnSocialProfile ? (
                <button
                  onClick={openSocialProfileEditor}
                  className="min-h-[44px] px-4 md:px-5 rounded-2xl border border-white/10 bg-white/5 text-xs font-black uppercase tracking-wider hover:border-primary/40 hover:bg-primary/10 transition-all"
                >
                  Editar perfil
                </button>
              ) : (
                <button
                  onClick={handleToggleFollow}
                  disabled={followSaving || Boolean(socialError)}
                  className={`min-h-[44px] px-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${
                    isFollowingProfile
                      ? 'border border-white/10 bg-white/5 text-text-secondary'
                      : 'bg-primary text-white shadow-lg shadow-primary/20'
                  }`}
                >
                  {followSaving ? <Loader2 size={17} className="animate-spin" /> : isFollowingProfile ? <UserMinus size={17} /> : <UserPlus size={17} />}
                  {isFollowingProfile ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black">{activeSocialProfile.name}</h2>
                <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[9px] font-black uppercase tracking-widest text-primary">
                  Plano {planName}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed max-w-xl">
                {activeSocialProfile.bio?.trim() || (isOwnSocialProfile
                  ? 'Conte um pouco sobre sua jornada, seus objetivos e o que mantém você em movimento.'
                  : 'Atleta da comunidade IronShape.')}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-6">
              <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center">
                <strong className="block text-lg md:text-xl font-black">{socialPosts.length}</strong>
                <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-text-muted">Publicações</span>
              </div>
              <button onClick={() => openSocialList('followers')} className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center hover:border-primary/30 transition-all">
                <strong className="block text-lg md:text-xl font-black">{socialLoading ? '...' : followersCount}</strong>
                <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-text-muted">Seguidores</span>
              </button>
              <button onClick={() => openSocialList('following')} className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center hover:border-primary/30 transition-all">
                <strong className="block text-lg md:text-xl font-black">{socialLoading ? '...' : followingCount}</strong>
                <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-text-muted">Seguindo</span>
              </button>
            </div>

            {socialError && (
              <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3 text-xs text-text-secondary leading-relaxed">
                {socialError}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Grid3X3 size={18} className="text-primary" />
              <h3 className="font-black uppercase tracking-widest text-xs">Publicações</h3>
            </div>
            <span className="text-[10px] text-text-muted uppercase tracking-widest">{socialPosts.length} no perfil</span>
          </div>

          {socialPosts.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 bg-surface p-10 text-center">
              <ImageIcon size={38} className="mx-auto text-text-muted mb-3" />
              <h4 className="font-bold">Nenhuma publicação ainda</h4>
              <p className="text-xs text-text-muted mt-2">As fotos e atualizações aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 md:gap-3">
              {socialPosts.map(post => (
                <div key={post.id} className="relative aspect-square rounded-lg md:rounded-2xl overflow-hidden bg-surface border border-white/5 group">
                  {post.imagem_url ? (
                    <img src={post.imagem_url} alt="Publicação do perfil" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full p-2 md:p-4 flex items-center justify-center text-center bg-gradient-to-br from-primary/15 to-white/5">
                      <p className="text-[8px] md:text-xs leading-relaxed text-text-secondary line-clamp-5">{post.conteudo}</p>
                    </div>
                  )}
                  <div className="absolute bottom-1.5 right-1.5 md:bottom-2 md:right-2 px-1.5 py-1 rounded-md bg-black/60 text-[8px] md:text-[9px] font-bold flex items-center gap-1">
                    <Flame size={10} /> {post.likes || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <AnimatePresence>
          {showEditSocialProfile && (
            <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-5">
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowEditSocialProfile(false)}
                className="absolute inset-0 bg-background/85 backdrop-blur-sm"
                aria-label="Fechar edição"
              />
              <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] border border-white/10 bg-surface p-5 md:p-7 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Seu perfil</p>
                    <h3 className="text-xl font-black">Editar perfil social</h3>
                  </div>
                  <button onClick={() => setShowEditSocialProfile(false)} className="p-2 rounded-xl bg-white/5"><X size={20} /></button>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden bg-primary flex items-center justify-center text-2xl font-black text-white shrink-0">
                      {editSocialAvatarPreview
                        ? <img src={editSocialAvatarPreview} alt="Prévia do avatar" className="w-full h-full object-cover" />
                        : editSocialName?.[0]?.toUpperCase() || 'I'}
                    </div>
                    <label className="min-h-[44px] px-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer hover:border-primary/40">
                      <Camera size={17} /> Trocar foto
                      <input type="file" accept="image/*" className="hidden" onChange={handleSocialAvatarChange} />
                    </label>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Nome</span>
                    <input value={editSocialName} onChange={event => setEditSocialName(event.target.value)} maxLength={60} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none focus:border-primary" />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Bio</span>
                    <textarea value={editSocialBio} onChange={event => setEditSocialBio(event.target.value)} maxLength={160} rows={4} placeholder="Fale sobre sua jornada e seus objetivos..." className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 outline-none resize-none focus:border-primary" />
                    <span className="block text-right text-[10px] text-text-muted">{editSocialBio.length}/160</span>
                  </label>
                  <button onClick={saveSocialProfile} disabled={savingSocialProfile || !editSocialName.trim()} className="w-full min-h-[52px] rounded-2xl bg-primary text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                    {savingSocialProfile && <Loader2 size={18} className="animate-spin" />}
                    Salvar perfil
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {showSocialList && (
            <div className="fixed inset-0 z-[125] flex items-end sm:items-center justify-center p-0 sm:p-5">
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSocialList(null)} className="absolute inset-0 bg-background/85 backdrop-blur-sm" aria-label="Fechar lista" />
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="relative w-full max-w-md max-h-[75vh] rounded-t-[32px] sm:rounded-[32px] border border-white/10 bg-surface overflow-hidden shadow-2xl">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-black">{showSocialList === 'followers' ? 'Seguidores' : 'Seguindo'}</h3>
                  <button onClick={() => setShowSocialList(null)} className="p-2 rounded-xl bg-white/5"><X size={19} /></button>
                </div>
                <div className="p-3 overflow-y-auto max-h-[60vh]">
                  {socialListLoading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                  ) : socialListProfiles.length === 0 ? (
                    <p className="py-12 text-center text-sm text-text-muted">Nenhum perfil nesta lista.</p>
                  ) : socialListProfiles.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setShowSocialList(null);
                        openSocialProfile(item.id, item);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 text-left transition-colors"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-primary overflow-hidden flex items-center justify-center font-black text-white shrink-0">
                        {item.avatar_url ? <img src={item.avatar_url} alt="" className="w-full h-full object-cover" /> : item.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{item.name}</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest">Plano {item.plano === 'free' || item.plano === 'Iniciante' ? 'Free' : item.plano}</p>
                      </div>
                      <ChevronRight size={18} className="ml-auto text-text-muted" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Comunidade 🤝</h1>
          <p className="text-text-muted text-sm md:text-base">Compartilhe sua jornada</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openSocialProfile(profile.id, profile)}
            className="w-12 h-12 rounded-2xl border border-white/10 bg-surface overflow-hidden flex items-center justify-center font-black text-primary hover:border-primary/40 transition-all shrink-0"
            aria-label="Abrir meu perfil social"
          >
            {profile.avatar_url ? <img src={profile.avatar_url} alt="Meu perfil" className="w-full h-full object-cover" /> : profile.name?.[0]?.toUpperCase()}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary w-12 h-12 flex items-center justify-center rounded-2xl text-text-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform shrink-0"
            aria-label="Criar publicação"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      {shareFeedback && (
        <div className="max-w-2xl mx-auto flex items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-text-secondary">
          <div className="flex items-start gap-3">
            <Share2 size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="leading-relaxed">{shareFeedback}</p>
          </div>
          <button onClick={() => setShareFeedback(null)} className="p-1 text-text-muted hover:text-text-primary" aria-label="Fechar aviso">
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="animate-spin text-primary" size={40} />
          <div className="text-center">
            <p className="text-text-muted font-medium">Carregando feed...</p>
            <button 
              onClick={() => {
                setLoading(true);
                fetchPosts();
              }}
              className="mt-2 text-primary text-sm font-bold hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-surface rounded-[40px] border border-white/5">
          <div className="p-6 rounded-full bg-white/5">
            <Users size={48} className="text-text-muted" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Nenhuma publicação ainda</h3>
            <p className="text-text-muted">Seja o primeiro a compartilhar sua evolução!</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-text-primary px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20"
          >
            Começar Agora
          </button>
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl mx-auto">
          {posts.map((post) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={post.id} 
              className="bg-surface rounded-2xl md:rounded-3xl border border-white/5 overflow-hidden"
            >
              <div className="p-4 md:p-6 flex items-center gap-4">
                <button
                  onClick={() => openSocialProfile(post.user_id, { name: post.user_name, avatar_url: post.user_avatar })}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary overflow-hidden flex items-center justify-center font-black text-lg md:text-xl text-text-primary shrink-0 hover:ring-2 hover:ring-primary/40 transition-all"
                  aria-label={`Abrir perfil de ${post.user_name}`}
                >
                  {postProfiles[post.user_id]?.avatar_url || (post.user_avatar?.startsWith('http') ? post.user_avatar : '') ? (
                    <img src={postProfiles[post.user_id]?.avatar_url || post.user_avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    post.user_avatar || post.user_name[0]
                  )}
                </button>
                <div>
                  <button onClick={() => openSocialProfile(post.user_id, { name: post.user_name, avatar_url: post.user_avatar })} className="font-bold text-sm md:text-base hover:text-primary transition-colors text-left">
                    {postProfiles[post.user_id]?.name || post.user_name}
                  </button>
                  <span className="text-[10px] md:text-xs text-text-muted">
                    {formatDistanceToNow(new Date(post.criado_em), { addSuffix: true, locale: dateFnsLocale })}
                  </span>
                </div>
              </div>
              <div className="px-4 md:px-6 pb-4">
                <p className="text-text-secondary text-sm md:text-base leading-relaxed whitespace-pre-wrap">{post.conteudo}</p>
              </div>
              {post.imagem_url && (
                <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] max-h-[640px] overflow-hidden bg-black">
                  <img
                    src={post.imagem_url}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <img
                    src={post.imagem_url}
                    alt="Imagem da publicação"
                    className="relative z-10 w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="p-4 flex items-center gap-6 border-t border-white/5">
                <button 
                  onClick={() => handleLike(post.id, post.likes)}
                  className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors group min-h-[44px] px-2"
                >
                  <Flame size={20} className="group-active:scale-125 transition-transform" />
                  <span className="text-sm font-bold">{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors min-h-[44px] px-2">
                  <Users size={20} />
                  <span className="text-sm font-bold">0</span>
                </button>
                {post.user_id === profile.id && post.imagem_url && (
                  <button
                    onClick={() => handleShareEvolution(post)}
                    disabled={sharingPostId === post.id}
                    className="ml-auto flex min-h-[44px] items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 text-primary transition-all hover:bg-primary hover:text-white active:scale-[0.98] disabled:opacity-60"
                  >
                    {sharingPostId === post.id ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                    <span className="hidden sm:inline text-xs font-black uppercase tracking-wider">
                      {sharingPostId === post.id ? 'Preparando' : 'Compartilhar evolução'}
                    </span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface rounded-[40px] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-black">Nova Publicação</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {postError && (
                  <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error text-sm animate-shake">
                    <AlertTriangle size={18} className="shrink-0" />
                    <p>{postError}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Legenda</label>
                  <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="O que você está treinando hoje?"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary outline-none focus:border-primary transition-all min-h-[120px] resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest ml-1">Mídia</label>
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[4/5] sm:aspect-[4/3] max-h-[480px] bg-black">
                        <img
                          src={imagePreview}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-35"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <img src={imagePreview} alt="Prévia da publicação" className="relative z-10 w-full h-full object-contain" />
                        {!isPublishing && (
                          <button 
                            onClick={() => {
                              setNewPostImage(null);
                              setImagePreview(null);
                            }}
                            className="absolute z-20 top-2 right-2 p-2 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                      {isPublishing && uploadProgress > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                            <span>Upload da Imagem</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress}%` }}
                              className="h-full bg-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-primary/50 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-12 h-12 text-text-muted mb-4 group-hover:text-primary transition-colors" />
                        <p className="text-sm text-text-muted font-bold">Clique para adicionar uma foto</p>
                        <p className="text-xs text-text-muted/50 mt-1">PNG, JPG ou JPEG (Máx 5MB)</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={isPublishing} />
                    </label>
                  )}
                </div>

                <button 
                  onClick={handleCreatePost}
                  disabled={isPublishing || (!newPostContent.trim() && !newPostImage)}
                  className="w-full bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {uploadProgress < 100 && newPostImage ? 'Enviando Imagem...' : 'Publicando...'}
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Publicar no Feed
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsView({ profile, language, logout: _logout, onUpgrade }: { profile: UserProfile, language: LanguageCode, logout: () => void, onUpgrade: () => void }) {
  const { isAdmin, simulatedPlan, setSimulatedPlan, user, logout, updateProfile } = useAuth();
  const dateFnsLocale = getDateFnsLocale(language);
  const effectivePlan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null);
  const [adminTestStatus, setAdminTestStatus] = useState('');
  const [trainingPlace, setTrainingPlace] = useState<'gym' | 'home'>(() => {
    if (!user?.id) return 'gym';
    try {
      const onboarding = JSON.parse(localStorage.getItem(`training_onboarding_${user.id}`) || 'null');
      return onboarding?.trainingPlace === 'home' ? 'home' : 'gym';
    } catch {
      return 'gym';
    }
  });

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || profile.name || 'Usuário';
  const userEmail = user?.email || profile.email || '';
  const isFreePlan = effectivePlan === 'free' || effectivePlan === 'Iniciante';
  const planLabel = isFreePlan ? 'Free' : effectivePlan;
  const paidAt = profile.subscriptionPaidAt ? new Date(profile.subscriptionPaidAt) : null;
  const nextBillingDate = paidAt && isValid(paidAt)
    ? format(addMonths(paidAt, 1), language === 'en' ? 'MMMM d, yyyy' : "d 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })
    : null;
  const handleTrainingPlaceChange = (nextTrainingPlace: 'gym' | 'home') => {
    if (!user?.id) return;
    let onboarding: any = null;
    try {
      onboarding = JSON.parse(localStorage.getItem(`training_onboarding_${user.id}`) || 'null');
    } catch {
      onboarding = null;
    }
    const nextOnboarding = {
      ...(onboarding || {}),
      trainingPlace: nextTrainingPlace,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`training_onboarding_${user.id}`, JSON.stringify(nextOnboarding));
    setTrainingPlace(nextTrainingPlace);
    window.dispatchEvent(new CustomEvent('ironshape:training-place-changed', { detail: { trainingPlace: nextTrainingPlace } }));
  };
  const prepareFreePhaseTest = async () => {
    setAdminTestStatus('Preparando teste...');
    try {
      localStorage.removeItem('completedWorkouts');
      localStorage.removeItem('awardedWorkoutPoints');
      if (user?.id) {
        localStorage.removeItem(`weekly_workouts_done_${user.id}`);
      }
      await updateProfile({
        points: 1900,
        plano: 'Iniciante',
        subscriptionStatus: 'inactive',
      });
      setSimulatedPlan('Iniciante');
      setAdminTestStatus('Teste pronto: usuário em 1900 pts. Complete um treino para bater 2000.');
    } catch (error: any) {
      setAdminTestStatus(error?.message || 'Não foi possível preparar o teste.');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Ajustes ⚙️</h1>
        <p className="text-text-muted">Gerencie sua conta e assinatura</p>
      </header>

      <div className="space-y-4">
        <section className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-bold">Perfil</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Nome</span>
              <span className="font-bold">{userName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Email</span>
              <span className="font-bold">{userEmail}</span>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-white/5 flex items-center gap-3">
            <Dumbbell className="text-primary" size={20} />
            <div>
              <h3 className="font-bold">Preferências de treino</h3>
              <p className="text-xs text-text-muted mt-1">Escolha onde você deseja treinar agora.</p>
            </div>
          </div>
          <div className="p-5 md:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'gym', label: 'Academia', description: 'Máquinas e cargas' },
                { id: 'home', label: 'Casa', description: 'Prático e adaptado' },
              ] as const).map((option) => {
                const selected = trainingPlace === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleTrainingPlaceChange(option.id)}
                    className={`min-h-[76px] rounded-2xl px-3 py-4 text-left transition-all border active:scale-[0.98] ${
                      selected
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white/5 border-white/10 text-text-muted hover:border-primary/40 hover:bg-white/10'
                    }`}
                  >
                    <span className="block text-xs font-black uppercase tracking-widest">{option.label}</span>
                    <span className={`block text-[10px] mt-1 ${selected ? 'text-white/75' : 'text-text-muted'}`}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4">
              <p className="text-xs text-text-secondary leading-relaxed">
                Você continuará no plano <span className="font-black text-text-primary">{planLabel}</span>. Pontos, histórico, favoritos, progresso e treinos da semana não serão apagados.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-bold">Assinatura</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-primary font-black text-xl mb-1">{effectivePlan}</div>
                <div className="text-xs text-text-muted uppercase tracking-widest font-bold">
                  Status: {isFreePlan ? 'GRATUITO' : profile.subscriptionStatus}
                </div>
              </div>
              <button 
                onClick={onUpgrade}
                className="bg-text-primary text-background font-bold px-6 py-2 rounded-xl text-sm hover:bg-text-secondary transition-colors"
              >
                Gerenciar
              </button>
            </div>
            {!isFreePlan && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-text-secondary">
                {nextBillingDate
                  ? `Sua próxima cobrança será em ${nextBillingDate}.`
                  : 'A data da próxima cobrança será exibida após a confirmação do pagamento.'}
              </div>
            )}
          </div>
        </section>

        {isAdmin && (
          <section className="bg-primary/5 rounded-3xl border border-primary/20 overflow-hidden">
            <div className="p-6 border-b border-primary/10 flex items-center gap-3">
              <Settings className="text-primary" size={20} />
              <h3 className="font-bold text-primary uppercase tracking-widest text-sm">Painel Administrativo</h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-text-muted mb-6 leading-relaxed">
                Você está logado como administrador. Use as opções abaixo para simular diferentes níveis de acesso e testar as funcionalidades premium.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(['Iniciante', 'Pro', 'Elite'] as Plan[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSimulatedPlan(p)}
                    className={`py-3 rounded-xl text-xs font-black transition-all border ${
                      effectivePlan === p 
                        ? 'bg-primary border-primary text-text-primary shadow-lg shadow-primary/20' 
                        : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {simulatedPlan && (
                <button 
                  onClick={() => setSimulatedPlan(null)}
                  className="w-full mt-4 py-3 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                >
                  Resetar para Plano Real
                </button>
              )}
              <div className="mt-6 pt-6 border-t border-primary/10">
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-3">Teste da fase free</p>
                <button
                  onClick={prepareFreePhaseTest}
                  className="w-full min-h-[48px] rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Trophy size={16} />
                  Preparar 1900 pts
                </button>
                <p className="text-xs text-text-muted mt-3 leading-relaxed">
                  Define sua conta como Iniciante com 1900 pontos e limpa marcações locais de treino. Ao concluir o próximo treino, a celebração dos 2000 pontos deve aparecer na hora.
                </p>
                {adminTestStatus && (
                  <div className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-3 text-xs font-bold text-text-secondary">
                    {adminTestStatus}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        <button
          onClick={async () => {
            try {
              localStorage.clear();
              sessionStorage.clear();
              await supabase.auth.signOut();
            } catch {
              // ignore
            }
            window.location.href = window.location.origin;
          }}
          className="w-full bg-error/10 text-error font-bold py-4 rounded-2xl border border-error/20 hover:bg-error/20 transition-all"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
}

function AdminView({ language }: { language: LanguageCode }) {
  const locale = getLocaleCode(language);
  const dateFnsLocale = getDateFnsLocale(language);
  const [adminTab, setAdminTab] = useState<'general' | 'affiliates' | 'shop'>('general');
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [adminError, setAdminError] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [planUser, setPlanUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedAdminPlan, setSelectedAdminPlan] = useState<'free' | 'Pro' | 'Elite'>('free');
  const [savingUserPlan, setSavingUserPlan] = useState(false);
  const [userPlanError, setUserPlanError] = useState('');
  const [ironShopSettings, setIronShopSettings] = useState<IronShopSettings | null>(null);
  const [ironShopAudit, setIronShopAudit] = useState<IronShopAuditEntry[]>([]);
  const [ironShopAdminLoading, setIronShopAdminLoading] = useState(false);
  const [ironShopAdminError, setIronShopAdminError] = useState('');
  const [ironShopReason, setIronShopReason] = useState('');
  const [adminData, setAdminData] = useState<{
    profiles: UserProfile[];
    workouts: WorkoutLog[];
    nutrition: NutritionLog[];
    posts: Post[];
    affiliates: Affiliate[];
    conversions: AffiliateConversion[];
  }>({ profiles: [], workouts: [], nutrition: [], posts: [], affiliates: [], conversions: [] });

  const fetchAdminData = async () => {
    setLoadingAdmin(true);
    setAdminError('');
    try {
      const [profilesRes, workoutsRes, nutritionRes, postsRes, affiliatesRes, conversionsRes] = await Promise.allSettled([
        withTimeout(() => supabase.from('profiles').select('*').order('criado_em', { ascending: false }).limit(1000), 15000, 1) as any,
        withTimeout(() => supabase.from('workout_logs').select('*').order('completedAt', { ascending: false }).limit(300), 15000, 1) as any,
        withTimeout(() => supabase.from('nutrition_logs').select('*').order('date', { ascending: false }).limit(300), 15000, 1) as any,
        withTimeout(() => supabase.from('posts').select('*').order('criado_em', { ascending: false }).limit(100), 15000, 1) as any,
        withTimeout(() => supabase.from('affiliates').select('*').order('criado_em', { ascending: false }).limit(200), 15000, 1) as any,
        withTimeout(() => supabase.from('affiliate_conversions').select('*').order('created_at', { ascending: false }).limit(300), 15000, 1) as any,
      ]);

      const read = <T,>(result: PromiseSettledResult<any>, label: string): T[] => {
        if (result.status === 'rejected') {
          console.warn(`Admin ${label} fetch failed:`, result.reason);
          return [];
        }
        if (result.value?.error) {
          console.warn(`Admin ${label} query error:`, result.value.error);
          return [];
        }
        return (result.value?.data || []) as T[];
      };

      setAdminData({
        profiles: read<UserProfile>(profilesRes, 'profiles'),
        workouts: read<WorkoutLog>(workoutsRes, 'workouts'),
        nutrition: read<NutritionLog>(nutritionRes, 'nutrition'),
        posts: read<Post>(postsRes, 'posts'),
        affiliates: read<Affiliate>(affiliatesRes, 'affiliates'),
        conversions: read<AffiliateConversion>(conversionsRes, 'conversions'),
      });
    } catch (e: any) {
      setAdminError(e.message || 'Erro ao carregar painel administrativo.');
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'general') fetchAdminData();
  }, [adminTab]);

  const fetchIronShopAdmin = async () => {
    setIronShopAdminLoading(true);
    setIronShopAdminError('');
    try {
      const payload = await ironshopService.getAdminSettings();
      setIronShopSettings(payload.settings);
      setIronShopAudit(payload.audit);
    } catch (error: any) {
      setIronShopAdminError(error?.message || 'Erro ao carregar disponibilidade da IronShop.');
    } finally {
      setIronShopAdminLoading(false);
    }
  };

  useEffect(() => {
    if (adminTab === 'shop') fetchIronShopAdmin();
  }, [adminTab]);

  const saveIronShopSettings = async (updates: Partial<IronShopSettings>) => {
    if (!ironShopSettings) return;
    setIronShopAdminLoading(true);
    setIronShopAdminError('');
    try {
      const payload = await ironshopService.updateAdminSettings({ ...ironShopSettings, ...updates }, ironShopReason);
      setIronShopSettings(payload.settings);
      setIronShopAudit(payload.audit);
      setIronShopReason('');
      trackEvent('admin_ironshop_settings_updated', {
        mode: payload.settings.availability_mode,
        enabled: payload.settings.ironshop_enabled,
      });
    } catch (error: any) {
      setIronShopAdminError(error?.message || 'Erro ao salvar disponibilidade da IronShop.');
    } finally {
      setIronShopAdminLoading(false);
    }
  };

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(adminData.profiles.length / 6));
    setUsersPage(current => Math.min(Math.max(current, 1), totalPages));
  }, [adminData.profiles.length]);

  const normalizeAdminPlan = (plan?: Plan): 'free' | 'Pro' | 'Elite' | 'Admin' => {
    if (plan === 'Pro' || plan === 'Elite' || plan === 'Admin') return plan;
    return 'free';
  };

  const openPlanManager = (target: UserProfile) => {
    const currentPlan = normalizeAdminPlan(target.plano);
    setPlanUser(target);
    setSelectedAdminPlan(currentPlan === 'Admin' ? 'free' : currentPlan);
    setUserPlanError('');
  };

  const saveUserPlan = async () => {
    if (!planUser || planUser.role === 'admin') return;
    setSavingUserPlan(true);
    setUserPlanError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Sua sessão expirou. Entre novamente para continuar.');
      const response = await fetch('/api/admin/update-user-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId: planUser.id, plan: selectedAdminPlan }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || 'Não foi possível alterar o plano.');
      setAdminData(current => ({
        ...current,
        profiles: current.profiles.map(profile => profile.id === planUser.id ? payload.profile as UserProfile : profile),
      }));
      setSelectedUser(current => current?.id === planUser.id ? payload.profile as UserProfile : current);
      trackEvent('admin_user_plan_updated', {
        previous_plan: normalizeAdminPlan(planUser.plano),
        new_plan: selectedAdminPlan,
      });
      setPlanUser(null);
    } catch (error: any) {
      setUserPlanError(error.message || 'Erro ao alterar o plano.');
    } finally {
      setSavingUserPlan(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const paidProfiles = adminData.profiles.filter(p => (p.plano === 'Pro' || p.plano === 'Elite') && p.subscriptionStatus === 'active');
  const getAdminPlanValue = (plan?: Plan) => plan === 'Elite' ? 29.9 : plan === 'Pro' ? 19.9 : 0;
  const getSubscriptionDate = (profile: UserProfile) => profile.subscriptionPaidAt || profile.updatedAt || profile.criado_em || '';
  const onboardingStuck = adminData.profiles.filter(p => !p.age || !p.weight || !p.height || !p.goal);
  const activeToday = new Set([
    ...adminData.workouts.filter(w => w.completedAt?.startsWith(today)).map(w => w.userUid),
    ...adminData.nutrition.filter(n => n.date === today).map(n => n.user_id),
  ]);
  const monthlyRevenue = paidProfiles.reduce((sum, profile) => sum + getAdminPlanValue(profile.plano), 0);
  const pendingAffiliates = adminData.affiliates.filter(a => a.status === 'pendente');
  const planCounts = (['free', 'Pro', 'Elite', 'Admin'] as const).map(plan => ({
    plan,
    count: adminData.profiles.filter(p => normalizeAdminPlan(p.plano) === plan).length,
  }));
  const usersPerPage = 6;
  const totalUserPages = Math.max(1, Math.ceil(adminData.profiles.length / usersPerPage));
  const safeUsersPage = Math.min(Math.max(usersPage, 1), totalUserPages);
  const firstUserIndex = adminData.profiles.length ? (safeUsersPage - 1) * usersPerPage : 0;
  const lastUserIndex = Math.min(firstUserIndex + usersPerPage, adminData.profiles.length);
  const recentUsers = adminData.profiles.slice(firstUserIndex, lastUserIndex);
  const getVisibleUserPages = () => {
    const pages = new Set<number>([1, totalUserPages, safeUsersPage]);

    if (safeUsersPage > 1) pages.add(safeUsersPage - 1);
    if (safeUsersPage < totalUserPages) pages.add(safeUsersPage + 1);
    if (totalUserPages <= 5) {
      for (let page = 1; page <= totalUserPages; page += 1) pages.add(page);
    }

    return Array.from(pages).sort((a, b) => a - b);
  };
  const formatAdminShortDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (!isValid(date)) return '';
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  };
  const recentPaidProfiles = [...paidProfiles]
    .sort((a, b) => new Date(getSubscriptionDate(b)).getTime() - new Date(getSubscriptionDate(a)).getTime())
    .slice(0, 5);
  const getUserWorkouts = (userId: string) => adminData.workouts.filter(workout => workout.userUid === userId);
  const getUserNutrition = (userId: string) => adminData.nutrition.filter(nutrition => nutrition.user_id === userId);
  const getUserPosts = (userId: string) => adminData.posts.filter(post => post.user_id === userId);
  const getUserConversions = (userId: string) => adminData.conversions.filter(conversion => conversion.user_id === userId);

  const getLatestUserActivity = (user: UserProfile) => {
    const dates = [
      user.updatedAt,
      user.lastWorkoutDate,
      ...getUserWorkouts(user.id).map(workout => workout.completedAt),
      ...getUserNutrition(user.id).map(nutrition => nutrition.date),
      ...getUserPosts(user.id).map(post => post.criado_em),
      ...getUserConversions(user.id).map(conversion => conversion.created_at),
    ]
      .filter(Boolean)
      .map(value => new Date(value as string))
      .filter(isValid);

    return dates.length ? new Date(Math.max(...dates.map(date => date.getTime()))) : null;
  };

  const getDaysSince = (date: Date | null) => {
    if (!date) return null;
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getAdminUserStatus = (user: UserProfile) => {
    const onboardingMissing = !user.age || !user.weight || !user.height || !user.goal;
    const latestActivity = getLatestUserActivity(user);
    const daysSinceActivity = getDaysSince(latestActivity);
    const workoutCount = getUserWorkouts(user.id).length;
    const nutritionCount = getUserNutrition(user.id).length;
    const conversionCount = getUserConversions(user.id).length;
    const isFree = normalizeAdminPlan(user.plano) === 'free';

    if (onboardingMissing) {
      return {
        label: 'Onboarding',
        detail: 'Perfil incompleto',
        tone: 'bg-error/10 border-error/20 text-error',
        priority: 4,
      };
    }

    if (isFree && (workoutCount >= 2 || nutritionCount >= 2 || Number(user.points || 0) >= 500 || conversionCount > 0)) {
      return {
        label: 'Oportunidade',
        detail: 'Free engajado',
        tone: 'bg-primary/10 border-primary/20 text-primary',
        priority: 3,
      };
    }

    if (daysSinceActivity === 0) {
      return {
        label: 'Ativo hoje',
        detail: 'Usou o app hoje',
        tone: 'bg-success/10 border-success/20 text-success',
        priority: 1,
      };
    }

    if (daysSinceActivity !== null && daysSinceActivity <= 7) {
      return {
        label: 'Engajado',
        detail: `Ativo há ${daysSinceActivity}d`,
        tone: 'bg-success/10 border-success/20 text-success',
        priority: 1,
      };
    }

    if (daysSinceActivity !== null && daysSinceActivity <= 14) {
      return {
        label: 'Morno',
        detail: `Ativo há ${daysSinceActivity}d`,
        tone: 'bg-white/5 border-white/10 text-text-secondary',
        priority: 2,
      };
    }

    return {
      label: 'Risco',
      detail: daysSinceActivity === null ? 'Sem atividade' : `Parado há ${daysSinceActivity}d`,
      tone: 'bg-error/10 border-error/20 text-error',
      priority: 5,
    };
  };

  const usersAtRisk = adminData.profiles
    .map(user => ({ user, status: getAdminUserStatus(user) }))
    .filter(item => item.status.label === 'Risco' || item.status.label === 'Onboarding')
    .sort((a, b) => b.status.priority - a.status.priority)
    .slice(0, 5);
  const upgradeOpportunities = adminData.profiles
    .map(user => ({ user, status: getAdminUserStatus(user), workouts: getUserWorkouts(user.id).length, nutrition: getUserNutrition(user.id).length }))
    .filter(item => item.status.label === 'Oportunidade')
    .sort((a, b) => (b.workouts + b.nutrition) - (a.workouts + a.nutrition))
    .slice(0, 5);
  const formatUserRegistrationDate = (value?: string) => {
    if (!value) return 'Data de cadastro indisponível';

    const registrationDate = new Date(value);
    if (!isValid(registrationDate)) return 'Data de cadastro indisponível';

    return `Cadastrado em ${registrationDate.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })} às ${registrationDate.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="text-primary" size={32} />
            <h1 className="text-3xl font-black tracking-tight uppercase">Painel Administrativo</h1>
          </div>
          <p className="text-text-muted">Gerenciamento de sistema e permissões de elite</p>
        </div>

        <div className="flex bg-surface p-1 rounded-2xl border border-white/5 self-start">
          <button
            onClick={() => setAdminTab('general')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'general' ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
          >
            Geral
          </button>
          <button
            onClick={() => setAdminTab('affiliates')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'affiliates' ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
          >
            Afiliados
          </button>
          <button
            onClick={() => setAdminTab('shop')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adminTab === 'shop' ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' : 'text-text-muted hover:text-text-primary'}`}
          >
            IronShop
          </button>
        </div>
      </header>

      {adminTab === 'general' ? (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface border border-white/5 rounded-3xl p-5">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">Visão operacional</h3>
              <p className="text-xs text-text-muted mt-1">Dados lidos diretamente do Supabase com as permissões do usuário admin.</p>
            </div>
            <button
              onClick={fetchAdminData}
              disabled={loadingAdmin}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary hover:bg-white/10 transition-all disabled:opacity-60"
            >
              <RefreshCw size={14} className={loadingAdmin ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>

          {adminError && (
            <div className="bg-error/10 border border-error/20 rounded-3xl p-5 flex items-center gap-3 text-error">
              <AlertTriangle size={20} />
              <p className="text-sm font-bold">{adminError}</p>
            </div>
          )}

          {loadingAdmin ? (
            <div className="bg-surface border border-white/5 rounded-[40px] p-16 flex flex-col items-center justify-center gap-4 text-text-muted">
              <Loader2 className="animate-spin text-primary" size={36} />
              <span className="text-xs font-black uppercase tracking-widest">Carregando dados administrativos...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <AdminMetricCard icon={<Users size={22} />} label="Usuários" value={adminData.profiles.length.toString()} detail={`${activeToday.size} ativos hoje`} tone="text-primary" />
                <AdminMetricCard icon={<Wallet size={22} />} label="Assinaturas" value={paidProfiles.length.toString()} detail={`${adminData.profiles.length ? Math.round((paidProfiles.length / adminData.profiles.length) * 100) : 0}% da base`} tone="text-success" />
                <AdminMetricCard icon={<BarChart3 size={22} />} label="Receita Mês" value={monthlyRevenue.toLocaleString(locale, { style: 'currency', currency: 'BRL' })} detail={`${paidProfiles.length} assinaturas ativas`} tone="text-primary" />
                <AdminMetricCard icon={<UserCheck size={22} />} label="Afiliados Pendentes" value={pendingAffiliates.length.toString()} detail={`${adminData.affiliates.length} afiliados no total`} tone={pendingAffiliates.length ? 'text-error' : 'text-success'} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-surface rounded-[32px] border border-white/5 overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Usuários Recentes</h3>
                      <p className="text-xs text-text-muted mt-1">Últimos perfis criados ou retornados pela base.</p>
                    </div>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                      {adminData.profiles.length ? `${firstUserIndex + 1}-${lastUserIndex}` : '0'} de {adminData.profiles.length}
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {recentUsers.length > 0 ? (
                      <>
                        {recentUsers.map(user => {
                          const status = getAdminUserStatus(user);
                          const workoutCount = getUserWorkouts(user.id).length;
                          const nutritionCount = getUserNutrition(user.id).length;
                          const latestActivity = getLatestUserActivity(user);
                          return (
                          <div
                            key={user.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedUser(user)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedUser(user);
                              }
                            }}
                            className="group p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 transition-colors cursor-pointer"
                            aria-label={`Ver detalhes de ${user.name || user.email || 'usuário'}`}
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0 group-hover:scale-105 transition-transform">
                                {(user.name || user.email || 'U')[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-black text-sm truncate">{user.name || 'Usuário sem nome'}</div>
                                <div className="text-[10px] text-text-muted font-bold truncate">{user.email}</div>
                                <div className="mt-1 flex items-center gap-1 text-[9px] text-text-muted font-bold">
                                  <CalendarDays size={11} className="shrink-0 text-primary" />
                                  <span className="truncate">{formatUserRegistrationDate(user.criado_em)}</span>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest text-text-muted">
                                  <span>{workoutCount} treinos</span>
                                  <span>•</span>
                                  <span>{nutritionCount} dietas</span>
                                  {latestActivity && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDistanceToNow(latestActivity, { addSuffix: true, locale: dateFnsLocale })}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <span className={`px-3 py-1 border rounded-xl text-[10px] font-black uppercase tracking-widest ${status.tone}`}>
                                {status.label}
                              </span>
                              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">{normalizeAdminPlan(user.plano)}</span>
                              <span className={`px-3 py-1 border rounded-xl text-[10px] font-black uppercase tracking-widest ${user.subscriptionStatus === 'active' ? 'bg-success/10 border-success/20 text-success' : user.subscriptionStatus === 'canceled' ? 'bg-error/10 border-error/20 text-error' : 'bg-white/5 border-white/10 text-text-muted'}`}>
                                {user.subscriptionStatus === 'active' ? 'Ativa' : user.subscriptionStatus === 'canceled' ? 'Cancelada' : 'Inativa'}
                              </span>
                              {(!user.age || !user.weight || !user.height || !user.goal) && (
                                <span className="px-3 py-1 bg-error/10 border border-error/20 text-error rounded-xl text-[10px] font-black uppercase tracking-widest">Onboarding</span>
                              )}
                              {user.role !== 'admin' && normalizeAdminPlan(user.plano) !== 'Admin' && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openPlanManager(user);
                                  }}
                                  className="min-h-[34px] px-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest hover:bg-primary hover:text-text-primary transition-all flex items-center gap-1.5"
                                >
                                  <Edit3 size={12} /> Gerenciar plano
                                </button>
                              )}
                              <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-text-muted group-hover:text-primary group-hover:border-primary/30 flex items-center justify-center transition-all">
                                <ChevronRight size={15} />
                              </span>
                            </div>
                          </div>
                        )})}
                        {totalUserPages > 1 && (
                          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted text-center sm:text-left">
                              Página {safeUsersPage} de {totalUserPages}
                            </span>
                            <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                              <button
                                onClick={() => setUsersPage(page => Math.max(1, page - 1))}
                                disabled={safeUsersPage === 1}
                                aria-label="Página anterior de usuários"
                                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                              >
                                <ChevronLeft size={17} />
                              </button>
                              {getVisibleUserPages().map((page, index, pages) => (
                                <div key={page} className="flex items-center gap-2 shrink-0">
                                  {index > 0 && page - pages[index - 1] > 1 && (
                                    <span className="px-1 text-text-muted text-xs font-black">...</span>
                                  )}
                                  <button
                                    onClick={() => setUsersPage(page)}
                                    aria-label={`Ir para página ${page} de usuários`}
                                    aria-current={safeUsersPage === page ? 'page' : undefined}
                                    className={`w-11 h-11 rounded-2xl border text-[11px] font-black transition-all ${
                                      safeUsersPage === page
                                        ? 'bg-primary border-primary text-text-primary shadow-lg shadow-primary/20'
                                        : 'bg-white/5 border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => setUsersPage(page => Math.min(totalUserPages, page + 1))}
                                disabled={safeUsersPage === totalUserPages}
                                aria-label="Próxima página de usuários"
                                className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-text-muted hover:text-text-primary hover:border-white/20 disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0"
                              >
                                <ChevronRight size={17} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-10 text-center text-text-muted text-sm font-bold">Nenhum usuário disponível com as permissões atuais.</div>
                    )}
                  </div>
                </div>

                <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">Distribuição de Planos</h3>
                    <p className="text-xs text-text-muted mt-1">Ajuda a ver conversão e composição da base.</p>
                  </div>
                  <div className="space-y-4">
                    {planCounts.map(({ plan, count }) => {
                      const pct = adminData.profiles.length ? Math.round((count / adminData.profiles.length) * 100) : 0;
                      return (
                        <div key={plan} className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black uppercase tracking-widest text-text-secondary">{plan === 'free' ? 'Free' : plan}</span>
                            <span className="font-black text-text-muted">{count} • {pct}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={onboardingStuck.length ? 'text-error' : 'text-success'} size={22} />
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Gargalos</h3>
                      <p className="text-xs text-text-muted">Usuários sem onboarding completo.</p>
                    </div>
                  </div>
                  <div className="text-4xl font-black">{onboardingStuck.length}</div>
                  <div className="space-y-2">
                    {onboardingStuck.slice(0, 4).map(user => (
                      <div key={user.id} className="flex items-center justify-between gap-3 text-xs bg-white/5 rounded-2xl px-4 py-3">
                        <span className="font-bold truncate">{user.name || user.email}</span>
                        <span className="text-text-muted shrink-0">perfil incompleto</span>
                      </div>
                    ))}
                    {onboardingStuck.length === 0 && <p className="text-sm text-text-muted">Nenhum gargalo detectado nos perfis carregados.</p>}
                  </div>
                </div>

                <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <Activity className="text-primary" size={22} />
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Atividade</h3>
                      <p className="text-xs text-text-muted">Treinos, dieta e comunidade.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniAdminStat label="Treinos" value={adminData.workouts.length} />
                    <MiniAdminStat label="Dietas" value={adminData.nutrition.length} />
                    <MiniAdminStat label="Posts" value={adminData.posts.length} />
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Os números refletem os registros carregados nas últimas consultas limitadas do painel.
                  </p>
                </div>

                <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <Wallet className="text-primary" size={22} />
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Assinaturas recentes</h3>
                      <p className="text-xs text-text-muted">Usuários com plano pago ativo.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {recentPaidProfiles.map(profile => (
                      <button
                        key={profile.id}
                        onClick={() => setSelectedUser(profile)}
                        className="w-full text-left bg-white/5 hover:bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{profile.name || profile.email || 'Usuário sem nome'}</div>
                          <div className="text-[10px] text-text-muted truncate">{profile.email}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black uppercase tracking-widest text-primary">{profile.plano}</div>
                          <div className="text-[10px] text-text-muted">{formatAdminShortDate(getSubscriptionDate(profile)) || 'ativo'}</div>
                        </div>
                      </button>
                    ))}
                    {recentPaidProfiles.length === 0 && <p className="text-sm text-text-muted">Nenhuma assinatura ativa disponível ainda.</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={usersAtRisk.length ? 'text-error' : 'text-success'} size={22} />
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Atenção agora</h3>
                      <p className="text-xs text-text-muted">Usuários em risco ou presos no onboarding.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {usersAtRisk.map(({ user, status }) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{user.name || user.email}</div>
                          <div className="text-[10px] text-text-muted truncate">{user.email}</div>
                        </div>
                        <span className={`shrink-0 px-3 py-1 border rounded-xl text-[9px] font-black uppercase tracking-widest ${status.tone}`}>{status.label}</span>
                      </button>
                    ))}
                    {usersAtRisk.length === 0 && <p className="text-sm text-text-muted">Nenhum risco forte detectado nos dados carregados.</p>}
                  </div>
                </div>

                <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-primary" size={22} />
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Chance de upgrade</h3>
                      <p className="text-xs text-text-muted">Free engajados que podem virar assinatura.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {upgradeOpportunities.map(({ user, workouts, nutrition }) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="w-full text-left bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{user.name || user.email}</div>
                          <div className="text-[10px] text-text-muted truncate">{workouts} treinos • {nutrition} dietas • {Number(user.points || 0)} pts</div>
                        </div>
                        <ChevronRight size={16} className="text-primary shrink-0" />
                      </button>
                    ))}
                    {upgradeOpportunities.length === 0 && <p className="text-sm text-text-muted">Ainda não há free engajado suficiente para destacar.</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : adminTab === 'affiliates' ? (
        <AdminAffiliatesView />
      ) : adminTab === 'shop' ? (
        <AdminIronShopSettings
          settings={ironShopSettings}
          audit={ironShopAudit}
          loading={ironShopAdminLoading}
          error={ironShopAdminError}
          reason={ironShopReason}
          language={language}
          onReasonChange={setIronShopReason}
          onRefresh={fetchIronShopAdmin}
          onSave={saveIronShopSettings}
        />
      ) : (
        <AdminAffiliatesView />
      )}

      <AnimatePresence>
        {selectedUser && (
          <AdminUserDetailsDrawer
            user={selectedUser}
            status={getAdminUserStatus(selectedUser)}
            workouts={getUserWorkouts(selectedUser.id)}
            nutrition={getUserNutrition(selectedUser.id)}
            posts={getUserPosts(selectedUser.id)}
            conversions={getUserConversions(selectedUser.id)}
            allWorkouts={ALL_WORKOUTS}
            normalizePlan={normalizeAdminPlan}
            formatRegistrationDate={formatUserRegistrationDate}
            latestActivity={getLatestUserActivity(selectedUser)}
            language={language}
            onClose={() => setSelectedUser(null)}
            onManagePlan={() => openPlanManager(selectedUser)}
          />
        )}

        {planUser && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !savingUserPlan && setPlanUser(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-plan-title"
              className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-zinc-950 border border-white/10 border-b-0 sm:border-b rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 sm:p-8"
            >
              <button
                onClick={() => setPlanUser(null)}
                disabled={savingUserPlan}
                aria-label="Fechar"
                className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-text-primary flex items-center justify-center disabled:opacity-40"
              >
                <X size={18} />
              </button>

              <div className="space-y-2 pr-12">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Ajuste administrativo</span>
                <h3 id="admin-plan-title" className="text-2xl font-black uppercase tracking-tight">Gerenciar plano</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {planUser.name || 'Usuário sem nome'} <span className="text-text-muted">({planUser.email})</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-7">
                {(['free', 'Pro', 'Elite'] as const).map(plan => (
                  <button
                    key={plan}
                    onClick={() => setSelectedAdminPlan(plan)}
                    disabled={savingUserPlan}
                    className={`min-h-[48px] rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedAdminPlan === plan ? 'bg-primary border-primary text-text-primary shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-text-muted hover:text-text-primary hover:border-white/20'}`}
                  >
                    {plan === 'free' ? 'Free' : plan}
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] text-text-muted font-black uppercase tracking-widest">Alteração</p>
                  <p className="text-sm font-black mt-1 uppercase">{normalizeAdminPlan(planUser.plano)} → {selectedAdminPlan}</p>
                </div>
                <span className={`px-3 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${selectedAdminPlan === 'free' ? 'bg-white/5 border-white/10 text-text-muted' : 'bg-success/10 border-success/20 text-success'}`}>
                  {selectedAdminPlan === 'free' ? 'Ficará inativa' : 'Ficará ativa'}
                </span>
              </div>

              {(!planUser.age || !planUser.weight || !planUser.height || !planUser.goal) && (
                <div className="mt-4 p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3 text-error">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed"><span className="font-black uppercase">Onboarding pendente.</span> O aviso continuará ativo mesmo após a troca do plano.</p>
                </div>
              )}

              {userPlanError && <p className="mt-4 text-xs font-bold text-error bg-error/10 border border-error/20 rounded-2xl p-4">{userPlanError}</p>}

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={saveUserPlan}
                  disabled={savingUserPlan || normalizeAdminPlan(planUser.plano) === selectedAdminPlan}
                  className="flex-1 min-h-[52px] rounded-2xl bg-primary text-text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingUserPlan ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : 'Confirmar alteração'}
                </button>
                <button
                  onClick={() => setPlanUser(null)}
                  disabled={savingUserPlan}
                  className="flex-1 min-h-[48px] rounded-2xl bg-white/5 border border-white/10 text-text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const IRONSHOP_MODE_OPTIONS: Array<{ mode: IronShopAvailabilityMode; label: string; description: string }> = [
  { mode: 'blocked', label: 'Bloqueada', description: 'Botão visível com cadeado para usuários comuns.' },
  { mode: 'admins', label: 'Administradores', description: 'Somente administradores entram na loja em teste.' },
  { mode: 'testers', label: 'Usuários de teste', description: 'Admin e lista de acesso antecipado podem validar.' },
  { mode: 'group', label: 'Grupo específico', description: 'Preparado para liberar por grupo configurado.' },
  { mode: 'gradual', label: 'Gradual', description: 'Liberação progressiva por percentual.' },
  { mode: 'all', label: 'Todos', description: 'Loja liberada para todos os usuários autenticados.' },
];

function AdminIronShopSettings({
  settings,
  audit,
  loading,
  error,
  reason,
  language,
  onReasonChange,
  onRefresh,
  onSave,
}: {
  settings: IronShopSettings | null;
  audit: IronShopAuditEntry[];
  loading: boolean;
  error: string;
  reason: string;
  language: LanguageCode;
  onReasonChange: (reason: string) => void;
  onRefresh: () => void;
  onSave: (updates: Partial<IronShopSettings>) => Promise<void>;
}) {
  const locale = getLocaleCode(language);

  const formatAuditState = (state?: IronShopSettings) => {
    if (!state) return 'indisponível';
    if (state.ironshop_enabled || state.availability_mode === 'all') return 'Liberada para todos';
    return IRONSHOP_MODE_OPTIONS.find(option => option.mode === state.availability_mode)?.label || state.availability_mode;
  };

  if (loading && !settings) {
    return (
      <div className="bg-surface border border-white/5 rounded-[40px] p-16 flex flex-col items-center justify-center gap-4 text-text-muted">
        <Loader2 className="animate-spin text-primary" size={36} />
        <span className="text-xs font-black uppercase tracking-widest">Carregando disponibilidade da IronShop...</span>
      </div>
    );
  }

  const currentSettings = settings || {
    ironshop_enabled: false,
    availability_mode: 'blocked' as IronShopAvailabilityMode,
    gradual_percentage: 0,
    allowed_group: null,
  };

  return (
    <div className="space-y-6">
      <section className="bg-surface border border-white/5 rounded-[32px] p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Disponibilidade da IronShop</h3>
              <p className="text-xs text-text-muted mt-1">Controle seguro de liberação sem expor dados da loja para quem não tem permissão.</p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-text-primary hover:bg-white/10 transition-all disabled:opacity-60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-3xl p-5 flex items-center gap-3 text-error">
            <AlertTriangle size={20} />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminMetricCard
            icon={currentSettings.ironshop_enabled || currentSettings.availability_mode === 'all' ? <CheckCircle2 size={22} /> : <Lock size={22} />}
            label="Estado público"
            value={currentSettings.ironshop_enabled || currentSettings.availability_mode === 'all' ? 'Liberada' : 'Bloqueada'}
            detail="botão segue visível"
            tone={currentSettings.ironshop_enabled || currentSettings.availability_mode === 'all' ? 'text-success' : 'text-primary'}
          />
          <AdminMetricCard icon={<ShieldCheck size={22} />} label="Modo atual" value={formatAuditState(currentSettings)} detail="controle no servidor" tone="text-primary" />
          <AdminMetricCard icon={<BarChart3 size={22} />} label="Gradual" value={`${currentSettings.gradual_percentage || 0}%`} detail="quando modo gradual estiver ativo" tone="text-primary" />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Motivo da alteração</label>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="Ex.: liberação para validar carrinho em ambiente controlado"
            className="w-full min-h-[86px] bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-text-primary outline-none focus:border-primary transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {IRONSHOP_MODE_OPTIONS.map(option => {
            const selected = currentSettings.availability_mode === option.mode;
            return (
              <button
                key={option.mode}
                onClick={() => onSave({ availability_mode: option.mode, ironshop_enabled: option.mode === 'all' })}
                disabled={loading}
                className={`min-h-[104px] rounded-2xl border p-4 text-left transition-all disabled:opacity-60 ${
                  selected
                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/5 border-white/10 text-text-secondary hover:border-primary/40 hover:bg-white/10'
                }`}
              >
                <span className="block text-xs font-black uppercase tracking-widest">{option.label}</span>
                <span className={`block text-xs mt-2 leading-relaxed ${selected ? 'text-white/80' : 'text-text-muted'}`}>{option.description}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-text-muted">Percentual gradual</label>
            <input
              type="range"
              min="0"
              max="100"
              value={currentSettings.gradual_percentage || 0}
              onChange={(event) => onSave({ gradual_percentage: Number(event.target.value) })}
              disabled={loading}
              className="w-full accent-primary"
            />
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>0%</span>
              <span className="font-black text-primary">{currentSettings.gradual_percentage || 0}%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="rounded-2xl bg-error/10 border border-error/20 p-4 flex flex-col justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-error">Falha crítica</p>
              <p className="text-xs text-text-secondary mt-2 leading-relaxed">Bloqueia novamente a IronShop e mantém somente o botão com aviso público.</p>
            </div>
            <button
              onClick={() => onSave({ availability_mode: 'blocked', ironshop_enabled: false, gradual_percentage: 0 })}
              disabled={loading}
              className="min-h-[44px] rounded-2xl bg-error/15 border border-error/30 text-error text-[10px] font-black uppercase tracking-widest hover:bg-error/20 transition-all disabled:opacity-60"
            >
              Bloquear agora
            </button>
          </div>
        </div>
      </section>

      <section className="bg-surface border border-white/5 rounded-[32px] overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-lg font-black uppercase tracking-tight">Histórico de auditoria</h3>
          <p className="text-xs text-text-muted mt-1">Administrador, data, estado anterior, novo estado e motivo informado.</p>
        </div>
        <div className="divide-y divide-white/5">
          {audit.length === 0 ? (
            <div className="p-8 text-sm text-text-muted">Nenhuma alteração registrada ainda.</div>
          ) : audit.map(entry => (
            <div key={entry.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-black truncate">{entry.admin_email || entry.admin_id || 'Administrador'}</p>
                <p className="text-[10px] text-text-muted font-bold mt-1">
                  {new Date(entry.created_at).toLocaleString(locale)}
                </p>
                {entry.reason && <p className="text-xs text-text-secondary mt-2 leading-relaxed">{entry.reason}</p>}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-muted">
                <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10">{formatAuditState(entry.previous_state)}</span>
                <ChevronRight size={14} />
                <span className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary">{formatAuditState(entry.new_state)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

type AdminUserStatus = {
  label: string;
  detail: string;
  tone: string;
  priority: number;
};

function AdminUserDetailsDrawer({
  user,
  status,
  workouts,
  nutrition,
  posts,
  conversions,
  allWorkouts,
  normalizePlan,
  formatRegistrationDate,
  latestActivity,
  language,
  onClose,
  onManagePlan,
}: {
  user: UserProfile;
  status: AdminUserStatus;
  workouts: WorkoutLog[];
  nutrition: NutritionLog[];
  posts: Post[];
  conversions: AffiliateConversion[];
  allWorkouts: Workout[];
  normalizePlan: (plan?: Plan) => 'free' | 'Pro' | 'Elite' | 'Admin';
  formatRegistrationDate: (value?: string) => string;
  latestActivity: Date | null;
  language: LanguageCode;
  onClose: () => void;
  onManagePlan: () => void;
}) {
  const locale = getLocaleCode(language);
  const dateFnsLocale = getDateFnsLocale(language);
  const completedWorkoutIds = new Set(workouts.map(workout => workout.workoutId).filter(Boolean));
  const workoutTemplates = allWorkouts.filter(workout => completedWorkoutIds.has(workout.id));
  const completedExercises = workoutTemplates.flatMap(workout =>
    workout.exercises.map(exercise => ({
      ...exercise,
      workoutName: workout.name,
      workoutId: workout.id,
    }))
  );
  const totalWorkoutMinutes = workouts.reduce((sum, workout) => sum + Number(workout.duration || 0), 0);
  const latestWorkout = workouts[0];
  const latestNutrition = nutrition[0];
  const latestConversion = conversions[0];
  const hasCompletedOnboarding = Boolean(user.age && user.weight && user.height && user.goal);

  const formatDateTime = (value?: string) => {
    if (!value) return 'Sem data';
    const date = new Date(value);
    if (!isValid(date)) return 'Data inválida';
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' }) + ' às ' + date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const formatShortDate = (value?: string) => {
    if (!value) return 'Sem data';
    const date = new Date(value);
    if (!isValid(date)) return 'Data inválida';
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  };

  const timeline = [
    user.criado_em ? { type: 'Cadastro', label: 'Criou conta', date: user.criado_em, tone: 'text-primary' } : null,
    latestWorkout ? { type: 'Treino', label: `Concluiu ${latestWorkout.workoutName || 'um treino'}`, date: latestWorkout.completedAt, tone: 'text-success' } : null,
    latestNutrition ? { type: 'Nutrição', label: `Registrou ${Number(latestNutrition.calories || 0).toLocaleString(locale)} kcal`, date: latestNutrition.date, tone: 'text-primary' } : null,
    posts[0] ? { type: 'Comunidade', label: 'Publicou na comunidade', date: posts[0].criado_em, tone: 'text-text-secondary' } : null,
    latestConversion ? { type: 'Conversão', label: `${latestConversion.plano} • ${latestConversion.status_pagamento}`, date: latestConversion.created_at, tone: 'text-success' } : null,
  ].filter(Boolean)
    .sort((a, b) => new Date((b as any).date).getTime() - new Date((a as any).date).getTime()) as Array<{ type: string; label: string; date: string; tone: string }>;

  const riskNotes = [
    !hasCompletedOnboarding ? 'Onboarding incompleto: falta algum dado corporal ou objetivo.' : null,
    workouts.length === 0 ? 'Ainda não concluiu nenhum treino.' : null,
    nutrition.length === 0 ? 'Ainda não possui registro de nutrição carregado.' : null,
    normalizePlan(user.plano) === 'free' && (workouts.length >= 2 || nutrition.length >= 2 || Number(user.points || 0) >= 500) ? 'Free com engajamento: bom candidato para oferta ou abordagem.' : null,
    latestActivity ? null : 'Sem atividade recente detectada além do cadastro.',
  ].filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-[115] flex items-end lg:items-stretch justify-center lg:justify-end">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/90 backdrop-blur-md"
      />
      <motion.aside
        initial={{ opacity: 0, y: 44, x: 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 44, x: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-detail-title"
        className="relative w-full lg:w-[620px] max-h-[92vh] lg:max-h-none overflow-y-auto bg-zinc-950 border border-white/10 border-b-0 lg:border-b lg:border-r-0 rounded-t-[32px] lg:rounded-none lg:rounded-l-[32px] shadow-2xl"
      >
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-xl border-b border-white/10 p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">Ficha do usuário</span>
            <h3 id="admin-user-detail-title" className="mt-1 text-2xl sm:text-3xl font-black uppercase tracking-tight truncate">{user.name || 'Usuário sem nome'}</h3>
            <p className="text-xs text-text-muted font-bold truncate">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar detalhes do usuário"
            className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 text-text-muted hover:text-text-primary flex items-center justify-center shrink-0 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <AdminDetailStat label="Plano" value={normalizePlan(user.plano) === 'free' ? 'Free' : normalizePlan(user.plano)} />
            <AdminDetailStat label="Status" value={status.label} tone={status.tone} />
            <AdminDetailStat label="Treinos" value={workouts.length.toString()} />
            <AdminDetailStat label="Nutrição" value={nutrition.length.toString()} />
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest">Resumo comportamental</h4>
                <p className="text-xs text-text-muted mt-1">{status.detail}</p>
              </div>
              {user.role !== 'admin' && normalizePlan(user.plano) !== 'Admin' && (
                <button
                  onClick={onManagePlan}
                  className="min-h-[42px] px-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={14} /> Gerenciar plano
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <AdminDetailLine label="Cadastro" value={formatRegistrationDate(user.criado_em)} />
              <AdminDetailLine label="Última atividade" value={latestActivity ? formatDistanceToNow(latestActivity, { addSuffix: true, locale: dateFnsLocale }) : 'Não detectada'} />
              <AdminDetailLine label="Objetivo" value={user.goal || 'Não informado'} />
              <AdminDetailLine label="Corpo" value={hasCompletedOnboarding ? `${user.weight}kg • ${user.height}cm • ${user.age} anos` : 'Dados incompletos'} />
              <AdminDetailLine label="Pontos / streak" value={`${Number(user.points || 0)} pts • ${Number(user.streak || 0)} dias`} />
              <AdminDetailLine label="Assinatura" value={user.subscriptionStatus || 'inactive'} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <AdminDetailStat label="Tempo treinando" value={`${totalWorkoutMinutes} min`} />
            <AdminDetailStat label="Posts" value={posts.length.toString()} />
            <AdminDetailStat label="Conversões" value={conversions.length.toString()} />
          </div>

          <section className="bg-white/[0.03] border border-white/10 rounded-[28px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={riskNotes.length ? 'text-primary' : 'text-success'} size={20} />
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest">O que monitorar</h4>
                <p className="text-xs text-text-muted">Sinais práticos para suporte, retenção e upgrade.</p>
              </div>
            </div>
            <div className="space-y-2">
              {riskNotes.length > 0 ? riskNotes.map(note => (
                <div key={note} className="flex items-start gap-2 text-xs text-text-secondary bg-white/5 rounded-2xl px-4 py-3">
                  <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              )) : (
                <p className="text-sm text-text-muted">Usuário sem alerta crítico nos dados carregados.</p>
              )}
            </div>
          </section>

          <section className="bg-white/[0.03] border border-white/10 rounded-[28px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Dumbbell className="text-primary" size={20} />
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest">Treinos e exercícios</h4>
                <p className="text-xs text-text-muted">Conclusões registradas e exercícios dos treinos feitos.</p>
              </div>
            </div>
            {workouts.length > 0 ? (
              <div className="space-y-3">
                {workouts.slice(0, 5).map(workout => (
                  <div key={workout.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-black truncate">{workout.workoutName || 'Treino sem nome'}</div>
                        <div className="text-[10px] text-text-muted font-bold">{formatDateTime(workout.completedAt)}</div>
                      </div>
                      <span className="text-xs font-black text-primary shrink-0">{Number(workout.duration || 0)} min</span>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  {completedExercises.slice(0, 12).map(exercise => (
                    <span key={`${exercise.workoutId}-${exercise.id}`} className="px-3 py-2 bg-primary/10 border border-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest">
                      {exercise.name}
                    </span>
                  ))}
                  {completedExercises.length > 12 && (
                    <span className="px-3 py-2 bg-white/5 border border-white/10 text-text-muted rounded-xl text-[10px] font-black uppercase tracking-widest">
                      +{completedExercises.length - 12} exercícios
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">Nenhum treino concluído encontrado nos registros carregados.</p>
            )}
          </section>

          <section className="bg-white/[0.03] border border-white/10 rounded-[28px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Apple className="text-primary" size={20} />
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest">Nutrição</h4>
                <p className="text-xs text-text-muted">Últimos registros nutricionais carregados.</p>
              </div>
            </div>
            {nutrition.length > 0 ? (
              <div className="space-y-3">
                {nutrition.slice(0, 4).map(item => (
                  <div key={item.id} className="grid grid-cols-4 gap-2 bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                    <AdminMacro label={formatShortDate(item.date)} value={`${Number(item.calories || 0).toLocaleString(locale)}`} />
                    <AdminMacro label="Prot." value={`${Number(item.protein || 0)}g`} />
                    <AdminMacro label="Carb." value={`${Number(item.carbs || 0)}g`} />
                    <AdminMacro label="Gord." value={`${Number(item.fat || 0)}g`} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Nenhum registro de nutrição encontrado nos dados carregados.</p>
            )}
          </section>

          <section className="bg-white/[0.03] border border-white/10 rounded-[28px] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Activity className="text-primary" size={20} />
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest">Linha do tempo</h4>
                <p className="text-xs text-text-muted">Principais sinais da jornada desse usuário.</p>
              </div>
            </div>
            {timeline.length > 0 ? (
              <div className="space-y-3">
                {timeline.map(item => (
                  <div key={`${item.type}-${item.date}`} className="flex items-start gap-3">
                    <div className="mt-1 w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0">
                      <div className={`text-[10px] font-black uppercase tracking-widest ${item.tone}`}>{item.type}</div>
                      <div className="text-sm font-bold text-text-secondary">{item.label}</div>
                      <div className="text-[10px] text-text-muted">{formatDateTime(item.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Nenhum evento encontrado para montar a jornada.</p>
            )}
          </section>
        </div>
      </motion.aside>
    </div>
  );
}

function AdminDetailStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`bg-white/[0.03] border border-white/10 rounded-2xl p-4 min-w-0 ${tone || ''}`}>
      <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</div>
      <div className="mt-2 text-lg font-black truncate">{value}</div>
    </div>
  );
}

function AdminDetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-2xl px-4 py-3 min-w-0">
      <div className="text-[9px] font-black uppercase tracking-widest text-text-muted">{label}</div>
      <div className="mt-1 text-xs font-bold text-text-secondary break-words">{value}</div>
    </div>
  );
}

function AdminMacro({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-black uppercase tracking-widest text-text-muted truncate">{label}</div>
      <div className="mt-1 text-sm font-black truncate">{value}</div>
    </div>
  );
}

function AdminMetricCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return (
    <div className="bg-surface p-5 sm:p-6 rounded-3xl border border-white/5 space-y-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-text-muted text-[10px] sm:text-xs font-black uppercase tracking-widest">{label}</h3>
        <div className={`p-2 rounded-xl bg-white/5 ${tone}`}>{icon}</div>
      </div>
      <div className="text-2xl sm:text-3xl font-black tracking-tight break-words leading-tight">{value}</div>
      <div className={`text-xs font-bold ${tone}`}>{detail}</div>
    </div>
  );
}

function MiniAdminStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 sm:p-4 text-center min-w-0">
      <div className="text-xl sm:text-2xl font-black">{value}</div>
      <div className="text-[9px] text-text-muted font-black uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function IAAdaptativaView({ profile, language, onUpgrade, isAdmin = false }: { profile: UserProfile; language: LanguageCode; onUpgrade: () => void; isAdmin?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/20 to-transparent p-6 rounded-[40px] border border-primary/20 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
          <Zap className="text-text-primary" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">IA Adaptativa</h2>
          <p className="text-text-secondary text-sm">Seu personal trainer inteligente, disponível 24h.</p>
        </div>
      </div>

      <div className="bg-surface rounded-[40px] border border-white/5 p-6 h-[600px] flex flex-col">
        <AIChat profile={profile} language={language} onUpgrade={onUpgrade} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

type LoadSet = { reps: number; weight: number };
type LoadSession = { date: string; sets: LoadSet[] };
type LoadData = Record<string, LoadSession[]>;

function LoadTrackerView({ userId, language }: { userId: string; language: LanguageCode }) {
  const locale = getLocaleCode(language);
  const storageKey = `load_tracker_${userId}`;
  const todayKey = new Date().toISOString().split('T')[0];

  const readData = (): LoadData => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  };

  const allExercisesWithGroup = [...new Map(
    ALL_WORKOUTS.flatMap(w => w.exercises.map((e: Exercise) => [e.name, e.muscleGroup] as [string, string]))
  ).entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const [data, setData] = useState<LoadData>(readData);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sets, setSets] = useState<{ reps: string; weight: string }[]>([{ reps: '', weight: '' }]);
  const [saved, setSaved] = useState(false);

  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const filteredExercises = allExercisesWithGroup
    .filter(([name, group]) => {
      const q = norm(searchQuery);
      return norm(name).includes(q) || norm(group).includes(q);
    })
    .map(([name]) => name);

  const maxWeight = (s: LoadSession) => Math.max(...s.sets.map(x => x.weight));

  // All exercises logged today (accumulated session)
  const todayEntries = Object.entries(data)
    .map(([name, sessions]) => ({ name, session: sessions.find(s => s.date === todayKey) }))
    .filter((e): e is { name: string; session: LoadSession } => !!e.session);

  // History for selected exercise (excluding today, last 5)
  const history: LoadSession[] = selectedExercise
    ? [...(data[selectedExercise] || [])].filter(s => s.date !== todayKey).reverse().slice(0, 5)
    : [];

  const lastSession = [...(data[selectedExercise] || [])].filter(s => s.date !== todayKey).slice(-1)[0];

  const progressDiff = (() => {
    const sessions = (data[selectedExercise] || []).filter(s => s.date !== todayKey);
    if (sessions.length < 2) return null;
    return maxWeight(sessions[sessions.length - 1]) - maxWeight(sessions[sessions.length - 2]);
  })();

  const addSet = () => setSets(prev => [...prev, { reps: '', weight: '' }]);
  const removeSet = (i: number) => setSets(prev => prev.filter((_, idx) => idx !== i));
  const updateSet = (i: number, field: 'reps' | 'weight', value: string) =>
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const saveSession = () => {
    if (!selectedExercise) return;
    const validSets = sets
      .filter(s => s.reps && s.weight)
      .map(s => ({ reps: parseInt(s.reps), weight: parseFloat(s.weight) }));
    if (validSets.length === 0) return;

    const newData = { ...data };
    const sessions = [...(newData[selectedExercise] || [])];
    const todayIdx = sessions.findIndex(s => s.date === todayKey);
    if (todayIdx >= 0) sessions[todayIdx] = { date: todayKey, sets: validSets };
    else sessions.push({ date: todayKey, sets: validSets });
    newData[selectedExercise] = sessions;

    setData(newData);
    try { localStorage.setItem(storageKey, JSON.stringify(newData)); } catch { /* ignore */ }
    setSaved(true);
    // Reset for next exercise
    setTimeout(() => {
      setSaved(false);
      setSets([{ reps: '', weight: '' }]);
      setSelectedExercise('');
      setSearchQuery('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary/20 to-transparent p-6 rounded-[40px] border border-primary/20 flex items-center gap-4">
        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
          <BarChart3 className="text-text-primary" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Registro de Cargas</h2>
          <p className="text-text-secondary text-sm">Registre seus pesos e acompanhe sua evolução.</p>
        </div>
      </div>

      {/* Exercise selector */}
      <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Exercício</span>
        <input
          type="text"
          placeholder="Buscar exercício..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
        />
        {searchQuery && (
          <div className="max-h-48 overflow-y-auto space-y-1 border border-white/5 rounded-2xl p-2">
            {filteredExercises.length === 0 ? (
              <p className="text-[10px] text-text-muted font-bold px-3 py-2">Nenhum exercício encontrado</p>
            ) : filteredExercises.map(ex => (
              <button
                key={ex}
                onClick={() => { setSelectedExercise(ex); setSearchQuery(''); setSets([{ reps: '', weight: '' }]); setSaved(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedExercise === ex ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-text-secondary'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        {selectedExercise && !searchQuery && (
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-black">{selectedExercise}</span>
            {progressDiff !== null && (
              <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${progressDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                <TrendingUp size={12} />
                {progressDiff >= 0 ? '+' : ''}{progressDiff}kg vs sessão anterior
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sets input */}
      {selectedExercise && (
        <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Séries — {selectedExercise}</span>
            {lastSession && (
              <span className="text-[10px] text-text-muted font-bold">
                Anterior: {lastSession.sets.length}x · Máx {maxWeight(lastSession)}kg
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 px-1">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest text-center">#</span>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Reps</span>
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Peso (kg)</span>
              <span />
            </div>
            {sets.map((set, i) => (
              <div key={i} className="grid grid-cols-[28px_1fr_1fr_32px] gap-2 items-center">
                <span className="text-[10px] font-black text-text-muted text-center">{i + 1}</span>
                <input
                  type="number"
                  placeholder="12"
                  value={set.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value)}
                  className="bg-background border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-primary outline-none transition-all"
                />
                <input
                  type="number"
                  placeholder="20.0"
                  step="0.5"
                  value={set.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value)}
                  className="bg-background border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold focus:border-primary outline-none transition-all"
                />
                <button
                  onClick={() => removeSet(i)}
                  disabled={sets.length === 1}
                  className="p-1.5 text-text-muted hover:text-red-400 transition-colors disabled:opacity-30"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addSet}
            className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-muted hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <Plus size={12} /> Adicionar Série
          </button>

          <button
            onClick={saveSession}
            className="w-full py-3 bg-primary text-text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {saved ? <><Check size={14} /> Salvo! Próximo exercício...</> : <><BarChart3 size={14} /> Salvar e Adicionar Próximo</>}
          </button>
        </div>
      )}

      {/* Today's accumulated session */}
      {todayEntries.length > 0 && (
        <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Sessão de Hoje</span>
            <span className="text-[10px] font-black text-primary">{todayEntries.length} exercício{todayEntries.length > 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/15"
              >
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{entry.name}</div>
                  <div className="text-sm font-black">
                    {entry.session.sets.map(s => `${s.reps}x${s.weight}kg`).join(' · ')}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-[9px] font-black text-text-muted uppercase tracking-widest">Máx</div>
                  <div className="text-primary font-black text-xl leading-none mt-0.5">{maxWeight(entry.session)}kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History for selected exercise */}
      {history.length > 0 && selectedExercise && (
        <div className="bg-surface rounded-[32px] border border-white/5 p-6 space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Histórico — {selectedExercise}</span>
          <div className="space-y-2">
            {history.map((session, i) => (
              <div
                key={session.date}
                className={`flex items-center justify-between p-4 rounded-2xl border ${i === 0 ? 'bg-white/5 border-white/10' : 'bg-white/[0.03] border-white/5'}`}
              >
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {new Date(session.date + 'T12:00:00').toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="text-sm font-black mt-1">
                    {session.sets.map(s => `${s.reps}x${s.weight}kg`).join(' · ')}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-[9px] font-black text-text-muted uppercase tracking-widest">Máx</div>
                  <div className="text-primary font-black text-xl leading-none mt-0.5">{maxWeight(session)}kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutHistoryView({ userUid, language }: { userUid: string; language: LanguageCode }) {
  const locale = getLocaleCode(language);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userUid) { setLoading(false); return; }
    dataService.getWorkoutLogs(userUid)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userUid]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black uppercase tracking-tight">Histórico de Treinos</h2>
      {loading ? (
        <div className="text-text-muted text-sm">Carregando...</div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-text-muted">
            <Calendar size={32} />
          </div>
          <p className="text-xl font-bold">Nenhum treino concluído ainda</p>
          <p className="text-text-muted text-sm">Complete um treino para ele aparecer aqui.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const date = new Date(item.completedAt).toLocaleDateString(locale);
            return (
              <div key={item.id} className="bg-surface p-6 rounded-3xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-text-muted">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="font-bold">{item.workoutName}</p>
                    <p className="text-xs text-text-muted">{date} • {item.duration} min</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">
                  +100 pts
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GlobalRankingView({ language: _language }: { language: LanguageCode }) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, points, streak')
      .gt('points', 0)
      .order('points', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data) {
          setRanking(data.map((p: any) => ({ uid: p.id, name: p.name, points: p.points, streak: p.streak })));
        }
      })
      .then(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tight">Ranking Global</h2>
        <div className="text-xs text-text-muted font-bold uppercase tracking-widest">Atualizado em tempo real</div>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm">Carregando...</div>
      ) : ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-text-muted">
            <Trophy size={32} />
          </div>
          <p className="text-xl font-bold">Ranking vazio por enquanto</p>
          <p className="text-text-muted text-sm">Complete treinos para aparecer no ranking!</p>
        </div>
      ) : (
        <div className="bg-surface rounded-[40px] border border-white/5 overflow-hidden">
          {ranking.map((entry, index) => (
            <div key={entry.uid} className={`p-6 flex items-center justify-between border-b border-white/5 last:border-0 ${index === 0 ? 'bg-primary/5' : ''}`}>
              <div className="flex items-center gap-6">
                <span className={`w-8 text-center font-black text-xl ${index === 0 ? 'text-primary' : 'text-text-muted'}`}>
                  #{index + 1}
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-lg">
                    {entry.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-bold">{entry.name}</p>
                    <p className="text-xs text-text-muted">{entry.streak} dias de sequência</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-primary">{entry.points}</p>
                <p className="text-[10px] text-text-muted uppercase font-black">Pontos</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AthleteSpreadsheetView({ language: _language, onSelectWorkout }: { language: LanguageCode; onSelectWorkout: (w: Workout) => void }) {
  const [selectedPlan, setSelectedPlan] = useState<'Iniciante' | 'Pro' | 'Elite'>('Elite');

  const schedules: Record<'Iniciante' | 'Pro' | 'Elite', WeeklySchedule[]> = {
    Iniciante: [
      { day: 'Segunda', workoutId: 'peito-iniciante-1', workoutName: 'Peito Básico', muscleGroup: 'Peito' },
      { day: 'Terça', workoutId: 'costas-iniciante-1', workoutName: 'Costas e Postura', muscleGroup: 'Costas' },
      { day: 'Quarta', workoutId: 'pernas-iniciante-1', workoutName: 'Pernas Base', muscleGroup: 'Pernas' },
      { day: 'Quinta', workoutId: 'ombros-iniciante-1', workoutName: 'Ombros Definidos', muscleGroup: 'Ombros' },
      { day: 'Sexta', workoutId: 'fullbody-iniciante-1', workoutName: 'Full Body Iniciante', muscleGroup: 'Full Body' },
    ],
    Pro: [
      { day: 'Segunda', workoutId: 'peito-intermediario-1', workoutName: 'Peito Explosivo', muscleGroup: 'Peito' },
      { day: 'Terça', workoutId: 'costas-pro-1', workoutName: 'Costas Pro', muscleGroup: 'Costas' },
      { day: 'Quarta', workoutId: 'pernas-pro-1', workoutName: 'Leg Day Pro', muscleGroup: 'Pernas' },
      { day: 'Quinta', workoutId: 'ombros-pro-1', workoutName: 'Ombros Pro', muscleGroup: 'Ombros' },
      { day: 'Sexta', workoutId: 'bracos-iniciante-1', workoutName: 'Bíceps e Tríceps', muscleGroup: 'Braços' },
    ],
    Elite: [
      { day: 'Segunda', workoutId: 'elite-peito-1', workoutName: 'Protocolo Peito Elite', muscleGroup: 'Peito' },
      { day: 'Terça', workoutId: 'elite-costas-1', workoutName: 'Dorsal de Ferro', muscleGroup: 'Costas' },
      { day: 'Quarta', workoutId: 'elite-pernas-1', workoutName: 'Leg Day Elite', muscleGroup: 'Pernas' },
      { day: 'Quinta', workoutId: 'elite-ombros-1', workoutName: 'Ombros 3D', muscleGroup: 'Ombros' },
      { day: 'Sexta', workoutId: 'elite-full-1', workoutName: 'Full Body Atleta', muscleGroup: 'Full Body' },
    ],
  };

  const planLabels: Record<'Iniciante' | 'Pro' | 'Elite', string> = {
    Iniciante: 'FREE',
    Pro: 'PRO',
    Elite: 'ELITE',
  };

  const schedule = schedules[selectedPlan];

  const handleDayClick = (workoutId: string) => {
    const workout = ALL_WORKOUTS.find(w => w.id === workoutId);
    if (workout) onSelectWorkout(workout);
  };

  return (
    <div className="space-y-8">
      <div className="bg-surface p-8 rounded-[40px] border border-white/5 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-black uppercase tracking-tight">Planilha Semanal</h2>
          <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
            {(['Iniciante', 'Pro', 'Elite'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPlan(p)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  selectedPlan === p
                    ? 'bg-primary border-primary text-text-primary shadow-lg shadow-primary/20'
                    : 'bg-transparent border-transparent text-text-muted hover:text-text-secondary'
                }`}
              >
                {planLabels[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {schedule.map((item) => (
            <div
              key={item.day}
              onClick={() => handleDayClick(item.workoutId)}
              className="group p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-white/10 hover:border-primary/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-8">
                <span className="w-24 text-sm font-black uppercase tracking-widest text-text-muted group-hover:text-primary transition-colors">
                  {item.day}
                </span>
                <div>
                  <p className="font-bold text-lg">{item.workoutName}</p>
                  <p className="text-xs text-text-muted uppercase font-black">{item.muscleGroup}</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-text-muted group-hover:text-primary transition-all group-hover:translate-x-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EarlyAccessView({ language: _language, onSelectWorkout: _onSelectWorkout }: { language: LanguageCode; onSelectWorkout: (w: Workout) => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">Acesso Antecipado</h2>
        <span className="flex items-center gap-1 px-3 py-1 bg-flame/20 text-flame text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
          <Flame size={12} />
          Em Breve
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-surface rounded-[40px] border border-white/5">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <Flame size={28} className="text-text-muted" />
        </div>
        <p className="text-text-primary font-bold">Novos protocolos chegando em breve</p>
        <p className="text-text-muted text-sm max-w-xs">Os treinos exclusivos de acesso antecipado serão disponibilizados aqui em breve.</p>
      </div>
    </div>
  );
}

function PricingView({
  onBack,
  onUpgrade,
  currentPlan,
  initialCheckoutPlan,
}: {
  onBack: () => void,
  onUpgrade: (plan: Plan) => Promise<void>,
  currentPlan: Plan,
  initialCheckoutPlan?: Plan | null,
}) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoCheckoutStarted, setAutoCheckoutStarted] = useState(false);
  const hasReferral = !!localStorage.getItem('affiliate_ref');

  useEffect(() => {
    trackEvent('view_pricing', {
      current_plan: currentPlan,
      initial_checkout_plan: initialCheckoutPlan || 'none',
    });
  }, [currentPlan, initialCheckoutPlan]);

  const plans = [
    {
      id: 'Iniciante' as Plan,
      name: 'Iniciante',
      eyebrow: 'Comece sem pagar',
      price: 'GRÁTIS',
      period: '',
      priceDetail: 'para sempre',
      description: 'Crie sua base, organize a rotina e prove o método IronShape.',
      features: [
        'Protocolos iniciais para casa, academia ou híbrido',
        'Planejamento semanal com até 3 treinos',
        'Calculadora e acompanhamento diário de macros',
        '3 análises de refeições com IA por dia',
        'Progresso corporal, pontos e comunidade',
        'Programa de afiliados'
      ],
      color: 'bg-white/5',
      buttonText: currentPlan === 'Iniciante' ? 'Plano Atual' : 'Começar Grátis'
    },
    {
      id: 'Pro' as Plan,
      name: 'Pro',
      eyebrow: 'Melhor custo-benefício',
      price: hasReferral ? 'R$ 17,91' : 'R$ 19,90',
      originalPrice: hasReferral ? 'R$ 19,90' : null,
      period: '/mês',
      priceDetail: hasReferral ? 'menos de R$ 0,60 por dia' : 'menos de R$ 0,67 por dia',
      description: 'Evolução contínua com IA, nutrição precisa e protocolos completos.',
      features: [
        'Tudo do plano Grátis',
        'Protocolos Pro para casa e academia',
        'Iron Coach IA 24h para adaptar seu treino',
        'Planejamento semanal com até 5 treinos',
        'Análises nutricionais ilimitadas por g/ml',
        'Registro de cargas e histórico completo',
        'Ranking global e evolução contínua'
      ],
      color: 'bg-primary/10 border-primary/30',
      highlight: true,
      buttonText: currentPlan === 'Pro' ? 'Plano Atual' : 'Quero Evoluir com o Pro'
    },
    {
      id: 'Elite' as Plan,
      name: 'Elite',
      eyebrow: 'Experiência completa',
      price: hasReferral ? 'R$ 26,91' : 'R$ 29,90',
      originalPrice: hasReferral ? 'R$ 29,90' : null,
      period: '/mês',
      priceDetail: hasReferral ? 'menos de R$ 0,90 por dia' : 'menos de R$ 1 por dia',
      description: 'Máximo controle para quem quer treinar sem limites e ir além.',
      features: [
        'Tudo do Pro',
        'Protocolos Elite avançados e de competição',
        'Rotina completa com até 7 treinos por semana',
        'Planilha do Atleta para organizar sua semana',
        'Edição e personalização de treinos',
        'Mobilidade e alongamento em nível avançado',
        'Acesso antecipado aos novos protocolos'
      ],
      color: 'bg-white/5',
      buttonText: currentPlan === 'Elite' ? 'Plano Atual' : 'Quero a Experiência Completa'
    }
  ];

  const handleUpgrade = async (plan: Plan) => {
    trackPlanEvent('select_plan', plan, {
      current_plan: currentPlan,
      has_referral: hasReferral,
    });

    if (plan === 'Elite' || plan === 'Pro') {
      setIsProcessing(true);
      try {
        if (user?.id) localStorage.setItem(`pending_checkout_plan_${user.id}`, plan);
        const analyticsClientId = await getAnalyticsClientId();
        trackPlanEvent('begin_checkout', plan, {
          current_plan: currentPlan,
          has_referral: hasReferral,
        });
        const res = await fetch('/api/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            customerEmail: user?.email,
            userId: user?.id,
            referralCode: localStorage.getItem('affiliate_ref') || null,
            analyticsClientId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Erro ao iniciar pagamento.');
        trackPlanEvent('checkout_redirect', plan, {
          provider: data.provider || 'abacatepay',
          mode: data.mode || 'unknown',
        });
        window.location.href = data.url;
      } catch (e: any) {
        alert(e.message || 'Erro ao iniciar pagamento. Tente novamente.');
        setIsProcessing(false);
      }
      return;
    }
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
  };

  useEffect(() => {
    if (!initialCheckoutPlan || autoCheckoutStarted || initialCheckoutPlan === currentPlan) return;
    setAutoCheckoutStarted(true);
    handleUpgrade(initialCheckoutPlan);
  }, [initialCheckoutPlan, autoCheckoutStarted, currentPlan]);

  const confirmUpgrade = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    
    // Simular processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Record affiliate conversion if applicable
    const ref = localStorage.getItem('affiliate_ref');
    if (ref && selectedPlan !== 'Iniciante' && user) {
      try {
        const { data: aff } = await supabase
          .from('affiliates')
          .select('id')
          .eq('codigo_afiliado', ref)
          .single();
        
        if (aff) {
          const valorOriginal = selectedPlan === 'Pro' ? 19.90 : 29.90;
          const valorComDesconto = valorOriginal * 0.9;
          const comissao = valorOriginal * 0.35; // 35% do valor original conforme solicitado
          
          await supabase.from('affiliate_conversions').insert([{
            affiliate_id: aff.id,
            user_id: user.id,
            plano: selectedPlan,
            valor_assinatura: valorComDesconto,
            valor_comissao: comissao,
            status_pagamento: 'pendente'
          }]);
        }
      } catch (e) {
        console.error('Error recording conversion:', e);
      }
    }

    await onUpgrade(selectedPlan);
    setIsProcessing(false);
    setSelectedPlan(null);
    onBack();
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors mx-auto mb-8"
          >
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </button>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.22em]">
            <Zap size={14} /> Um plano para cada fase da sua evolução
          </div>
          <h1 className="text-3xl md:text-6xl font-black tracking-tighter uppercase">Escolha como você quer evoluir</h1>
          {hasReferral && (
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-green-500/20">
              <Check size={14} /> Desconto de 10% Aplicado via Indicação
            </div>
          )}
          <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto">
            {initialCheckoutPlan && initialCheckoutPlan !== 'Iniciante'
              ? `Estamos preparando o checkout do plano ${initialCheckoutPlan}. O acesso premium só libera após o pagamento aprovado.`
              : 'Comece grátis ou acelere seus resultados com IA, nutrição precisa e protocolos que acompanham o seu nível.'}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              className={`relative p-7 lg:p-9 rounded-[32px] md:rounded-[40px] border flex flex-col justify-between gap-8 transition-all duration-500 ${
                plan.highlight 
                  ? 'bg-surface border-primary shadow-2xl shadow-primary/20' 
                  : 'bg-surface/40 border-white/5 hover:border-white/10'
              }`}
            >
              {plan.highlight && <div className="absolute inset-x-0 top-0 h-1 bg-primary" />}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-text-primary text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/30">
                  Mais escolhido
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-3">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${plan.highlight ? 'text-primary' : 'text-text-muted'}`}>
                    {plan.eyebrow}
                  </span>
                  <h3 className="text-2xl font-black uppercase tracking-tight">{plan.name}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed min-h-[44px]">{plan.description}</p>
                </div>

                <div className="space-y-2 pb-2 border-b border-white/5">
                  {plan.originalPrice && (
                    <span className="text-sm text-text-muted line-through font-bold">{plan.originalPrice}</span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-text-muted font-bold">{plan.period}</span>
                  </div>
                  <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">{plan.priceDetail}</p>
                </div>

                <div className="space-y-4 pt-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className={`${i === 0 && plan.id !== 'Iniciante' ? 'text-text-primary font-bold' : 'text-text-secondary'} leading-relaxed`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isProcessing || ((plan.id !== 'Elite' && plan.id !== 'Pro') && currentPlan === plan.id)}
                className={`w-full min-h-[58px] px-4 py-4 rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-wider transition-all active:scale-95 ${
                  plan.buttonText === 'Plano Atual'
                    ? 'bg-white text-black border border-white cursor-default'
                    : plan.highlight
                    ? 'bg-primary text-text-primary shadow-xl shadow-primary/20 hover:bg-primary-hover'
                    : 'bg-white/5 text-text-primary border border-white/10 hover:bg-white/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing && (plan.id === 'Elite' || plan.id === 'Pro') ? 'REDIRECIONANDO...' : plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-text-muted text-xs font-bold">
          <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-success" /> Pagamento seguro</span>
          <span className="flex items-center gap-2"><Check size={15} className="text-success" /> Acesso liberado após aprovação</span>
          <span className="flex items-center gap-2"><RefreshCw size={15} className="text-success" /> Cancele quando quiser</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setSelectedPlan(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface rounded-[40px] border border-white/10 p-10 shadow-2xl space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto border border-primary/20">
                  <ShieldCheck className="text-primary" size={40} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Confirmar Assinatura</h3>
                <p className="text-text-secondary">
                  Você está prestes a assinar o plano <span className="text-text-primary font-black">{selectedPlan.toUpperCase()}</span>.
                </p>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Plano Selecionado</span>
                  <span className="font-bold">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Valor Mensal</span>
                  <span className="font-bold text-primary">
                    {selectedPlan === 'Iniciante' ? 'GRÁTIS' : 
                     selectedPlan === 'Pro' ? (hasReferral ? 'R$ 17,91' : 'R$ 19,90') :
                     (hasReferral ? 'R$ 26,91' : 'R$ 29,90')}
                  </span>
                </div>
                {hasReferral && selectedPlan !== 'Iniciante' && (
                  <div className="flex justify-between text-xs text-green-500 font-bold">
                    <span>Desconto de Indicação</span>
                    <span>-10%</span>
                  </div>
                )}
                <div className="h-px bg-white/5" />
                <div className="flex justify-between font-black">
                  <span>Total Hoje</span>
                  <span className="text-xl">
                    {selectedPlan === 'Iniciante' ? 'GRÁTIS' : 
                     selectedPlan === 'Pro' ? (hasReferral ? 'R$ 17,91' : 'R$ 19,90') :
                     (hasReferral ? 'R$ 26,91' : 'R$ 29,90')}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={confirmUpgrade}
                  disabled={isProcessing}
                  className="w-full py-5 bg-primary text-text-primary rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary-hover transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-text-primary/30 border-t-text-primary rounded-full animate-spin" />
                      PROCESSANDO...
                    </>
                  ) : (
                    <>
                      CONFIRMAR PAGAMENTO
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
                <button
                  onClick={() => setSelectedPlan(null)}
                  disabled={isProcessing}
                  className="w-full py-4 text-text-muted font-bold text-sm hover:text-text-primary transition-colors disabled:opacity-30"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
