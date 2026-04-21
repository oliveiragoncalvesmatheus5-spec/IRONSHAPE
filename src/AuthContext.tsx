import { useState, useEffect, createContext, useContext, ReactNode, useRef } from 'react';
import { Plan, UserProfile } from './types';
import { supabase } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';

import { withTimeout } from './lib/utils';

const ADMIN_EMAIL = 'carlosalbertojuniorourak@gmail.com';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
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

  const isAdmin = user?.email === ADMIN_EMAIL;

  const initSession = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
      setAuthError('Erro ao conectar. Verifique sua internet.');
    }
  };

  const _initSessionLegacy = async (retryCount = 0) => {
    setAuthError(null);
    setLoading(true);
    try {
      console.log(`Initializing session... (attempt ${retryCount + 1})`);
      
      // Increased timeout to 15 seconds for session verification
      const { data: { session }, error } = await withTimeout(() => supabase.auth.getSession(), 15000, 2);
      
      if (error) {
        console.error('Supabase getSession error:', error);
        setUser(null);
        setLoading(false);
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        console.log('User verified:', currentUser.email);
        await fetchProfile(currentUser.id, currentUser);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error initializing session:', error);
      
      // Auto-retry session init on timeout with exponential backoff
      if (error.message === 'Timeout na requisição' && retryCount < 2) {
        const backoff = 1000 * (retryCount + 1);
        console.log(`Retrying session init after timeout in ${backoff}ms... (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        return initSession(retryCount + 1);
      }

      setUser(null);
      setLoading(false);
      if (error.message === 'Timeout na requisição') {
        setAuthError('A conexão com o servidor demorou muito. Verifique sua internet.');
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Primary init: fast getSession check
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser);
        } else {
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    // Listen for subsequent auth changes only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      const currentUser = session?.user ?? null;
      if (event === 'SIGNED_IN') {
        setUser(currentUser);
        if (currentUser) await fetchProfile(currentUser.id, currentUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    // Safety net: stop spinner after 15s without error message
    const watchdog = setTimeout(() => {
      setLoading(false);
    }, 15000);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(watchdog);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async (id: string, userObj?: User | null, retryCount = 0) => {
    // Show cached profile immediately while fetching fresh data
    if (retryCount === 0) {
      const cached = localStorage.getItem(`profile_${id}`);
      if (cached) {
        try { setProfile(JSON.parse(cached) as UserProfile); } catch {}
      }
    }

    setAuthError(null);
    try {
      console.log(`Fetching profile for ${id} (retry: ${retryCount})`);
      
      // Small delay to allow schema cache to refresh if needed
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      // Timeout for profile fetch - increased to 15s+
      const timeoutVal = 15000 + (retryCount * 5000);
      const { data, error } = await withTimeout(
        () => supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        timeoutVal,
        1 // Add one internal retry
      ) as any;

      if (error) {
        // If it's a schema cache error, retry up to 3 times
        if (error.message?.includes('schema cache') && retryCount < 3) {
          console.warn(`Schema cache error, retrying... (${retryCount + 1}/3)`);
          await fetchProfile(id, userObj, retryCount + 1);
          return;
        }
        
        if (error.code !== 'PGRST116') {
          throw error;
        }
      }

      if (data) {
        console.log('Profile found:', data.email);
        setProfile(data as UserProfile);
        // Update cache
        localStorage.setItem(`profile_${id}`, JSON.stringify(data));
      } else {
        console.log('Profile not found, creating new one...');
        // Use the passed userObj or the state user
        const targetUser = userObj || user;
        
        // Create profile if it doesn't exist
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

        const tryInsert = async (retries = 0): Promise<any> => {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
          const { data: created, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();
          
          if (createError) {
            if (createError.message?.includes('schema cache') && retries < 3) {
              console.warn(`Schema cache error on insert, retrying... (${retries + 1}/3)`);
              return tryInsert(retries + 1);
            }
            // If profile already exists (race condition), just fetch it
            if (createError.code === '23505') {
              return await fetchProfile(id, userObj);
            }
            throw createError;
          }
          return created;
        };

        const created = await tryInsert();
        console.log('Profile created successfully');
        setProfile(created as UserProfile);
        // Update cache
        localStorage.setItem(`profile_${id}`, JSON.stringify(created));
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      // Auto-retry up to 2 times on timeout with backoff
      if (err.message === 'Timeout na requisição' && retryCount < 2) {
        const backoff = 1000 * (retryCount + 1);
        console.log(`Retrying profile fetch after timeout in ${backoff}ms... (${retryCount + 1}/2)`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        await fetchProfile(id, userObj, retryCount + 1);
        return;
      }

      // If we have a cached profile, don't show error, just log it
      const cached = localStorage.getItem(`profile_${id}`);
      if (cached) {
        console.warn('Fetch failed but using cached profile as fallback');
        try {
          const parsed = JSON.parse(cached);
          setProfile(parsed as UserProfile);
        } catch (e) {}
        setLoading(false);
        return;
      }

      if (err.message === 'Timeout na requisição') {
        setAuthError('A conexão com o servidor demorou muito ao carregar seu perfil.');
      } else {
        setAuthError(err.message || 'Erro ao carregar perfil.');
      }
    } finally {
      setLoading(false);
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
