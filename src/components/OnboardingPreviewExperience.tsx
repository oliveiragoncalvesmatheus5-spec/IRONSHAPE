import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Dumbbell,
  Flame,
  Heart,
  Home,
  Repeat2,
  Stethoscope,
  Target,
  Zap,
} from 'lucide-react';
import { PHYSICAL_LIMITATION_OPTIONS } from '../data/physicalLimitations';
import type { Plan as AppPlan, UserProfile } from '../types';

type Plan = Extract<AppPlan, 'Iniciante' | 'Pro' | 'Elite'>;
type TrainingPlace = 'home' | 'gym' | 'hybrid';

type LeadFormData = {
  name: string;
  age: number;
  weight: number;
  height: number;
  goal: string;
  timeframe: string;
  trainingPlace: TrainingPlace;
  experience: string;
  daysPerWeek: number;
  sessionDuration: string;
  homeEquipment: string[];
  gymFocus: string[];
  limitations: string;
  challenge: string;
  plan: Plan;
};

type OnboardingExperienceProps = {
  user?: any;
  profile?: UserProfile | null;
  persist?: boolean;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<void>;
  onComplete?: (plan: AppPlan) => void;
};

const buildInitialLead = (user?: any, profile?: UserProfile | null): LeadFormData => ({
  name: profile?.name || user?.user_metadata?.full_name || 'Matheus',
  age: (profile?.age && profile.age > 0) ? profile.age : 25,
  weight: (profile?.weight && profile.weight > 0) ? profile.weight : 70,
  height: (profile?.height && profile.height > 0) ? profile.height : 175,
  goal: profile?.goal || 'Hipertrofia',
  timeframe: '90 dias',
  trainingPlace: 'home',
  experience: 'Iniciante',
  daysPerWeek: 3,
  sessionDuration: '30-45 min',
  homeEquipment: ['Nenhum'],
  gymFocus: ['Pernas'],
  limitations: 'Nenhuma',
  challenge: 'Consistência',
  plan: 'Pro',
});

const stepLabels = [
  'Identidade',
  'Objetivo',
  'Ponto de partida',
  'Ambiente',
  'Rotina',
  'Estrutura',
  'Ajustes finos',
  'Plano',
];

export function OnboardingPreviewExperience({ user, profile, persist = false, updateProfile, onComplete }: OnboardingExperienceProps) {
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lead, setLead] = useState<LeadFormData>(() => buildInitialLead(user, profile));

  const totalSteps = stepLabels.length;
  const progress = Math.round((step / totalSteps) * 100);

  const toggleListValue = (key: 'homeEquipment' | 'gymFocus', value: string, max = 4) => {
    setLead(prev => {
      const current = prev[key];
      if (value === 'Nenhum') {
        return { ...prev, [key]: current.includes('Nenhum') ? [] : ['Nenhum'] };
      }
      const cleaned = current.filter(item => item !== 'Nenhum');
      if (cleaned.includes(value)) {
        return { ...prev, [key]: cleaned.filter(item => item !== value) };
      }
      return { ...prev, [key]: [...cleaned, value].slice(0, max) };
    });
  };

  const recommendation = useMemo(() => {
    const home = lead.trainingPlace === 'home';
    const hybrid = lead.trainingPlace === 'hybrid';
    const hasEquipment = lead.homeEquipment.some(item => item !== 'Nenhum');
    const hasLimitation = lead.limitations !== 'Nenhuma';
    const title = home
      ? `Protocolo Casa ${lead.experience === 'Iniciante' ? 'Base' : 'Performance'}`
      : hybrid
        ? 'Protocolo Híbrido Inteligente'
        : `Protocolo Academia ${lead.goal}`;
    const why = home
      ? 'Baixo atrito, exercícios simples de executar e progressão por repetição para criar constância.'
      : hybrid
        ? 'Combina sessões fortes na academia com treinos curtos em casa para manter ritmo mesmo em semanas corridas.'
        : 'Usa máquinas, cargas e grupos prioritários para evoluir com mais controle.';
    const exercises = home
      ? [
          hasLimitation ? 'Mobilidade sem dor' : 'Mobilidade de quadril e tornozelo',
          hasEquipment ? 'Agachamento com carga disponível' : 'Agachamento livre controlado',
          'Flexão inclinada ou tradicional',
          'Prancha frontal',
        ]
      : [
          hasLimitation ? 'Aquecimento articular sem dor' : 'Aquecimento articular',
          'Composto principal',
          'Acessório para grupo prioritário',
          'Core anti-rotação',
        ];

    return {
      title,
      why,
      exercises,
      tags: [
        lead.trainingPlace === 'home' ? 'Casa' : lead.trainingPlace === 'gym' ? 'Academia' : 'Híbrido',
        lead.goal,
        `${lead.daysPerWeek}x/semana`,
        lead.sessionDuration,
        lead.challenge,
      ],
    };
  }, [lead]);

  const validations = [
    lead.name.trim().length > 0,
    lead.goal.length > 0 && lead.timeframe.length > 0,
    lead.age > 0 && lead.weight > 0 && lead.height > 0,
    !!lead.trainingPlace,
    lead.daysPerWeek > 0 && lead.sessionDuration.length > 0,
    lead.trainingPlace === 'gym' ? lead.gymFocus.length > 0 : lead.homeEquipment.length > 0,
    lead.limitations.length > 0 && lead.challenge.length > 0,
    lead.plan.length > 0,
  ];
  const currentStepValid = validations[step - 1];

  const goNext = () => {
    if (!currentStepValid) return;
    setStep(current => Math.min(totalSteps, current + 1));
  };

  const choosePlan = async (selectedPlan: Plan) => {
    setLead(current => ({ ...current, plan: selectedPlan }));
    if (!persist) {
      setCompleted(false);
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const isPaidPlan = selectedPlan === 'Pro' || selectedPlan === 'Elite';
      const activePlan: AppPlan = isPaidPlan ? 'Iniciante' : selectedPlan;
      const onboardingProfile = {
        trainingPlace: lead.trainingPlace,
        experience: lead.experience,
        daysPerWeek: lead.daysPerWeek,
        sessionDuration: lead.sessionDuration,
        homeEquipment: lead.homeEquipment,
        gymFocus: lead.gymFocus,
        limitations: lead.limitations,
        timeframe: lead.timeframe,
        challenge: lead.challenge,
        requestedPlan: selectedPlan,
        activePlan,
        recommendation,
        savedAt: new Date().toISOString(),
      };

      if (user?.id) {
        localStorage.setItem(`training_onboarding_${user.id}`, JSON.stringify(onboardingProfile));
        if (isPaidPlan) localStorage.setItem(`pending_checkout_plan_${user.id}`, selectedPlan);
      }

      if (updateProfile) {
        await updateProfile({
          name: lead.name,
          age: lead.age,
          weight: lead.weight,
          height: lead.height,
          goal: lead.goal,
          plano: activePlan,
          subscriptionStatus: 'inactive',
          updatedAt: new Date().toISOString(),
        } as Partial<UserProfile>);
      }

      onComplete?.(selectedPlan);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const optionClass = (active: boolean) => `w-full rounded-[22px] border p-4 text-left transition-all active:scale-[0.98] ${
    active
      ? 'border-primary bg-primary/10 text-text-primary shadow-lg shadow-primary/10'
      : 'border-white/10 bg-white/[0.045] text-text-secondary hover:border-white/20 hover:bg-white/[0.07]'
  }`;

  const chipClass = (active: boolean) => `min-h-[54px] rounded-2xl border px-3 text-sm font-black transition-all active:scale-[0.98] ${
    active
      ? 'border-primary bg-primary/10 text-primary'
      : 'border-white/10 bg-white/[0.045] text-text-secondary'
  }`;

  const labelClass = 'text-[10px] font-black uppercase tracking-widest text-text-muted';
  const inputClass = 'w-full min-h-[58px] rounded-[22px] border border-white/10 bg-white/[0.055] px-5 text-lg font-bold text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-primary shadow-inner';

  if (completed) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex justify-center overflow-y-auto px-4 py-[calc(18px+env(safe-area-inset-top))]">
        <div className="w-full max-w-md pb-6">
          <p className={labelClass}>Plano recomendado</p>
          <h1 className="mt-2 text-[30px] font-black leading-tight tracking-tight">Continue com o Pro.</h1>
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Pelo diagnóstico, o Pro é o melhor custo-benefício para sair do básico e manter evolução contínua.
          </p>

          <div className="mt-5 space-y-4">
            <PlanCard
              featured
              eyebrow="Melhor custo-benefício"
              title="Pro"
              description="Evolução contínua com IA, nutrição precisa e protocolos completos."
              price="R$ 29,90"
              suffix="/mês"
              daily="Menos de R$ 1 por dia"
              benefits={[
                'Tudo do plano Grátis',
                'Protocolos Pro para casa e academia',
                'Iron Coach IA 24h para adaptar seu treino',
                'Planejamento semanal com até 5 treinos',
                'Análises nutricionais ilimitadas por g/ml',
                'Registro de cargas e histórico completo',
                'Ranking global e evolução contínua',
              ]}
              buttonLabel="Quero evoluir com o Pro"
              disabled={isSubmitting}
              onSelect={() => choosePlan('Pro')}
            />

            <PlanCard
              eyebrow="Comece sem pagar"
              title="Iniciante"
              description="Crie sua base, organize a rotina e prove o método IronShape."
              price="Grátis"
              daily="Para sempre"
              benefits={[
                'Protocolos iniciais para casa, academia ou híbrido',
                'Planejamento semanal com até 3 treinos',
                'Calculadora e acompanhamento diário de macros',
                '3 análises de refeições com IA por dia',
                'Progresso corporal, pontos e comunidade',
                'Programa de afiliados',
              ]}
              buttonLabel="Plano atual"
              disabled={isSubmitting}
              mutedButton
              onSelect={() => choosePlan('Iniciante')}
            />

            <PlanCard
              eyebrow="Experiência completa"
              title="Elite"
              description="Máximo controle para quem quer treinar sem limites e ir além."
              price="R$ 39,90"
              suffix="/mês"
              daily="Menos de R$ 1,34 por dia"
              benefits={[
                'Tudo do Pro',
                'Protocolos Elite avançados e de competição',
                'Rotina completa com até 7 treinos por semana',
                'Planilha do Atleta para organizar sua semana',
                'Edição e personalização de treinos',
                'Mobilidade e alongamento em nível avançado',
                'Acesso antecipado aos novos protocolos',
              ]}
              buttonLabel="Quero a experiência completa"
              disabled={isSubmitting}
              onSelect={() => choosePlan('Elite')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex justify-center">
      <div className="relative min-h-screen w-full max-w-md overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_50%_0%,rgba(255,106,0,0.24),transparent_64%)]" />
        <div className="relative flex min-h-screen flex-col px-5 pb-[120px] pt-[calc(18px+env(safe-area-inset-top))]">
          <header className="mb-7">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-primary/20 bg-black shadow-[0_0_24px_rgba(255,106,0,0.18)]">
                  <img src="/ironshape-mark.jpeg" alt="IronShape" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">IronShape</p>
                  <p className="text-xs font-bold text-text-muted">Diagnóstico inicial</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-2 text-right">
                <p className={labelClass}>Passo</p>
                <p className="font-mono text-sm font-black text-primary">{step}/{totalSteps}</p>
              </div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </header>

          <div className="mb-5 rounded-[28px] border border-white/10 bg-surface/70 p-4 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={labelClass}>{stepLabels[step - 1]}</p>
                <p className="mt-1 text-sm font-bold text-text-secondary">Quanto mais contexto, menos treino genérico.</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Target size={22} />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.section
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22 }}
              className="flex-1"
            >
              {step === 1 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[34px] font-black leading-[0.98] tracking-tight">Como vamos te chamar?</h1>
                    <p className="mt-4 text-base leading-relaxed text-text-secondary">
                      A partir daqui o app monta uma experiência com a sua cara, sem parecer planilha de treino copiada.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Seu nome</label>
                    <input type="text" placeholder="Digite seu nome" value={lead.name} onChange={(e) => setLead({...lead, name: e.target.value})} className={inputClass} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[34px] font-black leading-[0.98] tracking-tight">Qual resultado você quer ver primeiro?</h1>
                    <p className="mt-4 text-base leading-relaxed text-text-secondary">
                      Isso define o tom do protocolo: volume, intensidade, recuperação e foco das primeiras semanas.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'Hipertrofia', label: 'Ganhar massa', icon: Dumbbell },
                      { value: 'Emagrecimento', label: 'Secar gordura', icon: Flame },
                      { value: 'Força', label: 'Ficar forte', icon: Zap },
                      { value: 'Condicionamento', label: 'Mais fôlego', icon: Activity },
                      { value: 'Mobilidade', label: 'Mover melhor', icon: Stethoscope },
                      { value: 'Saúde geral', label: 'Saúde e rotina', icon: Heart },
                    ].map(option => {
                      const Icon = option.icon;
                      return (
                        <button key={option.value} type="button" onClick={() => setLead({...lead, goal: option.value})} className={`${optionClass(lead.goal === option.value)} min-h-[116px]`}>
                          <Icon size={22} className={lead.goal === option.value ? 'text-primary' : 'text-text-muted'} />
                          <span className="mt-4 block text-base font-black leading-tight">{option.label}</span>
                          <span className="mt-1 block text-[10px] font-black uppercase tracking-widest text-text-muted">{option.value}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label className={labelClass}>Prazo em mente</label>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {['30 dias', '90 dias', 'Sem pressa'].map(timeframe => (
                        <button key={timeframe} type="button" onClick={() => setLead({...lead, timeframe})} className={chipClass(lead.timeframe === timeframe)}>
                          {timeframe}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[34px] font-black leading-[0.98] tracking-tight">Qual é seu ponto de partida?</h1>
                    <p className="mt-4 text-base leading-relaxed text-text-secondary">
                      Esses dados ajudam a calibrar meta, volume de treino e evolução sem prometer milagre.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className={labelClass}>Idade</label>
                      <input type="number" value={lead.age || ''} onChange={(e) => setLead({...lead, age: parseInt(e.target.value, 10) || 0})} className={inputClass} />
                    </div>
                    <div className="space-y-2">
                      <label className={labelClass}>Peso kg</label>
                      <input type="number" value={lead.weight || ''} onChange={(e) => setLead({...lead, weight: parseInt(e.target.value, 10) || 0})} className={inputClass} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className={labelClass}>Altura cm</label>
                      <input type="number" value={lead.height || ''} onChange={(e) => setLead({...lead, height: parseInt(e.target.value, 10) || 0})} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[34px] font-black leading-[0.98] tracking-tight">Onde esse treino precisa funcionar?</h1>
                    <p className="mt-4 text-base leading-relaxed text-text-secondary">
                      A melhor rotina é a que cabe na sua semana real, não só em um cenário perfeito.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: 'home', title: 'Em casa', desc: 'Baixo atrito, menos desculpas e treino com o que tiver.', icon: Home },
                      { id: 'gym', title: 'Academia', desc: 'Máquinas, cargas e progressão com mais controle.', icon: Dumbbell },
                      { id: 'hybrid', title: 'Casa + academia', desc: 'Flexível para semana corrida sem perder ritmo.', icon: Repeat2 },
                    ].map(option => {
                      const Icon = option.icon;
                      return (
                        <button key={option.id} type="button" onClick={() => setLead({...lead, trainingPlace: option.id as TrainingPlace})} className={optionClass(lead.trainingPlace === option.id)}>
                          <div className="flex items-center gap-4">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${lead.trainingPlace === option.id ? 'bg-primary/10 text-primary' : 'bg-white/5 text-text-muted'}`}>
                              <Icon size={22} />
                            </span>
                            <span>
                              <span className="block text-lg font-black">{option.title}</span>
                              <span className="mt-1 block text-sm leading-snug text-text-muted">{option.desc}</span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[34px] font-black leading-[0.98] tracking-tight">Quanto espaço existe na sua rotina?</h1>
                    <p className="mt-4 text-base leading-relaxed text-text-secondary">
                      Vamos ajustar frequência e duração para criar consistência antes de cobrar perfeição.
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Dias por semana</label>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {[3, 4, 5, 6].map(days => (
                        <button key={days} type="button" onClick={() => setLead({...lead, daysPerWeek: days})} className={`${chipClass(lead.daysPerWeek === days)} min-h-[72px] text-center`}>
                          <span className="block text-2xl font-black">{days}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">dias</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Tempo por treino</label>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {['20-30 min', '30-45 min', '45-60 min', '60+ min'].map(duration => (
                        <button key={duration} type="button" onClick={() => setLead({...lead, sessionDuration: duration})} className={chipClass(lead.sessionDuration === duration)}>
                          {duration}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Experiência atual</label>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {['Iniciante', 'Intermediário', 'Avançado'].map(experience => (
                        <button key={experience} type="button" onClick={() => setLead({...lead, experience})} className={chipClass(lead.experience === experience)}>
                          {experience}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[34px] font-black leading-[0.98] tracking-tight">{lead.trainingPlace === 'gym' ? 'O que você quer priorizar?' : 'O que você tem disponível?'}</h1>
                    <p className="mt-4 text-base leading-relaxed text-text-secondary">
                      {lead.trainingPlace === 'gym'
                        ? 'Escolha até três grupos para o app sugerir um caminho inicial mais direcionado.'
                        : 'Com isso o app evita recomendar exercício que depende de equipamento que você não tem.'}
                    </p>
                  </div>
                  {(lead.trainingPlace === 'home' || lead.trainingPlace === 'hybrid') && (
                    <div className="grid grid-cols-2 gap-3">
                      {['Nenhum', 'Halteres', 'Elástico', 'Barra fixa', 'Banco/cadeira', 'Colchonete'].map(item => (
                        <button key={item} type="button" onClick={() => toggleListValue('homeEquipment', item)} className={chipClass(lead.homeEquipment.includes(item))}>
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                  {(lead.trainingPlace === 'gym' || lead.trainingPlace === 'hybrid') && (
                    <div className="grid grid-cols-2 gap-3">
                      {['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen'].map(item => (
                        <button key={item} type="button" onClick={() => toggleListValue('gymFocus', item, 3)} className={chipClass(lead.gymFocus.includes(item))}>
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 7 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[34px] font-black leading-[0.98] tracking-tight">O que mais pode atrapalhar?</h1>
                    <p className="mt-4 text-base leading-relaxed text-text-secondary">
                      Aqui a gente identifica dores, limitações e a principal barreira para o protocolo nascer realista.
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Limitação física</label>
                    <select
                      value={lead.limitations}
                      onChange={(e) => setLead({...lead, limitations: e.target.value})}
                      className={`${inputClass} mt-3 appearance-none`}
                    >
                      {PHYSICAL_LIMITATION_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Maior dificuldade hoje</label>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {['Consistência', 'Tempo', 'Dieta', 'Motivação', 'Dor/lesão', 'Não saber treinar'].map(challenge => (
                        <button key={challenge} type="button" onClick={() => setLead({...lead, challenge})} className={chipClass(lead.challenge === challenge)}>
                          {challenge}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 8 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-[34px] font-black leading-[0.98] tracking-tight">Seu protocolo inicial está pronto.</h1>
                    <p className="mt-4 text-base leading-relaxed text-text-secondary">
                      Com base nas respostas, este é o primeiro direcionamento que o app pode apresentar ao lead.
                    </p>
                  </div>
                  <div className="rounded-[28px] border border-primary/20 bg-primary/10 p-5">
                    <div className="flex flex-wrap gap-2">
                      {recommendation.tags.map(tag => (
                        <span key={tag} className="rounded-xl border border-primary/20 bg-background/50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">{tag}</span>
                      ))}
                    </div>
                    <h3 className="mt-5 text-2xl font-black uppercase tracking-tight">{recommendation.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{recommendation.why}</p>
                    <div className="mt-5 space-y-2">
                      {recommendation.exercises.map(exercise => (
                        <div key={exercise} className="flex items-start gap-2 text-sm text-text-secondary">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
                          <span>{exercise}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.section>
          </AnimatePresence>

          <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-white/10 bg-background/95 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 backdrop-blur-xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(current => Math.max(1, current - 1))}
                disabled={step === 1}
                aria-label="Voltar"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] text-text-secondary transition-all disabled:opacity-30 active:scale-[0.96]"
              >
                <ArrowLeft size={20} />
              </button>
              <button
                type="button"
                onClick={step === totalSteps ? () => setCompleted(true) : goNext}
                disabled={!currentStepValid}
                className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary font-black text-text-primary shadow-xl shadow-primary/25 transition-all disabled:opacity-35 active:scale-[0.98]"
              >
                {step === totalSteps ? 'Ver planos' : 'Continuar'}
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type PlanCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  price: string;
  suffix?: string;
  daily: string;
  benefits: string[];
  buttonLabel: string;
  featured?: boolean;
  mutedButton?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

function PlanCard({
  eyebrow,
  title,
  description,
  price,
  suffix,
  daily,
  benefits,
  buttonLabel,
  featured = false,
  mutedButton = false,
  disabled = false,
  onSelect,
}: PlanCardProps) {
  return (
    <article className={`relative flex min-h-[560px] flex-col rounded-[30px] border bg-[#101010] p-7 shadow-2xl shadow-black/30 ${featured ? 'border-primary shadow-primary/10' : 'border-white/10'}`}>
      {featured && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-text-primary shadow-lg shadow-primary/30">
          Mais escolhido
        </div>
      )}
      <p className="text-[10px] font-black uppercase tracking-widest text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black uppercase leading-none tracking-tight">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-text-secondary">{description}</p>
      <div className="mt-6">
        <span className="text-[30px] font-black leading-none">{price}</span>
        {suffix && <span className="ml-1 text-sm font-bold text-text-muted">{suffix}</span>}
      </div>
      <p className="mt-2 border-b border-white/10 pb-4 text-[9px] font-black uppercase tracking-widest text-text-muted">{daily}</p>
      <ul className="mt-5 space-y-3">
        {benefits.map((benefit, index) => (
          <li key={`${title}-${index}`} className="flex items-start gap-3 text-sm leading-relaxed text-text-secondary">
            <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-black text-text-primary">
              <CheckCircle2 size={12} />
            </span>
            <span className={index === 0 && featured ? 'font-black text-text-primary' : undefined}>{benefit}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-7">
        <button
          type="button"
          disabled={disabled}
          onClick={onSelect}
          className={`min-h-[54px] w-full rounded-[18px] text-[11px] font-black uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 ${
            featured
              ? 'bg-primary text-text-primary shadow-xl shadow-primary/25'
              : mutedButton
                ? 'bg-white/60 text-black'
                : 'border border-white/10 bg-white/[0.055] text-text-primary'
          }`}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}
