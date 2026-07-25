"use server";

import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function bulkRegisterStudents(
  students: { name: string; username: string; password?: string }[],
  classCode: string
) {
  try {
    const user = await ensureGuru();

    // Verify class ownership
    const cls = await prisma.class.findUnique({
      where: { code: classCode },
      select: { id: true, adminId: true, name: true }
    });

    if (!cls || cls.adminId !== user.uid) {
      return { success: false, error: "Kelas tidak ditemukan atau akses ditolak" };
    }

    const results = [];

    for (const student of students) {
      try {
        const email = `${student.username.toLowerCase()}@siswa.kg`;
        const password = student.password || "Siswa123!";
        
        // 1. Create Supabase Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: password,
          email_confirm: true,
          user_metadata: {
            full_name: student.name,
            role: 'SISWA'
          }
        });

        if (authError) {
          results.push({ name: student.name, success: false, error: authError.message });
          continue;
        }

        // 2. Create User Profile & Enrollment in Prisma Transaction
        await prisma.$transaction(async (tx: any) => {
          await tx.user.create({
            data: {
              id: authUser.user.id,
              email,
              name: student.name,
              username: student.username,
              password: password,
              role: 'SISWA',
              isManual: true,
              enrollments: {
                create: {
                  classId: cls.id
                }
              }
            }
          });
        });

        results.push({ name: student.name, success: true, email, password });
      } catch (err: any) {
        results.push({ name: student.name, success: false, error: err.message });
      }
    }

    revalidatePath("/dashboard/guru/students");
    revalidatePath(`/dashboard/guru/classes/${cls.id}/students`);

    return { 
      success: true, 
      results,
      className: cls.name
    };
  } catch (error: any) {
    console.error("Bulk registration error:", error);
    return { success: false, error: error.message };
  }
}

export async function enrollStudentSupabase(studentId: string, classId: string) {
  try {
    const user = await ensureGuru();

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { adminId: true }
    });

    if (!cls || cls.adminId !== user.uid) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.enrollment.create({
      data: {
        userId: studentId,
        classId: classId
      }
    });

    revalidatePath(`/dashboard/guru/classes/${classId}/students`);
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "Siswa sudah terdaftar di kelas ini" };
    }
    return { success: false, error: "Gagal mendaftarkan siswa" };
  }
}

export const bulkRegisterManualStudents = bulkRegisterStudents;
