import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Plan, UserProfile } from './types';

const ADMIN_EMAIL = 'carlosalbertojuniorourak@gmail.com';

// Flag key to remember that this user has completed onboarding.
// Prevents returning users from hitting OnboardingView on transient Firestore errors.
const profileFlagKey = (uid: string) => `ironsaas_has_profile_${uid}`;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  simulatedPlan: Plan | null;
  setSimulatedPlan: (plan: Plan | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulatedPlan, setSimulatedPlan] = useState<Plan | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    let firestoreTimer: ReturnType<typeof setTimeout> | null = null;
    let resolved = false;

    const finish = () => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
        // Remove the native HTML loading screen
        if (typeof window !== 'undefined' && (window as any).__removeAppLoading) {
          (window as any).__removeAppLoading();
        }
      }
    };

    const clearFirestoreTimer = () => {
      if (firestoreTimer) { clearTimeout(firestoreTimer); firestoreTimer = null; }
    };

    // Firebase Auth resolves from IndexedDB cache in <300ms on return visits.
    // This fallback timer only activates if the device has no network AND no cached auth state.
    const authFallbackTimer = setTimeout(() => {
      finish();
    }, 6000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(authFallbackTimer);
      setUser(firebaseUser);

      if (unsubscribeProfile) { unsubscribeProfile(); unsubscribeProfile = null; }
      clearFirestoreTimer();

      if (!firebaseUser) {
        setProfile(null);
        finish();
        return;
      }

      // Start a Firestore subscription. On return visits with cached data this
      // fires immediately from IndexedDB. The timer is a fallback for new devices.
      firestoreTimer = setTimeout(() => {
        // Timer expired without Firestore responding.
        // If we know this user has a profile from a previous session, keep them in the app.
        const hasProfileFlag = localStorage.getItem(profileFlagKey(firebaseUser.uid));
        if (hasProfileFlag) {
          // Try a one-shot read as a last resort before giving up
          getDoc(doc(db, 'users', firebaseUser.uid))
            .then((snap) => {
              if (snap.exists()) setProfile(snap.data() as UserProfile);
            })
            .catch(() => {})
            .finally(() => finish());
        } else {
          finish();
        }
      }, 4000);

      const profileRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeProfile = onSnapshot(
        profileRef,
        (docSnap) => {
          clearFirestoreTimer();
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            // Mark that this user has a profile so we can skip OnboardingView on errors
            if (data.age > 0) {
              localStorage.setItem(profileFlagKey(firebaseUser.uid), 'true');
            }
          } else {
            setProfile(null);
          }
          finish();
        },
        (error) => {
          clearFirestoreTimer();
          console.error('Firestore profile error:', error.code, error.message);

          if (error.code === 'permission-denied') {
            // Check if this user has previously completed onboarding
            const hasProfileFlag = localStorage.getItem(profileFlagKey(firebaseUser.uid));
            if (hasProfileFlag) {
              // Returning user: keep them logged in with no profile data
              // rather than wrongly sending them to OnboardingView
              // (profile stays null but we mark loading done — App.tsx handles this)
              setProfile(null);
            } else {
              // Likely a new user whose doc doesn't exist yet
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
          finish();
        }
      );
    });

    return () => {
      clearTimeout(authFallbackTimer);
      clearFirestoreTimer();
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(firebaseUser, { displayName: name });
      const profileData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name,
        age: 0,
        weight: 0,
        height: 0,
        goal: '',
        plan: 'free' as Plan,
        role: 'user' as const,
        subscriptionStatus: 'inactive' as const,
        points: 0,
        streak: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), profileData);
    } catch (error) {
      console.error('Sign-up error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (user) localStorage.removeItem(profileFlagKey(user.uid));
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      resetPassword,
      logout,
      isAdmin,
      simulatedPlan,
      setSimulatedPlan
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
