"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface ClassData {
  id: string;
  name: string;
  description: string;
  code: string;
  adminId: string;
  studentCount: number;
  createdAt: string;
}

const createClassSchema = z.object({
  name: z.string().min(3, "Nama kelas minimal 3 karakter"),
  description: z.string().optional(),
});

/**
 * Generate a unique 6-digit alphanumeric code for a class.
 */
async function generateUniqueClassCode(): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let isUnique = false;
  let code = "";

  while (!isUnique) {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const existingClass = await prisma.class.findUnique({
      where: { code },
    });
    
    if (!existingClass) {
      isUnique = true;
    }
  }

  return code;
}

/**
 * Create a new class linked to the current Guru.
 */
export async function createClassSupabase(data: { name: string; description?: string }) {
  try {
    const user = await ensureGuru();
    
    const validation = createClassSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const code = await generateUniqueClassCode();
    
    const newClass = await prisma.class.create({
      data: {
        name: validation.data.name,
        description: validation.data.description || "",
        code,
        adminId: user.uid,
      },
    });

    revalidatePath("/dashboard/guru/classes");
    return { success: true, data: newClass };
  } catch (error: any) {
    console.error("Error creating class:", error);
    return { success: false, error: error.message || "Gagal membuat kelas" };
  }
}

/**
 * Fetch paginated classes for the current guru, including student counts.
 */
export async function getGuruClassesSupabase(params: { page?: number; pageSize?: number } = {}) {
  const { page = 1, pageSize = 10 } = params;
  
  try {
    const user = await ensureGuru();

    const totalCount = await prisma.class.count({
      where: { adminId: user.uid },
    });

    const classes = await prisma.class.findMany({
      where: { adminId: user.uid },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    return {
      success: true,
      data: classes.map((cls: any) => ({
        ...cls,
        studentCount: cls._count.students,
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error: any) {
    console.error("Error fetching guru classes:", error);
    return { success: false, data: [], totalCount: 0, totalPages: 0, error: error.message };
  }
}

/**
 * Update class name/description with ownership check.
 */
export async function updateClassSupabase(classId: string, data: { name: string; description?: string }) {
  try {
    const user = await ensureGuru();

    const validation = createClassSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // Ownership check
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { adminId: true },
    });

    if (!existingClass) {
      return { success: false, error: "Kelas tidak ditemukan" };
    }

    if (existingClass.adminId !== user.uid) {
      return { success: false, error: "Unauthorized" };
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        name: validation.data.name,
        description: validation.data.description || "",
      },
    });

    revalidatePath("/dashboard/guru/classes");
    return { success: true, data: updatedClass };
  } catch (error: any) {
    console.error("Error updating class:", error);
    return { success: false, error: error.message || "Gagal memperbarui kelas" };
  }
}

/**
 * Delete a class (Cascade delete should handle enrollments).
 */
export async function deleteClassSupabase(classId: string) {
  try {
    const user = await ensureGuru();

    // Ownership check
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { adminId: true },
    });

    if (!existingClass) {
      return { success: false, error: "Kelas tidak ditemukan" };
    }

    if (existingClass.adminId !== user.uid) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.class.delete({
      where: { id: classId },
    });

    revalidatePath("/dashboard/guru/classes");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting class:", error);
    return { success: false, error: error.message || "Gagal menghapus kelas" };
  }
}

/**
 * Fetch single class details.
 */
export async function getClassByIdSupabase(classId: string) {
  try {
    await ensureGuru(); // Base protection

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!cls) return null;

    return {
      ...cls,
      studentCount: cls._count.students,
    };
  } catch (error) {
    console.error("Error fetching class by id:", error);
    return null;
  }
}

/**
 * Counts total tasks for a class using Supabase/Prisma.
 */
export async function getTaskCountSupabase(classId: string): Promise<number> {
  try {
    await ensureGuru();
    const count = await prisma.task.count({
      where: { classId },
    });
    return count;
  } catch (error) {
    console.error("Error counting tasks:", error);
    return 0;
  }
}

/**
 * Fetches detailed performance and attendance stats for a class using Supabase/Prisma.
 */
export async function getClassDetailedStatsSupabase(classId: string) {
  try {
    await ensureGuru();

    // Average grade (from Grades)
    const grades = await prisma.grade.findMany({
      where: {
        task: {
          classId: classId,
        },
        value: { not: null },
      },
      select: { value: true },
    });

    let avgGrade = 0;
    if (grades.length > 0) {
      const totalGrade = grades.reduce((sum: number, g: any) => sum + (g.value || 0), 0);
      avgGrade = Math.round((totalGrade / grades.length) * 10) / 10;
    }

    // Attendance stats
    const totalStudents = await prisma.enrollment.count({
      where: { classId },
    });

    // Get last 10 dates with attendance
    const attendanceDates = await prisma.attendance.groupBy({
      by: ['date'],
      where: { classId },
      orderBy: { date: 'desc' },
      take: 10,
    });

    let avgAttendance = 0;
    let attendanceHistory: { date: string; percentage: number }[] = [];

    if (attendanceDates.length > 0) {
      const historyPromises = attendanceDates.map(async (group: { date: Date }) => {
        const date = group.date;
        const [presentCount, totalAtDate] = await Promise.all([
          prisma.attendance.count({
            where: {
              classId,
              date,
              status: { in: ['PRESENT', 'LATE'] },
            },
          }),
          prisma.attendance.count({
            where: {
              classId,
              date,
            },
          })
        ]);

        return {
          date: date.toISOString().split('T')[0],
          percentage: totalAtDate > 0 ? Math.round((presentCount / totalAtDate) * 100) : 0,
        };
      });

      attendanceHistory = (await Promise.all(historyPromises)).reverse();
      avgAttendance = Math.round(attendanceHistory.reduce((a, b) => a + b.percentage, 0) / attendanceHistory.length);
    }

    return { avgGrade, avgAttendance, attendanceHistory };
  } catch (error) {
    console.error("Error fetching detailed class stats:", error);
    return { avgGrade: 0, avgAttendance: 0, attendanceHistory: [] };
  }
}

/**
 * Fetches all tasks for a class using Supabase/Prisma.
 */
export async function getTasksSupabase(classId: string) {
  try {
    await ensureGuru();
    const tasks = await prisma.task.findMany({
      where: { classId },
      orderBy: { date: "desc" },
    });

    return tasks.map((t: any) => ({
      ...t,
      createdAt: t.date.toISOString(), // Map 'date' to 'createdAt' for UI compatibility
      updatedAt: t.date.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return [];
  }
}

/**
 * Fetches all grades for a specific class to be used in the Grading Matrix.
 * Returns a record keyed by taskId_userId.
 */
export async function getClassGradesSupabase(classId: string) {
  try {
    await ensureGuru();
    const gradesList = await prisma.grade.findMany({
      where: {
        task: {
          classId: classId,
        },
      },
    });

    const grades: Record<string, { grade: number; feedback: string; rewardXP?: number; rewardBadgeId?: string }> = {};
    gradesList.forEach((g: any) => {
      grades[`${g.taskId}_${g.studentId}`] = {
        grade: g.value || 0,
        feedback: g.remarks || "",
        // Supabase schema might differ in rewards, handle defaults
        rewardXP: 0, 
        rewardBadgeId: undefined,
      };
    });

    return grades;
  } catch (error) {
    console.error("Error fetching class grades:", error);
    return {};
  }
}


