/**
 * Authentication Provider
 * 
 * Provides authentication context and gates all routes behind Google sign-in.
 * Creates user record on first login and redirects to app once authenticated.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create user record if first login
      if (session?.user) {
        createUserIfNotExists(session.user);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Create user record if first login
      if (session?.user) {
        createUserIfNotExists(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const redirectTo = import.meta.env.DEV 
        ? `${window.location.origin}/fire-app/`
        : 'https://zeekaj.github.io/fire-app/';
      
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
    } catch (error) {
      logger.error('Sign-in error', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Sign-out error', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Creates a user record in public.users if it doesn't exist
 */
async function createUserIfNotExists(user: User) {
  try {
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email,
        } as any,
        {
          onConflict: 'id',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      logger.error('Error creating user record', error);
    }
  } catch (err) {
    logger.error('Unexpected error creating user', err);
  }
}
