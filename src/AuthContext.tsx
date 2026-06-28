import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { Plan, UserProfile } from './types';
import { supabase } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'carlosalbertojuniorourak@gmail.com';
const CLIENT_SAFE_PLANS: Plan[] = ['free', 'Iniciante'];
const PROTECTED_PROFILE_FIELDS = [
  'role',
  'paymentCustomerId',
  'subscriptionPaidAt',
] as const;
const AUTH_URL_KEYS = [
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

function hasAuthUrlParams() {
  if (typeof window === 'undefined') return false;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return AUTH_URL_KEYS.some(key => search.has(key) || hash.has(key));
}

function cleanAuthUrl(targetPath = '/') {
  if (typeof window === 'undefined') return;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (!hasAuthUrlParams() && window.location.pathname !== '/auth/callback') return;
  const nextPath = targetPath || '/';
  if (current !== nextPath) {
    window.history.replaceState({ ironshapeAuthClean: true }, document.title, nextPath);
  }
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  authError: string | null;
  initSession: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  simulatedPlan: Plan | null;
  setSimulatedPlan: (plan: Plan | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePlan: (plan: Plan) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [simulatedPlan, setSimulatedPlan] = useState<Plan | null>(null);
  const profileFetchingRef = useRef(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Promise.race wrapper — getSession can hang forever on mobile without throwing
  const getSessionWithTimeout = (ms = 5000) =>
    Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('session_timeout')), ms)
      ),
    ]);

  const initSession = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data: { session } } = await getSessionWithTimeout(5000);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      if (currentUser) fetchProfileBackground(currentUser.id, currentUser);
      else setLoading(false);
    } catch {
      setUser(null);
      setLoading(false);
      setAuthError('Erro ao conectar. Verifique sua internet.');
    }
  };

  const fetchProfileBackground = (id: string, userObj: User) => {
    if (profileFetchingRef.current) return;
    profileFetchingRef.current = true;
    setProfileLoading(true);
    fetchProfile(id, userObj).finally(() => {
      profileFetchingRef.current = false;
      setProfileLoading(false);
    });
  };

  useEffect(() => {
    let cancelled = false;

    // onAuthStateChange fires INITIAL_SESSION synchronously from localStorage —
    // fastest possible path. SIGNED_IN fires after OAuth/email login.
    // Both must be handled to cover every auth scenario in supabase-js v2.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      const currentUser = session?.user ?? null;

      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (currentUser) cleanAuthUrl('/');
        setUser(currentUser);
        setLoading(false);
        if (currentUser) fetchProfileBackground(currentUser.id, currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        profileFetchingRef.current = false;
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed silently — update user in case metadata changed
        setUser(currentUser);
      }
    });

    // Hard fallback: if onAuthStateChange never fires (e.g., Supabase init fails),
    // stop the spinner after 6s so the user isn't stuck forever
    const watchdog = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 6000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(watchdog);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async (id: string, userObj?: User | null, retryCount = 0): Promise<void> => {
    // Serve cached profile instantly while fresh data loads
    if (retryCount === 0) {
      const cached = localStorage.getItem(`profile_${id}`);
      if (cached) {
        try { setProfile(JSON.parse(cached) as UserProfile); } catch {}
      }
    }

    try {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        if (error.message?.includes('schema cache') && retryCount < 2) {
          return fetchProfile(id, userObj, retryCount + 1);
        }
        if (error.code !== 'PGRST116') throw error;
      }

      if (data) {
        setProfile(data as UserProfile);
        localStorage.setItem(`profile_${id}`, JSON.stringify(data));
      } else {
        const targetUser = userObj;
        const newProfile: UserProfile = {
          id,
          email: targetUser?.email || '',
          name: targetUser?.user_metadata?.full_name || 'Usuário',
          age: 0,
          weight: 0,
          height: 0,
          goal: '',
          plano: 'free',
          role: 'user',
          subscriptionStatus: 'inactive',
          points: 0,
          streak: 0,
          criado_em: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          if (createError.code === '23505') {
            // Race condition: profile was created between our select and insert — just re-fetch once
            const { data: existing } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', id)
              .maybeSingle();
            if (existing) {
              setProfile(existing as UserProfile);
              localStorage.setItem(`profile_${id}`, JSON.stringify(existing));
            }
            return;
          }
          if ((createError.message?.includes('schema cache') || createError.message?.includes('network')) && retryCount < 3) {
            return fetchProfile(id, userObj, retryCount + 1);
          }
          // Insert failed but user is authenticated — use the new profile object in memory
          // so the app opens normally; next visit will retry persisting it
          setProfile(newProfile as UserProfile);
          return;
        }

        if (created) {
          setProfile(created as UserProfile);
          localStorage.setItem(`profile_${id}`, JSON.stringify(created));
        }
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);

      const cached = localStorage.getItem(`profile_${id}`);
      if (cached) {
        try { setProfile(JSON.parse(cached) as UserProfile); } catch {}
        return;
      }

      if (retryCount < 2) {
        return fetchProfile(id, userObj, retryCount + 1);
      }

      // User is authenticated but profile couldn't be loaded/created.
      // Use a fallback from Google metadata so the app opens instead of showing an error screen.
      if (userObj) {
        const fallback: UserProfile = {
          id: userObj.id,
          email: userObj.email || '',
          name: userObj.user_metadata?.full_name || userObj.user_metadata?.name || 'Usuário',
          age: 0,
          weight: 0,
          height: 0,
          goal: '',
          plano: 'free',
          role: 'user',
          subscriptionStatus: 'inactive',
          points: 0,
          streak: 0,
          criado_em: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setProfile(fallback);
      } else {
        setAuthError('Erro ao carregar perfil. Tente recarregar a página.');
      }
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
        skipBrowserRedirect: false,
      }
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) throw error;
    return data;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const sanitizeClientProfileUpdates = (updates: Partial<UserProfile>) => {
    const safeUpdates = { ...updates } as Partial<UserProfile>;

    for (const field of PROTECTED_PROFILE_FIELDS) {
      delete safeUpdates[field];
    }

    if (safeUpdates.plano && !CLIENT_SAFE_PLANS.includes(safeUpdates.plano)) {
      delete safeUpdates.plano;
    }

    if (safeUpdates.subscriptionStatus && safeUpdates.subscriptionStatus !== 'inactive') {
      delete safeUpdates.subscriptionStatus;
    }

    return safeUpdates;
  };

  const updateProfile = async (updates: Partial<UserProfile>, retryCount = 0) => {
    if (!user) return;
    try {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      const safeUpdates = sanitizeClientProfileUpdates(updates);

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...safeUpdates, updatedAt: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        if (error.message?.includes('schema cache') && retryCount < 3) {
          console.warn(`Schema cache error on update, retrying... (${retryCount + 1}/3)`);
          return updateProfile(updates, retryCount + 1);
        }
        throw error;
      }
      setProfile(data as UserProfile);
      // Update cache
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  const updatePlan = async (plano: Plan) => {
    if (!user) return;
    if (!CLIENT_SAFE_PLANS.includes(plano)) {
      throw new Error('Planos pagos só podem ser ativados após confirmação do pagamento.');
    }
    await updateProfile({ 
      plano, 
      subscriptionStatus: 'inactive'
    });
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      profileLoading,
      authError,
      initSession,
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      logout,
      isAdmin,
      simulatedPlan,
      setSimulatedPlan,
      updateProfile,
      updatePlan,
      resendConfirmationEmail
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
