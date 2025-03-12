'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, signIn, signUp, signOut } from '@/lib/auth';
import { Profile } from '@/lib/supabase';
import { updateOnlineStatus } from '@/lib/chat';

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

  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    async function loadUser() {
      try {
        const { user, error } = await getCurrentUser();
        if (user) {
          setUser(user as User);
          // Kullanıcı oturumu varsa, çevrimiçi durumunu güncelle
          if (typeof window !== 'undefined') {
            await updateOnlineStatus(user.id, true);
          }
        }
      } catch (error) {
        console.error('Kullanıcı bilgisi alınamadı', error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Çevrimiçi durumu izle ve sayfa kapandığında/yenilendiğinde güncelleştir
  useEffect(() => {
    // Bu kodu sadece client tarafında çalıştır
    if (typeof window === 'undefined' || !user) return;
    
    const handleBeforeUnload = () => {
      if (user) {
        updateOnlineStatus(user.id, false);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Komponent unmount olduğunda da çevrimdışı olarak işaretle
      if (user) {
        updateOnlineStatus(user.id, false);
      }
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const { success, user, error } = await signIn(email, password);
      if (success && user) {
        const { user: fullUser } = await getCurrentUser();
        setUser(fullUser as User);
        
        // Çevrimiçi durumunu güncelle
        if (fullUser && typeof window !== 'undefined') {
          await updateOnlineStatus(fullUser.id, true);
        }
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
      // Önce çevrimiçi durumunu güncelle
      if (user && typeof window !== 'undefined') {
        await updateOnlineStatus(user.id, false);
      }
      
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