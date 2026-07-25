"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { assignXPSupabase, awardBadgeSupabase, batchAssignXPSupabase, batchAssignBadgeSupabase } from "./gamification-supabase";
import { getAuthUser, ensureGuru, ensureSiswa } from "@/lib/auth-server";

export interface GradeData {
  id: string;
  classId: string;
  taskId: string;
  studentId: string;
  grade: number;
  feedback: string;
  rewardXP?: number;
  rewardBadgeId?: string;
  updatedAt: string | null;
  updatedBy: string;
  taskTitle?: string;
}

export async function saveGradeSupabase(
  classId: string,
  taskId: string,
  studentId: string,
  grade: number,
  feedback: string = "",
  rewardXP?: number,
  rewardBadgeId?: string
) {
  try {
    const user = await ensureGuru();

    if (grade < 0 || grade > 100) {
      return { success: false, error: "Nilai harus antara 0 dan 100" };
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { classId: true, title: true, rewards: true },
    });

    if (!task || task.classId !== classId) {
      return { success: false, error: "Tugas tidak ditemukan di kelas ini" };
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const existingGrade = await tx.grade.findUnique({
        where: {
          taskId_studentId: {
            taskId,
            studentId,
          },
        },
      });

      const isNew = !existingGrade;
      const previousGrade = isNew ? 0 : (existingGrade.value || 0);
      const isImproved = !isNew && grade > previousGrade;

      const dataToSet: any = {
        value: grade,
        remarks: feedback,
      };

      await tx.grade.upsert({
        where: {
          taskId_studentId: {
            taskId,
            studentId,
          },
        },
        update: dataToSet,
        create: {
          taskId,
          studentId,
          ...dataToSet,
        },
      });

      if (isNew || isImproved) {
        const xpToAward = rewardXP ?? (task.rewards as any)?.xp ?? 50;
        const title = task.title || taskId;
        
        await assignXPSupabase(studentId, xpToAward, `Nilai Tugas: ${title}${isImproved ? ' (Peningkatan)' : ''}`, tx);
        
        if (rewardBadgeId) {
          await awardBadgeSupabase(studentId, rewardBadgeId, tx);
        }
      }

      return { success: true };
    }, { timeout: 15000 });

    if (result.success) {
      revalidatePath(`/dashboard/guru/classes/${classId}/grades`);
    }
    return result;
  } catch (error: any) {
    console.error("Error saving grade (Supabase):", error);
    return { success: false, error: error.message || "Gagal menyimpan nilai" };
  }
}

export async function saveBulkGradesSupabase(
  classId: string,
  taskId: string,
  updates: { studentId: string; grade: number; feedback?: string }[],
  rewardXP?: number,
  rewardBadgeId?: string
) {
  try {
    const user = await ensureGuru();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { classId: true, title: true, rewards: true },
    });

    if (!task || task.classId !== classId) {
      return { success: false, error: "Tugas tidak ditemukan" };
    }

    const xpToAward = rewardXP ?? (task.rewards as any)?.xp ?? 50;
    const studentIdsToReward: string[] = [];

    await prisma.$transaction(async (tx: any) => {
      for (const update of updates) {
        if (update.grade < 0 || update.grade > 100) continue;

        await tx.grade.upsert({
          where: {
            taskId_studentId: {
              taskId,
              studentId: update.studentId,
            },
          },
          update: {
            value: update.grade,
            remarks: update.feedback || "",
          },
          create: {
            taskId,
            studentId: update.studentId,
            value: update.grade,
            remarks: update.feedback || "",
          },
        });

        studentIdsToReward.push(update.studentId);
      }

      if (xpToAward > 0 && studentIdsToReward.length > 0) {
        await batchAssignXPSupabase(studentIdsToReward, xpToAward, `Nilai Tugas (Massal): ${task.title}`, tx);
      }
      if (rewardBadgeId && studentIdsToReward.length > 0) {
        await batchAssignBadgeSupabase(studentIdsToReward, rewardBadgeId, tx);
      }
    }, { timeout: 30000 });

    revalidatePath(`/dashboard/guru/classes/${classId}/grades`);
    return { success: true };
  } catch (error: any) {
    console.error("Error saving bulk grades (Supabase):", error);
    return { success: false, error: error.message || "Gagal menyimpan nilai massal" };
  }
}

export async function getStudentGradesInClassSupabase(classId: string, studentId: string): Promise<GradeData[]> {
  try {
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        task: {
          classId,
        },
      },
      include: {
        task: true,
      },
    });

    return grades.map((g: any) => ({
      id: g.id,
      classId: g.task.classId,
      taskId: g.taskId,
      studentId: g.studentId,
      grade: g.value || 0,
      feedback: g.remarks || "",
      updatedAt: g.createdAt.toISOString(), // Use createdAt as fallback for updatedAt
      updatedBy: g.updatedBy || "",
    }));
  } catch (error) {
    console.error("Error fetching student grades (Supabase):", error);
    return [];
  }
}

export async function getGlobalStudentGradesSupabase(): Promise<GradeData[]> {
  try {
    const user = await ensureSiswa();
    const grades = await prisma.grade.findMany({
      where: {
        studentId: user.uid,
      },
      include: {
        task: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return grades.map((g: any) => ({
      id: g.id,
      classId: g.task.classId,
      taskId: g.taskId,
      studentId: g.studentId,
      grade: g.value || 0,
      feedback: g.remarks || "",
      updatedAt: g.createdAt.toISOString(),
      updatedBy: g.updatedBy || "",
      taskTitle: g.task.title,
    }));
  } catch (error) {
    console.error("Error fetching global student grades (Supabase):", error);
    return [];
  }
}

export async function getGradingHistorySupabase(classId: string) {
  try {
    await ensureGuru();

    const [tasks, totalStudentsInClass] = await Promise.all([
      prisma.task.findMany({
        where: { classId },
        include: {
          grades: true,
        },
        orderBy: { date: "desc" },
      }),
      prisma.enrollment.count({
        where: { classId },
      }),
    ]);

    return tasks.map((task: any) => {
      const totalStudentsGraded = task.grades.length;
      const sumGrades = task.grades.reduce((sum: number, g: any) => sum + (g.value || 0), 0);
      const averageGrade = totalStudentsGraded > 0 ? sumGrades / totalStudentsGraded : 0;
      const completionRate = totalStudentsInClass > 0 ? (totalStudentsGraded / totalStudentsInClass) * 100 : 0;

      return {
        id: task.id,
        title: task.title,
        createdAt: task.date.toISOString(),
        averageGrade: Math.round(averageGrade * 10) / 10,
        completionRate: Math.round(completionRate),
        totalStudentsGraded,
        totalStudentsInClass,
      };
    });
  } catch (error) {
    console.error("Error fetching grading history (Supabase):", error);
    return [];
  }
}

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

export async function saveMatrixGradesSupabase(classId: string, updates: any[]) {
  try {
    const user = await ensureGuru();
    
    await prisma.$transaction(async (tx: any) => {
      for (const update of updates) {
        await tx.grade.upsert({
          where: {
            taskId_studentId: {
              taskId: update.taskId,
              studentId: update.studentId,
            },
          },
          update: {
            value: update.grade,
            remarks: update.feedback || "",
          },
          create: {
            taskId: update.taskId,
            studentId: update.studentId,
            value: update.grade,
            remarks: update.feedback || "",
          },
        });
      }
    }, { timeout: 30000 });

    revalidatePath(`/dashboard/guru/classes/${classId}/grades`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export interface TaskHistory {
  id: string;
  title: string;
  createdAt: string;
  averageGrade: number;
  completionRate: number;
  totalStudentsGraded: number;
  totalStudentsInClass: number;
}

export async function saveGrade(classId: string, taskId: string, studentId: string, grade: number, feedback: string = "", rewardXP?: number, rewardBadgeId?: string) {
  return saveGradeSupabase(classId, taskId, studentId, grade, feedback, rewardXP, rewardBadgeId);
}

export async function saveBulkGrades(classId: string, taskId: string, updates: { studentId: string; grade: number; feedback?: string }[], rewardXP?: number, rewardBadgeId?: string) {
  return saveBulkGradesSupabase(classId, taskId, updates, rewardXP, rewardBadgeId);
}

export async function getStudentGradesInClass(classId: string, studentId: string) {
  return getStudentGradesInClassSupabase(classId, studentId);
}

export async function getGradingHistory(classId: string) {
  return getGradingHistorySupabase(classId);
}

export async function getClassGrades(classId: string) {
  return getClassGradesSupabase(classId);
}

export async function saveMatrixGrades(classId: string, updates: any[]) {
  return saveMatrixGradesSupabase(classId, updates);
}
