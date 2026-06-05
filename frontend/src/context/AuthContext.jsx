// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('miabetrans_token');
    const saved = localStorage.getItem('miabetrans_user');
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, mot_de_passe: password });
    const { token, user } = res.data.data;
    localStorage.setItem('miabetrans_token', token);
    localStorage.setItem('miabetrans_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('miabetrans_token');
    localStorage.removeItem('miabetrans_user');
    setUser(null);
  };

  const isAdmin     = user?.role === 'Administrateur';
  const isChauffeur = user?.role === 'Chauffeur';
  const isClient    = user?.role === 'Client';
  const fullName    = user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : '';

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      isAdmin, isChauffeur, isClient, fullName,
      isLoggedIn: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
