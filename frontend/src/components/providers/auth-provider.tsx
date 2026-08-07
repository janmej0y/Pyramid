"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, getToken, setToken } from "@/lib/api";

type SessionUser = { id: string; name: string; avatar?: string | null };

type AuthContextValue = {
  user: SessionUser | null;
  status: "loading" | "authenticated" | "anonymous";
  loginAsGuest: (name?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const router = useRouter();

  // Resolve a stored token to a user once on mount.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!getToken()) {
        if (!cancelled) setStatus("anonymous");
        return;
      }
      try {
        const me = await api.me();
        if (cancelled) return;
        setUser({ id: me.id, name: me.name, avatar: me.avatar });
        setStatus("authenticated");
      } catch {
        // Expired or revoked token — drop it and fall back to anonymous.
        if (cancelled) return;
        clearToken();
        setStatus("anonymous");
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginAsGuest = useCallback(async (name?: string) => {
    const result = await api.loginAsGuest(name);
    setToken(result.accessToken);
    setUser({
      id: result.user.id,
      name: result.user.name,
      avatar: result.user.avatar,
    });
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("anonymous");
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, status, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
