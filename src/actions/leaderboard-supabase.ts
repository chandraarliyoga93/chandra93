"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";

// Default levels for name mapping, identical to gamification.ts
const DEFAULT_LEVELS = [
  { rank: 1, name: "Pemula", minXp: 0 },
  { rank: 2, name: "Peserta Didik", minXp: 100 },
  { rank: 3, name: "Pembelajar Giat", minXp: 250 },
  { rank: 4, name: "Pengejar Ilmu", minXp: 500 },
  { rank: 5, name: "Sarjana Muda", minXp: 1000 },
  { rank: 6, name: "Cendekiawan", minXp: 2000 },
  { rank: 7, name: "Pakar", minXp: 3500 },
  { rank: 8, name: "Empu", minXp: 5000 },
  { rank: 9, name: "Begawan", minXp: 7500 },
  { rank: 10, name: "Suhu", minXp: 10000 },
];

/**
 * Fetch global leaderboard (top students by XP) using Supabase/Prisma.
 */
export async function getGlobalLeaderboardSupabase(limit: number = 50) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    // Both Siswa and Guru can see the leaderboard
    const [users, dbLevels] = await Promise.all([
      prisma.user.findMany({
        where: { role: "SISWA" },
        orderBy: { xp: "desc" },
        take: limit,
        include: {
          enrollments: {
            include: {
              class: {
                select: { name: true }
              }
            },
            take: 1, // Just get the first class for display
          }
        }
      }),
      prisma.levelConfig.findMany({ orderBy: { rank: "asc" } })
    ]);

    const levels = dbLevels.length > 0 ? dbLevels : DEFAULT_LEVELS;
    const levelNameMap: Record<number, string> = {};
    levels.forEach(l => {
      levelNameMap[l.rank] = l.name;
    });

    return users.map((u: any) => ({
      id: u.id,
      name: u.name,
      photo: u.photo, 
      level: u.level,
      levelName: levelNameMap[u.level] || `Level ${u.level}`,
      xp: u.xp,
      className: u.enrollments[0]?.class.name || "Tanpa Kelas",
    }));
  } catch (error) {
    console.error("Error fetching global leaderboard (Supabase):", error);
    return [];
  }
}

/**
 * Fetch class-specific leaderboard (top students in a class) using Supabase/Prisma.
 */
export async function getClassLeaderboardSupabase(classId: string, limit: number = 50) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch class to verify it exists and get its name
    const [cls, dbLevels] = await Promise.all([
      prisma.class.findUnique({
        where: { id: classId },
        select: { name: true }
      }),
      prisma.levelConfig.findMany({ orderBy: { rank: "asc" } })
    ]);

    if (!cls) return [];

    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          xp: "desc",
        },
      },
      take: limit,
    });

    const levels = dbLevels.length > 0 ? dbLevels : DEFAULT_LEVELS;
    const levelNameMap: Record<number, string> = {};
    levels.forEach(l => {
      levelNameMap[l.rank] = l.name;
    });

    return enrollments.map((e: any) => ({
      id: e.user.id,
      name: e.user.name,
      photo: e.user.photo,
      level: e.user.level,
      levelName: levelNameMap[e.user.level] || `Level ${e.user.level}`,
      xp: e.user.xp,
      className: cls.name,
    }));
    } catch (error) {
    console.error("Error fetching class leaderboard (Supabase):", error);
    return [];
  }
}

/**
 * Fetch a student's rank in global or class leaderboard using Supabase/Prisma.
 */
export async function getStudentRankSupabase(studentId: string, classId?: string) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    if (classId) {
      // Rank within a specific class
      const enrollments = await prisma.enrollment.findMany({
        where: { classId },
        include: {
          user: {
            select: { xp: true },
          },
        },
        orderBy: {
          user: {
            xp: "desc",
          },
        },
      });

      const rank = enrollments.findIndex((e: any) => e.userId === studentId) + 1;
      return rank > 0 ? rank : null;
    } else {
      // Global rank
      const users = await prisma.user.findMany({
        where: { role: "SISWA" },
        orderBy: { xp: "desc" },
        select: { id: true },
      });

      const rank = users.findIndex((u: any) => u.id === studentId) + 1;
      return rank > 0 ? rank : null;
    }
  } catch (error) {
    console.error("Error fetching student rank (Supabase):", error);
    return null;
  }
}

