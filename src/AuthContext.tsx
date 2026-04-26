import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { Plan, UserProfile } from './types';
import { supabase } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'carlosalbertojuniorourak@gmail.com';

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
          if (createError.message?.includes('schema cache') && retryCount < 2) {
            return fetchProfile(id, userObj, retryCount + 1);
          }
          throw createError;
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

      if (retryCount < 1) {
        return fetchProfile(id, userObj, retryCount + 1);
      }

      setAuthError('Erro ao carregar perfil. Tente recarregar a página.');
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
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

  const updateProfile = async (updates: Partial<UserProfile>, retryCount = 0) => {
    if (!user) return;
    try {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updatedAt: new Date().toISOString() })
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
    await updateProfile({ 
      plano, 
      subscriptionStatus: plano === 'free' ? 'inactive' : 'active' 
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
