import { createContext, useContext, useState, useCallback } from 'react';
import { apiRequest } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ay_user'));
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('ay_token', data.token);
    localStorage.setItem('ay_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ay_token');
    localStorage.removeItem('ay_user');
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(localStorage.getItem('ay_token'));

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
