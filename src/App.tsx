import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebase';
import { doc, setDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { UserProfile, Workout, WorkoutLog, ProgressLog, Post, Plan, Level, MuscleGroup } from './types';
import { ALL_WORKOUTS } from './data/workouts';
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
  User as UserIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function App() {
  const { user, profile, loading, signInWithGoogle, logout, isAdmin, simulatedPlan, setSimulatedPlan } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showRetry, setShowRetry] = useState(false);

  // Remove HTML loading screen when React takes over
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__removeAppLoading) {
      (window as any).__removeAppLoading();
    }
  }, []);

  // Show a retry button if loading takes longer than 6s
  useEffect(() => {
    if (!loading) { setShowRetry(false); return; }
    const t = setTimeout(() => setShowRetry(true), 6000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin" />
        </div>
        <p className="text-text-muted text-sm tracking-widest uppercase font-black">
          Iniciando sua jornada...
        </p>
        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
          >
            Tentar Novamente
          </button>
        )}
      </div>
    );
  }

  if (!user) {
    return <LoginView onLogin={signInWithGoogle} />;
  }

  if (!profile || profile.age === 0) {
    return <OnboardingView user={user} profile={profile} />;
  }

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans selection:bg-primary/30">
      {/* Sidebar / Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-2xl border-t border-white/5 z-50 md:top-0 md:bottom-0 md:left-0 md:w-24 md:flex-col md:border-r md:border-t-0 flex md:items-center">
        {/* Branding - Desktop Only */}
        <div className="hidden md:flex items-center justify-center h-24 w-full border-b border-white/5 mb-8">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Dumbbell className="text-text-primary" size={28} />
          </div>
        </div>

        <div className="flex justify-around items-center h-16 w-full md:flex-col md:h-auto md:gap-8 md:py-4">
          <NavItem icon={<TrendingUp size={24} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Início" />
          <NavItem icon={<Dumbbell size={24} />} active={activeTab === 'workouts'} onClick={() => setActiveTab('workouts')} label="Treinos" />
          <NavItem icon={<Apple size={24} />} active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} label="Dieta" />
          <NavItem icon={<Users size={24} />} active={activeTab === 'community'} onClick={() => setActiveTab('community')} label="Social" />
          {isAdmin && (
            <NavItem icon={<ShieldCheck size={24} />} active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label="Admin" />
          )}
        </div>

        <div className="hidden md:flex md:flex-col md:gap-8 md:mt-auto md:mb-12 w-full items-center">
          <NavItem icon={<Settings size={24} />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Ajustes" />
          <button 
            onClick={logout}
            className="p-3 rounded-2xl text-text-muted hover:text-error hover:bg-error/10 transition-all duration-300"
            title="Sair"
          >
            <LogOut size={24} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24 md:pl-24 md:pb-0 min-h-screen">
        {isAdmin && (
          <PlanSimulator 
            currentPlan={simulatedPlan || profile?.plan || 'Iniciante'} 
            onPlanChange={setSimulatedPlan} 
          />
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-8 max-w-7xl mx-auto"
          >
            {activeTab === 'dashboard' && <DashboardView profile={profile} />}
            {activeTab === 'workouts' && <WorkoutsView profile={profile} />}
            {activeTab === 'nutrition' && <NutritionView profile={profile} />}
            {activeTab === 'community' && <CommunityView profile={profile} />}
            {activeTab === 'settings' && <SettingsView profile={profile} logout={logout} />}
            {activeTab === 'admin' && isAdmin && <AdminView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, active, onClick, label }: { icon: React.ReactNode, active: boolean, onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-500 group relative ${active ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}
    >
      <div className={`p-3 rounded-2xl transition-all duration-500 relative ${active ? 'bg-primary/10 shadow-[0_0_20px_rgba(255,106,0,0.1)]' : 'group-hover:bg-white/5'}`}>
        {icon}
        {active && (
          <motion.div 
            layoutId="nav-glow"
            className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10"
          />
        )}
      </div>
      <span className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0'}`}>
        {label}
      </span>
      {active && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute -right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full hidden md:block"
        />
      )}
    </button>
  );
}

function LoginView({ onLogin }: { onLogin: () => void }) {
  const { signInWithEmail, signUpWithEmail, resetPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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
        await signUpWithEmail(email, password, name);
        setSuccess('Conta criada com sucesso! Redirecionando...');
      }
    } catch (err: any) {
      console.error('Registration/Login error details:', err);
      let message = 'Ocorreu um erro ao processar sua solicitação.';
      
      if (err.code === 'auth/email-already-in-use') message = 'Este email já está em uso.';
      if (err.code === 'auth/invalid-credential') message = 'Email ou senha incorretos.';
      if (err.code === 'auth/weak-password') message = 'A senha é muito fraca (mínimo 6 caracteres).';
      if (err.code === 'auth/user-not-found') message = 'Usuário não encontrado.';
      if (err.code === 'auth/wrong-password') message = 'Senha incorreta.';
      if (err.code === 'auth/invalid-email') message = 'O formato do email é inválido.';
      if (err.code === 'auth/operation-not-allowed') message = 'O cadastro por email não está ativado no Firebase Console. Por favor, ative "E-mail/senha" na aba Authentication.';
      if (err.code === 'permission-denied') message = 'Erro de permissão ao acessar o banco de dados.';
      
      // If we have a specific message from Firebase that isn't one of the above, use it
      if (message === 'Ocorreu um erro ao processar sua solicitação.' && err.message) {
        message = err.message;
      }
      
      setError(message);
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
      let message = 'Erro ao entrar com Google.';
      if (err.code === 'auth/popup-blocked') {
        message = 'O popup foi bloqueado pelo navegador. Por favor, permita popups para este site.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        message = 'O login foi cancelado.';
      } else if (err.code === 'auth/unauthorized-domain') {
        message = 'Este domínio não está autorizado no Firebase Console.';
      }
      setError(message);
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
            IRON SAAS
          </h1>
          <p className="text-text-muted text-sm">A evolução definitiva do seu treino.</p>
        </div>

        <div className="bg-surface p-8 rounded-[40px] border border-white/5 shadow-2xl">
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-text-primary outline-none focus:border-primary transition-all"
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-text-primary outline-none focus:border-primary transition-all"
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
                className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium"
              >
                {error}
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

function OnboardingView({ user, profile }: { user: any, profile: UserProfile | null }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [formData, setFormData] = useState({
    name: profile?.name || user.displayName || '',
    age: (profile?.age && profile.age > 0) ? profile.age : 25,
    weight: (profile?.weight && profile.weight > 0) ? profile.weight : 70,
    height: (profile?.height && profile.height > 0) ? profile.height : 175,
    goal: profile?.goal || 'Hipertrofia',
    plan: (profile?.plan && profile.plan !== 'free') ? profile.plan : 'Iniciante' as any
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profile,
        ...formData,
        uid: user.uid,
        email: user.email,
        role: profile?.role || 'user',
        subscriptionStatus: profile?.subscriptionStatus || 'inactive',
        points: profile?.points || 0,
        streak: profile?.streak || 0,
        createdAt: profile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      // AuthContext onSnapshot listener will pick this up and navigate away
    } catch (error) {
      console.error("Error creating profile:", error);
      setSubmitError('Erro ao salvar perfil. Verifique sua conexão e tente novamente.');
      setSubmitting(false);
    }
  };

  const isStep1Valid = formData.name.trim().length > 0 && formData.age > 0;
  const isStep2Valid = formData.weight > 0 && formData.height > 0 && formData.goal.length > 0;
  const isFormValid = isStep1Valid && isStep2Valid && formData.plan.length > 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-surface rounded-3xl p-8 border border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Configure seu Perfil</h2>
          <span className="text-primary font-mono text-sm">Passo {step}/3</span>
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Nome Completo</label>
              <input 
                type="text" 
                placeholder="Ex: João Silva"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Idade</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={() => setStep(2)} 
              disabled={!isStep1Valid}
              className="w-full bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              Próximo
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Peso (kg)</label>
                <input 
                  type="number" 
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Altura (cm)</label>
                <input 
                  type="number" 
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: parseInt(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Seu Objetivo</label>
              <div className="relative">
                <select 
                  value={formData.goal}
                  onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-inner"
                >
                  <option value="Hipertrofia" className="bg-surface">Hipertrofia</option>
                  <option value="Emagrecimento" className="bg-surface">Emagrecimento</option>
                  <option value="Condicionamento" className="bg-surface">Condicionamento</option>
                  <option value="Força" className="bg-surface">Força</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <ChevronRight size={18} className="rotate-90" />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-white/5 text-text-secondary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">Voltar</button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!isStep2Valid}
                className="flex-1 bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-[0.98]"
              >
                Próximo
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Escolha seu Plano Inicial</label>
            <div className="space-y-3">
              {['Iniciante', 'Pro', 'Elite'].map((p) => (
                <button 
                  key={p}
                  onClick={() => setFormData({...formData, plan: p as any})}
                  className={`w-full p-5 rounded-2xl border transition-all text-left flex justify-between items-center group ${formData.plan === p ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-black text-lg">{p}</span>
                    <span className="text-[10px] uppercase tracking-widest opacity-60">
                      {p === 'Iniciante' ? 'Básico • R$29,90' : p === 'Pro' ? 'IA + Histórico • R$59,90' : 'Consultoria • R$99,90'}
                    </span>
                  </div>
                  {formData.plan === p ? (
                    <CheckCircle2 size={24} className="text-primary" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-white/10 group-hover:border-white/20" />
                  )}
                </button>
              ))}
            </div>
            {submitError && (
              <p className="text-red-400 text-sm text-center -mt-2">{submitError}</p>
            )}
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} disabled={submitting} className="flex-1 bg-white/5 text-text-secondary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed">Voltar</button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || submitting}
                className="flex-1 bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Finalizar'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DashboardView({ profile }: { profile: UserProfile }) {
  const { isAdmin, simulatedPlan } = useAuth();
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plan;

  const weightData = [
    { name: 'Seg', weight: 70 },
    { name: 'Ter', weight: 69.8 },
    { name: 'Qua', weight: 70.2 },
    { name: 'Qui', weight: 69.5 },
    { name: 'Sex', weight: 69.2 },
    { name: 'Sab', weight: 69.0 },
    { name: 'Dom', weight: 68.8 },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[48px] bg-surface border border-white/5 p-8 md:p-12">
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
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
              BOM TRABALHO, <br />
              <span className="text-primary">{profile.name.split(' ')[0].toUpperCase()}!</span>
            </h1>
            <p className="text-text-secondary text-lg max-w-md leading-relaxed">
              "A disciplina é a ponte entre metas e realizações." Você já completou <span className="text-text-primary font-bold">85%</span> da sua meta semanal.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="bg-primary text-text-primary px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary-hover hover:scale-105 transition-all active:scale-95 flex items-center gap-2">
                INICIAR TREINO DE HOJE
                <ArrowRight size={18} />
              </button>
              <div className="flex items-center gap-4 px-6 py-4 bg-white/5 rounded-2xl border border-white/10">
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
            <div className="w-64 h-64 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent -rotate-45" />
              <div className="text-center">
                <div className="text-5xl font-black">85%</div>
                <div className="text-[10px] font-black text-text-muted uppercase tracking-widest">Meta Semanal</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Peso Atual" 
          value={`${profile.weight} kg`} 
          subValue="-1.2kg esta semana" 
          icon={<TrendingUp size={20} />} 
          trend="up" 
        />
        <MetricCard 
          label="Próximo Treino" 
          value="Peito & Tríceps" 
          subValue="Hoje às 18:00" 
          icon={<Calendar size={20} />} 
        />
        <MetricCard 
          label="Calorias Diárias" 
          value="2.400 kcal" 
          subValue="Meta: 2.600 kcal" 
          icon={<Apple size={20} />} 
        />
        <MetricCard 
          label="Nível de Energia" 
          value="Alta" 
          subValue="Baseado no sono" 
          icon={<Zap size={20} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-surface p-8 rounded-[40px] border border-white/5 hover:border-primary/20 transition-all duration-500 space-y-8 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase">Evolução de Peso</h3>
              <p className="text-sm text-text-muted">Seu progresso nos últimos 7 dias</p>
            </div>
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
              <button className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-text-primary shadow-lg shadow-primary/20">7D</button>
              <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-text-muted hover:text-text-secondary transition-colors">1M</button>
              <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-text-muted hover:text-text-secondary transition-colors">6M</button>
            </div>
          </div>
          
          <div className="h-[320px] w-full relative">
            {weightData && weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6A00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF6A00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#6F6F6F" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#121212', 
                    border: '1px solid #ffffff10', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}
                  itemStyle={{ color: '#FF6A00', fontWeight: 'bold' }}
                  cursor={{ stroke: '#FF6A00', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#FF6A00" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </div>

        {/* Nutrition Preview */}
        <div className="bg-surface p-8 rounded-[40px] border border-white/5 hover:border-primary/20 transition-all duration-500 space-y-8 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-tight uppercase">Nutrição</h3>
            <button className="text-primary text-xs font-black uppercase tracking-widest hover:text-primary-hover transition-colors">Ver Tudo</button>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-text-muted">Calorias</span>
                <span className="text-text-primary">1.840 / 2.400 kcal</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '76%' }}
                  className="h-full bg-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-[20px] border border-white/5 hover:border-primary/20 transition-all duration-300 group/m">
                <div className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1.5">Prot</div>
                <div className="text-sm font-black group-hover/m:text-primary transition-colors duration-300">142g</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-[20px] border border-white/5 hover:border-primary/20 transition-all duration-300 group/m">
                <div className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1.5">Carb</div>
                <div className="text-sm font-black group-hover/m:text-primary transition-colors duration-300">185g</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-[20px] border border-white/5 hover:border-primary/20 transition-all duration-300 group/m">
                <div className="text-[9px] text-text-muted font-black uppercase tracking-widest mb-1.5">Gord</div>
                <div className="text-sm font-black group-hover/m:text-primary transition-colors duration-300">54g</div>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <h4 className="text-xs font-black text-text-muted uppercase tracking-widest">Próxima Refeição</h4>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Utensils size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold">Almoço</div>
                  <div className="text-[10px] text-text-muted">Frango, Arroz e Salada</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction icon={<Plus />} label="Log Treino" color="bg-primary" />
        <QuickAction icon={<Plus />} label="Log Peso" color="bg-surface border border-white/10" />
        <QuickAction icon={<Plus />} label="Log Dieta" color="bg-surface border border-white/10" />
        <QuickAction icon={<Plus />} label="Nova Foto" color="bg-surface border border-white/10" />
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon, trend }: { label: string, value: string, subValue: string, icon: React.ReactNode, trend?: 'up' | 'down' }) {
  return (
    <div className="bg-surface p-8 rounded-[40px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-black/20">
      <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 text-primary">
        {icon}
      </div>
      <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-primary/0 group-hover:bg-primary/40 rounded-full transition-all duration-500" />
      <div className="relative z-10 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-[9px] font-black uppercase tracking-[0.25em]">{label}</span>
          <div className="p-2.5 rounded-2xl bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 border border-white/5 group-hover:border-primary/20 transition-all duration-500">
            {icon}
          </div>
        </div>
        <div>
          <div className="text-3xl font-black tracking-tight group-hover:translate-x-1 transition-transform duration-500">{value}</div>
          <div className={`mt-1.5 text-[10px] font-black flex items-center gap-1 uppercase tracking-widest ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-muted'}`}>
            {trend === 'up' && <TrendingUp size={10} />}
            {subValue}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <button className="flex items-center gap-4 p-6 bg-surface rounded-[32px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-black/20 active:scale-95">
      <div className={`p-3 rounded-2xl ${color} text-text-primary group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-black/20 border border-white/5`}>
        {icon}
      </div>
      <span className="font-black text-[10px] uppercase tracking-[0.15em]">{label}</span>
      <div className="ml-auto p-2 rounded-xl bg-white/0 group-hover:bg-primary/10 text-text-muted group-hover:text-primary transition-all duration-500">
        <ChevronRight size={16} />
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-0 group-hover:opacity-5 transition-opacity duration-700 text-primary">
        {icon}
      </div>
    </button>
  );
}

function WorkoutsView({ profile }: { profile: UserProfile }) {
  const { isAdmin, simulatedPlan } = useAuth();
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plan;
  const [selectedPlanTab, setSelectedPlanTab] = useState<Plan>(effectivePlan);
  const [selectedLevel, setSelectedLevel] = useState<Level>('Iniciante');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedWorkouts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
  }, [completedWorkouts]);

  const plans: { id: Plan, label: string, desc: string }[] = [
    { id: 'Iniciante', label: 'INICIANTE', desc: 'Fundamentos e adaptação' },
    { id: 'Pro', label: 'PRO', desc: 'IA e performance avançada' },
    { id: 'Elite', label: 'ELITE', desc: 'Protocolos de competição' }
  ];

  const muscleGroups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Full Body'];

  const hasAccess = (planId: Plan) => {
    const weights = { 'Iniciante': 1, 'Pro': 2, 'Elite': 3 };
    return weights[effectivePlan] >= weights[planId];
  };

  const toggleComplete = (workoutId: string) => {
    setCompletedWorkouts(prev => 
      prev.includes(workoutId) 
        ? prev.filter(id => id !== workoutId) 
        : [...prev, workoutId]
    );
  };

  if (selectedWorkout) {
    return (
      <WorkoutDetailView 
        workout={selectedWorkout} 
        onBack={() => setSelectedWorkout(null)} 
        isCompleted={completedWorkouts.includes(selectedWorkout.id)}
        onToggleComplete={() => toggleComplete(selectedWorkout.id)}
      />
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Meus Treinos</h1>
        </div>
        <p className="text-text-secondary text-lg">Protocolos de treinamento personalizados para sua evolução.</p>
      </header>

      {/* Plan Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlanTab(p.id)}
            className={`relative p-8 rounded-[32px] border transition-all duration-700 text-left overflow-hidden group ${
              selectedPlanTab === p.id 
                ? 'bg-surface border-primary shadow-[0_20px_40px_rgba(0,0,0,0.4)]' 
                : 'bg-surface/40 border-white/5 hover:border-white/10'
            }`}
          >
            <div className="relative z-10 space-y-3">
              <div className={`text-[10px] uppercase tracking-[0.3em] font-black transition-colors duration-500 ${selectedPlanTab === p.id ? 'text-primary' : 'text-text-muted'}`}>
                {p.label}
              </div>
              <div className="text-2xl font-black text-text-primary">{p.id}</div>
              <div className="text-sm text-text-muted leading-relaxed max-w-[200px]">{p.desc}</div>
            </div>
            
            <div className={`absolute -right-8 -bottom-8 opacity-5 transition-all duration-700 group-hover:scale-110 ${selectedPlanTab === p.id ? 'opacity-10 text-primary' : 'text-text-muted'}`}>
              <Dumbbell size={120} />
            </div>

            {selectedPlanTab === p.id && (
              <motion.div 
                layoutId="plan-glow"
                className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"
              />
            )}
          </button>
        ))}
      </div>

      {/* Level Filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
          {(['Iniciante', 'Intermediário'] as Level[]).map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                selectedLevel === level 
                  ? 'bg-primary text-text-primary shadow-xl shadow-primary/20' 
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[500px]">
        {!hasAccess(selectedPlanTab) ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 bg-surface/40 backdrop-blur-xl rounded-[48px] border border-white/5 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
              <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-primary rounded-full blur-[120px]" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl rotate-12">
                <Lock className="text-primary" size={40} />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black tracking-tighter uppercase">Acesso Restrito</h3>
                <p className="text-text-secondary max-w-sm mx-auto text-lg leading-relaxed">
                  O módulo <span className="text-text-primary font-black">{selectedPlanTab}</span> faz parte dos nossos protocolos premium de treinamento.
                </p>
              </div>
              <button className="bg-primary text-text-primary font-black px-12 py-5 rounded-[24px] hover:bg-primary-hover hover:scale-105 transition-all shadow-2xl shadow-primary/30 active:scale-95 flex items-center gap-3 mx-auto">
                FAZER UPGRADE AGORA
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-16">
            {muscleGroups.map((group) => {
              const groupWorkouts = ALL_WORKOUTS.filter(w => 
                w.muscleGroup === group && 
                w.level === selectedLevel &&
                (selectedPlanTab === 'Elite' || w.planRequired === selectedPlanTab || (selectedPlanTab === 'Pro' && w.planRequired === 'Iniciante'))
              );

              if (groupWorkouts.length === 0) return null;

              return (
                <section key={group} className="space-y-8">
                  <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-black tracking-tight uppercase">{group}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {groupWorkouts.map((workout) => (
                      <WorkoutCard 
                        key={workout.id} 
                        workout={workout} 
                        isCompleted={completedWorkouts.includes(workout.id)}
                        onClick={() => setSelectedWorkout(workout)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutCard({ workout, isCompleted, onClick }: { workout: Workout, isCompleted: boolean, onClick: () => void }) {
  const accent = isCompleted ? '#22C55E' : '#FF6B00';
  const accentRgb = isCompleted ? '34,197,94' : '255,107,0';

  return (
    <button
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, #1e1e1e 0%, ${isCompleted ? '#0e2a1a' : '#2a1a0e'} 100%)`,
        border: `2px solid ${accent}`,
        boxShadow: `0 0 24px rgba(${accentRgb}, 0.30), 0 8px 32px rgba(0,0,0,0.4)`,
        borderRadius: '24px',
      }}
      className="p-7 relative overflow-hidden flex flex-col text-left w-full active:scale-[0.97] transition-transform duration-150"
    >
      {/* Dumbbell watermark */}
      <div className="absolute top-0 right-0 p-6 pointer-events-none" style={{ opacity: 0.08, color: accent }}>
        <Dumbbell size={110} />
      </div>
      {/* Inner glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, rgba(${accentRgb},0.08) 0%, transparent 65%)` }}
      />

      {/* Completed check */}
      {isCompleted && (
        <div className="absolute top-5 right-5 z-20 p-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 12px rgba(${accentRgb},0.5)` }}>
          <CheckCircle2 size={16} className="text-white" />
        </div>
      )}

      <div className="relative z-10 flex-1 space-y-7">

        {/* Badge + Title */}
        <div className="space-y-3">
          <span
            style={{
              background: `rgba(${accentRgb}, 0.18)`,
              color: accent,
              border: `1px solid rgba(${accentRgb}, 0.35)`,
            }}
            className="inline-block px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest"
          >
            NÍVEL {workout.level.toUpperCase()}
          </span>
          {isCompleted && (
            <span className="ml-2 text-[8px] font-black uppercase tracking-widest" style={{ color: accent }}>
              Concluído
            </span>
          )}
          <h3 className="text-2xl font-black tracking-tight leading-tight" style={{ color: accent }}>
            {workout.name}
          </h3>
        </div>

        {/* Sub-cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Exercícios', value: workout.exercises.length },
            { label: 'Duração', value: workout.duration },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: `1px solid rgba(${accentRgb}, 0.20)`,
                borderRadius: '16px',
              }}
              className="p-4"
            >
              <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1.5">{label}</div>
              <div className="text-lg font-black text-white">{value}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          {/* Avatars */}
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full overflow-hidden"
                style={{ border: '2px solid #1e1e1e' }}
              >
                <img
                  src={`https://picsum.photos/seed/${workout.id + i}/32/32`}
                  alt="User"
                  className="w-full h-full object-cover opacity-70"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-black text-text-muted"
              style={{ border: '2px solid #1e1e1e', background: 'rgba(255,255,255,0.08)' }}
            >
              +12
            </div>
          </div>

          {/* Arrow button — always accent color */}
          <div
            className="p-3 rounded-2xl text-white flex items-center justify-center"
            style={{
              background: accent,
              boxShadow: `0 4px 16px rgba(${accentRgb}, 0.50)`,
            }}
          >
            <ChevronRight size={20} />
          </div>
        </div>

      </div>
    </button>
  );
}

function WorkoutDetailView({ workout, onBack, isCompleted, onToggleComplete }: { workout: Workout, onBack: () => void, isCompleted: boolean, onToggleComplete: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12 pb-20"
    >
      <header className="relative space-y-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
        >
          <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all">
            <ArrowLeft size={20} />
          </div>
          <span className="text-sm font-black uppercase tracking-widest">Voltar para Treinos</span>
        </button>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
              {workout.muscleGroup.toUpperCase()}
            </span>
            <span className="px-4 py-1.5 rounded-full bg-white/5 text-text-secondary text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
              {workout.level.toUpperCase()}
            </span>
            {isCompleted && (
              <span className="px-4 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-[0.2em] border border-success/20 flex items-center gap-2">
                <CheckCircle2 size={12} /> CONCLUÍDO
              </span>
            )}
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">{workout.name}</h1>
          <p className="text-text-secondary text-xl max-w-3xl leading-relaxed font-medium">{workout.description}</p>
          
          <div className="flex flex-wrap gap-8 pt-4">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/5 text-primary border border-white/5">
                <Clock size={24} />
              </div>
              <div>
                <div className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Duração</div>
                <div className="text-xl font-black">{workout.duration}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/5 text-primary border border-white/5">
                <Zap size={24} />
              </div>
              <div>
                <div className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Carga</div>
                <div className="text-xl font-black">{workout.carga}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-white/5 text-primary border border-white/5">
                <Dumbbell size={24} />
              </div>
              <div>
                <div className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Exercícios</div>
                <div className="text-xl font-black">{workout.exercises.length}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <h2 className="text-3xl font-black tracking-tight uppercase">Protocolo de Exercícios</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {workout.exercises.map((exercise, index) => (
            <div key={exercise.id} className="bg-surface p-8 rounded-[40px] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 group hover:border-white/10 transition-all duration-500">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center text-2xl font-black text-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500 border border-white/5">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-black tracking-tight">{exercise.name}</h4>
                  <p className="text-text-secondary max-w-md leading-relaxed">{exercise.description}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-8 md:gap-12">
                <div className="text-center space-y-1">
                  <div className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Séries</div>
                  <div className="text-3xl font-black text-primary">{exercise.series}</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Reps</div>
                  <div className="text-3xl font-black text-primary">{exercise.reps}</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">Descanso</div>
                  <div className="text-3xl font-black text-text-primary">{exercise.restTime}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-12 sticky bottom-8">
        <button 
          onClick={onToggleComplete}
          className={`w-full py-6 rounded-[32px] font-black text-xl shadow-2xl transition-all duration-500 active:scale-[0.98] flex items-center justify-center gap-4 ${
            isCompleted 
              ? 'bg-success text-text-primary shadow-success/20' 
              : 'bg-primary text-text-primary shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02]'
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 size={28} />
              TREINO CONCLUÍDO
            </>
          ) : (
            <>
              CONCLUIR TREINO DE HOJE
              <ArrowRight size={28} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

function NutritionView({ profile }: { profile: UserProfile }) {
  const { isAdmin, simulatedPlan } = useAuth();
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plan;

  const [calcData, setCalcData] = useState({
    weight: profile.weight.toString(),
    height: profile.height.toString(),
    age: profile.age.toString(),
    gender: 'male' as 'male' | 'female',
    activityLevel: '1.55',
    goal: 'maintain' as 'lose' | 'maintain' | 'gain'
  });

  const [results, setResults] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  const [customMacros, setCustomMacros] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  const calculateMacros = () => {
    const w = parseFloat(calcData.weight);
    const h = parseFloat(calcData.height);
    const a = parseFloat(calcData.age);
    const activity = parseFloat(calcData.activityLevel);

    let bmr = 0;
    if (calcData.gender === 'male') {
      bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
    } else {
      bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
    }

    let tdee = bmr * activity;

    if (calcData.goal === 'lose') tdee -= 500;
    if (calcData.goal === 'gain') tdee += 500;

    const calories = Math.round(tdee);
    const protein = Math.round(w * 2); // 2g per kg
    const fat = Math.round(w * 0.8); // 0.8g per kg
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4);

    setResults({ calories, protein, carbs, fat });
  };

  const hasPro = effectivePlan === 'Pro' || effectivePlan === 'Elite';
  const hasElite = effectivePlan === 'Elite';

  return (
    <div className="space-y-16 pb-24">
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Nutrição & Dieta</h1>
        </div>
        <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
          Otimize sua performance com protocolos nutricionais baseados em ciência e adaptados ao seu metabolismo.
        </p>
      </header>

      {/* Calculadora de Macros */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <Calculator size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Calculadora Metabólica</h2>
          </div>
          <span className="px-3 py-1 bg-white/5 text-text-muted text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10">
            MÓDULO INICIANTE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 bg-surface p-10 rounded-[48px] border border-white/5 space-y-8 shadow-2xl">
            <div className="grid grid-cols-2 gap-6">
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
                <div className="relative">
                  <select 
                    value={calcData.gender}
                    onChange={(e) => setCalcData({...calcData, gender: e.target.value as any})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                  </select>
                  <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Nível de Atividade</label>
              <div className="relative">
                <select 
                  value={calcData.activityLevel}
                  onChange={(e) => setCalcData({...calcData, activityLevel: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-inner"
                >
                  <option value="1.2">Sedentário (Pouco ou nenhum exercício)</option>
                  <option value="1.375">Levemente Ativo (1-3 dias/semana)</option>
                  <option value="1.55">Moderadamente Ativo (3-5 dias/semana)</option>
                  <option value="1.725">Muito Ativo (6-7 dias/semana)</option>
                  <option value="1.9">Extra Ativo (Treino pesado 2x/dia)</option>
                </select>
                <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted rotate-90" />
              </div>
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
              className="w-full py-5 bg-primary text-text-primary rounded-[24px] font-black text-sm shadow-2xl shadow-primary/30 hover:bg-primary-hover hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              CALCULAR PROTOCOLO
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="lg:col-span-7 bg-surface p-10 rounded-[48px] border border-white/5 flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-10">
              <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-primary rounded-full blur-[120px]" />
            </div>

            {!results ? (
              <div className="relative z-10 text-center space-y-6 py-20">
                <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto text-text-muted border border-white/5 shadow-inner">
                  <Info size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight uppercase">Aguardando Parâmetros</h3>
                  <p className="text-text-secondary max-w-xs mx-auto text-lg leading-relaxed">
                    Preencha suas informações biométricas para gerar seu protocolo nutricional.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative z-10 space-y-12">
                <div className="text-center space-y-2">
                  <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">META DIÁRIA ESTIMADA</div>
                  <div className="text-7xl md:text-8xl font-black text-primary tracking-tighter leading-none">
                    {(customMacros || results).calories} 
                    <span className="text-2xl text-text-muted font-black ml-2 uppercase tracking-widest">kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <MacroResultCard label="Proteínas" value={(customMacros || results).protein} unit="g" color="bg-primary" />
                  <MacroResultCard label="Carboidratos" value={(customMacros || results).carbs} unit="g" color="bg-white/10" />
                  <MacroResultCard label="Gorduras" value={(customMacros || results).fat} unit="g" color="bg-white/10" />
                </div>

                <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 flex items-start gap-6 backdrop-blur-md">
                  <div className="p-4 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                    <Zap size={28} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black uppercase tracking-tight">Análise do Protocolo</h4>
                    <p className="text-text-secondary leading-relaxed">
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

      {/* Dieta Personalizada - Plano Pro */}
      <section className="space-y-8 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <Utensils size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Plano Alimentar Estratégico</h2>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
            MÓDULO PRO
          </span>
        </div>

        {!hasPro ? (
          <LockedFeatureOverlay 
            title="Desbloqueie sua Dieta Personalizada" 
            description="Receba sugestões de refeições completas baseadas no seu objetivo de emagrecimento, manutenção ou ganho de massa."
            plan="Pro"
          />
        ) : (
          <div className="bg-surface rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight uppercase">Sugestão de Cardápio</h3>
                <p className="text-text-secondary font-medium">Protocolo otimizado para {calcData.goal === 'lose' ? 'perda de gordura' : calcData.goal === 'gain' ? 'hipertrofia' : 'manutenção metabólica'}</p>
              </div>
              <button className="p-4 bg-white/5 rounded-2xl text-text-muted hover:text-primary transition-all hover:scale-110 border border-white/5">
                <Plus size={24} />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              <MealRow 
                time="07:30" 
                name="Café da Manhã" 
                items={calcData.goal === 'gain' 
                  ? ['5 Ovos inteiros', '100g Aveia com mel', '1 Banana'] 
                  : ['3 Claras e 1 ovo inteiro', '1 Fatia de pão integral', 'Meio mamão']} 
              />
              <MealRow 
                time="10:30" 
                name="Lanche da Manhã" 
                items={['30g Mix de castanhas', '1 Iogurte natural zero açúcar']} 
              />
              <MealRow 
                time="13:00" 
                name="Almoço" 
                items={calcData.goal === 'gain'
                  ? ['200g Frango ou Carne magra', '250g Arroz ou Macarrão', 'Salada à vontade']
                  : ['150g Frango grelhado', '100g Arroz integral', 'Vegetais verdes à vontade']} 
              />
              <MealRow 
                time="16:30" 
                name="Lanche da Tarde" 
                items={['1 Dose de Whey Protein', '1 Maçã ou Pêra']} 
              />
              <MealRow 
                time="20:00" 
                name="Jantar" 
                items={['150g Peixe ou Frango', '150g Batata doce ou Abóbora', 'Mix de folhas com azeite extra virgem']} 
              />
            </div>
          </div>
        )}
      </section>

      {/* Ajustes Avançados - Plano Elite */}
      <section className="space-y-8 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5">
              <ChefHat size={24} />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Ajustes de Alta Performance</h2>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
            MÓDULO ELITE
          </span>
        </div>

        {!hasElite ? (
          <LockedFeatureOverlay 
            title="Controle Total da sua Nutrição" 
            description="Personalize seus macros manualmente, ajuste calorias por dia e tenha flexibilidade total no seu planejamento."
            plan="Elite"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-surface p-10 rounded-[48px] border border-white/5 space-y-8 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Settings size={20} />
                </div>
                <h3 className="text-xl font-black tracking-tight uppercase">Ajuste Manual de Macros</h3>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-sm font-black text-text-secondary uppercase tracking-widest">Calorias Totais</span>
                  <input 
                    type="number" 
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-28 text-right text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    defaultValue={results?.calories}
                  />
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-sm font-black text-text-secondary uppercase tracking-widest">Proteínas (g)</span>
                  <input 
                    type="number" 
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-28 text-right text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    defaultValue={results?.protein}
                  />
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-sm font-black text-text-secondary uppercase tracking-widest">Carboidratos (g)</span>
                  <input 
                    type="number" 
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-28 text-right text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    defaultValue={results?.carbs}
                  />
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-sm font-black text-text-secondary uppercase tracking-widest">Gorduras (g)</span>
                  <input 
                    type="number" 
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-28 text-right text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    defaultValue={results?.fat}
                  />
                </div>
              </div>
              <button className="w-full py-5 bg-white/5 border border-white/10 rounded-[24px] font-black text-xs tracking-widest uppercase hover:bg-white/10 transition-all active:scale-95">
                SALVAR PROTOCOLO PERSONALIZADO
              </button>
            </div>

            <div className="bg-surface p-10 rounded-[48px] border border-white/5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5">
                <Stethoscope size={200} />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Stethoscope size={20} />
                  </div>
                  <h3 className="text-xl font-black tracking-tight uppercase">Acompanhamento Profissional</h3>
                </div>
                <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/10 text-center space-y-6 backdrop-blur-sm">
                  <div className="inline-block px-4 py-1.5 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                    EM BREVE
                  </div>
                  <p className="text-text-secondary text-lg leading-relaxed font-medium">
                    Integração direta com nutricionistas parceiros para ajustes em tempo real e consultoria personalizada via chat.
                  </p>
                  <button className="w-full py-4 bg-primary/10 text-primary rounded-2xl text-xs font-black uppercase tracking-widest cursor-not-allowed opacity-50">
                    NOTIFICAR-ME NO LANÇAMENTO
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function MacroResultCard({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className="bg-surface p-8 rounded-[40px] border border-white/5 text-center space-y-4 group hover:border-primary/30 transition-all duration-500 relative overflow-hidden shadow-xl shadow-black/20">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/0 to-primary/0 group-hover:to-primary/5 transition-all duration-700 pointer-events-none" />
      <div className="relative z-10 space-y-4">
        <div className="text-[9px] text-text-muted uppercase font-black tracking-[0.25em]">{label}</div>
        <div className="text-4xl font-black group-hover:text-primary transition-colors duration-500">{value}<span className="text-base font-bold opacity-50">{unit}</span></div>
        <div className={`h-1 w-16 mx-auto rounded-full ${color} shadow-[0_0_12px_rgba(255,106,0,0.4)]`} />
      </div>
    </div>
  );
}

function LockedFeatureOverlay({ title, description, plan }: { title: string, description: string, plan: Plan }) {
  return (
    <div className="relative group overflow-hidden rounded-[48px]">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl z-10 flex flex-col items-center justify-center p-12 text-center border border-white/5">
        <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mb-8 border border-primary/20 shadow-2xl rotate-12">
          <Lock className="text-primary" size={40} />
        </div>
        <h3 className="text-3xl font-black mb-4 tracking-tight uppercase">{title}</h3>
        <p className="text-text-secondary text-lg max-w-md mb-10 leading-relaxed">
          {description}
        </p>
        <button className="bg-primary text-text-primary px-12 py-5 rounded-[24px] font-black text-sm shadow-2xl shadow-primary/30 hover:scale-105 transition-all active:scale-95 flex items-center gap-3">
          FAZER UPGRADE PARA {plan.toUpperCase()}
          <ArrowRight size={20} />
        </button>
      </div>
      
      {/* Blurred Preview Content */}
      <div className="opacity-10 pointer-events-none filter blur-xl">
        <div className="bg-surface h-96 rounded-[48px] border border-white/5" />
      </div>
    </div>
  );
}

function MacroCard({ label, value, unit, color }: { label: string, value: string, unit: string, color: string }) {
  return (
    <div className="bg-surface p-6 rounded-[32px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-black/20">
      <div className="text-text-muted text-[9px] uppercase tracking-[0.2em] font-black mb-2">{label}</div>
      <div className={`text-2xl font-black ${color} group-hover:translate-x-0.5 transition-transform duration-300`}>{value} <span className="text-xs font-normal opacity-40">{unit}</span></div>
    </div>
  );
}

function MealRow({ time, name, items }: { time: string, name: string, items: string[] }) {
  return (
    <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 group hover:bg-white/[0.02] transition-all duration-500 border-b border-white/5 last:border-0">
      <div className="md:w-36 shrink-0">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl text-primary font-black text-[11px] uppercase tracking-widest border border-primary/20">
          <Clock size={12} />
          {time}
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <h4 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors duration-500 uppercase">{name}</h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item, i) => (
            <li key={i} className="text-text-secondary flex items-center gap-3 bg-white/5 p-4 rounded-[20px] border border-white/5 hover:border-primary/20 transition-colors duration-300">
              <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(255,106,0,0.6)] shrink-0" />
              <span className="font-medium text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CommunityView({ profile }: { profile: UserProfile }) {
  const { isAdmin, simulatedPlan } = useAuth();
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plan;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Comunidade</h1>
          </div>
          <p className="text-text-secondary text-lg">Compartilhe sua jornada fitness.</p>
        </div>
        <button className="bg-primary p-3.5 rounded-2xl text-text-primary shadow-lg shadow-primary/20 hover:bg-primary-hover hover:scale-105 transition-all active:scale-95">
          <Plus size={24} />
        </button>
      </header>

      <div className="space-y-6 max-w-2xl mx-auto">
        {[1, 2, 3].map((p) => (
          <div key={p} className="bg-surface rounded-[40px] border border-white/5 hover:border-primary/30 transition-all duration-500 overflow-hidden group shadow-xl shadow-black/20">
            <div className="p-6 flex items-center gap-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xl text-primary shadow-lg shadow-primary/10">
                {profile.name[0]}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-sm">Ricardo Silva</h4>
                <span className="text-[10px] text-text-muted uppercase tracking-widest font-black">Há 2 horas</span>
              </div>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/20">
                Plano Pro
              </span>
            </div>
            <div className="px-6 py-5">
              <p className="text-text-secondary leading-relaxed text-sm">Mais um treino de pernas concluído! A evolução está vindo devagar, mas constante. Foco no objetivo! 💪 #fitness #evolução</p>
            </div>
            <div className="mx-6 mb-4 rounded-[24px] overflow-hidden border border-white/5">
              <img
                src={`https://picsum.photos/seed/gym${p}/800/600`}
                alt="Post"
                className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="px-6 pb-5 flex items-center gap-6 border-t border-white/5 pt-4">
              <button className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors duration-300 group/btn">
                <div className="p-2 rounded-xl bg-white/5 group-hover/btn:bg-primary/10 transition-all duration-300">
                  <Flame size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">24</span>
              </button>
              <button className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors duration-300 group/btn">
                <div className="p-2 rounded-xl bg-white/5 group-hover/btn:bg-primary/10 transition-all duration-300">
                  <Users size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">12</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView({ profile, logout }: { profile: UserProfile, logout: () => void }) {
  const { isAdmin, simulatedPlan, setSimulatedPlan } = useAuth();
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plan;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(255,106,0,0.5)]" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">Ajustes</h1>
        </div>
        <p className="text-text-secondary text-lg">Gerencie sua conta e assinatura.</p>
      </header>

      <div className="space-y-4">
        <section className="bg-surface rounded-[40px] border border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden group shadow-xl shadow-black/20">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <UserIcon size={16} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest">Perfil</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-[20px] border border-white/5">
              <span className="text-text-muted text-xs font-black uppercase tracking-widest">Nome</span>
              <span className="font-black text-sm">{profile.name}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-[20px] border border-white/5">
              <span className="text-text-muted text-xs font-black uppercase tracking-widest">Email</span>
              <span className="font-black text-sm">{profile.email}</span>
            </div>
          </div>
        </section>

        <section className="bg-surface rounded-[40px] border border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden group shadow-xl shadow-black/20">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Trophy size={16} />
            </div>
            <h3 className="font-black text-sm uppercase tracking-widest">Assinatura</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-[20px] border border-white/5">
              <div>
                <div className="text-primary font-black text-xl">{effectivePlan}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-widest font-black mt-0.5">Status: {profile.subscriptionStatus}</div>
              </div>
              <button className="bg-primary text-text-primary font-black px-6 py-2.5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary-hover transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95">Gerenciar</button>
            </div>
            <div className="p-4 rounded-[20px] bg-primary/5 border border-primary/10 text-[11px] text-text-secondary flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,106,0,0.6)] shrink-0" />
              Sua próxima cobrança será em 24 de Abril de 2026.
            </div>
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
            </div>
          </section>
        )}

        <button 
          onClick={logout}
          className="w-full bg-error/10 text-error font-bold py-4 rounded-2xl border border-error/20 hover:bg-error/20 transition-all"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
}

function AdminView() {
  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="text-primary" size={32} />
          <h1 className="text-3xl font-black tracking-tight uppercase">Painel Administrativo</h1>
        </div>
        <p className="text-text-muted">Gerenciamento de sistema e permissões de elite</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-8 rounded-[40px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-black/20">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 text-primary"><Users size={80} /></div>
          <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-primary/0 group-hover:bg-primary/40 rounded-full transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.25em]">Usuários Totais</span>
              <div className="p-2.5 rounded-2xl bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 border border-white/5 group-hover:border-primary/20 transition-all duration-500"><Users size={16} /></div>
            </div>
            <div className="text-4xl font-black group-hover:translate-x-1 transition-transform duration-500">1.284</div>
            <div className="mt-2 text-[10px] font-black text-success uppercase tracking-widest flex items-center gap-1"><TrendingUp size={10} />+12 hoje</div>
          </div>
        </div>
        <div className="bg-surface p-8 rounded-[40px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-black/20">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 text-primary"><Trophy size={80} /></div>
          <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-primary/0 group-hover:bg-primary/40 rounded-full transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.25em]">Assinaturas Ativas</span>
              <div className="p-2.5 rounded-2xl bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 border border-white/5 group-hover:border-primary/20 transition-all duration-500"><Trophy size={16} /></div>
            </div>
            <div className="text-4xl font-black group-hover:translate-x-1 transition-transform duration-500">856</div>
            <div className="mt-2 text-[10px] font-black text-primary uppercase tracking-widest">67% de conversão</div>
          </div>
        </div>
        <div className="bg-surface p-8 rounded-[40px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden shadow-xl shadow-black/20">
          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 text-primary"><Flame size={80} /></div>
          <div className="absolute left-0 top-6 bottom-6 w-0.5 bg-primary/0 group-hover:bg-primary/40 rounded-full transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.25em]">Receita Mensal</span>
              <div className="p-2.5 rounded-2xl bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 border border-white/5 group-hover:border-primary/20 transition-all duration-500"><Flame size={16} /></div>
            </div>
            <div className="text-4xl font-black group-hover:translate-x-1 transition-transform duration-500">R$ 42.5k</div>
            <div className="mt-2 text-[10px] font-black text-success uppercase tracking-widest flex items-center gap-1"><TrendingUp size={10} />+8% vs mês anterior</div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-[40px] border border-white/5 hover:border-primary/20 transition-all duration-500 overflow-hidden shadow-xl shadow-black/20">
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Settings size={18} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Gerenciamento de Planos</h3>
          </div>
          <button className="bg-primary text-text-primary text-[10px] font-black px-6 py-2.5 rounded-2xl hover:bg-primary-hover transition-all active:scale-95 shadow-lg shadow-primary/20 uppercase tracking-widest">NOVO RECURSO</button>
        </div>
        <div className="p-8 space-y-4">
          <div className="flex items-center justify-between p-6 bg-white/5 rounded-[28px] border border-white/5 hover:border-primary/20 transition-all duration-300 group/plan">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Zap size={18} />
              </div>
              <div>
                <h4 className="font-black text-base">Plano Pro</h4>
                <p className="text-xs text-text-muted">IA Adaptativa, Histórico Completo, Suporte 24h</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">EDITAR</button>
              <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20">ATIVO</button>
            </div>
          </div>
          <div className="flex items-center justify-between p-6 bg-white/5 rounded-[28px] border border-white/5 hover:border-primary/20 transition-all duration-300 group/plan">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <Trophy size={18} />
              </div>
              <div>
                <h4 className="font-black text-base">Plano Elite</h4>
                <p className="text-xs text-text-muted">Consultoria Individual, Protocolos de Competição, Acesso VIP</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">EDITAR</button>
              <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary/20">ATIVO</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanSimulator({ currentPlan, onPlanChange }: { currentPlan: Plan, onPlanChange: (plan: Plan | null) => void }) {
  const planLabels: Record<Plan, string> = {
    'Iniciante': 'FREE',
    'Pro': 'PRO',
    'Elite': 'ELITE',
    'free': 'FREE',
    'Admin': 'ADMIN'
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-fit">
      <div className="bg-surface/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
        <div className="px-3 py-1.5 bg-primary/10 rounded-xl flex items-center gap-2 border border-primary/20">
          <ShieldCheck size={14} className="text-primary" />
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Admin</span>
        </div>
        <div className="h-4 w-px bg-white/10 mx-1" />
        <div className="flex gap-1">
          {(['Iniciante', 'Pro', 'Elite'] as Plan[]).map((p) => (
            <button
              key={p}
              onClick={() => onPlanChange(p)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border ${
                currentPlan === p 
                  ? 'bg-primary border-primary text-text-primary shadow-lg shadow-primary/20' 
                  : 'bg-white/5 border-white/5 text-text-muted hover:text-text-secondary'
              }`}
            >
              {planLabels[p]}
            </button>
          ))}
          <button
            onClick={() => onPlanChange(null)}
            className="p-1.5 rounded-xl bg-white/5 border border-white/5 text-text-muted hover:text-error hover:bg-error/10 transition-all"
            title="Resetar"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
