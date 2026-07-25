"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru, getAuthUser } from "@/lib/auth-server";
import { teacherProfileSchema } from "@/lib/schemas/user";
import { revalidatePath } from "next/cache";

export async function getTeacherProfileSupabase() {
  try {
    const user = await ensureGuru();
    const dbUser = await prisma.user.findUnique({
      where: { id: user.uid }
    });
    return { success: true, data: dbUser };
  } catch (error) {
    return { success: false, data: null };
  }
}

export async function updateStudentAliasSupabase(alias: string) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    await prisma.user.update({
      where: { id: user.uid },
      data: { alias } as any
    });

    revalidatePath("/dashboard/siswa/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating student alias:", error);
    return { success: false, error: "Gagal memperbarui alias" };
  }
}

export async function updateFCMTokenActionSupabase(token: string) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false };
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateProfilePhotoSupabase(photoUrl: string) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    await prisma.user.update({
      where: { id: user.uid },
      data: { photo: photoUrl } as any
    });

    revalidatePath("/dashboard/siswa/profile");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal memperbarui foto profil" };
  }
}

export async function updateStudentNameSupabase(studentId: string, name: string) {
  try {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    await prisma.user.update({
      where: { id: studentId },
      data: { name }
    });

    revalidatePath("/dashboard/guru/students");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal memperbarui nama" };
  }
}

export async function updateTeacherProfileSupabase(data: any) {
  try {
    const user = await ensureGuru();
    
    // Validate data using zod
    const validation = teacherProfileSchema.safeParse(data);
    if (!validation.success) {
      return { 
        success: false, 
        error: validation.error.issues[0].message 
      };
    }

    await prisma.user.update({
      where: { id: user.uid },
      data: validation.data
    });

    revalidatePath("/dashboard/guru/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    return { 
      success: false, 
      error: "Gagal memperbarui profil. Silakan coba lagi nanti." 
    };
  }
}

export async function getTeacherProfile() { return getTeacherProfileSupabase(); }
export async function updateStudentAlias(alias: string) { return updateStudentAliasSupabase(alias); }
export async function updateFCMTokenAction(token: string) { return updateFCMTokenActionSupabase(token); }
export async function updateProfilePhoto(photoUrl: string) { return updateProfilePhotoSupabase(photoUrl); }
export async function updateStudentName(studentId: string, name: string) { return updateStudentNameSupabase(studentId, name); }
export async function updateTeacherProfile(data: any) { return updateTeacherProfileSupabase(data); }
