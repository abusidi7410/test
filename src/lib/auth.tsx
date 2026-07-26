import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { authApi, type User } from "./api";
import { TOKEN_KEY } from "./constants";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface LoginResult {
  is_admin?: boolean;
}

interface AuthContextType extends AuthState {
  hasPin: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
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
  setHasPin: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

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
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ user, has_pin }) => {
        setUser(user);
        setToken(storedToken);
        if (has_pin !== undefined) {
          setHasPin(has_pin);
        }
      })
      .catch(() => {
        setToken(storedToken);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    function handleStorageEvent(e: StorageEvent) {
      if (e.key === TOKEN_KEY && !e.newValue) {
        setToken(null);
        setUser(null);
      }
    }

    function handleTokenCleared() {
      setToken(null);
      setUser(null);
    }

    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener("auth:token-cleared", handleTokenCleared);
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("auth:token-cleared", handleTokenCleared);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const response = await authApi.login(email, password);
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
    if (response.has_pin !== undefined) {
      setHasPin(response.has_pin);
    }
    return { is_admin: response.is_admin };
  }, []);

  const register = useCallback(async (data: {
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
    if (response.has_pin !== undefined) {
      setHasPin(response.has_pin);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors; clear local state regardless
    }
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setHasPin(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user } = await authApi.me();
    setUser(user);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, hasPin, login, register, logout, refreshUser, setHasPin }),
    [user, token, isLoading, hasPin, login, register, logout, refreshUser, setHasPin]
  );

  return (
    <AuthContext.Provider value={value}>
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
