import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiRequest } from '../api';
import type { LoginResponse, SessionUser } from '../types';

interface AuthContextValue {
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ay_token'));
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('ay_user') || 'null') as SessionUser | null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('ay_token', data.token);
    localStorage.setItem('ay_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ay_token');
    localStorage.removeItem('ay_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
