"use client";
// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "@/types";

const CACHE_KEY = "tezdavo_user";

function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user));
  else localStorage.removeItem(CACHE_KEY);
}

interface AuthState {
  supabaseUser: SupabaseUser | null;
  user: User | null;
  loading: boolean;
}

let _cachedUser: User | null = null;
let _fetchPromise: Promise<void> | null = null;

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    supabaseUser: null,
    user: _cachedUser,
    loading: !_cachedUser,
  });

  useEffect(() => {
    // Читаем localStorage только на клиенте
    if (!_cachedUser) {
      const fromStorage = getCachedUser();
      if (fromStorage) {
        _cachedUser = fromStorage;
        setState((prev) => ({ ...prev, user: fromStorage, loading: false }));
      }
    }

    const supabase = createClient();
    let mounted = true;

    const fetchUser = async (supabaseUser: SupabaseUser | null) => {
      if (!mounted) return;

      if (!supabaseUser) {
        _cachedUser = null;
        _fetchPromise = null;
        setCachedUser(null);
        setState({ supabaseUser: null, user: null, loading: false });
        return;
      }

      if (_cachedUser) {
        setState({ supabaseUser, user: _cachedUser, loading: false });
        return;
      }

      // Предотвращаем дублирующие запросы
      if (!_fetchPromise) {
        _fetchPromise = supabase
          .from("users")
          .select("*")
          .eq("auth_id", supabaseUser.id)
          .single()
          .then(({ data: user }) => {
            _cachedUser = user;
            setCachedUser(user);
            _fetchPromise = null;
            if (mounted) setState({ supabaseUser, user, loading: false });
          });
      }

      await _fetchPromise;
    };

    // Используем только onAuthStateChange — не вызываем getUser() отдельно
    // чтобы избежать lock race condition
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        _cachedUser = null;
        _fetchPromise = null;
        setCachedUser(null);
      }
      fetchUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  _cachedUser = null;
  _fetchPromise = null;
  setCachedUser(null);
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
}
