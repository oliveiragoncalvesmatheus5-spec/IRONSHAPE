import { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import { withTimeout } from './lib/utils';
import { UserProfile, NutritionPreferences, NutritionLog, Workout, WorkoutLog, ProgressLog, Post, Plan, Level, MuscleGroup, Exercise, RankingEntry, WeeklySchedule, Affiliate, AffiliateStatus, AffiliateConversion } from './types';
import { ALL_WORKOUTS } from './data/workouts';
import { dataService } from './services/dataService';
import { searchExercisesByName } from './services/workoutxApi';
import { getLocalExerciseMedia, translateExerciseName } from './utils/exerciseTranslations';
import AIChat from './AIChat';
import { DashboardMetricCard } from './components/dashboardCards';
import { LoadingScreen, ViewErrorBoundary } from './components/feedback';
import { MobileNavItem, NavItem } from './components/navigation';
import { PlanSimulator } from './components/PlanSimulator';
import { PHYSICAL_LIMITATION_OPTIONS } from './data/physicalLimitations';
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
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
      'Execute o movimento com controle, sem prender a respiração.',
      hasLimitation ? `Respeite a limitação marcada: ${limitation}. Pare se sentir dor.` : 'Mantenha postura firme e amplitude confortável.',
    ],
    proTips: [
      hasLimitation
        ? 'Priorize controle e conforto articular antes de aumentar repetições.'
        : 'Quando completar todas as séries com facilidade, aumente repetições ou tempo sob tensão.',
    ],
    commonErrors: [
      'Apressar o movimento e perder alinhamento do corpo.',
    ],
  };
}

function buildHomeWorkouts(
  profile: UserProfile,
  onboarding: any,
  plan: Plan,
  level: Level
): Workout[] {
  const goal = String(profile.goal || '').toLowerCase();
  const equipment = Array.isArray(onboarding?.homeEquipment) ? onboarding.homeEquipment : [];
  const hasDumbbells = equipment.includes('Halteres');
  const hasElastic = equipment.includes('Elástico');
  const hasBar = equipment.includes('Barra fixa');
  const hasBench = equipment.includes('Banco/cadeira');
  const limitation = onboarding?.limitations || 'Nenhuma';
  const hasLimitation = limitation !== 'Nenhuma';
  const series = level === 'Avançado' ? 4 : level === 'Intermediário' ? 3 : 2;
  const duration = level === 'Avançado' ? '45 min' : level === 'Intermediário' ? '35 min' : '25 min';
  const carga: Workout['carga'] = level === 'Avançado' ? 'Alta' : level === 'Intermediário' ? 'Média' : 'Baixa';
  const reps = goal.includes('emagrec') || goal.includes('condicion') ? '12-18 reps' : goal.includes('força') ? '6-10 reps' : '10-15 reps';
  const rest = goal.includes('emagrec') || goal.includes('condicion') ? '30s' : '60s';
  const planRequired = plan === 'free' ? 'Iniciante' : plan;

  const mobilityFirst = hasLimitation
    ? buildExercise('home-mobility-safe', 'Mobilidade leve sem dor', 'Full Body', 2, '6-8 movimentos', '30s', 'Preparação articular para treinar em casa com segurança.', limitation)
    : buildExercise('home-mobility', 'Mobilidade dinâmica', 'Full Body', 2, '8-10 movimentos', '30s', 'Ativa quadril, tornozelo, coluna torácica e ombros antes do treino.', limitation);

  const library: Record<MuscleGroup, Exercise[]> = {
    'Peito': [
      buildExercise('home-pushup-incline', hasBench ? 'Flexão inclinada no banco/cadeira' : 'Flexão inclinada na parede', 'Peito', series, reps, rest, 'Variação de flexão ajustável para peito, tríceps e core.', limitation),
      buildExercise('home-pushup-control', hasLimitation ? 'Flexão parcial controlada' : 'Flexão tradicional controlada', 'Peito', series, reps, rest, 'Movimento base para ganhar força de empurrar sem máquinas.', limitation),
      buildExercise('home-chest-squeeze', hasDumbbells ? 'Supino no chão com halteres' : 'Pressão isométrica de palmas', 'Peito', series, '10-14 reps', rest, 'Estimula peitoral com baixa necessidade de equipamento.', limitation),
    ],
    'Costas': [
      buildExercise('home-row', hasElastic ? 'Remada com elástico' : hasDumbbells ? 'Remada unilateral com halter' : 'Remada isométrica com toalha', 'Costas', series, reps, rest, 'Fortalece dorsais e melhora postura para compensar o treino de empurrar.', limitation),
      buildExercise('home-scapula', 'Retração escapular no chão', 'Costas', series, '12-15 reps', '45s', 'Ativa musculatura das costas com pouca sobrecarga na lombar.', limitation),
      buildExercise('home-pull', hasBar ? 'Barra fixa assistida' : 'Pulldown com toalha/elástico', 'Costas', series, '6-12 reps', rest, 'Puxada vertical adaptada ao equipamento disponível.', limitation),
    ],
    'Pernas': [
      buildExercise('home-squat', hasLimitation ? 'Agachamento curto na cadeira' : hasDumbbells ? 'Agachamento goblet' : 'Agachamento livre', 'Pernas', series, reps, rest, 'Base para pernas e glúteos, ajustando amplitude conforme conforto.', limitation),
      buildExercise('home-hip-hinge', hasDumbbells ? 'Levantamento romeno com halteres' : 'Bom dia sem carga', 'Pernas', series, '10-14 reps', rest, 'Fortalece posterior de coxa e glúteos com controle de tronco.', limitation),
      buildExercise('home-glute-bridge', 'Elevação pélvica no chão', 'Pernas', series, '12-20 reps', '45s', 'Ótima opção para glúteos e estabilidade sem impacto.', limitation),
    ],
    'Ombros': [
      buildExercise('home-shoulder-press', hasDumbbells ? 'Desenvolvimento com halteres' : hasElastic ? 'Desenvolvimento com elástico' : 'Elevação frontal sem carga', 'Ombros', series, '10-14 reps', rest, 'Trabalha ombros com carga ajustável para ambiente doméstico.', limitation),
      buildExercise('home-lateral-raise', hasDumbbells ? 'Elevação lateral com halteres' : 'Elevação lateral isométrica', 'Ombros', series, '12-16 reps', '45s', 'Foco em deltoide lateral, sem precisar de máquina.', limitation),
      buildExercise('home-wall-slide', 'Wall slide', 'Ombros', series, '8-12 reps', '30s', 'Melhora controle escapular e mobilidade de ombros.', limitation),
    ],
    'Braços': [
      buildExercise('home-curl', hasDumbbells ? 'Rosca direta com halteres' : hasElastic ? 'Rosca com elástico' : 'Rosca isométrica com toalha', 'Braços', series, '10-15 reps', rest, 'Bíceps em casa usando o equipamento disponível.', limitation),
      buildExercise('home-triceps', hasBench ? 'Tríceps no banco com amplitude curta' : 'Tríceps testa no chão sem carga', 'Braços', series, '10-14 reps', rest, 'Tríceps com variação controlada para evitar desconforto no ombro.', limitation),
      buildExercise('home-carry', hasDumbbells ? 'Farmer hold com halteres' : 'Aperto isométrico de toalha', 'Braços', series, '20-40s', '45s', 'Fortalece pegada, antebraço e estabilidade.', limitation),
    ],
    'Abdômen': [
      buildExercise('home-plank', hasLimitation ? 'Prancha elevada' : 'Prancha frontal', 'Abdômen', series, '20-45s', '45s', 'Core anti-extensão para proteger lombar e melhorar estabilidade.', limitation),
      buildExercise('home-dead-bug', 'Dead bug', 'Abdômen', series, '8-12 por lado', '45s', 'Controle de core com baixa sobrecarga lombar.', limitation),
      buildExercise('home-side-plank', 'Prancha lateral adaptada', 'Abdômen', series, '15-35s por lado', '45s', 'Fortalece oblíquos e estabilidade lateral.', limitation),
    ],
    'Full Body': [
      mobilityFirst,
      buildExercise('home-circuit-squat', hasLimitation ? 'Sentar e levantar da cadeira' : 'Agachamento + alcance', 'Full Body', series, reps, rest, 'Movimento global para ativar pernas, core e coordenação.', limitation),
      buildExercise('home-circuit-push', hasBench ? 'Flexão inclinada' : 'Flexão na parede', 'Full Body', series, reps, rest, 'Empurrar seguro para treino geral em casa.', limitation),
      buildExercise('home-circuit-row', hasElastic ? 'Remada com elástico' : 'Retração escapular', 'Full Body', series, reps, rest, 'Puxada/postura para equilibrar o protocolo.', limitation),
      buildExercise('home-circuit-core', 'Dead bug ou prancha elevada', 'Full Body', series, '8-12 reps', '45s', 'Finaliza com estabilidade de core.', limitation),
    ],
  };

  const preferredGroups: MuscleGroup[] = (() => {
    if (goal.includes('emagrec') || goal.includes('condicion')) return ['Full Body', 'Pernas', 'Abdômen', 'Costas'];
    if (goal.includes('força')) return ['Full Body', 'Pernas', 'Peito', 'Costas'];
    if (goal.includes('mobilidade') || goal.includes('saúde')) return ['Full Body', 'Costas', 'Abdômen', 'Pernas'];
    return ['Full Body', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen'];
  })();

  const goalLabel = profile.goal || 'Treino';
  return preferredGroups.map((group, index) => ({
    id: `home-${slugifyText(goalLabel)}-${slugifyText(group)}-${slugifyText(level)}`,
    name: group === 'Full Body' ? `Casa ${goalLabel}` : `Casa ${group}`,
    description: `Treino em casa para ${goalLabel.toLowerCase()}, adaptado ao equipamento informado e às limitações do usuário.`,
    muscleGroup: group,
    level,
    duration,
    carga,
    exercises: library[group].slice(0, group === 'Full Body' ? 5 : 3),
    planRequired,
    authorUid: `home-protocol-${index}`,
  }));
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
    return [
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
    ];
  }

  return [
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
  ];
}

export default function App() {
  const { user, profile, loading, profileLoading, authError, initSession, signInWithGoogle, logout, isAdmin, simulatedPlan, setSimulatedPlan, updatePlan, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPricing, setShowPricing] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [initTimeout, setInitTimeout] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

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

  const effectivePlan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null);

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
            setCheckoutPlan(plan);
            setShowPricing(true);
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
          <NavItem icon={<TrendingUp size={20} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Início" />
          <NavItem icon={<Dumbbell size={20} />} active={activeTab === 'workouts'} onClick={() => setActiveTab('workouts')} label="Treinos" />
          <NavItem icon={<Apple size={20} />} active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} label="Dieta" />
          <NavItem icon={<BarChart3 size={20} />} active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} label="Progresso" />
          <NavItem icon={<Users size={20} />} active={activeTab === 'community'} onClick={() => setActiveTab('community')} label="Social" />
          <NavItem icon={<Wallet size={20} />} active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} label="Afiliados" />
        </div>

        <div className="hidden md:flex md:flex-col md:gap-8 md:mt-auto md:mb-12 w-full items-center">
          <button
            onClick={() => { setCheckoutPlan(null); setShowPricing(true); }}
            className={`p-3 rounded-2xl transition-all duration-300 ${effectivePlan === 'free' ? 'text-primary bg-primary/10 animate-pulse' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
            title="Planos"
          >
            <Zap size={24} />
          </button>
          <NavItem icon={<Settings size={24} />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Ajustes" />
          {isAdmin && <NavItem icon={<ShieldCheck size={20} />} active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label="Admin" />}
          <button
            onClick={logout}
            className="p-3 rounded-2xl text-text-muted hover:text-error hover:bg-error/10 transition-all duration-300"
            title="Sair"
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
            background: 'rgba(13,13,15,0.96)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <MobileNavItem icon={<TrendingUp size={23} />} label="Início"    active={activeTab === 'dashboard'}  onClick={() => { setDrawerOpen(false); setActiveTab('dashboard'); }} />
          <MobileNavItem icon={<Dumbbell size={23} />}   label="Treinos"   active={activeTab === 'workouts'}   onClick={() => { setDrawerOpen(false); setActiveTab('workouts'); }} />
          <MobileNavItem icon={<Apple size={23} />}      label="Dieta"     active={activeTab === 'nutrition'}  onClick={() => { setDrawerOpen(false); setActiveTab('nutrition'); }} />
          <MobileNavItem icon={<BarChart3 size={23} />}  label="Progresso" active={activeTab === 'progress'}   onClick={() => { setDrawerOpen(false); setActiveTab('progress'); }} />
          {/* "Mais" slot */}
          <button
            onClick={() => setDrawerOpen(v => !v)}
            className="flex-1 flex flex-col items-center justify-center gap-[5px] relative h-full"
            aria-label={drawerOpen ? 'Fechar menu' : 'Mais opções'}
          >
            {drawerOpen && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                style={{ width: 28, height: 3, background: '#ff6b1a' }}
              />
            )}
            <span
              className="transition-transform duration-300"
              style={{
                display: 'flex',
                color: drawerOpen ? '#ff6b1a' : '#8a8a92',
                transform: drawerOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              }}
            >
              {drawerOpen ? <X size={23} /> : <MoreHorizontal size={23} />}
            </span>
            <span
              className="text-[11px] font-bold leading-none"
              style={{ color: drawerOpen ? '#ff6b1a' : '#8a8a92', fontWeight: drawerOpen ? 700 : 500 }}
            >
              {drawerOpen ? 'Fechar' : 'Mais'}
            </span>
          </button>
        </div>
      </nav>

      {/* ── Drawer Overlay (mobile only) ── */}
      <div
        className="md:hidden fixed inset-0 z-40 pointer-events-none"
        style={{
          bottom: 'calc(76px + env(safe-area-inset-bottom))',
          background: 'rgba(0,0,0,0.45)',
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
        aria-label="Mais opções"
        className="md:hidden fixed left-0 right-0 z-40"
        style={{
          bottom: 'calc(76px + env(safe-area-inset-bottom))',
          background: '#16161a',
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -20px 40px -10px rgba(0,0,0,0.5)',
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
          <div className="rounded-full" style={{ width: 44, height: 4, background: 'rgba(255,255,255,0.18)' }} />
        </div>

        <div className="px-4 sm:px-5 pt-3 pb-6 space-y-5">
          {/* Header */}
          <div>
            <p className="text-base font-bold text-text-primary">Mais opções</p>
            <p className="text-[11.5px] mt-0.5" style={{ color: '#8a8a92' }}>Acessos secundários e configurações</p>
          </div>

          {/* Grid of items */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
            {[
              { tab: 'community',  icon: <Users size={20} />,      label: 'Social',    desc: 'Feed e comunidade' },
              { tab: 'affiliates', icon: <Wallet size={20} />,     label: 'Afiliados', desc: 'Comissões e links' },
              { tab: 'settings',   icon: <Settings size={20} />,   label: 'Ajustes',   desc: 'Conta e preferências' },
              ...(isAdmin ? [{ tab: 'admin', icon: <ShieldCheck size={20} />, label: 'Admin', desc: 'Painel de administrador' }] : []),
            ].map(item => (
              <button
                key={item.tab}
                onClick={() => { setActiveTab(item.tab); setDrawerOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-95 min-h-[68px]"
                style={{ background: 'rgba(255,255,255,0.04)', border: activeTab === item.tab ? '1px solid rgba(255,107,26,0.4)' : '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex-shrink-0 flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', color: activeTab === item.tab ? '#ff6b1a' : '#8a8a92' }}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13.5px] font-bold text-text-primary truncate">{item.label}</span>
                    {activeTab === item.tab && <span className="flex-shrink-0 rounded-full" style={{ width: 6, height: 6, background: '#ff6b1a' }} />}
                  </div>
                  <p className="text-[10.5px] truncate" style={{ color: '#8a8a92' }}>{item.desc}</p>
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
                onUpgrade={() => { setCheckoutPlan(null); setShowPricing(true); }}
                onStartWorkout={() => setActiveTab('workouts')}
                onViewNutrition={() => setActiveTab('nutrition')}
              />
            )}
            {activeTab === 'workouts' && <ViewErrorBoundary><WorkoutsView profile={profile} onUpgrade={() => { setCheckoutPlan(null); setShowPricing(true); }} /></ViewErrorBoundary>}
            {activeTab === 'nutrition' && <NutritionView profile={profile} onUpgrade={() => { setCheckoutPlan(null); setShowPricing(true); }} updateProfile={updateProfile} />}
            {activeTab === 'progress' && <BodyProgressView userId={profile.id} />}
            {activeTab === 'community' && <CommunityView profile={profile} />}
            {activeTab === 'affiliates' && <AffiliateView profile={profile} />}
            {activeTab === 'settings' && <SettingsView profile={profile} logout={logout} onUpgrade={() => { setCheckoutPlan(null); setShowPricing(true); }} />}
            {activeTab === 'admin' && isAdmin && <AdminView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function AffiliateView({ profile }: { profile: UserProfile | null }) {
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
          setMessage('Email confirmado com sucesso!');
          setTimeout(() => {
            try { window.close(); } catch (e) {}
            window.location.href = '/';
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Não foi possível confirmar seu email.');
          setTimeout(() => { window.location.href = '/'; }, 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Erro ao processar confirmação.');
        setTimeout(() => { window.location.href = '/'; }, 3000);
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
            onClick={() => window.location.href = '/'}
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
      console.error('Google login error:', err);
      setError(err.message || 'Erro ao entrar com Google.');
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

function DashboardView({ profile, onUpgrade, onStartWorkout, onViewNutrition }: { profile: UserProfile, onUpgrade: () => void, onStartWorkout: () => void, onViewNutrition: () => void }) {
  const { isAdmin, simulatedPlan, user } = useAuth();
  const effectivePlan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null);

  const getFirstName = () => {
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || profile.name || 'Usuário';
    return fullName.split(' ')[0].toUpperCase();
  };

  const [weeklyCalData, setWeeklyCalData] = useState<{ day: string; date: string; calories: number; protein: number; carbs: number; fat: number; isToday: boolean; isFuture: boolean }[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [trainingOnboarding, setTrainingOnboarding] = useState<any>(null);

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
              <h4 className="font-black text-lg uppercase tracking-tight">Desbloqueie seu Potencial Máximo</h4>
              <p className="text-sm text-text-secondary">Assine o plano <span className="text-primary font-bold">PRO</span> ou <span className="text-primary font-bold">ELITE</span> e tenha acesso a treinos com IA e dietas personalizadas.</p>
            </div>
          </div>
          <button 
            onClick={onUpgrade}
            className="bg-primary text-text-primary px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-95 whitespace-nowrap"
          >
            Ver Planos
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
              onClick={onStartWorkout}
              className="bg-primary text-text-primary px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all min-h-[48px]"
            >
              Começar Protocolo
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {trainingOnboarding.recommendation.weeklySplit?.slice(0, 3).map((day: string, idx: number) => (
              <div key={day} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="text-[10px] text-text-muted font-black uppercase tracking-widest">Dia {idx + 1}</div>
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
                {effectivePlan} MEMBER
              </span>
              {isAdmin && (
                <span className="px-3 py-1 bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
                  ADMIN MODE
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-6xl font-black tracking-tighter leading-none">
              BOM TRABALHO, <br />
              <span className="text-primary">{getFirstName()}!</span>
            </h1>
            <p className="text-text-secondary text-base md:text-lg max-w-md leading-relaxed">
              "A disciplina é a ponte entre metas e realizações." Você já completou <span className="text-text-primary font-bold">{weeklyPercent}%</span> da sua meta semanal ({weeklyCount}/{WEEKLY_TARGET} treinos).
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onStartWorkout}
                className="bg-primary text-text-primary px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary-hover hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[56px]"
              >
                INICIAR TREINO DE HOJE
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
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Meta Semanal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardMetricCard 
          label="Peso Atual" 
          value={`${profile.weight} kg`} 
          subValue="-1.2kg esta semana" 
          icon={<TrendingUp size={20} />} 
          trend="up" 
        />
        <DashboardMetricCard
          label="Próximo Treino"
          value={nextWorkout.name}
          subValue={nextWorkout.muscleGroup}
          icon={<Calendar size={20} />}
          onClick={onStartWorkout}
        />
        <DashboardMetricCard 
          label="Calorias Diárias" 
          value={`${calorieGoal.toLocaleString('pt-BR')} kcal`}
          subValue={profile.goal?.toLowerCase().includes('emagrec') ? 'Meta em déficit calórico' : `Meta: ${calorieGoal.toLocaleString('pt-BR')} kcal`}
          icon={<Apple size={20} />} 
          onClick={onViewNutrition}
        />
        <DashboardMetricCard 
          label="Nível de Energia" 
          value="Alta" 
          subValue="Baseado no sono" 
          icon={<Zap size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calorias da Semana */}
        <div className="lg:col-span-2 bg-surface p-8 rounded-[40px] border border-white/5 space-y-6">
          <div>
            <h3 className="text-xl font-black tracking-tight uppercase">Calorias da semana</h3>
            <p className="text-sm text-text-muted">Meta: {calorieGoal.toLocaleString('pt-BR')} kcal/dia</p>
          </div>

          <div className="h-[280px] w-full relative">
            {weeklyCalData.every(d => d.calories === 0) && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <p className="text-sm text-text-muted font-bold text-center px-4">Registre suas refeições para ver o gráfico</p>
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
                    if (props.payload?.isFuture || value === 0) return ['Sem registro', 'Calorias'];
                    return [`${value.toLocaleString('pt-BR')} kcal`, 'Calorias'];
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
                          {value.toLocaleString('pt-BR')}
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
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Média da semana</p>
                  <p className="text-base font-black mt-0.5">{avg.toLocaleString('pt-BR')} <span className="text-text-muted text-xs font-bold">kcal</span></p>
                </div>
                <div className="w-px bg-white/5" />
                <div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Melhor dia</p>
                  <p className="text-base font-black mt-0.5">{best.toLocaleString('pt-BR')} <span className="text-text-muted text-xs font-bold">kcal</span></p>
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
                <h3 className="text-xl font-black tracking-tight uppercase">Nutrição</h3>
                <button
                  onClick={onViewNutrition}
                  className="text-primary text-xs font-black uppercase tracking-widest hover:text-primary-hover transition-colors"
                >
                  Ver Tudo
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-text-muted">Calorias</span>
                    <span className="text-text-primary">
                      {todayCals > 0 ? todayCals.toLocaleString('pt-BR') : '—'} / {calorieGoal.toLocaleString('pt-BR')} kcal
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
                    { label: 'Prot', value: todayLog?.protein ?? 0, unit: 'g' },
                    { label: 'Carb', value: todayLog?.carbs ?? 0, unit: 'g' },
                    { label: 'Gord', value: todayLog?.fat ?? 0, unit: 'g' },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-[10px] text-text-muted font-black uppercase mb-1">{label}</div>
                      <div className="text-sm font-black">{value > 0 ? `${value}g` : '—'}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-4">
                  <h4 className="text-xs font-black text-text-muted uppercase tracking-widest">Próxima Refeição</h4>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Utensils size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-text-muted">Registre refeições</div>
                      <div className="text-[10px] text-text-muted">no módulo de Nutrição</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

    </div>
  );
}

function WorkoutsView({ profile, onUpgrade }: { profile: UserProfile, onUpgrade: () => void }) {
  const { isAdmin, simulatedPlan, user, updateProfile } = useAuth();
  const effectivePlan: Plan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null) || 'Iniciante';
  const hasPro = effectivePlan === 'Pro' || effectivePlan === 'Elite' || isAdmin;
  const isFreePointsPlan = effectivePlan === 'free' || effectivePlan === 'Iniciante';
  const FREE_POINTS_LIMIT = 2000;
  const [selectedPlanTab, setSelectedPlanTab] = useState<Plan>(
    (effectivePlan === 'free' || !effectivePlan) ? 'Iniciante' : effectivePlan
  );
  const initialLevel: Level = effectivePlan === 'Elite' ? 'Avançado' : effectivePlan === 'Pro' ? 'Intermediário' : 'Iniciante';
  const [selectedLevel, setSelectedLevel] = useState<Level>(initialLevel);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'Todos'>('Todos');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'workouts' | 'ia' | 'history' | 'ranking' | 'spreadsheet' | 'early' | 'registro'>('workouts');
  const [activeHomeMode, setActiveHomeMode] = useState<HomeTrainingMode>('training');
  const [trainingOnboarding, setTrainingOnboarding] = useState<any>(null);
  const [livePoints, setLivePoints] = useState(profile.points || 0);
  const livePointsRef = useRef(profile.points || 0);
  const reconciledCompletedPointsRef = useRef(false);

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
    const availablePoints = isFreePointsPlan ? Math.max(0, FREE_POINTS_LIMIT - basePoints) : missingAwards.length * 100;
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
  }, [user?.id, completedWorkouts, awardedWorkoutPoints, profile.points, isFreePointsPlan, updateProfile]);

  const muscleGroups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Full Body'];
  const trainingPlace = trainingOnboarding?.trainingPlace;
  const usesHomeProtocol = trainingPlace === 'home';
  const usesHybridProtocol = trainingPlace === 'hybrid';
  const homeWorkouts = buildHomeWorkouts(profile, trainingOnboarding, selectedPlanTab, selectedLevel);
  const homeRecoveryWorkouts = activeHomeMode === 'training'
    ? []
    : buildHomeRecoveryWorkouts(trainingOnboarding, selectedPlanTab, selectedLevel, activeHomeMode);
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
  const POINTS_MILESTONE_STEP = 100;
  const nextPointsMilestone = isFreePointsPlan
    ? FREE_POINTS_LIMIT
    : Math.max(POINTS_MILESTONE_STEP, Math.ceil((points + 1) / POINTS_MILESTONE_STEP) * POINTS_MILESTONE_STEP);
  const previousPointsMilestone = isFreePointsPlan ? 0 : Math.max(0, nextPointsMilestone - POINTS_MILESTONE_STEP);
  const pointsProgress = Math.min(100, Math.round(((points - previousPointsMilestone) / (nextPointsMilestone - previousPointsMilestone)) * 100));
  const freePointsLimitReached = isFreePointsPlan && points >= FREE_POINTS_LIMIT;

  useEffect(() => {
    if (selectedMuscleGroup !== 'Todos' && !visibleMuscleGroups.includes(selectedMuscleGroup)) {
      setSelectedMuscleGroup('Todos');
    }
  }, [selectedMuscleGroup, visibleMuscleGroups]);

  const hasAccess = (planId: Plan) => {
    const weights = { 'free': 0, 'Iniciante': 1, 'Pro': 2, 'Elite': 3, 'Admin': 4 };
    return weights[effectivePlan] >= weights[planId];
  };

  const completeWorkoutAndAwardPoints = async (workoutId: string): Promise<number | null> => {
    const alreadyAwarded = awardedWorkoutPoints.includes(workoutId);
    const alreadyCompleted = completedWorkouts.includes(workoutId);

    if (!alreadyCompleted) {
      setCompletedWorkouts(prev => prev.includes(workoutId) ? prev : [...prev, workoutId]);
    }

    if (!alreadyAwarded && user) {
      const basePoints = Math.max(livePointsRef.current, profile.points || 0);
      if (isFreePointsPlan && basePoints >= FREE_POINTS_LIMIT) {
        return null;
      }

      const workout = workoutSource.find(w => w.id === workoutId) ?? ALL_WORKOUTS.find(w => w.id === workoutId);
      const today = new Date().toISOString().split('T')[0];
      const nextPoints = isFreePointsPlan ? Math.min(FREE_POINTS_LIMIT, basePoints + 100) : basePoints + 100;

      livePointsRef.current = nextPoints;
      setLivePoints(nextPoints);
      setAwardedWorkoutPoints(prev => prev.includes(workoutId) ? prev : [...prev, workoutId]);

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

  if (selectedWorkout) {
    return (
      <WorkoutDetailView 
        workout={selectedWorkout} 
        onBack={() => setSelectedWorkout(null)} 
        isCompleted={completedWorkouts.includes(selectedWorkout.id)}
        hasAwardedPoints={awardedWorkoutPoints.includes(selectedWorkout.id)}
        onToggleComplete={() => toggleComplete(selectedWorkout.id)}
        canEdit={hasAccess('Elite')}
        currentPoints={livePoints}
        isFreePointsPlan={isFreePointsPlan}
        freePointsLimit={FREE_POINTS_LIMIT}
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
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">Meus Treinos</h1>
          </div>
          <p className="text-text-secondary text-base md:text-lg">
            Protocolos de treinamento personalizados para {placeLabel.toLowerCase()} e objetivo: <span className="text-text-primary font-bold">{profile.goal || 'evolução'}</span>.
          </p>
        </div>
        
        <div className="bg-surface border border-white/10 rounded-2xl p-4 shrink-0 w-full md:w-[320px] shadow-xl shadow-black/10">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <Trophy size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Pontos</div>
                <div className="text-lg font-black leading-tight">{points} pts</div>
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
            <span>{previousPointsMilestone}</span>
            <span>{isFreePointsPlan ? `Limite free ${FREE_POINTS_LIMIT} pts` : `Meta ${nextPointsMilestone} pts`}</span>
          </div>
          {freePointsLimitReached && (
            <button
              onClick={onUpgrade}
              className="w-full mt-3 min-h-[42px] bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all"
            >
              Liberar mais pontos
            </button>
          )}
        </div>
      </header>

      {usesHomeProtocol && (
        <section className="space-y-4">
          <div className="bg-primary/10 border border-primary/20 rounded-[24px] p-5 flex flex-col gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Treino em casa ativado</div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Sessões práticas para o objetivo <span className="text-text-primary font-bold">{profile.goal}</span>, com progressão segura e rotina adaptada ao seu espaço.
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
              { id: 'training', label: 'Treinar', icon: <Dumbbell size={16} /> },
              { id: 'mobility', label: 'Mobilidade', icon: <Activity size={16} /> },
              { id: 'stretching', label: 'Alongar', icon: <RefreshCw size={16} /> },
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

      {/* Main Plan Tabs */}
      {(!usesHomeProtocol || activeHomeMode === 'training') && <div className="flex flex-col gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Protocolo</span>
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
            label="Treinos" 
            icon={<Dumbbell size={14} />} 
          />
          {selectedPlanTab === 'Pro' && (
            <>
              <SubTabButton
                active={activeSubTab === 'registro'}
                onClick={() => setActiveSubTab('registro')}
                label="Registro"
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
                label="Histórico"
                icon={<Calendar size={14} />}
              />
              <SubTabButton
                active={activeSubTab === 'ranking'}
                onClick={() => setActiveSubTab('ranking')}
                label="Ranking"
                icon={<Trophy size={14} />}
              />
            </>
          )}
          {selectedPlanTab === 'Elite' && (
            <>
              <SubTabButton
                active={activeSubTab === 'registro'}
                onClick={() => setActiveSubTab('registro')}
                label="Registro"
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
                label="Planilha Atleta"
                icon={<Calculator size={14} />}
              />
              <SubTabButton
                active={activeSubTab === 'early'}
                onClick={() => setActiveSubTab('early')}
                label="Acesso Antecipado"
                icon={<Flame size={14} />}
              />
            </>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="relative min-h-[500px]">
        {!hasAccess(selectedPlanTab) ? (
          <LockedFeatureOverlay onUpgrade={onUpgrade} plan={selectedPlanTab} />
        ) : (
          <div className="space-y-12">
            {activeSubTab === 'workouts' && (
              <>
                {/* Filters Area */}
                {(!usesHomeProtocol || activeHomeMode === 'training') && <div className="space-y-8">
                  <div>
                    <div className="flex flex-col gap-3 max-w-4xl">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Grupo Muscular</span>
                      <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                        <button
                          onClick={() => setSelectedMuscleGroup('Todos')}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                            selectedMuscleGroup === 'Todos' 
                              ? 'bg-primary text-text-primary shadow-lg shadow-primary/20' 
                              : 'text-text-muted hover:text-text-secondary'
                          }`}
                        >
                          Todos
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
                            {group}
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
                              ? 'Rotinas de mobilidade'
                              : usesHomeProtocol && activeHomeMode === 'stretching'
                              ? 'Rotinas de alongamento'
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
                                mode={activeHomeMode}
                                isCompleted={completedWorkouts.includes(workout.id)}
                                onClick={() => setSelectedWorkout(workout)}
                              />
                            ) : (
                              <div key={workout.id} className="shrink-0 w-[78vw] sm:w-[60vw] md:w-auto snap-start">
                                <WorkoutCard
                                  workout={workout}
                                  isCompleted={completedWorkouts.includes(workout.id)}
                                  onClick={() => setSelectedWorkout(workout)}
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
                        <p className="text-xl font-bold">Nenhum treino encontrado</p>
                        <p className="text-text-muted">Tente ajustar seus filtros para encontrar outros protocolos.</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeSubTab === 'registro' && <LoadTrackerView userId={user?.id || ''} />}
            {activeSubTab === 'ia' && (
              hasPro
                ? <IAAdaptativaView profile={profile} onUpgrade={onUpgrade} isAdmin={isAdmin} />
                : <LockedFeatureOverlay onUpgrade={onUpgrade} plan="Pro" title="Iron Coach IA" description="Seu personal trainer inteligente disponível 24h. Exclusivo para assinantes Pro e Elite." />
            )}
            {activeSubTab === 'history' && <WorkoutHistoryView userUid={user?.id || ''} />}
            {activeSubTab === 'ranking' && <GlobalRankingView />}
            {activeSubTab === 'spreadsheet' && <AthleteSpreadsheetView onSelectWorkout={setSelectedWorkout} />}
            {activeSubTab === 'early' && <EarlyAccessView onSelectWorkout={setSelectedWorkout} />}
          </div>
        )}
      </div>
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

function LockedFeatureOverlay({ onUpgrade, plan, title, description }: { onUpgrade: () => void, plan: Plan, title?: string, description?: string }) {
  const defaultTitle = "Acesso Restrito";
  const defaultDescription = `O módulo ${plan} faz parte dos nossos protocolos premium de treinamento.`;

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
          FAZER UPGRADE PARA {(plan || '').toUpperCase()}
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function WorkoutCard({
  workout,
  isCompleted,
  onClick
}: {
  workout: Workout,
  isCompleted: boolean,
  onClick: () => void
}) {
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

      <div className="relative z-10 flex-1 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${isCompleted ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
              NÍVEL {(workout.level || '').toUpperCase()}
            </span>
            {isCompleted && <span className="text-[8px] font-black text-success uppercase tracking-widest">Concluído</span>}
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-tight text-primary">{workout.name}</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
            <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">Exercícios</div>
            <div className="text-lg font-black">{workout.exercises.length}</div>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
            <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">Duração</div>
            <div className="text-lg font-black">{workout.duration}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
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
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary translate-x-1">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeRoutineCard({
  workout,
  mode,
  isCompleted,
  onClick,
}: {
  workout: Workout,
  mode: HomeTrainingMode,
  isCompleted: boolean,
  onClick: () => void,
}) {
  const config = mode === 'mobility'
    ? {
        label: 'Mobilidade',
        benefit: 'Movimente melhor',
        icon: <Activity size={20} />,
        accent: 'text-success',
        soft: 'bg-success/10 border-success/20',
      }
    : mode === 'stretching'
    ? {
        label: 'Alongamento',
        benefit: 'Recupere com calma',
        icon: <RefreshCw size={20} />,
        accent: 'text-[#74b9ff]',
        soft: 'bg-[#74b9ff]/10 border-[#74b9ff]/20',
      }
    : {
        label: 'Treino em casa',
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
        {isCompleted && <CheckCircle2 size={20} className="text-success shrink-0" />}
      </div>
      <div>
        <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${config.accent}`}>{config.label}</p>
        <h3 className="text-xl font-black tracking-tight leading-tight text-text-primary">{workout.name}</h3>
        <p className="text-xs text-text-secondary leading-relaxed mt-2 line-clamp-2">{workout.description}</p>
      </div>
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-text-muted">
          <span className="flex items-center gap-1.5"><Clock size={13} />{workout.duration}</span>
          <span className="flex items-center gap-1.5"><Activity size={13} />{workout.exercises.length} movimentos</span>
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${config.soft} ${config.accent}`}>
          <ChevronRight size={18} />
        </div>
      </div>
      <span className="sr-only">{config.benefit}</span>
    </div>
  );
}

function RestTimer({ restTime, onStateChange }: { restTime: string, onStateChange?: (isActive: boolean) => void }) {
  const initialSeconds = parseInt(restTime.replace('s', '')) || 60;
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      setIsFinished(true);
      if (onStateChange) onStateChange(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, onStateChange]);

  const toggleTimer = () => {
    if (isFinished) {
      setSeconds(initialSeconds);
      setIsFinished(false);
    }
    const newActive = !isActive;
    setIsActive(newActive);
    if (onStateChange) onStateChange(newActive);
  };

  const resetTimer = () => {
    setSeconds(initialSeconds);
    setIsActive(false);
    setIsFinished(false);
    if (onStateChange) onStateChange(false);
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

type ExerciseAnimationType = 'dumbbellBenchPress';

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
  if (key.includes('supino reto com halteres') && !navigator.onLine) return 'dumbbellBenchPress';
  return null;
}

function DumbbellBenchPressAnimation() {
  return (
    <div className="relative w-full h-full min-h-[260px] bg-[#f7f7f7] overflow-hidden flex items-center justify-center">
      <svg viewBox="0 0 640 380" className="w-full h-full" role="img" aria-label="Supino reto com halteres">
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
          <ellipse cx="320" cy="222" rx="96" ry="42" fill="url(#demoSkin)" />
          <ellipse cx="320" cy="218" rx="50" ry="27" fill="url(#demoMuscle)" opacity="0.95" />
          <circle cx="456" cy="218" r="31" fill="url(#demoSkin)" />
          <path d="M432 218c20-28 53-18 58 6-17-11-36-12-58-6Z" fill="#222" />
          <rect x="194" y="240" width="96" height="24" rx="12" fill="#222" opacity="0.9" />
        </g>

        <g strokeLinecap="round" strokeLinejoin="round" filter="url(#demoShadow)">
          <line x1="275" y1="204" x2="242" y2="142" stroke="url(#demoSkin)" strokeWidth="20">
            <animate attributeName="x2" values="242;252;242" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="y2" values="142;178;142" dur="2.1s" repeatCount="indefinite" />
          </line>
          <line x1="242" y1="142" x2="242" y2="76" stroke="url(#demoSkin)" strokeWidth="18">
            <animate attributeName="x1" values="242;252;242" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="y1" values="142;178;142" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="x2" values="242;252;242" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="y2" values="76;128;76" dur="2.1s" repeatCount="indefinite" />
          </line>
          <line x1="365" y1="204" x2="398" y2="142" stroke="url(#demoSkin)" strokeWidth="20">
            <animate attributeName="x2" values="398;388;398" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="y2" values="142;178;142" dur="2.1s" repeatCount="indefinite" />
          </line>
          <line x1="398" y1="142" x2="398" y2="76" stroke="url(#demoSkin)" strokeWidth="18">
            <animate attributeName="x1" values="398;388;398" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="y1" values="142;178;142" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="x2" values="398;388;398" dur="2.1s" repeatCount="indefinite" />
            <animate attributeName="y2" values="76;128;76" dur="2.1s" repeatCount="indefinite" />
          </line>
        </g>

        <g filter="url(#demoShadow)">
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;10 52;0 0" dur="2.1s" repeatCount="indefinite" />
            <rect x="214" y="56" width="56" height="18" rx="9" fill="#191919" />
            <circle cx="214" cy="65" r="22" fill="#111" />
            <circle cx="270" cy="65" r="22" fill="#111" />
            <circle cx="214" cy="65" r="10" fill="#333" />
            <circle cx="270" cy="65" r="10" fill="#333" />
          </g>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;-10 52;0 0" dur="2.1s" repeatCount="indefinite" />
            <rect x="370" y="56" width="56" height="18" rx="9" fill="#191919" />
            <circle cx="370" cy="65" r="22" fill="#111" />
            <circle cx="426" cy="65" r="22" fill="#111" />
            <circle cx="370" cy="65" r="10" fill="#333" />
            <circle cx="426" cy="65" r="10" fill="#333" />
          </g>
        </g>

        <path d="M231 92c-22 27-22 58 0 86" fill="none" stroke="#ff6a00" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
        <path d="M409 92c22 27 22 58 0 86" fill="none" stroke="#ff6a00" strokeWidth="5" strokeLinecap="round" opacity="0.85" />
      </svg>
    </div>
  );
}

function ExerciseAnimation({ type }: { type: ExerciseAnimationType }) {
  if (type === 'dumbbellBenchPress') return <DumbbellBenchPressAnimation />;
  return null;
}

function ExecutionModal({
  exercise,
  onClose
}: {
  exercise: Exercise,
  onClose: () => void
}) {
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [apiVideoUrl, setApiVideoUrl] = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(true);
  const [curatedVideoFailed, setCuratedVideoFailed] = useState(false);
  const animationType = getExerciseAnimationType(exercise.name);

  useEffect(() => {
    let cancelled = false;
    setGifUrl(null);
    setApiVideoUrl(null);
    setCuratedVideoFailed(false);
    setGifLoading(!exercise.videoUrl && !animationType);
    if (animationType) return () => { cancelled = true; };
    const localMedia = getLocalExerciseMedia(exercise.name);
    if (localMedia) {
      setGifUrl(localMedia);
      setGifLoading(false);
    }
    const searchName = translateExerciseName(exercise.name);
    searchExercisesByName(exercise.name)
      .then((results: any) => {
        if (cancelled) return;
        const list = Array.isArray(results) ? results : results?.data;
        if (Array.isArray(list) && list.length > 0) {
          setApiVideoUrl(list[0].videoUrl ?? list[0].video_url ?? null);
          setGifUrl(list[0].gifUrl ?? list[0].imageUrl ?? null);
        } else {
          console.warn('[ExerciseModal] No GIF found for:', exercise.name, 'query:', searchName, results);
        }
      })
      .catch((err: any) => { console.error('[ExerciseModal] GIF fetch error:', err?.message); })
      .finally(() => { if (!cancelled) setGifLoading(false); });
    return () => { cancelled = true; };
  }, [exercise.name, exercise.videoUrl, animationType]);

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
          ) : animationType ? (
            <ExerciseAnimation type={animationType} />
          ) : exercise.videoUrl && !curatedVideoFailed ? (
            <video
              src={exercise.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls
              onError={() => setCuratedVideoFailed(true)}
              className="w-full h-full object-contain"
            />
          ) : apiVideoUrl ? (
            <video
              src={apiVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              controls
              className="w-full h-full object-contain"
            />
          ) : gifUrl ? (
            <img src={gifUrl} alt={exercise.name} className="w-full h-full object-contain" />
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
              <h3 className="text-3xl font-black tracking-tight uppercase">{exercise.name}</h3>
              <p className="text-primary font-black text-xs uppercase tracking-[0.2em]">{exercise.muscleGroup}</p>
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
                {exercise.instructions.map((step, i) => (
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
                  "{exercise.proTips[0]}"
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
                  {exercise.commonErrors[0]}
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
  index,
  isEditing,
  isCompleted,
  onUpdate,
  onShowExecution,
  onToggleComplete
}: {
  exercise: Exercise,
  index: number,
  isEditing: boolean,
  isCompleted: boolean,
  onUpdate: (field: keyof Exercise, value: any) => void,
  onShowExecution: () => void,
  onToggleComplete: () => void
}) {
  const [isResting, setIsResting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [apiVideoUrl, setApiVideoUrl] = useState<string | null>(null);
  const [gifLoading, setGifLoading] = useState(false);
  const [curatedVideoFailed, setCuratedVideoFailed] = useState(false);
  const animationType = getExerciseAnimationType(exercise.name);

  const handleToggleDetails = async () => {
    if (showDetails) {
      setShowDetails(false);
      return;
    }
    setShowDetails(true);
    setCuratedVideoFailed(false);
    if (animationType) return;
    if (gifUrl || apiVideoUrl) return;
    const localMedia = getLocalExerciseMedia(exercise.name);
    if (localMedia) {
      setGifUrl(localMedia);
    }
    const searchName = translateExerciseName(exercise.name);
    setGifLoading(!exercise.videoUrl);
    try {
      const results = await searchExercisesByName(exercise.name);
      const list = Array.isArray(results) ? results : results?.data;
      if (Array.isArray(list) && list.length > 0) {
        setApiVideoUrl(list[0].videoUrl ?? list[0].video_url ?? null);
        setGifUrl(list[0].gifUrl ?? list[0].imageUrl ?? null);
      } else {
        console.warn('[ActiveExercise] No GIF found for:', exercise.name, 'query:', searchName, results);
      }
    } catch (err: any) {
      console.error('[ActiveExercise] GIF fetch error:', err?.message);
    } finally {
      setGifLoading(false);
    }
  };

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
                <h4 className="text-xl md:text-2xl font-black tracking-tight">{exercise.name}</h4>
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
            <p className="text-text-secondary text-sm md:text-base max-w-md leading-relaxed line-clamp-2">{exercise.description}</p>

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
              <RestTimer restTime={exercise.restTime} onStateChange={setIsResting} />
            )}
          </div>

          {!isEditing && (
            <button
              onClick={onToggleComplete}
              className={`w-full sm:w-auto min-h-[48px] px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isCompleted
                  ? 'bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white'
                  : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white'
              }`}
            >
              {isCompleted ? <CheckCircle2 size={15} /> : <Check size={15} />}
              {isCompleted ? 'Concluído' : 'Concluir'}
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
                ) : animationType ? (
                  <ExerciseAnimation type={animationType} />
                ) : exercise.videoUrl && !curatedVideoFailed ? (
                  <video
                    src={exercise.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    onError={() => setCuratedVideoFailed(true)}
                    className="w-full h-full object-contain"
                  />
                ) : apiVideoUrl ? (
                  <video
                    src={apiVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : gifUrl ? (
                  <img
                    src={gifUrl}
                    alt={exercise.name}
                    className="w-full h-full object-contain"
                  />
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
                  <h3 className="text-2xl font-black tracking-tight uppercase">{exercise.name}</h3>
                  <p className="text-primary font-black text-xs uppercase tracking-[0.2em]">{exercise.muscleGroup}</p>
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
                      {exercise.instructions.map((step, i) => (
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
                    <p className="text-xs text-text-secondary leading-relaxed font-medium italic">"{exercise.proTips[0]}"</p>
                  </div>
                )}

                {exercise.commonErrors && (
                  <div className="p-5 bg-error/5 rounded-2xl border border-error/10 space-y-2">
                    <div className="flex items-center gap-2 text-error">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Erro Comum</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">{exercise.commonErrors[0]}</p>
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
  onBack,
  isCompleted,
  hasAwardedPoints,
  onToggleComplete,
  canEdit,
  currentPoints,
  isFreePointsPlan,
  freePointsLimit,
  onUpgrade
}: {
  workout: Workout,
  onBack: () => void,
  isCompleted: boolean,
  hasAwardedPoints: boolean,
  onToggleComplete: () => Promise<number | null>,
  canEdit: boolean,
  currentPoints: number,
  isFreePointsPlan: boolean,
  freePointsLimit: number,
  onUpgrade: () => void
}) {
  const [exercises, setExercises] = useState(workout.exercises);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExerciseForVideo, setSelectedExerciseForVideo] = useState<Exercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [showPointsNotice, setShowPointsNotice] = useState(false);
  const [pointsNoticeMode, setPointsNoticeMode] = useState<'earned' | 'earnedLimit' | 'limit' | 'complete'>('earned');
  const [displayPoints, setDisplayPoints] = useState(currentPoints);

  const POINTS_PER_WORKOUT = 100;
  const POINTS_MILESTONE_STEP = 100;

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

  const completedCount = completedExercises.length;
  const totalExercises = exercises.length || 1;
  const workoutProgress = Math.round((completedCount / totalExercises) * 100);
  const reachedMilestone = isFreePointsPlan
    ? Math.min(freePointsLimit, Math.max(POINTS_MILESTONE_STEP, Math.floor(displayPoints / POINTS_MILESTONE_STEP) * POINTS_MILESTONE_STEP))
    : Math.max(POINTS_MILESTONE_STEP, Math.floor(displayPoints / POINTS_MILESTONE_STEP) * POINTS_MILESTONE_STEP);
  const nextMilestone = isFreePointsPlan
    ? freePointsLimit
    : Math.max(POINTS_MILESTONE_STEP, Math.ceil((displayPoints + 1) / POINTS_MILESTONE_STEP) * POINTS_MILESTONE_STEP);
  const previousMilestone = isFreePointsPlan ? 0 : Math.max(0, nextMilestone - POINTS_MILESTONE_STEP);
  const milestoneProgress = Math.min(100, Math.round(((displayPoints - previousMilestone) / (nextMilestone - previousMilestone)) * 100));
  const freeLimitReached = isFreePointsPlan && displayPoints >= freePointsLimit;
  const isLimitNotice = pointsNoticeMode === 'limit';
  const isEarnedLimitNotice = pointsNoticeMode === 'earnedLimit';
  const isCompleteNotice = pointsNoticeMode === 'complete';
  const noticeReachedPoints = isEarnedLimitNotice ? freePointsLimit : displayPoints;

  const completeWorkout = async () => {
    if (isCompleted && hasAwardedPoints) {
      setPointsNoticeMode('complete');
      setShowPointsNotice(true);
      setTimeout(() => setShowPointsNotice(false), 4500);
      return false;
    }
    if (freeLimitReached && !hasAwardedPoints) {
      setPointsNoticeMode('limit');
      setShowPointsNotice(true);
      setTimeout(() => setShowPointsNotice(false), 6500);
      return false;
    }
    const nextPoints = await onToggleComplete();
    if (nextPoints !== null) {
      const willReachFreeLimit = isFreePointsPlan && nextPoints >= freePointsLimit;
      setDisplayPoints(nextPoints);
      setPointsNoticeMode(willReachFreeLimit ? 'earnedLimit' : 'earned');
      setShowPointsNotice(true);
      setTimeout(() => setShowPointsNotice(false), willReachFreeLimit ? 6500 : 4500);
    }
    return nextPoints !== null;
  };

  const toggleExerciseComplete = async (exerciseId: string) => {
    const alreadyDone = completedExercises.includes(exerciseId);
    const next = alreadyDone
      ? completedExercises.filter(id => id !== exerciseId)
      : [...completedExercises, exerciseId];

    setCompletedExercises(next);
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
      className="space-y-6 pb-32"
    >
      <AnimatePresence>
        {selectedExerciseForVideo && (
          <ExecutionModal
            exercise={selectedExerciseForVideo}
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
              {workout.muscleGroup}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
              {workout.level}
            </span>
            {isCompleted && (
              <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-[0.2em] border border-success/20 flex items-center gap-1">
                <CheckCircle2 size={10} /> Concluído
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">{workout.name}</h1>
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
            <span className="font-bold">{workout.carga}</span>
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
                    {isLimitNotice || isEarnedLimitNotice ? 'Meta free completa!' : isCompleteNotice ? 'Treino já registrado!' : 'Treino concluído!'}
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {isLimitNotice
                      ? `Você chegou aos ${freePointsLimit} pts. Assine Pro ou Elite para liberar mais pontos e mais exercícios.`
                      : isEarnedLimitNotice
                      ? `Você ganhou +${POINTS_PER_WORKOUT} pts e bateu ${freePointsLimit} pts. Agora assine Pro ou Elite para continuar evoluindo com mais pontos e exercícios.`
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
                      {isLimitNotice ? freePointsLimit : isCompleteNotice ? displayPoints : `+${POINTS_PER_WORKOUT}`}
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-text-muted">pts</span>
                  </div>
                </motion.div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Seu progresso</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{displayPoints} pts</span>
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
                    <span>{previousMilestone}</span>
                    <span>{isFreePointsPlan ? `Limite free ${freePointsLimit} pts` : `Meta ${nextMilestone} pts`}</span>
                  </div>
                </div>

                {isLimitNotice || isEarnedLimitNotice ? (
                  <button
                    onClick={onUpgrade}
                    className="w-full min-h-[52px] bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-hover transition-all active:scale-95"
                  >
                    Fazer upgrade
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
                <div className="text-sm font-black">{displayPoints} pts</div>
              </div>
            </div>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              {isFreePointsPlan ? `Limite free ${freePointsLimit} pts` : `Meta ${nextMilestone} pts`}
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
              Liberar mais pontos e exercícios
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
            index={index}
            isEditing={isEditing}
            isCompleted={completedExercises.includes(exercise.id)}
            onUpdate={(field, value) => updateExercise(index, field, value)}
            onShowExecution={() => setSelectedExerciseForVideo(exercise)}
            onToggleComplete={() => toggleExerciseComplete(exercise.id)}
          />
        ))}
      </div>

      {/* CTA fixo no rodapé */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-xl border-t border-white/5">
        <button
          onClick={async () => {
            if (freeLimitReached && !hasAwardedPoints) {
              setPointsNoticeMode('limit');
              setShowPointsNotice(true);
              setTimeout(() => setShowPointsNotice(false), 6500);
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
        >
          {freeLimitReached && !hasAwardedPoints ? (
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

function BodyProgressView({ userId }: { userId: string }) {
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
      date: new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
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
            {new Date(todayKey + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
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
              {new Date(latest.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
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
                      {new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
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

function NutritionView({ profile, onUpgrade, updateProfile }: { profile: UserProfile, onUpgrade: () => void, updateProfile: (u: Partial<UserProfile>) => Promise<void> }) {
  const { isAdmin, simulatedPlan } = useAuth();
  const effectivePlan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null);

  const localStorageKey = `nutrition_prefs_${profile.id}`;
  const localPrefs = (() => {
    try { return JSON.parse(localStorage.getItem(localStorageKey) || 'null'); } catch { return null; }
  })();
  const hasPrefs = !!(profile.nutrition_preferences || localPrefs);
  const [showPrefsForm, setShowPrefsForm] = useState(!hasPrefs);
  const [localNutritionPrefs, setLocalNutritionPrefs] = useState<NutritionPreferences | undefined>(
    profile.nutrition_preferences || localPrefs || undefined
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savePrefsError, setSavePrefsError] = useState('');

  const [calcData, setCalcData] = useState({
    weight: profile.weight.toString(),
    height: profile.height.toString(),
    age: profile.age.toString(),
    gender: 'male' as 'male' | 'female',
    activityLevel: '1.55',
    goal: 'maintain' as 'lose' | 'maintain' | 'gain'
  });

  const [results, setResults] = useState<{
    bmr: number;
    tdee: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  const mealPlanStorageKey = `meal_plan_${profile.id}`;
  const favoriteFoodsKey = `nutrition_favorites_${profile.id}`;

  const [mealPlan, setMealPlan] = useState<{
    time: string;
    name: string;
    icon: string;
    items: MealItem[];
  }[]>(() => {
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
      const res = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    if (calcData.goal === 'lose') targetCalories -= 500;
    if (calcData.goal === 'gain') targetCalories += 300;

    const calories = Math.round(targetCalories);
    const protein = Math.round(w * 2); // 2g per kg
    const fat = Math.round((calories * 0.25) / 9); // 25% of calories
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4);

    setResults({ 
      bmr: Math.round(bmr), 
      tdee: Math.round(tdee), 
      calories, 
      protein, 
      carbs, 
      fat 
    });

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
      setResults({
        ...results,
        calories: manualMacros.calories,
        protein: manualMacros.protein,
        carbs: manualMacros.carbs,
        fat: manualMacros.fat
      });
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
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase">Nutrição & Dieta</h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-text-secondary text-base sm:text-lg max-w-2xl leading-relaxed">
            Otimize sua performance com protocolos nutricionais baseados em ciência e adaptados ao seu metabolismo.
          </p>
          {localNutritionPrefs && (
            <button
              onClick={() => setShowPrefsForm(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-white/5 text-text-muted border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-text-primary transition-all"
            >
              <Edit3 size={13} />
              Editar Preferências
            </button>
          )}
        </div>
        {localNutritionPrefs && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg border border-primary/20 uppercase tracking-widest">
              {localNutritionPrefs.mealsPerDay} refeições/dia
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
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Calculadora Metabólica</h2>
          </div>
          <span className="self-start sm:self-auto px-3 py-1 bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
            MÓDULO INICIANTE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          <div className="lg:col-span-5 bg-surface p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-white/5 space-y-6 sm:space-y-8 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Peso (kg)</label>
                <input 
                  type="number" 
                  value={calcData.weight}
                  onChange={(e) => setCalcData({...calcData, weight: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Altura (cm)</label>
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
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Idade</label>
                <input 
                  type="number" 
                  value={calcData.age}
                  onChange={(e) => setCalcData({...calcData, age: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Sexo</label>
                <CustomSelect 
                  value={calcData.gender}
                  onChange={(val) => setCalcData({...calcData, gender: val as any})}
                  options={[
                    { value: 'male', label: 'Masculino' },
                    { value: 'female', label: 'Feminino' }
                  ]}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Nível de Atividade</label>
              <CustomSelect 
                value={calcData.activityLevel}
                onChange={(val) => setCalcData({...calcData, activityLevel: val})}
                options={[
                  { value: '1.2', label: 'Sedentário (Pouco ou nenhum exercício)' },
                  { value: '1.375', label: 'Levemente Ativo (1-3 dias/semana)' },
                  { value: '1.55', label: 'Moderadamente Ativo (3-5 dias/semana)' },
                  { value: '1.725', label: 'Muito Ativo (6-7 dias/semana)' },
                  { value: '1.9', label: 'Extra Ativo (Treino pesado 2x/dia)' }
                ]}
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Objetivo Estratégico</label>
              <div className="grid grid-cols-3 gap-3">
                {(['lose', 'maintain', 'gain'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setCalcData({...calcData, goal: g})}
                    className={`py-4 rounded-2xl text-[10px] font-black transition-all border duration-500 ${
                      calcData.goal === g 
                        ? 'bg-primary border-primary text-text-primary shadow-xl shadow-primary/20' 
                        : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                    }`}
                  >
                    {g === 'lose' ? 'PERDER' : g === 'maintain' ? 'MANTER' : 'GANHAR'}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={calculateMacros}
              className="w-full min-h-[56px] bg-primary text-text-primary rounded-[24px] font-black text-base shadow-2xl shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              CALCULAR PROTOCOLO
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
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Aguardando Parâmetros</h3>
                  <p className="text-text-secondary max-w-xs mx-auto text-base sm:text-lg leading-relaxed">
                    Preencha suas informações biométricas para gerar seu protocolo nutricional.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 space-y-8 sm:space-y-10">
                <div className="text-center space-y-4">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">META DIÁRIA ESTIMADA</div>
                  <div className="text-5xl sm:text-7xl md:text-8xl font-black text-primary tracking-tighter leading-none break-words">
                    {results.calories} 
                    <span className="text-xl sm:text-2xl text-text-muted font-black ml-2 uppercase tracking-widest">kcal</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                      <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">TMB</div>
                      <div className="text-lg font-black text-text-primary">{results.bmr} <span className="text-[10px] opacity-50">kcal</span></div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                      <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">TDEE</div>
                      <div className="text-lg font-black text-text-primary">{results.tdee} <span className="text-[10px] opacity-50">kcal</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <MacroResultCard label="Proteínas" value={results.protein} unit="g" color="bg-primary" icon="🥩" />
                  <MacroResultCard label="Carboidratos" value={results.carbs} unit="g" color="bg-white/10" icon="🍚" />
                  <MacroResultCard label="Gorduras" value={results.fat} unit="g" color="bg-white/10" icon="🥑" />
                </div>

                <div className="p-6 sm:p-8 bg-white/5 rounded-[24px] sm:rounded-[32px] border border-white/10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 backdrop-blur-md">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20 shrink-0">
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base sm:text-lg font-black uppercase tracking-tight">Análise do Protocolo</h4>
                    <p className="text-text-secondary text-sm sm:text-base leading-relaxed">
                      Este protocolo foi otimizado para <span className="text-text-primary font-black uppercase">{calcData.goal === 'lose' ? 'Déficit Calórico' : calcData.goal === 'gain' ? 'Superávit Calórico' : 'Manutenção'}</span>. 
                      Mantenha a consistência por pelo menos 14 dias para observar as primeiras adaptações metabólicas.
                    </p>
                  </div>
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

          <div className="bg-surface p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-white/5 shadow-2xl space-y-10 relative z-10 h-auto overflow-visible">
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

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-muted">Refeições Registradas Hoje</h4>
                <button
                  onClick={() => setIsAddMealModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-text-primary transition-all active:scale-95"
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
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Zap size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                        {isFreePlan ? 'Registrar refeição com IA' : 'Calcular macros com IA'}
                      </span>
                      <p className="text-[10px] text-text-muted mt-0.5">
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
                  <div className="bg-background/70 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-text-primary">Quer pesar em gramas?</div>
                      <p className="text-[10px] text-text-muted mt-1">O registro exato por g/ml fica liberado nos planos Pro e Elite.</p>
                    </div>
                    <button
                      onClick={onUpgrade}
                      className="px-4 py-2 bg-white/5 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-text-primary transition-all"
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
                  <div className="py-4 text-center">
                    <p className="text-text-muted font-bold text-sm uppercase tracking-widest">Nenhuma refeição registrada ainda.</p>
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
                            {new Date(log.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
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
    </div>
  );
}

function MigrationBanner({ onDismiss, onSuccess }: { onDismiss: () => void; onSuccess: () => void }) {
  const [key, setKey] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const runMigration = async () => {
    if (!key.trim()) return;
    setRunning(true);
    setResult('');
    try {
      const res = await fetch('/api/run-migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceRoleKey: key.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao executar migration');
      setResult('✅ Coluna adicionada com sucesso! As preferências serão sincronizadas automaticamente.');
      setTimeout(() => onSuccess(), 1500);
    } catch (e: any) {
      setResult(`❌ ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-yellow-400 font-black text-sm uppercase tracking-wide">
            Coluna ausente no Supabase
          </p>
          <p className="text-yellow-400/70 text-xs leading-relaxed">
            Preferências salvas localmente. Para sincronizar entre dispositivos, execute a migration abaixo.
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
        <button
          onClick={() => setShowKeyInput(v => !v)}
          className="flex-1 py-2.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500/20 transition-all"
        >
          {showKeyInput ? 'Fechar' : 'Executar Automaticamente'}
        </button>
        <a
          href={`https://supabase.com/dashboard/project/${(import.meta as any).env?.VITE_SUPABASE_URL?.replace('https://', '').split('.')[0] ?? '_'}/sql/new`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 bg-white/5 text-text-muted border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all text-center flex items-center justify-center gap-1.5"
        >
          <ExternalLink size={11} />
          Abrir SQL Editor
        </a>
      </div>

      {showKeyInput && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-yellow-400/60 uppercase tracking-widest ml-1">
              Service Role Key (Settings → API no dashboard do Supabase)
            </label>
            <input
              type="password"
              placeholder="sb_secret_..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full bg-black/30 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm font-mono text-yellow-300 focus:border-yellow-400 outline-none transition-all placeholder:text-yellow-400/30"
            />
          </div>
          <button
            onClick={runMigration}
            disabled={running || !key.trim()}
            className="w-full py-3 bg-yellow-500 text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {running ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <RefreshCw size={13} />
                </motion.div>
                Executando...
              </>
            ) : (
              <>
                <Zap size={13} />
                Executar Migration
              </>
            )}
          </button>
          {result && (
            <p className="text-xs font-bold leading-relaxed" style={{ color: result.startsWith('✅') ? '#4ade80' : '#f87171' }}>
              {result}
            </p>
          )}
        </motion.div>
      )}
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
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

function CommunityView({ profile }: { profile: UserProfile }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postError, setPostError] = useState<string | null>(null);

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
      setPosts(data || []);
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

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Comunidade 🤝</h1>
          <p className="text-text-muted text-sm md:text-base">Compartilhe sua jornada</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-primary w-12 h-12 flex items-center justify-center rounded-2xl text-text-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform shrink-0"
        >
          <Plus size={24} />
        </button>
      </header>

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
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center font-black text-lg md:text-xl text-text-primary shrink-0">
                  {post.user_avatar || post.user_name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-sm md:text-base">{post.user_name}</h4>
                  <span className="text-[10px] md:text-xs text-text-muted">
                    {formatDistanceToNow(new Date(post.criado_em), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
              <div className="px-4 md:px-6 pb-4">
                <p className="text-text-secondary text-sm md:text-base leading-relaxed whitespace-pre-wrap">{post.conteudo}</p>
              </div>
              {post.imagem_url && (
                <img 
                  src={post.imagem_url} 
                  alt="Post" 
                  className="w-full aspect-square sm:aspect-video object-cover"
                  referrerPolicy="no-referrer"
                />
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
                      <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        {!isPublishing && (
                          <button 
                            onClick={() => {
                              setNewPostImage(null);
                              setImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-colors"
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

function SettingsView({ profile, logout: _logout, onUpgrade }: { profile: UserProfile, logout: () => void, onUpgrade: () => void }) {
  const { isAdmin, simulatedPlan, setSimulatedPlan, user, logout } = useAuth();
  const effectivePlan = getEntitledPlan(profile, isAdmin ? simulatedPlan : null);
  const [adminTrainingPlace, setAdminTrainingPlace] = useState<'gym' | 'home'>(() => {
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
  const handleAdminTrainingPlaceChange = (trainingPlace: 'gym' | 'home') => {
    if (!user?.id) return;
    let onboarding: any = null;
    try {
      onboarding = JSON.parse(localStorage.getItem(`training_onboarding_${user.id}`) || 'null');
    } catch {
      onboarding = null;
    }
    const nextOnboarding = {
      ...(onboarding || {}),
      trainingPlace,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`training_onboarding_${user.id}`, JSON.stringify(nextOnboarding));
    setAdminTrainingPlace(trainingPlace);
    window.dispatchEvent(new CustomEvent('ironshape:training-place-changed', { detail: { trainingPlace } }));
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
                Sua próxima cobrança será em 24 de Abril de 2026.
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
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-black mb-3">Ambiente dos treinos</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'gym', label: 'Academia' },
                    { id: 'home', label: 'Casa' },
                  ] as const).map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAdminTrainingPlaceChange(option.id)}
                      className={`py-3 rounded-xl text-xs font-black transition-all border ${
                        adminTrainingPlace === option.id
                          ? 'bg-primary border-primary text-text-primary shadow-lg shadow-primary/20'
                          : 'bg-white/5 border-white/10 text-text-muted hover:border-white/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted mt-3 leading-relaxed">
                  Alterna a área de treinos entre protocolos de academia e exercícios adaptados para casa.
                </p>
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

function AdminView() {
  const [adminTab, setAdminTab] = useState<'general' | 'affiliates'>('general');
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [adminError, setAdminError] = useState('');
  const [showAllUsers, setShowAllUsers] = useState(false);
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

  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const paidProfiles = adminData.profiles.filter(p => p.plano === 'Pro' || p.plano === 'Elite' || p.subscriptionStatus === 'active');
  const onboardingStuck = adminData.profiles.filter(p => !p.age || !p.weight || !p.height || !p.goal);
  const activeToday = new Set([
    ...adminData.workouts.filter(w => w.completedAt?.startsWith(today)).map(w => w.userUid),
    ...adminData.nutrition.filter(n => n.date === today).map(n => n.user_id),
  ]);
  const monthlyRevenue = adminData.conversions
    .filter(c => c.created_at && new Date(c.created_at) >= startOfMonth)
    .reduce((sum, c) => sum + Number(c.valor_assinatura || 0), 0);
  const pendingAffiliates = adminData.affiliates.filter(a => a.status === 'pendente');
  const planCounts = (['free', 'Iniciante', 'Pro', 'Elite', 'Admin'] as Plan[]).map(plan => ({
    plan,
    count: adminData.profiles.filter(p => (p.plano || 'free') === plan).length,
  }));
  const recentUsers = showAllUsers ? adminData.profiles : adminData.profiles.slice(0, 6);
  const hasMoreUsers = adminData.profiles.length > 6;
  const recentConversions = adminData.conversions.slice(0, 5);

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
                <AdminMetricCard icon={<BarChart3 size={22} />} label="Receita Mês" value={monthlyRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} detail={`${recentConversions.length} conversões recentes`} tone="text-primary" />
                <AdminMetricCard icon={<UserCheck size={22} />} label="Afiliados Pendentes" value={pendingAffiliates.length.toString()} detail={`${adminData.affiliates.length} afiliados no total`} tone={pendingAffiliates.length ? 'text-error' : 'text-success'} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-surface rounded-[32px] border border-white/5 overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Usuários Recentes</h3>
                      <p className="text-xs text-text-muted mt-1">Últimos perfis criados ou retornados pela base.</p>
                    </div>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{recentUsers.length} de {adminData.profiles.length} exibidos</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {recentUsers.length > 0 ? (
                      <>
                        {recentUsers.map(user => (
                          <div key={user.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0">
                                {(user.name || user.email || 'U')[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="font-black text-sm truncate">{user.name || 'Usuário sem nome'}</div>
                                <div className="text-[10px] text-text-muted font-bold truncate">{user.email}</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest">{user.plano || 'free'}</span>
                              <span className={`px-3 py-1 border rounded-xl text-[10px] font-black uppercase tracking-widest ${user.subscriptionStatus === 'active' ? 'bg-success/10 border-success/20 text-success' : 'bg-white/5 border-white/10 text-text-muted'}`}>
                                {user.subscriptionStatus || 'inactive'}
                              </span>
                              {(!user.age || !user.goal) && (
                                <span className="px-3 py-1 bg-error/10 border border-error/20 text-error rounded-xl text-[10px] font-black uppercase tracking-widest">Onboarding</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {hasMoreUsers && (
                          <div className="p-5 flex justify-center">
                            <button
                              onClick={() => setShowAllUsers(prev => !prev)}
                              className="flex items-center justify-center gap-2 px-5 py-3 bg-primary/10 border border-primary/20 rounded-2xl text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-text-primary transition-all active:scale-95"
                            >
                              <ChevronDown size={16} className={`transition-transform ${showAllUsers ? 'rotate-180' : ''}`} />
                              {showAllUsers ? 'Ver menos' : 'Ver mais'}
                            </button>
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
                            <span className="font-black uppercase tracking-widest text-text-secondary">{plan}</span>
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
                      <h3 className="text-lg font-black uppercase tracking-tight">Conversões</h3>
                      <p className="text-xs text-text-muted">Pagamentos e afiliados recentes.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {recentConversions.map(conv => (
                      <div key={conv.id} className="bg-white/5 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest">{conv.plano}</div>
                          <div className="text-[10px] text-text-muted">{conv.status_pagamento}</div>
                        </div>
                        <div className="text-sm font-black text-primary">
                          {Number(conv.valor_assinatura || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                    ))}
                    {recentConversions.length === 0 && <p className="text-sm text-text-muted">Nenhuma conversão disponível ainda.</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <AdminAffiliatesView />
      )}
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

function IAAdaptativaView({ profile, onUpgrade, isAdmin = false }: { profile: UserProfile; onUpgrade: () => void; isAdmin?: boolean }) {
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
        <AIChat profile={profile} onUpgrade={onUpgrade} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

type LoadSet = { reps: number; weight: number };
type LoadSession = { date: string; sets: LoadSet[] };
type LoadData = Record<string, LoadSession[]>;

function LoadTrackerView({ userId }: { userId: string }) {
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
                    {new Date(session.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
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

function WorkoutHistoryView({ userUid }: { userUid: string }) {
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
            const date = new Date(item.completedAt).toLocaleDateString('pt-BR');
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

function GlobalRankingView() {
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

function AthleteSpreadsheetView({ onSelectWorkout }: { onSelectWorkout: (w: Workout) => void }) {
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

function EarlyAccessView({ onSelectWorkout: _onSelectWorkout }: { onSelectWorkout: (w: Workout) => void }) {
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

  const plans = [
    {
      id: 'Iniciante' as Plan,
      name: 'Iniciante',
      price: 'GRÁTIS',
      period: '',
      description: 'Ideal para quem está começando sua jornada fitness.',
      features: [
        'Treinos de nível básico (Iniciante)',
        'Calculadora de macros e nutrição',
        'Dashboard de evolução de peso',
        'Acesso à comunidade',
        'Programa de afiliados'
      ],
      color: 'bg-white/5',
      buttonText: currentPlan === 'Iniciante' ? 'Plano Atual' : 'Começar Agora'
    },
    {
      id: 'Pro' as Plan,
      name: 'Pro',
      price: hasReferral ? 'R$ 17,91' : 'R$ 19,90',
      originalPrice: hasReferral ? 'R$ 19,90' : null,
      period: '/mês',
      description: 'Para quem busca performance e resultados consistentes.',
      features: [
        'Tudo do Iniciante',
        'Treinos intermediários (Protocolo Pro)',
        'IA Adaptativa — treinos gerados por IA',
        'Histórico completo de treinos',
        'Ranking global de pontos',
        'Evolução de peso com filtros 7D / 1M / 6M'
      ],
      color: 'bg-primary/10 border-primary/30',
      highlight: true,
      buttonText: currentPlan === 'Pro' ? 'Plano Atual' : 'Fazer Upgrade'
    },
    {
      id: 'Elite' as Plan,
      name: 'Elite',
      price: hasReferral ? 'R$ 26,91' : 'R$ 29,90',
      originalPrice: hasReferral ? 'R$ 29,90' : null,
      period: '/mês',
      description: 'O protocolo definitivo para atletas e entusiastas de elite.',
      features: [
        'Tudo do Pro',
        'Treinos avançados (Protocolo Elite)',
        'Planilha Atleta semanal',
        'Acesso antecipado a novos treinos',
        'Edição e personalização de treinos',
        'Protocolos de Competição'
      ],
      color: 'bg-white/5',
      buttonText: currentPlan === 'Elite' ? 'Plano Atual' : 'Seja Elite'
    }
  ];

  const handleUpgrade = async (plan: Plan) => {
    if (plan === 'Elite' || plan === 'Pro') {
      setIsProcessing(true);
      try {
        if (user?.id) localStorage.setItem(`pending_checkout_plan_${user.id}`, plan);
        const res = await fetch('/api/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            customerEmail: user?.email,
            userId: user?.id,
            referralCode: localStorage.getItem('affiliate_ref') || null,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || 'Erro ao iniciar pagamento.');
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
          <h1 className="text-3xl md:text-6xl font-black tracking-tighter uppercase">Escolha seu Protocolo</h1>
          {hasReferral && (
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-green-500/20">
              <Check size={14} /> Desconto de 10% Aplicado via Indicação
            </div>
          )}
          <p className="text-text-secondary text-base md:text-lg max-w-2xl mx-auto">
            {initialCheckoutPlan && initialCheckoutPlan !== 'Iniciante'
              ? `Estamos preparando o checkout do plano ${initialCheckoutPlan}. O acesso premium só libera após o pagamento aprovado.`
              : 'Selecione o plano que melhor se adapta aos seus objetivos e comece sua transformação hoje mesmo.'}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              className={`relative p-8 md:p-10 rounded-[32px] md:rounded-[48px] border flex flex-col justify-between gap-8 transition-all duration-500 ${
                plan.highlight 
                  ? 'bg-surface border-primary shadow-2xl shadow-primary/20' 
                  : 'bg-surface/40 border-white/5 hover:border-white/10'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-text-primary text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/30">
                  POPULAR
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tight">{plan.name}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{plan.description}</p>
                </div>

                <div className="space-y-1">
                  {plan.originalPrice && (
                    <span className="text-sm text-text-muted line-through font-bold">{plan.originalPrice}</span>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-text-muted font-bold">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 size={18} className="text-primary shrink-0" />
                      <span className="text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isProcessing || ((plan.id !== 'Elite' && plan.id !== 'Pro') && currentPlan === plan.id)}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
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

        <div className="text-center text-text-muted text-xs">
          <p>Pagamento seguro e processamento criptografado. Cancele quando quiser.</p>
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
