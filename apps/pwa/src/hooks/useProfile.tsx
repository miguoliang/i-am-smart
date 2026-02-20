"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfiles, type LearnerProfile } from "@/lib/api/profiles";

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

export function ProfileProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [activeProfileId, setActiveProfileIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_PROFILE_KEY);
  });

  const { data: profiles = [], isLoading, refetch } = useQuery({
    queryKey: ["profiles"],
    queryFn: fetchProfiles,
    staleTime: 5 * 60 * 1000,
  });

  // Resolve active profile
  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ??
    profiles.find((p) => p.is_default) ??
    profiles[0] ??
    null;

  // Sync activeProfileId when profiles load
  useEffect(() => {
    if (activeProfile && activeProfile.id !== activeProfileId) {
      setActiveProfileIdState(activeProfile.id);
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfile.id);
    }
  }, [activeProfile, activeProfileId]);

  const setActiveProfileId = useCallback(
    (id: string) => {
      setActiveProfileIdState(id);
      localStorage.setItem(ACTIVE_PROFILE_KEY, id);
      // Invalidate learning data queries so they refetch with new profile
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    [queryClient]
  );

  return (
    <ProfileContext.Provider
      value={{ profiles, activeProfile, setActiveProfileId, isLoading, refetch }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
