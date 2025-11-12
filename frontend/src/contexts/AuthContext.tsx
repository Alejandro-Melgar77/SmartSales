import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_display: string;
  phone: string;
  ciudad: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // <-- (1) Añadido
  login: (userData: User, token: string) => void; // <-- (2) Modificado
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // <-- (3) Añadido

  useEffect(() => {
    // Verificar si hay usuario Y TOKEN al cargar la app
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('auth_token'); // <-- (4) Añadido

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken); // <-- (5) Añadido
    }
  }, []);

  const login = (userData: User, token: string) => { // <-- (6) Modificado
    setUser(userData);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('auth_token', token); // <-- (7) AÑADIDO: Guarda el token
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token'); // <-- (8) AÑADIDO: Borra el token
  };

  return (
    <AuthContext.Provider value={{
      user,
      token, // <-- (9) Añadido
      login,
      logout,
      isAuthenticated: !!user && !!token // <-- (10) Modificado: Autenticado SÓLO si hay usuario Y token
    }}>
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