import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import { withTimeout } from './lib/utils';
import { UserProfile, NutritionPreferences, Workout, WorkoutLog, ProgressLog, Post, Plan, Level, MuscleGroup, Exercise, RankingEntry, WeeklySchedule, Affiliate, AffiliateStatus, AffiliateConversion } from './types';
import { ALL_WORKOUTS } from './data/workouts';
import { dataService } from './services/dataService';
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
  Ban
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function App() {
  const { user, profile, loading, authError, initSession, signInWithGoogle, logout, isAdmin, simulatedPlan, setSimulatedPlan, updatePlan, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPricing, setShowPricing] = useState(false);
  const [initTimeout, setInitTimeout] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('App level timeout reached: forcing advance');
        setInitTimeout(true);
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [loading]);

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

  const effectivePlan = simulatedPlan || profile?.plano || 'free';

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

  if (!profile || profile.age === 0) {
    return (
      <OnboardingView 
        user={user} 
        profile={profile} 
        onComplete={(plan) => {
          if (plan !== 'Iniciante') setShowPricing(true);
        }} 
      />
    );
  }

  if (showPricing) {
    return <PricingView onBack={() => setShowPricing(false)} onUpgrade={updatePlan} currentPlan={effectivePlan} />;
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

        <div className="flex justify-around items-center h-20 w-full md:flex-col md:h-auto md:gap-8 md:py-4">
          <NavItem icon={<TrendingUp size={20} />} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Início" />
          <NavItem icon={<Dumbbell size={20} />} active={activeTab === 'workouts'} onClick={() => setActiveTab('workouts')} label="Treinos" />
          <NavItem icon={<Apple size={20} />} active={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} label="Dieta" />
          <NavItem icon={<Users size={20} />} active={activeTab === 'community'} onClick={() => setActiveTab('community')} label="Social" />
          <NavItem icon={<Wallet size={20} />} active={activeTab === 'affiliates'} onClick={() => setActiveTab('affiliates')} label="Afiliados" />
          <div className="md:hidden flex-1 flex justify-center">
            <NavItem icon={<Settings size={20} />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Ajustes" />
          </div>
          {isAdmin && (
            <NavItem icon={<ShieldCheck size={20} />} active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label="Admin" />
          )}
        </div>

        <div className="hidden md:flex md:flex-col md:gap-8 md:mt-auto md:mb-12 w-full items-center">
          <button 
            onClick={() => setShowPricing(true)}
            className={`p-3 rounded-2xl transition-all duration-300 ${effectivePlan === 'free' ? 'text-primary bg-primary/10 animate-pulse' : 'text-text-muted hover:text-primary hover:bg-primary/10'}`}
            title="Planos"
          >
            <Zap size={24} />
          </button>
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
            currentPlan={effectivePlan} 
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
            {activeTab === 'dashboard' && (
              <DashboardView 
                profile={profile} 
                onUpgrade={() => setShowPricing(true)} 
                onStartWorkout={() => setActiveTab('workouts')}
                onViewNutrition={() => setActiveTab('nutrition')}
              />
            )}
            {activeTab === 'workouts' && <WorkoutsView profile={profile} onUpgrade={() => setShowPricing(true)} />}
            {activeTab === 'nutrition' && <NutritionView profile={profile} onUpgrade={() => setShowPricing(true)} updateProfile={updateProfile} />}
            {activeTab === 'community' && <CommunityView profile={profile} />}
            {activeTab === 'affiliates' && <AffiliateView profile={profile} />}
            {activeTab === 'settings' && <SettingsView profile={profile} logout={logout} onUpgrade={() => setShowPricing(true)} />}
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
      className={`flex flex-col items-center justify-center gap-1 transition-all duration-500 group relative flex-1 md:flex-none ${active ? 'text-primary' : 'text-text-muted hover:text-text-primary'}`}
    >
      <div className={`p-2.5 md:p-3 rounded-2xl transition-all duration-500 relative ${active ? 'bg-primary/10 shadow-[0_0_20px_rgba(255,106,0,0.1)]' : 'group-hover:bg-white/5'}`}>
        {icon}
        {active && (
          <motion.div 
            layoutId="nav-glow"
            className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10"
          />
        )}
      </div>
      <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all duration-500 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0'}`}>
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
        const data = await signUpWithEmail(email, password, name);
        if (data?.user && !data?.session) {
          setSuccess('Conta criada! Por favor, verifique seu email para confirmar e depois faça login.');
          setMode('login');
        } else {
          setSuccess('Conta criada com sucesso! Redirecionando...');
        }
      }
    } catch (err: any) {
      console.error('Registration/Login error details:', err);
      const message = err.message || '';
      
      if (message.includes('rate limit exceeded')) {
        setError('Limite de tentativas excedido. Por favor, aguarde alguns minutos antes de tentar novamente.');
      } else if (message.includes('Email not confirmed')) {
        setError('Seu email ainda não foi confirmado. Por favor, verifique sua caixa de entrada (e a pasta de spam) para o link de confirmação.');
      } else if (message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.');
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
    plano: (profile?.plano && profile.plano !== 'free') ? profile.plano : 'Iniciante' as any
  });

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      // Small delay as requested to handle potential schema cache issues
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await updateProfile({
        ...formData,
        updatedAt: new Date().toISOString()
      } as any);
      if (onComplete) {
        onComplete(formData.plano);
      }
    } catch (err: any) {
      console.error("Error creating profile:", err);
      setError(err.message || "Erro ao salvar perfil. Verifique sua conexão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = formData.name.trim().length > 0 && formData.age > 0;
  const isStep2Valid = formData.weight > 0 && formData.height > 0 && formData.goal.length > 0;
  const isFormValid = isStep1Valid && isStep2Valid && formData.plano.length > 0;

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
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner min-h-[56px]"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Idade</label>
              <input 
                type="number" 
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || 0})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner min-h-[56px]"
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
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner min-h-[56px]"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Altura (cm)</label>
                <input 
                  type="number" 
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: parseInt(e.target.value) || 0})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner min-h-[56px]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted mb-2 font-bold">Seu Objetivo</label>
              <div className="relative">
                <select 
                  value={formData.goal}
                  onChange={(e) => setFormData({...formData, goal: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-primary text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-inner min-h-[56px]"
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
                  onClick={() => setFormData({...formData, plano: p as any})}
                  className={`w-full p-5 rounded-2xl border transition-all text-left flex justify-between items-center group relative overflow-hidden ${formData.plano === p ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-text-secondary hover:border-white/20'}`}
                >
                  <div className="flex flex-col relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg">{p}</span>
                      {p === 'Iniciante' && (
                        <span className="bg-success/20 text-success text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">GRÁTIS</span>
                      )}
                      {p === 'Pro' && (
                        <span className="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">POPULAR</span>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest opacity-60">
                      {p === 'Iniciante' ? 'Básico • GRATUITO' : p === 'Pro' ? 'IA + Histórico • R$19,90' : 'Consultoria • R$29,90'}
                    </span>
                  </div>
                  {formData.plano === p ? (
                    <CheckCircle2 size={24} className="text-primary relative z-10" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-white/10 group-hover:border-white/20 relative z-10" />
                  )}
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
              <button onClick={() => setStep(2)} className="flex-1 bg-white/5 text-text-secondary font-bold py-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">Voltar</button>
              <button 
                onClick={handleSubmit} 
                disabled={!isFormValid || isSubmitting}
                className="flex-1 bg-primary text-text-primary font-black py-4 rounded-2xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Finalizar'
                )}
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
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plano;

  const getFirstName = () => {
    const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || profile.name || 'Usuário';
    return fullName.split(' ')[0].toUpperCase();
  };

  const [weightLogs, setWeightLogs] = useState<ProgressLog[]>([]);
  const [weightPeriod, setWeightPeriod] = useState<'7D' | '1M' | '6M'>('7D');
  const [addingWeight, setAddingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightSaveError, setWeightSaveError] = useState<string | null>(null);
  const [weeklyCount, setWeeklyCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1 - dayOfWeek);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    supabase
      .from('workout_logs')
      .select('id', { count: 'exact' })
      .eq('userUid', user.id)
      .gte('completedAt', monday.toISOString())
      .then(({ count }) => { if (count !== null) setWeeklyCount(count); });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const WEEKLY_TARGET = 5;
  const weeklyPercent = Math.min(100, Math.round((weeklyCount / WEEKLY_TARGET) * 100));

  const fetchWeightLogs = async () => {
    if (!user) return;
    let retryCount = 0;
    const maxRetries = 2;
    const tryFetch = async () => {
      try {
        const logs = await dataService.getProgressLogs(user.id);
        setWeightLogs(logs);
      } catch (err: any) {
        console.error('Error fetching progress logs:', err);
        if (err.message === 'Timeout na requisição' && retryCount < maxRetries) {
          retryCount++;
          setTimeout(tryFetch, 1000 * retryCount);
        }
      }
    };
    tryFetch();
  };

  useEffect(() => { fetchWeightLogs(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddWeight = async () => {
    const w = parseFloat(newWeight.replace(',', '.'));
    if (!user || isNaN(w) || w <= 0) return;
    setSavingWeight(true);
    setWeightSaveError(null);
    try {
      const { error } = await supabase
        .from('progress_logs')
        .insert([{ userUid: user.id, weight: w, date: new Date().toISOString() }]);
      if (error) throw error;
      setNewWeight('');
      setAddingWeight(false);
      const { data } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('userUid', user.id)
        .order('date', { ascending: true });
      if (data) setWeightLogs(data as ProgressLog[]);
    } catch (err: any) {
      console.error('Error adding weight log:', err);
      setWeightSaveError(err?.message || 'Erro ao salvar peso.');
    } finally {
      setSavingWeight(false);
    }
  };

  const periodDays = weightPeriod === '7D' ? 7 : weightPeriod === '1M' ? 30 : 180;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - periodDays);

  const filteredLogs = weightLogs
    .filter(l => new Date(l.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const weightData = filteredLogs.map(log => ({
    name: weightPeriod === '7D'
      ? new Date(log.date).toLocaleDateString('pt-BR', { weekday: 'short' })
      : new Date(log.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    weight: log.weight,
  }));

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
          value="Peito & Tríceps" 
          subValue="Hoje às 18:00" 
          icon={<Calendar size={20} />} 
          onClick={onStartWorkout}
        />
        <DashboardMetricCard 
          label="Calorias Diárias" 
          value="2.400 kcal" 
          subValue="Meta: 2.600 kcal" 
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
        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-surface p-8 rounded-[40px] border border-white/5 space-y-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase">Evolução de Peso</h3>
              <p className="text-sm text-text-muted">
                {weightPeriod === '7D' ? 'Últimos 7 dias' : weightPeriod === '1M' ? 'Último mês' : 'Últimos 6 meses'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAddingWeight(v => !v)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                + Registrar
              </button>
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                {(['7D', '1M', '6M'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setWeightPeriod(p)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      weightPeriod === p
                        ? 'bg-primary text-text-primary shadow-lg shadow-primary/20'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
          </div>

          {addingWeight && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  value={newWeight}
                  onChange={e => { setNewWeight(e.target.value); setWeightSaveError(null); }}
                  placeholder="Peso em kg (ex: 72.5)"
                  className="flex-1 bg-background border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/40 transition-colors"
                />
                <button
                  onClick={handleAddWeight}
                  disabled={savingWeight || !newWeight}
                  className="bg-primary text-white font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider disabled:opacity-50 transition-all hover:bg-primary/90"
                >
                  {savingWeight ? '...' : 'Salvar'}
                </button>
                <button
                  onClick={() => { setAddingWeight(false); setNewWeight(''); setWeightSaveError(null); }}
                  className="text-text-muted hover:text-text-primary text-xs px-2 py-2 transition-colors"
                >
                  ✕
                </button>
              </div>
              {weightSaveError && (
                <p className="text-xs text-red-400 px-2">{weightSaveError}</p>
              )}
            </div>
          )}

          <div className="h-[320px] w-full relative">
            {weightData.length > 0 ? (
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
                  formatter={(value: number) => [`${value} kg`, 'Peso']}
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
              <div className="flex flex-col items-center justify-center h-full gap-3 text-text-muted">
                <TrendingUp size={32} className="opacity-30" />
                <p className="text-sm">Nenhum registro neste período.</p>
                <button
                  onClick={() => setAddingWeight(true)}
                  className="text-primary text-xs font-bold hover:underline"
                >
                  Registrar primeiro peso
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nutrition Preview */}
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
              <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] text-text-muted font-black uppercase mb-1">Prot</div>
                <div className="text-sm font-black">142g</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] text-text-muted font-black uppercase mb-1">Carb</div>
                <div className="text-sm font-black">185g</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-[10px] text-text-muted font-black uppercase mb-1">Gord</div>
                <div className="text-sm font-black-sm">54g</div>
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

    </div>
  );
}

function LoadingScreen({ onRetry }: { onRetry: () => void }) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-6"></div>
      <p className="text-text-muted font-medium">Iniciando sua jornada...</p>
      
      {showRetry && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 space-y-4"
        >
          <p className="text-sm text-text-muted max-w-xs mx-auto">
            Está demorando mais que o esperado. Isso pode ser devido a uma conexão lenta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => {
                try {
                  onRetry();
                } catch (e) {
                  console.error('Retry failed:', e);
                }
              }}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 justify-center"
            >
              <RefreshCw size={14} />
              Tentar Novamente
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-text-muted hover:underline flex items-center gap-1 justify-center"
            >
              <RefreshCw size={14} />
              Recarregar Página
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DashboardMetricCard({ label, value, subValue, icon, trend, onClick }: { label: string, value: string, subValue: string, icon: React.ReactNode, trend?: 'up' | 'down', onClick?: () => void }) {
  return (
    <motion.div 
      whileHover={onClick ? { y: -5, scale: 1.02 } : {}}
      onClick={onClick}
      className={`bg-surface p-6 md:p-8 rounded-[32px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
        {icon}
      </div>
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
          <div className={`p-2 rounded-xl bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 transition-all duration-500`}>
            {icon}
          </div>
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-black tracking-tight group-hover:translate-x-1 transition-transform duration-500">{value}</div>
          <div className={`mt-1 text-xs font-bold flex items-center gap-1 ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-muted'}`}>
            {trend === 'up' && <TrendingUp size={12} />}
            {subValue}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function QuickAction({ icon, label, color }: { icon: React.ReactNode, label: string, color: string }) {
  return (
    <button className="flex items-center gap-4 p-6 bg-surface rounded-[24px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden">
      <div className={`p-3 rounded-xl ${color} text-text-primary group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-black/20`}>
        {icon}
      </div>
      <span className="font-black text-xs uppercase tracking-widest">{label}</span>
      <div className="absolute -right-2 -bottom-2 opacity-0 group-hover:opacity-5 transition-opacity duration-500">
        {icon}
      </div>
    </button>
  );
}

function WorkoutsView({ profile, onUpgrade }: { profile: UserProfile, onUpgrade: () => void }) {
  const { isAdmin, simulatedPlan, user, updateProfile } = useAuth();
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plano;
  const [selectedPlanTab, setSelectedPlanTab] = useState<Plan>(effectivePlan === 'free' ? 'Iniciante' : effectivePlan);
  const initialLevel: Level = effectivePlan === 'Elite' ? 'Avançado' : effectivePlan === 'Pro' ? 'Intermediário' : 'Iniciante';
  const [selectedLevel, setSelectedLevel] = useState<Level>(initialLevel);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'Todos'>('Todos');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'workouts' | 'ia' | 'history' | 'ranking' | 'spreadsheet' | 'early'>('workouts');

  const [completedWorkouts, setCompletedWorkouts] = useState<string[]>(() => {
    const saved = localStorage.getItem('completedWorkouts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('completedWorkouts', JSON.stringify(completedWorkouts));
  }, [completedWorkouts]);

  const muscleGroups: MuscleGroup[] = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Abdômen', 'Full Body'];

  const hasAccess = (planId: Plan) => {
    const weights = { 'free': 0, 'Iniciante': 1, 'Pro': 2, 'Elite': 3, 'Admin': 4 };
    return weights[effectivePlan] >= weights[planId];
  };

  const toggleComplete = async (workoutId: string) => {
    const alreadyDone = completedWorkouts.includes(workoutId);
    setCompletedWorkouts(prev =>
      alreadyDone ? prev.filter(id => id !== workoutId) : [...prev, workoutId]
    );
    if (!alreadyDone && user) {
      const workout = ALL_WORKOUTS.find(w => w.id === workoutId);
      const today = new Date().toISOString().split('T')[0];
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
          points: (profile.points || 0) + 100,
          streak: newStreak,
          lastWorkoutDate: today,
        });
      } catch (e) {
        console.error('Erro ao salvar treino:', e);
      }
    }
  };

  if (selectedWorkout) {
    return (
      <WorkoutDetailView 
        workout={selectedWorkout} 
        onBack={() => setSelectedWorkout(null)} 
        isCompleted={completedWorkouts.includes(selectedWorkout.id)}
        onToggleComplete={() => toggleComplete(selectedWorkout.id)}
        canEdit={hasAccess('Elite')}
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
          <p className="text-text-secondary text-base md:text-lg">Protocolos de treinamento personalizados para sua evolução.</p>
        </div>
        
        <button 
          onClick={onUpgrade}
          className="flex items-center justify-center gap-2 bg-surface border border-white/10 px-6 py-4 rounded-2xl hover:bg-white/5 transition-all group shrink-0 w-full md:w-auto min-h-[56px]"
        >
          <Zap size={18} className="text-primary group-hover:scale-110 transition-transform" />
          <span className="text-sm font-black uppercase tracking-widest">Planos</span>
        </button>
      </header>

      {/* Main Plan Tabs */}
      <div className="flex flex-col gap-3">
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
      </div>

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
                active={activeSubTab === 'ia'} 
                onClick={() => setActiveSubTab('ia')} 
                label="IA Adaptativa" 
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
                <div className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Nível de Intensidade</span>
                      <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                        {(selectedPlanTab === 'Elite' ? ['Avançado' as Level] : selectedPlanTab === 'Pro' ? ['Intermediário' as Level] : ['Iniciante' as Level]).map((level: Level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                              selectedLevel === level 
                                ? 'bg-surface border border-white/10 text-text-primary shadow-xl' 
                                : 'text-text-muted hover:text-text-secondary'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
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
                        {muscleGroups.map((group) => (
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
                </div>

                <div className="space-y-16">
                  {muscleGroups.filter(g => selectedMuscleGroup === 'Todos' || g === selectedMuscleGroup).map((group) => {
                    const groupWorkouts = ALL_WORKOUTS.filter(w => 
                      w.planRequired === selectedPlanTab && 
                      w.level === selectedLevel && 
                      w.muscleGroup === group
                    );

                    if (groupWorkouts.length === 0) return null;

                    return (
                      <section key={group} className="space-y-8">
                        <div className="flex items-center gap-6">
                          <h2 className="text-2xl font-black tracking-tight uppercase">{group}</h2>
                          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0 md:snap-none">
                          {groupWorkouts.map((workout) => (
                            <div key={workout.id} className="shrink-0 w-[78vw] sm:w-[60vw] md:w-auto snap-start">
                              <WorkoutCard
                                workout={workout}
                                isCompleted={completedWorkouts.includes(workout.id)}
                                onClick={() => setSelectedWorkout(workout)}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                  
                  {muscleGroups.filter(g => selectedMuscleGroup === 'Todos' || g === selectedMuscleGroup).every(g => 
                    ALL_WORKOUTS.filter(w => w.planRequired === selectedPlanTab && w.level === selectedLevel && w.muscleGroup === g).length === 0
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

            {activeSubTab === 'ia' && <IAAdaptativaView />}
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
          FAZER UPGRADE PARA {plan.toUpperCase()}
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </motion.div>
  );
}

function WorkoutCard({ workout, isCompleted, onClick }: { workout: Workout, isCompleted: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-full bg-surface p-8 rounded-[40px] border border-white/5 hover:border-primary/30 transition-all duration-500 group relative overflow-hidden flex flex-col text-left"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
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
              NÍVEL {workout.level.toUpperCase()}
            </span>
            {isCompleted && <span className="text-[8px] font-black text-success uppercase tracking-widest">Concluído</span>}
          </div>
          <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors duration-500">{workout.name}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors duration-500">
            <div className="text-[8px] text-text-muted uppercase font-black tracking-widest mb-1">Exercícios</div>
            <div className="text-lg font-black">{workout.exercises.length}</div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:bg-white/10 transition-colors duration-500">
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
          <div className="p-3 rounded-2xl bg-white/5 group-hover:bg-primary group-hover:text-text-primary transition-all duration-500 group-hover:translate-x-1">
            <ChevronRight size={20} />
          </div>
        </div>
      </div>
    </button>
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

function ExecutionModal({ 
  exercise, 
  onClose 
}: { 
  exercise: Exercise, 
  onClose: () => void 
}) {
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
          {exercise.videoUrl ? (
            <video 
              src={exercise.videoUrl} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted flex-col gap-4">
              <PlayCircle size={64} className="opacity-20" />
              <p className="font-black uppercase tracking-widest text-xs">Vídeo não disponível</p>
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
  onUpdate,
  onShowExecution
}: {
  exercise: Exercise,
  index: number,
  isEditing: boolean,
  onUpdate: (field: keyof Exercise, value: any) => void,
  onShowExecution: () => void
}) {
  const [isResting, setIsResting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`bg-surface rounded-[32px] md:rounded-[40px] border transition-all duration-500 overflow-hidden group ${
      isResting ? 'border-primary/40 bg-primary/5 shadow-2xl shadow-primary/5' : 'border-white/5 hover:border-white/10'
    }`}>
      {/* Main card row */}
      <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div className="flex items-start sm:items-center gap-6 md:gap-8 flex-1">
          <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[18px] md:rounded-[24px] flex items-center justify-center text-xl md:text-2xl font-black transition-all duration-500 border shrink-0 ${
            isResting ? 'bg-primary text-text-primary border-primary/20 scale-110' : 'bg-white/5 text-text-muted group-hover:text-primary group-hover:bg-primary/10 border-white/5'
          }`}>
            {index + 1}
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
            </div>
            <p className="text-text-secondary text-sm md:text-base max-w-md leading-relaxed line-clamp-2">{exercise.description}</p>

            {!isEditing && (
              <button
                onClick={() => setShowDetails(v => !v)}
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
              {/* Video */}
              <div className="lg:w-1/2 bg-black aspect-video lg:aspect-auto min-h-[220px] flex items-center justify-center relative">
                {exercise.videoUrl ? (
                  <video
                    src={exercise.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-text-muted">
                    <PlayCircle size={56} className="opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Vídeo não disponível</p>
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

function WorkoutDetailView({ workout, onBack, isCompleted, onToggleComplete, canEdit }: { workout: Workout, onBack: () => void, isCompleted: boolean, onToggleComplete: () => void, canEdit: boolean }) {
  const [exercises, setExercises] = useState(workout.exercises);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExerciseForVideo, setSelectedExerciseForVideo] = useState<Exercise | null>(null);

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
      className="space-y-12 pb-20"
    >
      <AnimatePresence>
        {selectedExerciseForVideo && (
          <ExecutionModal 
            exercise={selectedExerciseForVideo} 
            onClose={() => setSelectedExerciseForVideo(null)} 
          />
        )}
      </AnimatePresence>

      <header className="relative space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors group"
          >
            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all">
              <ArrowLeft size={20} />
            </div>
            <span className="text-sm font-black uppercase tracking-widest">Voltar para Treinos</span>
          </button>

          <div className="flex items-center gap-4">
            {canEdit && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  isEditing ? 'bg-primary text-text-primary' : 'bg-surface border border-white/10 text-text-muted hover:text-text-primary'
                }`}
              >
                <Edit3 size={16} />
                {isEditing ? 'Salvar Ajustes' : 'Ajuste Manual'}
              </button>
            )}
            <button 
              onClick={onToggleComplete}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                isCompleted ? 'bg-success text-text-primary' : 'bg-primary text-text-primary shadow-xl shadow-primary/20'
              }`}
            >
              {isCompleted ? <CheckCircle2 size={18} /> : <Play size={18} />}
              {isCompleted ? 'Concluído' : 'Iniciar Treino'}
            </button>
          </div>
        </div>

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
          {exercises.map((exercise, index) => (
            <ExerciseCard 
              key={exercise.id}
              exercise={exercise}
              index={index}
              isEditing={isEditing}
              onUpdate={(field, value) => updateExercise(index, field, value)}
              onShowExecution={() => setSelectedExerciseForVideo(exercise)}
            />
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

function NutritionView({ profile, onUpgrade, updateProfile }: { profile: UserProfile, onUpgrade: () => void, updateProfile: (u: Partial<UserProfile>) => Promise<void> }) {
  const { isAdmin, simulatedPlan } = useAuth();
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plano;

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

  const [mealPlan, setMealPlan] = useState<{
    time: string;
    name: string;
    icon: string;
    items: { name: string, quantity: string, calories: number, protein: number, carbs: number, fat: number }[];
  }[]>([]);

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

  useEffect(() => {
    const fetchTracker = async () => {
      if (!profile.id) return;
      setIsLoadingTracker(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const log = await dataService.getNutritionLog(profile.id, today);
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
      setMealPlan(data.meals);
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
    await saveTrackerToSupabase(newTracker);
    
    setIsAddMealModalOpen(false);
    setNewMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  };

  const [aiFood, setAiFood] = useState('');
  const [aiQty, setAiQty] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<{ name: string; calories: number; protein: number; carbs: number; fat: number } | null>(null);

  const analyzeWithAI = async () => {
    if (!aiFood.trim() || !aiQty.trim()) return;
    setAiAnalyzing(true);
    setAiError('');
    setAiResult(null);
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ food: aiFood.trim(), quantity: parseFloat(aiQty) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na análise');
      setAiResult({
        name: `${aiFood.trim()} (${aiQty}g)`,
        calories: Math.round(data.calorias),
        protein: Math.round(data.proteinas_g),
        carbs: Math.round(data.carboidratos_g),
        fat: Math.round(data.gorduras_g)
      });
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
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Tracker de Macros</h2>
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
              {/* AI Food Analyzer — always visible */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Zap size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Calcular Macros com IA</span>
                    <p className="text-[10px] text-text-muted mt-0.5">Digite o alimento e a quantidade — a IA calcula proteínas, carboidratos e gorduras</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Alimento</label>
                    <input
                      type="text"
                      placeholder="Ex: Frango grelhado"
                      value={aiFood}
                      onChange={(e) => { setAiFood(e.target.value); setAiResult(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && analyzeWithAI()}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Quantidade (g ou ml)</label>
                    <input
                      type="number"
                      placeholder="Ex: 150"
                      value={aiQty}
                      onChange={(e) => { setAiQty(e.target.value); setAiResult(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && analyzeWithAI()}
                      className="w-full bg-background border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none transition-all"
                    />
                  </div>
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
                        onClick={() => { setAiResult(null); setAiFood(''); setAiQty(''); }}
                        className="px-4 py-3 bg-white/5 text-text-muted border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={analyzeWithAI}
                    disabled={aiAnalyzing || !aiFood.trim() || !aiQty.trim()}
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
                  className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden"
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
                      setMealPlan(prev => prev.map((m, i) =>
                        i === idx ? { ...m, items: [...m.items, item] } : m
                      ));
                    }}
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
                    value={manualMacros.calories}
                    onChange={(e) => setManualMacros({...manualMacros, calories: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white/5 rounded-2xl border border-white/5 gap-2">
                  <span className="text-[10px] sm:text-sm font-black text-text-secondary uppercase tracking-widest">Proteínas (g)</span>
                  <input 
                    type="number" 
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-full sm:w-28 text-left sm:text-right text-base sm:text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    value={manualMacros.protein}
                    onChange={(e) => setManualMacros({...manualMacros, protein: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white/5 rounded-2xl border border-white/5 gap-2">
                  <span className="text-[10px] sm:text-sm font-black text-text-secondary uppercase tracking-widest">Carboidratos (g)</span>
                  <input 
                    type="number" 
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-full sm:w-28 text-left sm:text-right text-base sm:text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    value={manualMacros.carbs}
                    onChange={(e) => setManualMacros({...manualMacros, carbs: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-white/5 rounded-2xl border border-white/5 gap-2">
                  <span className="text-[10px] sm:text-sm font-black text-text-secondary uppercase tracking-widest">Gorduras (g)</span>
                  <input 
                    type="number" 
                    className="bg-background border border-white/10 rounded-xl px-4 py-2 w-full sm:w-28 text-left sm:text-right text-base sm:text-lg font-black text-primary outline-none focus:border-primary transition-all"
                    value={manualMacros.fat}
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

            <div className="bg-surface p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border border-white/5 flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[300px]">
              <div className="absolute -right-10 -bottom-10 opacity-5">
                <Stethoscope size={200} />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Stethoscope size={20} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase">Acompanhamento Profissional</h3>
                </div>
                <div className="p-6 sm:p-8 bg-primary/5 rounded-[24px] sm:rounded-[32px] border border-primary/10 text-center space-y-4 sm:space-y-6 backdrop-blur-sm">
                  <div className="inline-block px-4 py-1.5 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em]">
                    EM BREVE
                  </div>
                  <p className="text-text-secondary text-base sm:text-lg leading-relaxed font-medium">
                    Integração direta com nutricionistas parceiros para ajustes em tempo real e consultoria personalizada via chat.
                  </p>
                  <button className="w-full py-4 bg-primary/10 text-primary rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest cursor-not-allowed opacity-50">
                    NOTIFICAR-ME NO LANÇAMENTO
                  </button>
                </div>
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

function FoodItemCard({ item }: { item: MealItem }) {
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
    </div>
  );
}

function MealRow({ time, name, items, onAddItem }: {
  time: string;
  name: string;
  items: MealItem[];
  onAddItem?: (item: MealItem) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [foodInput, setFoodInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<MealItem | null>(null);
  const [error, setError] = useState('');

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
            <FoodItemCard key={i} item={item} />
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

function SettingsView({ profile, logout, onUpgrade }: { profile: UserProfile, logout: () => void, onUpgrade: () => void }) {
  const { isAdmin, simulatedPlan, setSimulatedPlan, user } = useAuth();
  const effectivePlan = (isAdmin && simulatedPlan) ? simulatedPlan : profile.plano;

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || profile.name || 'Usuário';
  const userEmail = user?.email || profile.email || '';
  const isFreePlan = effectivePlan === 'free' || effectivePlan === 'Iniciante';

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
            </div>
          </section>
        )}

        <button
          onClick={async () => {
            try {
              localStorage.clear();
              await logout();
            } catch {
              // ignore
            } finally {
              window.location.reload();
            }
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface p-6 rounded-3xl border border-white/5">
              <h3 className="text-text-muted text-xs font-black uppercase tracking-widest mb-4">Usuários Totais</h3>
              <div className="text-4xl font-black">1.284</div>
              <div className="mt-2 text-xs text-success">+12 hoje</div>
            </div>
            <div className="bg-surface p-6 rounded-3xl border border-white/5">
              <h3 className="text-text-muted text-xs font-black uppercase tracking-widest mb-4">Assinaturas Ativas</h3>
              <div className="text-4xl font-black">856</div>
              <div className="mt-2 text-xs text-primary">67% de conversão</div>
            </div>
            <div className="bg-surface p-6 rounded-3xl border border-white/5">
              <h3 className="text-text-muted text-xs font-black uppercase tracking-widest mb-4">Receita Mensal</h3>
              <div className="text-4xl font-black">R$ 42.500</div>
              <div className="mt-2 text-xs text-success">+8% vs mês anterior</div>
            </div>
          </div>

          <div className="bg-surface rounded-[40px] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black">Gerenciamento de Planos</h3>
              <button className="bg-primary text-text-primary text-xs font-black px-6 py-2 rounded-xl">NOVO RECURSO</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                <div>
                  <h4 className="font-bold text-lg">Plano Pro</h4>
                  <p className="text-sm text-text-muted">IA Adaptativa, Histórico Completo, Suporte 24h</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">EDITAR</button>
                  <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold">ATIVO</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                <div>
                  <h4 className="font-bold text-lg">Plano Elite</h4>
                  <p className="text-sm text-text-muted">Consultoria Individual, Protocolos de Competição, Acesso VIP</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-all">EDITAR</button>
                  <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold">ATIVO</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <AdminAffiliatesView />
      )}
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

function IAAdaptativaView() {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-primary/20 to-transparent p-8 rounded-[40px] border border-primary/20 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="text-text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">IA Adaptativa</h2>
            <p className="text-text-secondary text-sm">Sugestões inteligentes baseadas no seu desempenho.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface p-8 rounded-[40px] border border-white/5 space-y-6">
          <h3 className="text-lg font-black uppercase tracking-widest text-primary">Recomendação do Dia</h3>
          <div className="space-y-4">
            <p className="text-text-secondary leading-relaxed">
              Com base nos seus últimos treinos de <span className="text-text-primary font-bold">Peito</span> e <span className="text-text-primary font-bold">Costas</span>, sugerimos focar em <span className="text-text-primary font-bold">Pernas</span> hoje para manter o equilíbrio muscular.
            </p>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted uppercase font-black">Protocolo Sugerido</p>
                <p className="font-bold">Leg Day Pro</p>
              </div>
              <ArrowRight size={20} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-surface p-8 rounded-[40px] border border-white/5 space-y-6">
          <h3 className="text-lg font-black uppercase tracking-widest text-primary">Ajuste de Carga</h3>
          <div className="space-y-4">
            <p className="text-text-secondary leading-relaxed">
              Você completou o último treino com facilidade. A IA sugere aumentar a carga em <span className="text-success font-bold">10%</span> no próximo treino de força.
            </p>
            <div className="flex items-center gap-3 text-success text-sm font-bold">
              <TrendingUp size={18} />
              Evolução detectada!
            </div>
          </div>
        </div>
      </div>
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

function EarlyAccessView({ onSelectWorkout }: { onSelectWorkout: (w: Workout) => void }) {
  const newWorkouts = ALL_WORKOUTS.filter(w => w.planRequired === 'Elite').slice(0, 2);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">Acesso Antecipado</h2>
        <span className="flex items-center gap-1 px-3 py-1 bg-flame/20 text-flame text-[10px] font-black rounded-full uppercase tracking-widest animate-pulse">
          <Flame size={12} />
          Novos Protocolos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {newWorkouts.map((workout) => (
          <div key={workout.id} className="relative group">
            <div className="absolute -top-3 -right-3 z-10 bg-flame text-text-primary text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-flame/30">
              NOVO
            </div>
            <WorkoutCard 
              workout={workout} 
              isCompleted={false} 
              onClick={() => onSelectWorkout(workout)} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingView({ onBack, onUpgrade, currentPlan }: { onBack: () => void, onUpgrade: (plan: Plan) => Promise<void>, currentPlan: Plan }) {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasReferral = !!localStorage.getItem('affiliate_ref');

  const plans = [
    {
      id: 'Iniciante' as Plan,
      name: 'Iniciante',
      price: 'GRÁTIS',
      period: '',
      description: 'Ideal para quem está começando sua jornada fitness.',
      features: [
        'Acesso a treinos básicos',
        'Calculadora de macros',
        'Histórico de progresso',
        'Comunidade básica'
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
        'Treinos com IA Adaptativa',
        'Dieta Estratégica Personalizada',
        'Suporte prioritário',
        'Sem anúncios'
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
        'Protocolos de Competição',
        'Ajustes Manuais Avançados',
        'Consultoria VIP (Em breve)',
        'Acesso Antecipado a Recursos'
      ],
      color: 'bg-white/5',
      buttonText: currentPlan === 'Elite' ? 'Plano Atual' : 'Seja Elite'
    }
  ];

  const handleUpgrade = async (plan: Plan) => {
    if (plan === 'Elite') {
      window.open('https://app.abacatepay.com/pay/bill_xnCyrzR4mdf4Yg4wThbkWFmS', '_blank');
      return;
    }
    if (plan === 'Pro') {
      window.open('https://app.abacatepay.com/pay/bill_PMmn4JmemZC5MdCMrpjkZwdk', '_blank');
      return;
    }
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
  };

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
            Selecione o plano que melhor se adapta aos seus objetivos e comece sua transformação hoje mesmo.
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
                disabled={(plan.id !== 'Elite' && plan.id !== 'Pro') && currentPlan === plan.id}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                  plan.highlight
                    ? 'bg-primary text-text-primary shadow-xl shadow-primary/20 hover:bg-primary-hover'
                    : 'bg-white/5 text-text-primary border border-white/10 hover:bg-white/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {plan.buttonText}
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
