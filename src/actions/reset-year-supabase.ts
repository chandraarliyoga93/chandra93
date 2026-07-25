"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensureGuru } from "@/lib/auth-server";
import { RESET_SCHOOL_YEAR_CONFIRM_PHRASE } from "@/lib/reset-school-year";

export type ResetSchoolYearResult =
  | {
      success: true;
      stats: {
        classesDeleted: number;
        coursesDeleted: number;
        examsDeleted: number;
        studentsDeleted: number;
        authDeleted: number;
        authFailed: { id: string; message: string }[];
      };
    }
  | { success: false; error: string };

export async function resetSchoolYearSupabase(
  confirmation: string
): Promise<ResetSchoolYearResult> {
  try {
    const user = await ensureGuru();
    const guruId = user.uid;

    const adminEmail = process.env.ADMIN_GURU_EMAIL;
    if (adminEmail) {
      const me = await prisma.user.findUnique({
        where: { id: guruId },
        select: { email: true },
      });
      if (me?.email !== adminEmail) {
        return { success: false, error: "Akses ditolak: hanya admin utama." };
      }
    }

    if (confirmation.trim() !== RESET_SCHOOL_YEAR_CONFIRM_PHRASE) {
      return { success: false, error: "Frasa konfirmasi tidak sesuai." };
    }

    const { deletedStudentIds, classesDeleted, coursesDeleted, examsDeleted } =
      await prisma.$transaction(
        async (tx) => {
          const classRows = await tx.class.findMany({
            where: { adminId: guruId },
            select: { id: true },
          });
          const classIds = classRows.map((c) => c.id);

          let candidateStudentIds: string[] = [];
          if (classIds.length > 0) {
            const enrollRows = await tx.enrollment.findMany({
              where: { classId: { in: classIds } },
              select: { userId: true },
            });
            candidateStudentIds = [...new Set(enrollRows.map((e) => e.userId))];
          }

          if (classIds.length > 0) {
            await tx.exam.updateMany({
              where: { classId: { in: classIds } },
              data: { classId: null },
            });
          }

          const examsDel = await tx.exam.deleteMany({
            where: { adminId: guruId },
          });

          const coursesDel = await tx.course.deleteMany({
            where: { teacherId: guruId },
          });

          const classesDel = await tx.class.deleteMany({
            where: { adminId: guruId },
          });

          if (candidateStudentIds.length === 0) {
            return {
              deletedStudentIds: [] as string[],
              examsDeleted: examsDel.count,
              coursesDeleted: coursesDel.count,
              classesDeleted: classesDel.count,
            };
          }

          const remainingEnrollments = await tx.enrollment.findMany({
            where: { userId: { in: candidateStudentIds } },
            select: { userId: true },
          });
          const stillEnrolled = new Set(
            remainingEnrollments.map((e) => e.userId)
          );

          const orphanedCandidateIds = candidateStudentIds.filter(
            (id) => !stillEnrolled.has(id)
          );

          if (orphanedCandidateIds.length === 0) {
            return {
              deletedStudentIds: [] as string[],
              examsDeleted: examsDel.count,
              coursesDeleted: coursesDel.count,
              classesDeleted: classesDel.count,
            };
          }

          const usersToRemove = await tx.user.findMany({
            where: {
              id: { in: orphanedCandidateIds },
              role: "SISWA",
            },
            select: { id: true },
          });

          const ids = usersToRemove.map((u) => u.id);

          if (ids.length > 0) {
            await tx.user.deleteMany({
              where: { id: { in: ids }, role: "SISWA" },
            });
          }

          return {
            deletedStudentIds: ids,
            examsDeleted: examsDel.count,
            coursesDeleted: coursesDel.count,
            classesDeleted: classesDel.count,
          };
        },
        { maxWait: 60000, timeout: 120000 }
      );

    const authFailed: { id: string; message: string }[] = [];
    let authDeleted = 0;

    for (const sid of deletedStudentIds) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(sid);
      if (error) {
        authFailed.push({ id: sid, message: error.message });
      } else {
        authDeleted++;
      }
    }

    revalidatePath("/dashboard/guru");
    revalidatePath("/dashboard/guru/admin");
    revalidatePath("/dashboard/guru/classes");
    revalidatePath("/dashboard/guru/students");
    revalidatePath("/dashboard/guru/bank-soal");
    revalidatePath("/dashboard/guru/lms");
    revalidatePath("/dashboard/guru/cbt");

    return {
      success: true,
      stats: {
        classesDeleted,
        coursesDeleted,
        examsDeleted,
        studentsDeleted: deletedStudentIds.length,
        authDeleted,
        authFailed,
      },
    };
  } catch (error: unknown) {
    console.error("resetSchoolYearSupabase", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mereset data tahun ajaran",
    };
  }
}
