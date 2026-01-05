import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/lib/store';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkPremiumStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { setIsPremium, isPremium } = useAppStore();

  const checkPremiumStatus = useCallback(async () => {
    // Only check premium if user is logged in
    const currentSession = session;
    if (!currentSession?.access_token) {
      // No session = no premium
      setIsPremium(false);
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('check-payment', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });
      
      if (error) {
        console.error('Error checking premium status:', error);
        setIsPremium(false);
        return;
      }
      
      // Only set premium to true if the API confirms it AND user is logged in
      if (data?.isPremium === true) {
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
    } catch (err) {
      console.error('Error checking premium status:', err);
      setIsPremium(false);
    }
  }, [session, setIsPremium]);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);

        // Reset premium status when user logs out
        if (event === 'SIGNED_OUT' || !newSession) {
          setIsPremium(false);
        }

        // Check premium status after auth change (only if signed in)
        if (newSession && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(async () => {
            try {
              const { data, error } = await supabase.functions.invoke('check-payment', {
                headers: {
                  Authorization: `Bearer ${newSession.access_token}`,
                },
              });
              
              if (!error && data?.isPremium === true) {
                setIsPremium(true);
              } else {
                setIsPremium(false);
              }
            } catch (err) {
              console.error('Error checking premium status:', err);
              setIsPremium(false);
            }
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
      
      if (existingSession) {
        setTimeout(async () => {
          try {
            const { data, error } = await supabase.functions.invoke('check-payment', {
              headers: {
                Authorization: `Bearer ${existingSession.access_token}`,
              },
            });
            
            if (!error && data?.isPremium === true) {
              setIsPremium(true);
            } else {
              setIsPremium(false);
            }
          } catch (err) {
            console.error('Error checking premium status:', err);
            setIsPremium(false);
          }
        }, 0);
      } else {
        // No session, ensure premium is false
        setIsPremium(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setIsPremium]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsPremium(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        checkPremiumStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
