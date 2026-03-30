"use client";
// ЗАМЕНИ: src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "@/types";

interface AuthState {
  supabaseUser: SupabaseUser | null;
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    supabaseUser: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const fetchUser = async (supabaseUser: SupabaseUser | null) => {
      if (!mounted) return;

      if (!supabaseUser) {
        setState({ supabaseUser: null, user: null, loading: false });
        return;
      }

      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", supabaseUser.id)
        .single();

      if (!mounted) return;
      setState({ supabaseUser, user, loading: false });
    };

    // Получаем текущую сессию один раз при маунте
    supabase.auth.getUser().then(({ data }) => fetchUser(data.user));

    // Слушаем только реальные события смены сессии
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = "/login";
}
