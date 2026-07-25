"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUserProfileActionSupabase } from "@/actions/students";

interface UserProfile {
  role: "Guru" | "Siswa" | "ADMIN_GURU" | "SISWA";
  name: string;
  xp?: number;
  level?: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedUid = useRef<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        lastFetchedUid.current = null;
        setLoading(false);
        return;
      }

      if (lastFetchedUid.current === currentUser.id) {
        setLoading(false);
        return;
      }
      lastFetchedUid.current = currentUser.id;

      try {
        // Fetch profile using Server Action instead of direct client-side DB access
        // This bypasses RLS and is the preferred way in Next.js App Router
        const profileData = await getUserProfileActionSupabase(currentUser.id);

        if (profileData) {
          setProfile({
            ...profileData,
            role: profileData.role as any,
            name: profileData.name || "User",
          } as UserProfile);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
