import { createContext, useState, useCallback, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('medcore_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // On app boot, verify stored user is still valid
  useEffect(() => {
    const stored = sessionStorage.getItem('medcore_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData, accessToken) => {
    setUser(userData);
    sessionStorage.setItem('medcore_user', JSON.stringify(userData));
    sessionStorage.setItem('medcore_access_token', accessToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('medcore_user');
    sessionStorage.removeItem('medcore_access_token');
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
