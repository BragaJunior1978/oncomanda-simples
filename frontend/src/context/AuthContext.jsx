// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

// URL base do seu Backend
const API_BASE_URL = 'http://localhost:3000';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega o token do localStorage ao carregar a aplicação
  useEffect(() => {
    const storedToken = localStorage.getItem('oncomanda_token');
    const storedUser = localStorage.getItem('oncomanda_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Função de Login que faz o fetch para a API
  const login = async (username, password) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro desconhecido no login');
      }

      const data = await response.json();

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('oncomanda_token', data.token);
      localStorage.setItem('oncomanda_user', JSON.stringify(data.user));

      setLoading(false);
      return data.user;
      
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('oncomanda_token');
    localStorage.removeItem('oncomanda_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);