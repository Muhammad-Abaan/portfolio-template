import React, { createContext, useContext, useEffect, useState } from 'react';

type User = { id: string; email?: string } | null;

interface AuthContextType {
  session: any;
  user: User;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for dummy token
    const token = localStorage.getItem('dummy_auth_token');
    if (token) {
      setUser({ id: 'dummy-admin-id', email: 'admin@portfolio.local' });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const signOut = async () => {
    localStorage.removeItem('dummy_auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session: user ? { access_token: 'dummy' } : null, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
