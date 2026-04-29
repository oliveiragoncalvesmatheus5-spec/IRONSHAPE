import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Loader2, Bot, Sparkles, ChevronRight, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile } from './types';
import { ALL_WORKOUTS } from './data/workouts';
import { sendMessage, AIProfile, Message } from './services/claudeService';

// ─── Onboarding config ────────────────────────────────────────────────────────

const STEPS = [
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
    options: ['Nenhuma', 'Joelho', 'Lombar / Coluna', 'Ombro', 'Tornozelo', 'Outra'],
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profileKey(userId: string) {
  return `ironcoach_profile_${userId}`;
}

function historyKey(userId: string) {
  return `ironcoach_history_${userId}`;
}

function parseAIProfile(answers: Record<string, string | string[]>): AIProfile {
  const daysMap: Record<string, number> = {
    '3 dias': 3,
    '4 dias': 4,
    '5 dias': 5,
    '6+ dias': 6,
  };

  const limitations = (answers.limitations as string[]) ?? [];
  const limitationsText = limitations.includes('Nenhuma')
    ? 'Nenhuma'
    : limitations.join(', ');

  return {
    trainingDays: daysMap[answers.trainingDays as string] ?? 4,
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

function Onboarding({ onComplete }: { onComplete: (answers: Record<string, string | string[]>) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const current = STEPS[step];
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
    if (step === STEPS.length - 1) {
      onComplete(answers);
    } else {
      setStep(s => s + 1);
    }
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Sparkles size={20} className="text-primary" />
        </div>
        <div>
          <h2 className="text-text-primary font-bold text-lg">Iron Coach</h2>
          <p className="text-text-muted text-xs">Configuração inicial</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((_, i) => (
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
          className="flex-1 flex flex-col"
        >
          <h3 className="text-text-primary font-bold text-xl mb-1">{current.title}</h3>
          <p className="text-text-muted text-sm mb-6">{current.subtitle}</p>

          <div className="flex flex-col gap-3 flex-1">
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
        className={`mt-8 w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200
          ${canAdvance()
            ? 'bg-primary text-white hover:bg-primary/90 active:scale-[0.98]'
            : 'bg-white/5 text-text-muted cursor-not-allowed'
          }`}
      >
        {isLast ? 'Começar' : 'Próximo'}
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
}: {
  profile: UserProfile;
  aiProfile: AIProfile;
  history: Message[];
  onSend: (msg: string) => void;
  loading: boolean;
  error: string | null;
  onReset: () => void;
}) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    onSend(text);
  }

  const SUGGESTIONS = [
    'Qual treino é melhor para hoje?',
    'Como faço para ganhar mais massa?',
    'Me dá uma dica de alimentação pré-treino',
    'Estou sem disposição, o que fazer?',
  ];

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
              {profile.plano} · {aiProfile.trainingDays} dias/semana
            </p>
          </div>
        </div>
        <button
          onClick={onReset}
          title="Reiniciar configuração"
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
              <p className="text-text-primary font-semibold mb-1">Olá, {profile.name.split(' ')[0]}!</p>
              <p className="text-text-muted text-sm max-w-xs">
                Sou seu personal trainer virtual. Me pergunte sobre treinos, exercícios, nutrição ou motivação.
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
              <span className="text-text-muted text-sm">Pensando...</span>
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
          placeholder="Pergunte qualquer coisa..."
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

function UpgradePrompt({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-6">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
        <Bot size={36} className="text-primary" />
      </div>
      <div>
        <h2 className="text-text-primary font-bold text-xl mb-2">Iron Coach</h2>
        <p className="text-text-muted text-sm max-w-xs leading-relaxed">
          Seu personal trainer com IA adaptativa está disponível nos planos <span className="text-primary font-semibold">Pro</span> e <span className="text-primary font-semibold">Elite</span>.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <div className="flex items-start gap-3 text-left">
          <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-text-muted text-sm">Recomendações personalizadas ao seu perfil</p>
        </div>
        <div className="flex items-start gap-3 text-left">
          <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-text-muted text-sm">Ajusta treinos com base na sua evolução</p>
        </div>
        <div className="flex items-start gap-3 text-left">
          <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-text-muted text-sm">Chat ilimitado com seu coach 24/7</p>
        </div>
      </div>
      <button
        onClick={onUpgrade}
        className="w-full max-w-xs py-4 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
      >
        Ver planos
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AIChat({
  profile,
  onUpgrade,
  isAdmin = false,
}: {
  profile: UserProfile | null;
  onUpgrade: () => void;
  isAdmin?: boolean;
}) {
  const [aiProfile, setAIProfile] = useState<AIProfile | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPro = profile?.plano === 'Pro' || profile?.plano === 'Elite' || isAdmin;

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
      setError('Erro ao conectar com o Iron Coach. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    if (!profile) return;
    localStorage.removeItem(profileKey(profile.id));
    localStorage.removeItem(historyKey(profile.id));
    setAIProfile(null);
    setHistory([]);
    setError(null);
  }

  if (!profile || !isPro) {
    return <UpgradePrompt onUpgrade={onUpgrade} />;
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
          <Onboarding onComplete={handleOnboardingComplete} />
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
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
