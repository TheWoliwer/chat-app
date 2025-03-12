'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, signIn, signUp, signOut } from '@/lib/auth';
import { Profile } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  profile: Profile;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  register: (email: string, password: string, username: string, fullName: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { user, error } = await getCurrentUser();
        if (user) {
          setUser(user as User);
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi alınamadı', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { success, user, error } = await signIn(email, password);
      if (success && user) {
        const { user: fullUser } = await getCurrentUser();
        setUser(fullUser as User);
      }
      return { success, error };
    } catch (error) {
      return { success: false, error };
    }
  };

  const register = async (email: string, password: string, username: string, fullName: string) => {
    try {
      const { success, user, error } = await signUp(email, password, username, fullName);
      return { success, error };
    } catch (error) {
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      const { success, error } = await signOut();
      if (success) {
        setUser(null);
      }
      return { success, error };
    } catch (error) {
      return { success: false, error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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