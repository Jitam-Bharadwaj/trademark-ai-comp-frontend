'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, UserInfo } from '@/lib/api';

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const refresh = async () => {
    try {
      const userInfo = await getCurrentUser();
      setUser(userInfo);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!user?.user) return;
    
    try {
      if (user.type === 'admin') {
        const { adminLogout } = await import('@/lib/api');
        await adminLogout();
      } else {
        const { clientLogout } = await import('@/lib/api');
        await clientLogout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  useEffect(() => {
    setMounted(true);
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
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

