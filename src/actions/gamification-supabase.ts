"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AwardBadgeSchema = z.object({
  studentId: z.string().min(1),
  badgeId: z.string().min(1),
});

// Default levels for name mapping, identical to gamification.ts
const DEFAULT_LEVELS = [
  { rank: 1, name: "Pemula", minXp: 0, coins: 0 },
  { rank: 2, name: "Peserta Didik", minXp: 100, coins: 50 },
  { rank: 3, name: "Pembelajar Giat", minXp: 250, coins: 100 },
  { rank: 4, name: "Pengejar Ilmu", minXp: 500, coins: 150 },
  { rank: 5, name: "Sarjana Muda", minXp: 1000, coins: 250 },
  { rank: 6, name: "Cendekiawan", minXp: 2000, coins: 500 },
  { rank: 7, name: "Pakar", minXp: 3500, coins: 750 },
  { rank: 8, name: "Empu", minXp: 5000, coins: 1000 },
  { rank: 9, name: "Begawan", minXp: 7500, coins: 1500 },
  { rank: 10, name: "Suhu", minXp: 10000, coins: 2500 },
];

export interface LevelConfig {
  rank: number;
  name: string;
  minXp: number;
  coins?: number;
}

export interface BadgeRequirement {
  type: "CBT_COMPLETION" | "MANUAL";
  examId?: string;
  minScore?: number;
}

export interface BadgePreset {
  id: string;
  emoji: string;
  label: string;
  xp: number;
  requirement?: BadgeRequirement;
}

/**
 * Fetch level configuration.
 */
export async function getLevelConfigSupabase(): Promise<LevelConfig[]> {
  try {
    const dbLevels = await prisma.levelConfig.findMany({
      orderBy: { rank: "asc" },
    });
    
    if (dbLevels.length > 0) {
      return dbLevels.map((l: any) => ({
        rank: l.rank,
        name: l.name,
        minXp: l.minXp,
        coins: (l as any).coins || 0
      }));
    }
    
    return DEFAULT_LEVELS;
  } catch (error) {
    console.error("Error fetching level config (Supabase):", error);
    return DEFAULT_LEVELS;
  }
}

/**
 * Update level configuration.
 */
export async function updateLevelConfigSupabase(levels: LevelConfig[]) {
  try {
    await ensureGuru();
    
    // Simple implementation: delete and recreate all
    await prisma.$transaction([
      prisma.levelConfig.deleteMany({}),
      prisma.levelConfig.createMany({
        data: levels.map(l => ({
          rank: l.rank,
          name: l.name,
          minXp: l.minXp,
          // coins field might need adjustment in schema if not present
        })),
      }),
    ]);

    revalidatePath("/dashboard/guru/gamification");
    return { success: true };
  } catch (error) {
    console.error("Error updating level config (Supabase):", error);
    return { success: false, error: "Gagal memperbarui konfigurasi level" };
  }
}

/**
 * Save or update a badge.
 */
export async function saveBadgeSupabase(badge: Omit<BadgePreset, "id"> & { id?: string }) {
  try {
    await ensureGuru();
    
    const data = {
      emoji: badge.emoji,
      label: badge.label,
      xp: badge.xp,
      requirement: badge.requirement ? (badge.requirement as any) : { type: "MANUAL" },
    };

    if (badge.id) {
      await prisma.badge.update({
        where: { id: badge.id },
        data,
      });
    } else {
      await prisma.badge.create({
        data,
      });
    }

    revalidatePath("/dashboard/guru/gamification");
    return { success: true };
  } catch (error) {
    console.error("Error saving badge (Supabase):", error);
    return { success: false, error: "Gagal menyimpan badge" };
  }
}

/**
 * Delete a badge.
 */
export async function deleteBadgeSupabase(id: string) {
  try {
    await ensureGuru();
    await prisma.badge.delete({ where: { id } });
    revalidatePath("/dashboard/guru/gamification");
    return { success: true };
  } catch (error) {
    console.error("Error deleting badge (Supabase):", error);
    return { success: false, error: "Gagal menghapus badge" };
  }
}

/**
 * Assign XP to a student.
 * If skipAuth is true, skips the guru check (for automatic rewards from lesson/quiz completion).
 */
export async function assignXPSupabase(
  studentId: string,
  xpAmount: number,
  reason: string,
  tx?: any,
  skipAuth: boolean = false,
) {
  try {
    if (!skipAuth) {
      await ensureGuru();
    }
    
    const logic = async (txClient: any) => {
      const student = await txClient.user.findUnique({
        where: { id: studentId },
      });
      if (!student) throw new Error("Siswa tidak ditemukan");

      const currentXP = student.xp || 0;
      const currentLevel = student.level || 1;
      const currentCoins = student.guruCoin || 0;
      const newXP = currentXP + xpAmount;

      const dbLevels = await txClient.levelConfig.findMany({ orderBy: { rank: "asc" } });
      const levels = dbLevels.length > 0 ? dbLevels : DEFAULT_LEVELS;

      let newLevel = 1;
      for (const level of levels) {
        if (newXP >= level.minXp) {
          newLevel = level.rank;
        } else {
          break;
        }
      }

      const leveledUp = newLevel > currentLevel;
      let coinReward = 0;
      if (leveledUp) {
        for (let l = currentLevel + 1; l <= newLevel; l++) {
          const config = levels.find((lv: any) => lv.rank === l);
          if (config) coinReward += (config as any).coins || 0;
        }
      }

      await txClient.user.update({
        where: { id: studentId },
        data: {
          xp: newXP,
          level: newLevel,
          guruCoin: currentCoins + coinReward,
        },
      });

      await txClient.xpLog.create({
        data: {
          userId: studentId,
          amount: xpAmount,
          type: "MANUAL",
          reason,
          oldXp: currentXP,
          newXp: newXP,
          oldLevel: currentLevel,
          newLevel: newLevel,
          coinReward,
        },
      });

      if (coinReward > 0) {
        await txClient.economyLog.create({
          data: {
            studentId,
            amount: coinReward,
            type: "LEVEL_UP_REWARD",
            reason: `Hadiah naik ke level ${newLevel}`,
            oldCoins: currentCoins,
            newCoins: currentCoins + coinReward,
          },
        });
      }

      return { success: true as const, newXP, newLevel, leveledUp, coinReward };
    };

    return tx ? await logic(tx) : await prisma.$transaction(logic, { timeout: 15000 }) as any;
  } catch (error: any) {
    console.error("Error assigning XP (Supabase):", error);
    return { success: false as const, error: error.message || "Gagal memberikan XP" };
  }
}

/**
 * Batch assign XP to multiple students.
 * Optimized to use a single transaction and batch log creation.
 */
export async function batchAssignXPSupabase(studentIds: string[], xpAmount: number, reason: string, tx?: any) {
  try {
    await ensureGuru();
    
    const logic = async (txClient: any) => {
      // 1. Fetch levels and students once
      const dbLevels = await txClient.levelConfig.findMany({ orderBy: { rank: "asc" } });
      const levels = dbLevels.length > 0 ? dbLevels : DEFAULT_LEVELS;
      
      const students = await txClient.user.findMany({
        where: { id: { in: studentIds } }
      });

      const xpLogs = [];
      const econLogs = [];

      // 2. Process each student
      for (const student of students) {
        const currentXP = student.xp || 0;
        const currentLevel = student.level || 1;
        const currentCoins = student.guruCoin || 0;
        const newXP = currentXP + xpAmount;

        let newLevel = 1;
        for (const level of levels) {
          if (newXP >= level.minXp) {
            newLevel = level.rank;
          } else {
            break;
          }
        }

        const leveledUp = newLevel > currentLevel;
        let coinReward = 0;
        if (leveledUp) {
          for (let l = currentLevel + 1; l <= newLevel; l++) {
            const config = levels.find((lv: any) => lv.rank === l);
            if (config) coinReward += (config as any).coins || 0;
          }
        }

        // We still need to update users individually within the transaction
        // as updateMany doesn't support individual field values based on conditions
        await txClient.user.update({
          where: { id: student.id },
          data: {
            xp: newXP,
            level: newLevel,
            guruCoin: currentCoins + coinReward,
          },
        });

        xpLogs.push({
          userId: student.id,
          amount: xpAmount,
          type: "MANUAL",
          reason,
          oldXp: currentXP,
          newXp: newXP,
          oldLevel: currentLevel,
          newLevel: newLevel,
          coinReward,
        });

        if (coinReward > 0) {
          econLogs.push({
            studentId: student.id,
            amount: coinReward,
            type: "LEVEL_UP_REWARD",
            reason: `Hadiah naik ke level ${newLevel} (Massal)`,
            oldCoins: currentCoins,
            newCoins: currentCoins + coinReward,
          });
        }
      }

      // 3. Batch create logs
      if (xpLogs.length > 0) await txClient.xpLog.createMany({ data: xpLogs });
      if (econLogs.length > 0) await txClient.economyLog.createMany({ data: econLogs });

      return { success: true as const };
    };

    const result = tx ? await logic(tx) : await prisma.$transaction(logic, { timeout: 30000 });
    if (!tx) revalidatePath("/dashboard/guru");
    return result as { success: true } | { success: false; error: string };
  } catch (error) {
    console.error("Error batch assigning XP (Supabase):", error);
    return { success: false, error: "Gagal memberikan XP massal" };
  }
}

export async function batchAssignBadgeSupabase(studentIds: string[], badgeId: string, tx?: any) {
  try {
    await ensureGuru();
    
    const logic = async (txClient: any) => {
      // 1. Fetch badge
      const badge = await txClient.badge.findUnique({ where: { id: badgeId } });
      if (!badge) throw new Error("Badge tidak ditemukan");

      // 2. Fetch levels
      const dbLevels = await txClient.levelConfig.findMany({ orderBy: { rank: "asc" } });
      const levels = dbLevels.length > 0 ? dbLevels : DEFAULT_LEVELS;

      // 3. Fetch students
      const students = await txClient.user.findMany({
        where: { id: { in: studentIds }, role: "SISWA" }
      });

      // 4. Fetch existing awards to avoid duplicates
      const existingAwards = await txClient.badgeAward.findMany({
        where: { badgeId, userId: { in: studentIds } }
      });
      const existingUserIds = new Set(existingAwards.map((a: any) => a.userId));

      const badgeAwards = [];
      const xpLogs = [];
      const econLogs = [];

      for (const student of students) {
        if (existingUserIds.has(student.id)) continue;

        const currentXP = student.xp || 0;
        const currentLevel = student.level || 1;
        const currentCoins = student.guruCoin || 0;
        const newXP = currentXP + badge.xp;

        let newLevel = 1;
        for (const level of levels) {
          if (newXP >= level.minXp) {
            newLevel = level.rank;
          } else {
            break;
          }
        }

        const leveledUp = newLevel > currentLevel;
        let coinReward = 0;
        if (leveledUp) {
          for (let l = currentLevel + 1; l <= newLevel; l++) {
            const config = levels.find((lv: any) => lv.rank === l);
            if (config) {
              coinReward += (config as any).coins || 0;
            }
          }
        }

        await txClient.user.update({
          where: { id: student.id },
          data: {
            xp: newXP,
            level: newLevel,
            guruCoin: currentCoins + coinReward,
          },
        });

        badgeAwards.push({ badgeId, userId: student.id });
        xpLogs.push({
          userId: student.id,
          amount: badge.xp,
          type: "BADGE_AWARD",
          reason: `Badge: ${badge.emoji} ${badge.label}`,
          oldXp: currentXP,
          newXp: newXP,
          oldLevel: currentLevel,
          newLevel: newLevel,
          coinReward: coinReward,
        });

        if (coinReward > 0) {
          econLogs.push({
            studentId: student.id,
            amount: coinReward,
            type: "LEVEL_UP_REWARD",
            reason: `Hadiah naik ke level ${newLevel} (dari Badge Massal)`,
            oldCoins: currentCoins,
            newCoins: currentCoins + coinReward,
          });
        }
      }

      if (badgeAwards.length > 0) await txClient.badgeAward.createMany({ data: badgeAwards });
      if (xpLogs.length > 0) await txClient.xpLog.createMany({ data: xpLogs });
      if (econLogs.length > 0) await txClient.economyLog.createMany({ data: econLogs });

      return { success: true as const };
    };

    const result = tx ? await logic(tx) : await prisma.$transaction(logic, { timeout: 30000 });
    if (!tx) revalidatePath("/dashboard/guru");
    return result as { success: true } | { success: false; error: string };
  } catch (error) {
    console.error("Error batch assigning badge (Supabase):", error);
    return { success: false, error: "Gagal memberikan badge massal" };
  }
}

/**
 * Fetch basic stats for a student.
 */
export async function getStudentStatsSupabase(studentId: string) {
  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { xp: true, level: true, name: true },
    });
    return student;
  } catch (error) {
    console.error("Error fetching student stats (Supabase):", error);
    return null;
  }
}

/**
 * Fetch badges earned by a student.
 */
export async function getStudentBadgesActionSupabase(studentId: string): Promise<BadgePreset[]> {
  try {
    const awards = await prisma.badgeAward.findMany({
      where: { userId: studentId },
      include: { badge: true },
    });
    
    return awards.map((a: any) => ({
      id: a.badge.id,
      emoji: a.badge.emoji,
      label: a.badge.label,
      xp: a.badge.xp,
    }));
  } catch (error) {
    console.error("Error fetching student badges (Supabase):", error);
    return [];
  }
}

/**
 * Fetch all students in a class with their gamification stats.
 */
export async function getStudentsInClassSupabase(classId: string) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        user: true,
      },
    });

    return enrollments.map((e: any) => ({
      id: e.user.id,
      uid: e.user.id,
      name: e.user.name,
      email: e.user.email,
      xp: e.user.xp,
      level: e.user.level,
      createdAt: e.user.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching students in class (Supabase):", error);
    return [];
  }
}

/**
 * Fetch all available badges using Prisma.
 */
export async function getBadgesSupabase() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { xp: "asc" },
    });
    return badges;
  } catch (error) {
    console.error("Error fetching badges (Supabase):", error);
    return [];
  }
}

/**
 * Award a badge to a student.
 * If skipAuth is true, skips the guru check (for automatic rewards).
 */
export async function awardBadgeSupabase(
  studentId: string,
  badgeId: string,
  tx?: any,
  skipAuth: boolean = false,
) {
  try {
    if (!skipAuth) {
      const guru = await ensureGuru();
    }
    const validated = AwardBadgeSchema.safeParse({ studentId, badgeId });
    if (!validated.success) {
      return { success: false, error: "Input tidak valid" };
    }

    const logic = async (txClient: any) => {
      // 1. Get student data
      const student = await txClient.user.findUnique({
        where: { id: studentId },
      });
      if (!student || student.role !== "SISWA") {
        throw new Error("Siswa tidak ditemukan");
      }

      // 2. Get badge data
      const badge = await txClient.badge.findUnique({
        where: { id: badgeId },
      });
      if (!badge) {
        throw new Error("Badge tidak ditemukan");
      }

      // 3. Check if already awarded
      const existingAward = await txClient.badgeAward.findUnique({
        where: {
          badgeId_userId: {
            badgeId,
            userId: studentId,
          },
        },
      });
      if (existingAward) {
        throw new Error("Siswa sudah memiliki badge ini");
      }

      const currentXP = student.xp || 0;
      const currentLevel = student.level || 1;
      const currentCoins = student.guruCoin || 0;
      const newXP = currentXP + badge.xp;

      // 4. Calculate new level
      const dbLevels = await txClient.levelConfig.findMany({
        orderBy: { rank: "asc" },
      });
      const levels = dbLevels.length > 0 ? dbLevels : DEFAULT_LEVELS;
      
      let newLevel = 1;
      for (const level of levels) {
        if (newXP >= level.minXp) {
          newLevel = level.rank;
        } else {
          break;
        }
      }

      const leveledUp = newLevel > currentLevel;
      let coinReward = 0;
      if (leveledUp) {
        for (let l = currentLevel + 1; l <= newLevel; l++) {
          const config = levels.find((lv: any) => lv.rank === l);
          if (config && 'coins' in config) {
            coinReward += (config as any).coins || 0;
          }
        }
      }

      // 5. Apply updates to User
      await txClient.user.update({
        where: { id: studentId },
        data: {
          xp: newXP,
          level: newLevel,
          guruCoin: currentCoins + coinReward,
        },
      });

      // 6. Create BadgeAward record
      await txClient.badgeAward.create({
        data: {
          badgeId,
          userId: studentId,
        },
      });

      // 7. Log XP transaction
      await txClient.xpLog.create({
        data: {
          userId: studentId,
          amount: badge.xp,
          type: "BADGE_AWARD",
          reason: `Badge: ${badge.emoji} ${badge.label}`,
          oldXp: currentXP,
          newXp: newXP,
          oldLevel: currentLevel,
          newLevel: newLevel,
          coinReward: coinReward,
        },
      });

      // 8. Log Economy transaction if there's a reward
      if (coinReward > 0) {
        await txClient.economyLog.create({
          data: {
            studentId,
            amount: coinReward,
            type: "LEVEL_UP_REWARD",
            reason: `Hadiah naik ke level ${newLevel} (dari Badge)`,
            oldCoins: currentCoins,
            newCoins: currentCoins + coinReward,
          },
        });
      }

      return {
        success: true as const,
        data: {
          newXP,
          newLevel,
          leveledUp,
          coinReward,
        },
      };
    };

    return tx ? await logic(tx) : await prisma.$transaction(logic, { timeout: 15000 }) as any;
  } catch (error) {
    console.error("Error awarding badge (Supabase):", error);
    return { success: false as const, error: error instanceof Error ? error.message : "Gagal memberikan badge" };
  }
}

/**
 * Fetch XP logs for a specific student.
 */
export async function getXpLogsSupabase(studentId: string) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    // Both Siswa (for self) and Guru can see these logs
    const logs = await prisma.xpLog.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: "desc" },
    });
    return logs;
  } catch (error) {
    console.error("Error fetching XP logs (Supabase):", error);
    return [];
  }
}
