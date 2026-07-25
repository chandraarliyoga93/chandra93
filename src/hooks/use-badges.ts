"use client";

import { useState, useEffect } from "react";
import { getBadgesSupabase as getBadges, BadgePreset } from "@/actions/gamification-supabase";

let badgesCache: Promise<BadgePreset[]> | null = null;
let cachedData: BadgePreset[] | null = null;

export function useBadges() {
  const [badges, setBadges] = useState<BadgePreset[]>(cachedData || []);
  const [loading, setLoading] = useState(!cachedData);

  useEffect(() => {
    if (cachedData) {
      setLoading(false);
      return;
    }

    if (!badgesCache) {
      badgesCache = getBadges() as any;
    }

    if (badgesCache) {
      badgesCache
        .then((data) => {
          cachedData = data as any;
          setBadges(data as any);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching badges:", error);
          badgesCache = null;
          setLoading(false);
        });
    }
  }, []);

  return { badges, loading };
}
