import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, type User } from "./api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "techhub_token";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage unavailable
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ user }) => {
        setUser(user);
        setToken(storedToken);
      })
      .catch(() => {
        setStoredToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const register = async (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
  }) => {
    const response = await authApi.register(data);
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors; clear local state regardless
    }
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const { user } = await authApi.me();
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
