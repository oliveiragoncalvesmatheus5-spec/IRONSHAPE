import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Bot, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile } from './types';
import { ALL_WORKOUTS } from './data/workouts';
import { PHYSICAL_LIMITATION_OPTIONS } from './data/physicalLimitations';
import { sendMessage, AIProfile, Message } from './services/claudeService';

type LanguageCode = 'pt-BR' | 'en' | 'es';

const IRON_COACH_LIMITATION_OPTIONS = PHYSICAL_LIMITATION_OPTIONS.filter(option => ![
  'Costas/dorsal',
  'Cervical/pescoço',
  'Cotovelo',
  'Punho/mão',
  'Quadril',
  'Tornozelo',
  'Pé/fascite plantar',
  'Dor ciática',
  'Tendinite/bursite',
  'Artrose/artrite',
  'Pós-cirúrgico',
  'Asma/respiratória',
  'Gestação/pós-parto',
  'Mais de uma limitação',
].includes(option));

// ─── Onboarding config ────────────────────────────────────────────────────────

const STEPS_PT = [
  {
    id: 'trainingDays',
    title: 'Quantos dias por semana você pode treinar?',
    subtitle: 'Isso define sua frequência semanal ideal.',
    type: 'single' as const,
    options: ['3 dias', '4 dias', '5 dias', '6+ dias'],
  },
  {
    id: 'experience',
    title: 'Há quanto tempo você treina?',
    subtitle: 'Isso ajusta a complexidade das recomendações.',
    type: 'single' as const,
    options: ['Menos de 6 meses', '6 meses a 2 anos', '2 a 5 anos', 'Mais de 5 anos'],
  },
  {
    id: 'limitations',
    title: 'Você tem alguma limitação física?',
    subtitle: 'Selecione todas que se aplicam.',
    type: 'multi' as const,
    options: IRON_COACH_LIMITATION_OPTIONS,
  },
  {
    id: 'priorityMuscles',
    title: 'Quais grupos musculares quer priorizar?',
    subtitle: 'Selecione até 3.',
    type: 'multi' as const,
    options: ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen'],
    max: 3,
  },
  {
    id: 'sessionDuration',
    title: 'Quanto tempo você tem por treino?',
    subtitle: 'Incluindo aquecimento e alongamento.',
    type: 'single' as const,
    options: ['30–45 min', '45–60 min', '60–90 min', 'Mais de 90 min'],
  },
];

const IRON_COACH_TEXT: Record<LanguageCode, {
  initialSetup: string;
  start: string;
  next: string;
  reset: string;
  daysPerWeek: (days: number) => string;
  greeting: (name: string) => string;
  intro: string;
  thinking: string;
  placeholder: string;
  upgradeText: string;
  benefits: string[];
  viewPlans: string;
  error: string;
  suggestions: string[];
}> = {
  'pt-BR': {
    initialSetup: 'Configuração inicial',
    start: 'Começar',
    next: 'Próximo',
    reset: 'Reiniciar configuração',
    daysPerWeek: days => `${days} dias/semana`,
    greeting: name => `Olá, ${name}!`,
    intro: 'Sou seu personal trainer virtual. Me pergunte sobre treinos, exercícios, nutrição ou motivação.',
    thinking: 'Pensando...',
    placeholder: 'Pergunte qualquer coisa...',
    upgradeText: 'Seu personal trainer com IA adaptativa está disponível nos planos Pro e Elite.',
    benefits: [
      'Recomendações personalizadas ao seu perfil',
      'Ajusta treinos com base na sua evolução',
      'Chat ilimitado com seu coach 24/7',
    ],
    viewPlans: 'Ver planos',
    error: 'Erro ao conectar com o Iron Coach. Tente novamente.',
    suggestions: [
      'Qual treino é melhor para hoje?',
      'Como faço para ganhar mais massa?',
      'Me dá uma dica de alimentação pré-treino',
      'Estou sem disposição, o que fazer?',
    ],
  },
  en: {
    initialSetup: 'Initial setup',
    start: 'Start',
    next: 'Next',
    reset: 'Reset setup',
    daysPerWeek: days => `${days} days/week`,
    greeting: name => `Hi, ${name}!`,
    intro: 'I am your virtual personal trainer. Ask me about workouts, exercises, nutrition, or motivation.',
    thinking: 'Thinking...',
    placeholder: 'Ask anything...',
    upgradeText: 'Your adaptive AI personal trainer is available on the Pro and Elite plans.',
    benefits: [
      'Recommendations personalized to your profile',
      'Adjusts workouts based on your progress',
      'Unlimited chat with your coach 24/7',
    ],
    viewPlans: 'View plans',
    error: 'Error connecting to Iron Coach. Please try again.',
    suggestions: [
      'What workout is best for today?',
      'How can I gain more muscle mass?',
      'Give me a pre-workout nutrition tip',
      'I feel low on energy, what should I do?',
    ],
  },
  es: {
    initialSetup: 'Configuración inicial',
    start: 'Comenzar',
    next: 'Siguiente',
    reset: 'Reiniciar configuración',
    daysPerWeek: days => `${days} días/semana`,
    greeting: name => `¡Hola, ${name}!`,
    intro: 'Soy tu entrenador personal virtual. Pregúntame sobre entrenos, ejercicios, nutrición o motivación.',
    thinking: 'Pensando...',
    placeholder: 'Pregunta cualquier cosa...',
    upgradeText: 'Tu entrenador personal con IA adaptativa está disponible en los planes Pro y Elite.',
    benefits: [
      'Recomendaciones personalizadas para tu perfil',
      'Ajusta entrenos con base en tu evolución',
      'Chat ilimitado con tu coach 24/7',
    ],
    viewPlans: 'Ver planes',
    error: 'Error al conectar con Iron Coach. Inténtalo de nuevo.',
    suggestions: [
      '¿Qué entreno es mejor para hoy?',
      '¿Cómo puedo ganar más masa muscular?',
      'Dame un consejo de alimentación pre-entreno',
      'Estoy sin energía, ¿qué hago?',
    ],
  },
};

const STEP_TRANSLATIONS: Record<Exclude<LanguageCode, 'pt-BR'>, typeof STEPS_PT> = {
  en: [
    {
      id: 'trainingDays',
      title: 'How many days per week can you train?',
      subtitle: 'This defines your ideal weekly frequency.',
      type: 'single' as const,
      options: ['3 days', '4 days', '5 days', '6+ days'],
    },
    {
      id: 'experience',
      title: 'How long have you been training?',
      subtitle: 'This adjusts the complexity of the recommendations.',
      type: 'single' as const,
      options: ['Less than 6 months', '6 months to 2 years', '2 to 5 years', 'More than 5 years'],
    },
    {
      id: 'limitations',
      title: 'Do you have any physical limitation?',
      subtitle: 'Select all that apply.',
      type: 'multi' as const,
      options: IRON_COACH_LIMITATION_OPTIONS,
    },
    {
      id: 'priorityMuscles',
      title: 'Which muscle groups do you want to prioritize?',
      subtitle: 'Select up to 3.',
      type: 'multi' as const,
      options: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'],
      max: 3,
    },
    {
      id: 'sessionDuration',
      title: 'How much time do you have per workout?',
      subtitle: 'Including warm-up and stretching.',
      type: 'single' as const,
      options: ['30-45 min', '45-60 min', '60-90 min', 'More than 90 min'],
    },
  ],
  es: [
    {
      id: 'trainingDays',
      title: '¿Cuántos días por semana puedes entrenar?',
      subtitle: 'Esto define tu frecuencia semanal ideal.',
      type: 'single' as const,
      options: ['3 días', '4 días', '5 días', '6+ días'],
    },
    {
      id: 'experience',
      title: '¿Hace cuánto tiempo entrenas?',
      subtitle: 'Esto ajusta la complejidad de las recomendaciones.',
      type: 'single' as const,
      options: ['Menos de 6 meses', '6 meses a 2 años', '2 a 5 años', 'Más de 5 años'],
    },
    {
      id: 'limitations',
      title: '¿Tienes alguna limitación física?',
      subtitle: 'Selecciona todas las que correspondan.',
      type: 'multi' as const,
      options: IRON_COACH_LIMITATION_OPTIONS,
    },
    {
      id: 'priorityMuscles',
      title: '¿Qué grupos musculares quieres priorizar?',
      subtitle: 'Selecciona hasta 3.',
      type: 'multi' as const,
      options: ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Abdomen'],
      max: 3,
    },
    {
      id: 'sessionDuration',
      title: '¿Cuánto tiempo tienes por entreno?',
      subtitle: 'Incluyendo calentamiento y estiramiento.',
      type: 'single' as const,
      options: ['30-45 min', '45-60 min', '60-90 min', 'Más de 90 min'],
    },
  ],
};

const getSteps = (language: LanguageCode) => language === 'pt-BR' ? STEPS_PT : STEP_TRANSLATIONS[language];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profileKey(userId: string) {
  return `ironcoach_profile_${userId}`;
}

function historyKey(userId: string) {
  return `ironcoach_history_${userId}`;
}

function hasPaidAccess(profile: UserProfile | null) {
  return !!profile && profile.subscriptionStatus === 'active' && (profile.plano === 'Pro' || profile.plano === 'Elite');
}

function visiblePlan(profile: UserProfile) {
  return hasPaidAccess(profile) ? profile.plano : 'Iniciante';
}

function parseAIProfile(answers: Record<string, string | string[]>): AIProfile {
  const trainingDaysAnswer = String(answers.trainingDays || '');
  const parsedDays = parseInt(trainingDaysAnswer, 10);

  const limitations = (answers.limitations as string[]) ?? [];
  const limitationsText = limitations.includes('Nenhuma')
    ? 'Nenhuma'
    : limitations.join(', ');

  return {
    trainingDays: Number.isFinite(parsedDays) ? parsedDays : 4,
    experience: (answers.experience as string) ?? '',
    limitations: limitationsText,
    priorityMuscles: (answers.priorityMuscles as string[]) ?? [],
    sessionDuration: (answers.sessionDuration as string) ?? '',
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OptionButton({
  label,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 font-medium text-sm
        ${selected
          ? 'bg-primary/20 border-primary text-primary'
          : disabled
          ? 'border-white/5 text-text-muted opacity-40 cursor-not-allowed'
          : 'border-white/10 text-text-primary hover:border-primary/50 hover:bg-primary/5'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${selected ? 'border-primary bg-primary' : 'border-white/30'}`} />
        {label}
      </div>
    </button>
  );
}

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
          <Bot size={16} className="text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
          ${isUser
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-surface border border-white/5 text-text-primary rounded-tl-sm'
          }`}
      >
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

function Onboarding({ language, onComplete }: { language: LanguageCode; onComplete: (answers: Record<string, string | string[]>) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const steps = getSteps(language);
  const current = steps[step];
  const text = IRON_COACH_TEXT[language];
  const value = answers[current.id];

  function toggleOption(option: string) {
    if (current.type === 'single') {
      setAnswers(prev => ({ ...prev, [current.id]: option }));
    } else {
      const prev = (answers[current.id] as string[]) ?? [];

      if (option === 'Nenhuma') {
        setAnswers(a => ({ ...a, [current.id]: prev.includes('Nenhuma') ? [] : ['Nenhuma'] }));
        return;
      }

      const withoutNenhuma = prev.filter(o => o !== 'Nenhuma');
      const max = current.max;

      if (withoutNenhuma.includes(option)) {
        setAnswers(a => ({ ...a, [current.id]: withoutNenhuma.filter(o => o !== option) }));
      } else if (!max || withoutNenhuma.length < max) {
        setAnswers(a => ({ ...a, [current.id]: [...withoutNenhuma, option] }));
      }
    }
  }

  function isSelected(option: string) {
    if (current.type === 'single') return value === option;
    return ((value as string[]) ?? []).includes(option);
  }

  function isDisabled(option: string) {
    if (current.type !== 'multi' || !current.max) return false;
    const selected = (value as string[]) ?? [];
    return selected.length >= current.max && !selected.includes(option);
  }

  function canAdvance() {
    if (current.type === 'single') return !!value;
    const selected = (value as string[]) ?? [];
    return selected.length > 0;
  }

  function next() {
    if (!canAdvance()) return;
    if (step === steps.length - 1) {
      onComplete(answers);
    } else {
      setStep(s => s + 1);
    }
  }

  const isLast = step === steps.length - 1;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-8 flex-shrink-0">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Sparkles size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-text-primary font-bold text-lg">Iron Coach</h2>
          <p className="text-text-muted text-xs">{text.initialSetup}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-5 sm:mb-8 flex-shrink-0">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-white/10'}`}
          />
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <h3 className="text-text-primary font-bold text-xl mb-1">{current.title}</h3>
          <p className="text-text-muted text-sm mb-6">{current.subtitle}</p>

          <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1 pb-2">
            {current.options.map(option => (
              <OptionButton
                key={option}
                label={option}
                selected={isSelected(option)}
                onClick={() => toggleOption(option)}
                disabled={isDisabled(option)}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Next button */}
      <button
        onClick={next}
        disabled={!canAdvance()}
        className={`mt-4 sm:mt-8 w-full min-h-[56px] px-5 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 flex-shrink-0 touch-manipulation
          ${canAdvance()
            ? 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
            : 'bg-white/5 text-text-muted cursor-not-allowed'
          }`}
      >
        {isLast ? text.start : text.next}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

function Chat({
  profile,
  aiProfile,
  history,
  onSend,
  loading,
  error,
  onReset,
  language,
}: {
  profile: UserProfile;
  aiProfile: AIProfile;
  history: Message[];
  onSend: (msg: string) => void;
  loading: boolean;
  error: string | null;
  onReset: () => void;
  language: LanguageCode;
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const text = IRON_COACH_TEXT[language];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    onSend(text);
  }

  const SUGGESTIONS = text.suggestions;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bot size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-text-primary font-bold">Iron Coach</h2>
            <p className="text-text-muted text-xs">
              {visiblePlan(profile)} · {text.daysPerWeek(aiProfile.trainingDays)}
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          title={text.reset}
          className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-2 min-h-0">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-text-primary font-semibold mb-1">{text.greeting(profile.name.split(' ')[0])}</p>
              <p className="text-text-muted text-sm max-w-xs">
                {text.intro}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="text-sm text-left px-4 py-3 rounded-xl border border-white/10 text-text-muted hover:text-text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <ChatBubble key={i} msg={msg} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={16} className="text-primary" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-surface border border-white/5 flex items-center gap-2">
              <Loader2 size={14} className="text-primary animate-spin" />
              <span className="text-text-muted text-sm">{text.thinking}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-4 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={text.placeholder}
          disabled={loading}
          className="flex-1 bg-surface border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0
            ${input.trim() && !loading
              ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
              : 'bg-white/5 text-text-muted cursor-not-allowed'
            }`}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Upgrade prompt ──────────────────────────────────────────────────────────

function UpgradePrompt({ language, onUpgrade }: { language: LanguageCode; onUpgrade: () => void }) {
  const text = IRON_COACH_TEXT[language];
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
        <Bot size={36} className="text-primary" />
      </div>
      <div>
        <h2 className="text-text-primary font-bold text-xl mb-2">Iron Coach</h2>
        <p className="text-text-muted text-sm max-w-xs leading-relaxed">
          {text.upgradeText}
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="flex items-start gap-3 text-left">
          <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-text-muted text-sm">{text.benefits[0]}</p>
        </div>
        <div className="flex items-start gap-3 text-left">
          <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-text-muted text-sm">{text.benefits[1]}</p>
        </div>
        <div className="flex items-start gap-3 text-left">
          <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-text-muted text-sm">{text.benefits[2]}</p>
        </div>
      </div>
      <button
        onClick={onUpgrade}
        className="w-full max-w-xs py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
      >
        {text.viewPlans}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIChat({
  profile,
  onUpgrade,
  isAdmin = false,
  language = 'pt-BR',
}: {
  profile: UserProfile | null;
  onUpgrade: () => void;
  isAdmin?: boolean;
  language?: LanguageCode;
}) {
  const [aiProfile, setAIProfile] = useState<AIProfile | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consumedPendingPrompt = useRef(false);

  const isPro = hasPaidAccess(profile) || isAdmin;

  // Load persisted profile and history
  useEffect(() => {
    if (!profile) return;
    const savedProfile = localStorage.getItem(profileKey(profile.id));
    if (savedProfile) setAIProfile(JSON.parse(savedProfile));

    const savedHistory = localStorage.getItem(historyKey(profile.id));
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, [profile?.id]);

  function handleOnboardingComplete(answers: Record<string, string | string[]>) {
    if (!profile) return;
    const parsed = parseAIProfile(answers);
    setAIProfile(parsed);
    localStorage.setItem(profileKey(profile.id), JSON.stringify(parsed));
  }

  async function handleSend(userMessage: string) {
    if (!profile || !aiProfile) return;

    const newHistory: Message[] = [...history, { role: 'user', content: userMessage }];
    setHistory(newHistory);
    setLoading(true);
    setError(null);

    try {
      const reply = await sendMessage(profile, aiProfile, ALL_WORKOUTS, history, userMessage);
      const finalHistory: Message[] = [...newHistory, { role: 'assistant', content: reply }];
      setHistory(finalHistory);
      localStorage.setItem(historyKey(profile.id), JSON.stringify(finalHistory));
    } catch (err) {
      setError(IRON_COACH_TEXT[language].error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!profile || !aiProfile || loading || consumedPendingPrompt.current) return;
    const key = `ironcoach_pending_prompt_${profile.id}`;
    const pendingPrompt = localStorage.getItem(key);
    if (!pendingPrompt) return;
    consumedPendingPrompt.current = true;
    localStorage.removeItem(key);
    void handleSend(pendingPrompt);
  }, [profile?.id, aiProfile, loading]);

  function handleReset() {
    if (!profile) return;
    localStorage.removeItem(profileKey(profile.id));
    localStorage.removeItem(historyKey(profile.id));
    setAIProfile(null);
    setHistory([]);
    setError(null);
  }

  if (!profile || !isPro) {
    return <UpgradePrompt language={language} onUpgrade={onUpgrade} />;
  }

  return (
    <AnimatePresence mode="wait">
      {!aiProfile ? (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-full"
        >
          <Onboarding language={language} onComplete={handleOnboardingComplete} />
        </motion.div>
      ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full"
        >
          <Chat
            profile={profile}
            aiProfile={aiProfile}
            history={history}
            onSend={handleSend}
            loading={loading}
            error={error}
            onReset={handleReset}
            language={language}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
