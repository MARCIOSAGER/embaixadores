import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"user" | "admin">("user");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
      else { setUserRole("user"); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (authId: string) => {
    try {
      const { data } = await supabase
        .from("users")
        .select("role, name")
        .eq("openId", authId)
        .single();
      setUserRole(data?.role ?? "user");
      setUserName(data?.name ?? null);
    } catch {
      setUserRole("user");
    } finally {
      setLoading(false);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  }, []);

  return {
    user,
    session,
    loading,
    role: userRole,
    userName,
    isAdmin: userRole === "admin",
    isAuthenticated: !!session,
    signIn,
    signOut,
    resetPassword,
  };
}
