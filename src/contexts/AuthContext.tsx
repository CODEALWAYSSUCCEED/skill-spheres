import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'learner' | 'mentor';
  bio: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'learner' | 'mentor') => Promise<{ needsVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data && !error) {
      setProfile(data);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          setUser(session?.user ?? null);
          setLoading(false);
          return;
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
          // Create profile for OAuth users if one doesn't exist yet
          if (event === 'SIGNED_IN') {
            const { data: existing } = await supabase
              .from('users')
              .select('id')
              .eq('id', session.user.id)
              .maybeSingle();
            if (!existing) {
              await supabase.from('users').insert({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                role: 'learner',
                bio: '',
              });
              await fetchProfile(session.user.id);
            }
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'learner' | 'mentor') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    // If identities is empty, the email is already registered
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    // Store profile (will be confirmed after email verification)
    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role,
        bio: '',
      });
    }

    // If session is null, email confirmation is required
    const needsVerification = !data.session;
    return { needsVerification };
  };

  const sendPasswordReset = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setIsPasswordRecovery(false);
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isPasswordRecovery, signUp, signIn, signInWithGoogle, signOut, refreshProfile, sendPasswordReset, updatePassword }}>
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
