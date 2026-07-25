"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru, getAuthUser } from "@/lib/auth-server";
import { subDays } from "date-fns";

/**
 * Fetch dashboard statistics for a Guru using Supabase/Prisma.
 */
export async function getDashboardStatsSupabase() {
  return getGuruAnalyticsSupabase();
}

export async function getDashboardStats() { return getDashboardStatsSupabase(); }
export async function getGuruAnalytics() { return getGuruAnalyticsSupabase(); }
export async function getClassPerformanceData() { return getClassPerformanceDataSupabase(); }
export async function getAttendanceTrends() { return getAttendanceTrendsSupabase(); }
export async function getClassDetailedStats(classId: string) { return getClassDetailedStatsSupabase(classId); }

export async function getGuruAnalyticsSupabase() {
  try {
    const user = await ensureGuru();

    // Independent queries for performance
    const [totalStudents, totalClasses, journalsThisWeek, pendingGrades] = await Promise.all([
      // Total students (Global SISWA count, matching original Firebase logic)
      prisma.user.count({
        where: { role: "SISWA" },
      }),
      // Total classes for this Guru
      prisma.class.count({
        where: { adminId: user.uid },
      }),
      // Journals created by this Guru in the last 7 days
      prisma.journal.count({
        where: {
          userId: user.uid,
          date: {
            gte: subDays(new Date(), 7),
          },
        },
      }),
      // Pending grades (count where value is null for tasks in Guru's classes)
      prisma.grade.count({
        where: {
          task: {
            class: {
              adminId: user.uid,
            },
          },
          value: null,
        },
      }),
    ]);

    // Fetch latest activities for the current Guru
    // Since XpLog doesn't have guruId, we'll fetch activities related to students in this Guru's classes
    const recentXpLogs = await prisma.xpLog.findMany({
      where: {
        user: {
          enrollments: {
            some: {
              class: {
                adminId: user.uid,
              },
            },
          },
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, level: true },
        },
      },
    });

    const recentJournals = await prisma.journal.findMany({
      where: { userId: user.uid },
      take: 10,
      orderBy: { date: "desc" },
      include: {
        class: {
          select: { name: true },
        },
      },
    });

    // Combine and format activities
    const activities = [
      ...recentXpLogs.map((log: any) => ({
        id: log.id,
        type: "XP" as const,
        studentName: log.user.name,
        reason: log.reason,
        amount: log.amount,
        timestamp: log.createdAt.toISOString(),
      })),
      ...recentJournals.map((j: any) => ({
        id: j.id,
        type: "JOURNAL" as const,
        className: j.class.name,
        reason: `Mengisi Jurnal: ${j.topic}`,
        timestamp: j.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    return {
      totalStudents,
      totalClasses,
      journalsThisWeek,
      pendingGrades,
      recentActivities: activities,
    };
  } catch (error) {
    console.error("Error fetching guru analytics (Supabase):", error);
    return {
      totalStudents: 0,
      totalClasses: 0,
      journalsThisWeek: 0,
      pendingGrades: 0,
      recentActivities: [],
    };
  }
}

/**
 * Fetch performance data (average grades) per class for a Guru using Supabase/Prisma.
 */
export async function getClassPerformanceDataSupabase() {
  try {
    const user = await ensureGuru();

    const classes = await prisma.class.findMany({
      where: { adminId: user.uid },
      include: {
        students: true,
        tasks: {
          include: {
            grades: true,
          },
        },
      },
    });

    const performanceData = classes.map((cls: any) => {
      const allGrades = cls.tasks.flatMap((t: any) => t.grades.map((g: any) => g.value || 0));
      const studentCount = cls.students.length;
      
      let average = 0;
      if (allGrades.length > 0) {
        average = allGrades.reduce((sum: number, val: number) => sum + val, 0) / allGrades.length;
      }

      return {
        className: cls.name,
        average: Math.round(average * 10) / 10,
        studentCount,
      };
    });

    return performanceData;
  } catch (error) {
    console.error("Error fetching class performance data (Supabase):", error);
    return [];
  }
}

/**
 * Fetch attendance trends for a Guru's classes using Supabase/Prisma.
 * Returns percentage of present students over the last 7 days.
 */
export async function getAttendanceTrendsSupabase() {
  try {
    const user = await ensureGuru();
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    // Fetch all attendance records for this guru's classes from the last 7 days
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        class: {
          adminId: user.uid,
        },
        date: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        // records field might be missing in Attendance model, 
        // looking at schema.prisma, Attendance has classId, userId, date, status, remarks.
        // It seems the implementation was assuming a different structure.
        // Let's fix it based on the schema.prisma.
      },
    });

    const datesMap: Record<string, { total: number; present: number }> = {};

    // Grouping attendance by date
    for (const record of attendanceRecords) {
      const dateStr = record.date.toISOString().split("T")[0];
      if (!datesMap[dateStr]) {
        datesMap[dateStr] = { total: 0, present: 0 };
      }
      datesMap[dateStr].total += 1;
      if (record.status === "PRESENT" || record.status === "LATE") {
        datesMap[dateStr].present += 1;
      }
    }

    const trends = Object.entries(datesMap)
      .map(([date, counts]) => ({
        date,
        percentage: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  } catch (error) {
    console.error("Error fetching attendance trends (Supabase):", error);
    return [];
  }
}

/**
 * Fetch detailed statistics for a specific class using Supabase/Prisma.
 */
export async function getClassDetailedStatsSupabase(classId: string) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const [grades, attendanceRecords, totalEnrolled] = await Promise.all([
      // 1. Fetch all grades for tasks in this class
      prisma.grade.findMany({
        where: {
          task: {
            classId,
          },
        },
        select: {
          value: true,
        },
      }),
      // 2. Fetch all attendance records for this class
      prisma.attendance.findMany({
        where: { classId },
        orderBy: { date: "desc" },
      }),
      // 3. Total enrolled students for percentage calculation
      prisma.enrollment.count({
        where: { classId }
      })
    ]);

    // Calculate Average Grade
    let avgGrade = 0;
    if (grades.length > 0) {
      const values = grades.map((g: any) => g.value || 0);
      avgGrade = Math.round((values.reduce((a: number, b: number) => a + b, 0) / values.length) * 10) / 10;
    }

    // Calculate Attendance History
    const datesMap: Record<string, { total: number; present: number }> = {};
    for (const record of attendanceRecords) {
      const dateStr = record.date.toISOString().split("T")[0];
      if (!datesMap[dateStr]) {
        datesMap[dateStr] = { total: totalEnrolled, present: 0 };
      }
      if (record.status === "PRESENT" || record.status === "LATE") {
        datesMap[dateStr].present += 1;
      }
    }

    const attendanceHistory = Object.entries(datesMap)
      .map(([date, counts]) => ({
        date,
        percentage: counts.total > 0 ? Math.round((counts.present / counts.total) * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    const avgAttendance = attendanceHistory.length > 0
      ? Math.round(attendanceHistory.reduce((a: number, b: any) => a + b.percentage, 0) / attendanceHistory.length)
      : 0;

    return { avgGrade, avgAttendance, attendanceHistory };
  } catch (error) {
    console.error("Error fetching detailed class stats (Supabase):", error);
    return { avgGrade: 0, avgAttendance: 0, attendanceHistory: [] };
  }
}
