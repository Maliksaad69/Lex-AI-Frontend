"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  fetchCurrentUser,
  type LoginPayload,
  type RegisterPayload,
  type UserProfile,
} from "@/lib/api";

// localStorage helpers (token/auth-only, NOT case data)
function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lexai_token");
}
function setStoredToken(token: string): void {
  localStorage.setItem("lexai_token", token);
  document.cookie = `lexai_token=${encodeURIComponent(token)}; path=/; SameSite=Lax; max-age=${7 * 86400}`;
}
function removeStoredToken(): void {
  localStorage.removeItem("lexai_token");
  document.cookie = "lexai_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

interface AuthState {
  token: string | null;
  id: number | null;
  username: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [id, setId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate token from localStorage on mount, then fetch user profile
  useEffect(() => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    setToken(savedToken);
    // Fetch the actual user profile from the backend
    fetchCurrentUser()
      .then((user: UserProfile) => {
        setId(user.id);
        setUsername(user.username);
      })
      .catch(() => {
        // Token is invalid or expired — clear it
        removeStoredToken();
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await apiLogin(payload);
      setStoredToken(data.access_token);
      setToken(data.access_token);

      // Fetch the user profile to get the ID
      const user = await fetchCurrentUser();
      setId(user.id);
      setUsername(user.username);

      router.push("/dashboard");
    },
    [router],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiRegister(payload);
  }, []);

  const logout = useCallback(() => {
    removeStoredToken();
    setToken(null);
    setId(null);
    setUsername(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        token,
        id,
        username,
        isLoading,
        isAuthenticated: !!token && !!id,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}