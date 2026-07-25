"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru } from "@/lib/auth-server";

export async function getLevelConfigSupabase() {
  const levels = await prisma.levelConfig.findMany({ orderBy: { rank: "asc" } });
  return levels.length > 0 ? levels : [
    { rank: 1, name: "Pemula", minXp: 0, coins: 0 },
    { rank: 2, name: "Siswa Giat", minXp: 100, coins: 50 },
  ];
}

export async function getLevelRewardsSupabase() {
  const levels = await getLevelConfigSupabase();
  return levels.map((l: any) => ({ level: l.rank, coins: l.coins || 0 }));
}
