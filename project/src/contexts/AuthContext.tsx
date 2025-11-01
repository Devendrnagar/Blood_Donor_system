/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from '../lib/apiService';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isEmailVerified: boolean;
  avatar?: string;
  address?: Record<string, any>;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const token = apiService.getToken();
    if (token) {
      apiService.getMe().then(response => {
        if (response.success && (response.data as any)?.user) {
          setUser((response.data as any).user);
        } else {
          // Invalid token, clear it
          apiService.setToken(null);
        }
        setLoading(false);
      }).catch(() => {
        apiService.setToken(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const response = await apiService.register({
        fullName,
        email,
        password,
        phone
      });

      if (response.success && (response.data as any)?.user) {
        setUser((response.data as any).user);
        return { error: null };
      } else {
        return { error: response.error?.message || 'Registration failed' };
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Registration failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });

      if (response.success && (response.data as any)?.user) {
        setUser((response.data as any).user);
        return { error: null };
      } else {
        return { error: response.error?.message || 'Login failed' };
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Login failed' };
    }
  };

  const signOut = async () => {
    try {
      await apiService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}


