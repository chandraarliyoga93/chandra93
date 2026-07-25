"use server";

import { prisma } from "@/lib/prisma";
import { ensureSiswa, ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

/**
 * Fetches all classes the current student is enrolled in.
 */
export async function getEnrolledClassesSupabase() {
  try {
    const user = await ensureSiswa();

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.uid },
      include: {
        class: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
        user: {
          select: {
            xp: true,
            level: true,
            alias: true,
            name: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return enrollments.map((e: any) => ({
      id: e.class.id,
      name: e.class.name,
      description: e.class.description,
      code: e.class.code,
      guruId: e.class.adminId,
      studentCount: e.class._count.students,
      createdAt: e.class.createdAt.toISOString(),
      studentStats: {
        xp: e.user.xp,
        level: e.user.level,
        alias: e.user.alias,
        name: e.user.name,
      },
    }));
  } catch (error) {
    console.error("Error fetching enrolled classes:", error);
    return [];
  }
}

/**
 * Guru action to remove a student from a class.
 */
export async function removeStudentFromClassSupabase(classId: string, studentId: string) {
  try {
    const user = await ensureGuru();

    // Ownership check
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { adminId: true },
    });

    if (!targetClass) {
      return { success: false, error: "Kelas tidak ditemukan" };
    }

    if (targetClass.adminId !== user.uid) {
      return { success: false, error: "Bukan pemilik kelas" };
    }

    // Remove enrollment
    await prisma.enrollment.delete({
      where: {
        userId_classId: {
          userId: studentId,
          classId: classId,
        },
      },
    });

    revalidatePath(`/dashboard/guru/classes/${classId}/students`);
    return { success: true };
  } catch (error: any) {
    console.error("Error removing student from class:", error);
    return { success: false, error: error.message || "Gagal mengeluarkan siswa" };
  }
}

export async function getEnrolledClasses() { return getEnrolledClassesSupabase(); }
export async function removeStudentFromClass(classId: string, studentId: string) { return removeStudentFromClassSupabase(classId, studentId); }
