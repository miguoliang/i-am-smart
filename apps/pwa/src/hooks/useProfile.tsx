"use client";

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfiles, type LearnerProfile } from "@/lib/api/profiles";
import { createClient } from "@/lib/supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

const ACTIVE_PROFILE_KEY = "activeProfileId";

interface ProfileContextValue {
  profiles: LearnerProfile[];
  activeProfile: LearnerProfile | null;
  setActiveProfileId: (id: string) => void;
  isLoading: boolean;
  refetch: () => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profiles: [],
  activeProfile: null,
  setActiveProfileId: () => {},
  isLoading: true,
  refetch: () => {},
});

function getStoredProfileId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_PROFILE_KEY);
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(getStoredProfileId);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const { data: profiles = [], isLoading, refetch } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated === true,
    retry: false,
  });

  // Resolve active profile — pure derivation, no effect needed
  const activeProfile = useMemo(() => {
    const byId = profiles.find((p) => p.id === activeProfileId);
    if (byId) return byId;
    const defaultProfile = profiles.find((p) => p.is_default) ?? profiles[0] ?? null;
    // Sync localStorage if we fell back
    if (defaultProfile && defaultProfile.id !== activeProfileId) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, defaultProfile.id);
    }
    return defaultProfile;
  }, [profiles, activeProfileId]);

  const setActiveProfileId = useCallback(
    (id: string) => {
      setActiveProfileIdState(id);
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    [queryClient]
  );

  // Loading if auth check pending, or authenticated and profiles still loading
  const loading = isAuthenticated === null || (isAuthenticated && isLoading);

  return (
    <ProfileContext.Provider
      value={{ profiles, activeProfile, setActiveProfileId, isLoading: loading, refetch }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
