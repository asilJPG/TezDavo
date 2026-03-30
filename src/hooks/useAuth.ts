"use client";
// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "@/types";

interface AuthState {
  supabaseUser: SupabaseUser | null;
  user: User | null;
  loading: boolean;
}

// Client-side кеш — живёт пока открыта вкладка
// Это безопасно: код выполняется только в браузере конкретного пользователя
let _cachedUser: User | null = null;
let _cacheReady = false;

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    supabaseUser: null,
    user: _cachedUser,
    loading: !_cacheReady,
  });

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const fetchUser = async (supabaseUser: SupabaseUser | null) => {
      if (!mounted) return;

      if (!supabaseUser) {
        _cachedUser = null;
        _cacheReady = true;
        setState({ supabaseUser: null, user: null, loading: false });
        return;
      }

      // Есть кеш для этого юзера — не делаем повторный запрос
      if (_cacheReady && _cachedUser) {
        setState({ supabaseUser, user: _cachedUser, loading: false });
        return;
      }

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", supabaseUser.id)
        .single();

      if (!mounted) return;

      _cachedUser = user;
      _cacheReady = true;
      setState({ supabaseUser, user, loading: false });
    };

    supabase.auth.getUser().then(({ data }) => fetchUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        _cachedUser = null;
        _cacheReady = false;
      }
      if (
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        fetchUser(session?.user ?? null);
      }
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
  _cacheReady = false;
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
}
