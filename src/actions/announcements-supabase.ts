"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureGuru, getAuthUser } from "@/lib/auth-server";

export interface Announcement {
  id: string;
  authorName: string;
  message: string;
  expiresAt?: string;
  createdAt: string;
}

const announcementSchema = z.object({
  classId: z.string().min(1, "Pilih kelas"),
  message: z.string().min(3, "Pesan minimal 3 karakter"),
  expiresAt: z.date().optional().nullable(),
});

/**
 * Fetch active announcements for a student's classes
 */
export async function getActiveAnnouncementsSupabase(classIds: string[]): Promise<Announcement[]> {
  if (classIds.length === 0) return [];

  try {
    const now = new Date();

    const snapshot = await prisma.announcement.findMany({
      where: {
        classId: { in: classIds },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20, // Reasonable limit for all classes combined
    });

    return snapshot.map((doc: any) => ({
      id: doc.id,
      authorName: doc.authorName,
      message: doc.message,
      expiresAt: doc.expiresAt?.toISOString(),
      createdAt: doc.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching active announcements (Supabase):", error);
    return [];
  }
}

/**
 * Fetch all announcements for a specific class (Guru view)
 */
export async function getAnnouncementsByClassSupabase(classId: string): Promise<Announcement[]> {
  try {
    const snapshot = await prisma.announcement.findMany({
      where: { classId },
      orderBy: { createdAt: "desc" },
    });

    return snapshot.map((doc: any) => ({
      id: doc.id,
      authorName: doc.authorName,
      message: doc.message,
      expiresAt: doc.expiresAt?.toISOString(),
      createdAt: doc.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching class announcements (Supabase):", error);
    return [];
  }
}

/**
 * Create a new announcement
 */
export async function createAnnouncementSupabase(data: z.infer<typeof announcementSchema>) {
  try {
    const user = await ensureGuru();
    
    // Get guru name
    const userData = await prisma.user.findUnique({
      where: { id: user.uid },
      select: { name: true },
    });
    const authorName = userData?.name || "Guru";

    const validation = announcementSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    await prisma.announcement.create({
      data: {
        classId: validation.data.classId,
        authorName,
        message: validation.data.message,
        expiresAt: validation.data.expiresAt || null,
      },
    });

    revalidatePath("/dashboard/guru");
    revalidatePath("/dashboard/siswa");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating announcement (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal membuat pengumuman" };
  }
}

/**
 * Update an existing announcement
 */
export async function updateAnnouncementSupabase(id: string, data: z.infer<typeof announcementSchema>) {
  try {
    await ensureGuru();

    const validation = announcementSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Pengumuman tidak ditemukan" };
    }

    await prisma.announcement.update({
      where: { id },
      data: {
        message: validation.data.message,
        expiresAt: validation.data.expiresAt || null,
      },
    });

    revalidatePath("/dashboard/guru");
    revalidatePath("/dashboard/siswa");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating announcement (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal memperbarui pengumuman" };
  }
}

/**
 * Delete an announcement
 */
export async function deleteAnnouncementSupabase(id: string) {
  try {
    await ensureGuru();

    const existing = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Pengumuman tidak ditemukan" };
    }

    await prisma.announcement.delete({
      where: { id },
    });

    revalidatePath("/dashboard/guru");
    revalidatePath("/dashboard/siswa");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting announcement (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal menghapus pengumuman" };
  }
}
