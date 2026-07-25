"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureGuru, getAuthUser } from "@/lib/auth-server";

export interface Journal {
  id: string;
  classId: string;
  className: string;
  guruId: string;
  topic: string;
  activities: string;
  incidents: string;
  mood: string;
  date: string;
  createdAt: string;
}

const journalSchema = z.object({
  classId: z.string().min(1, "Pilih kelas"),
  topic: z.string().min(3, "Topik minimal 3 karakter"),
  activities: z.string().min(5, "Ringkasan aktivitas minimal 5 karakter"),
  incidents: z.string().optional().nullable(),
  mood: z.string().min(1, "Pilih mood"),
  date: z.date().optional(),
});

export async function createJournalSupabase(data: z.infer<typeof journalSchema>) {
  try {
    const user = await ensureGuru();

    const validation = journalSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: validation.data.classId },
    });
    if (!classExists) {
      return { success: false, error: "Kelas tidak ditemukan" };
    }

    await prisma.journal.create({
      data: {
        classId: validation.data.classId,
        userId: user.uid,
        topic: validation.data.topic,
        activities: validation.data.activities,
        incidents: validation.data.incidents || null,
        mood: validation.data.mood,
        date: validation.data.date || new Date(),
      },
    });

    revalidatePath("/dashboard/guru");
    revalidatePath("/dashboard/guru/journals");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating journal (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal membuat jurnal" };
  }
}

export async function updateJournalSupabase(id: string, data: z.infer<typeof journalSchema>) {
  try {
    const user = await ensureGuru();

    const validation = journalSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const existingJournal = await prisma.journal.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingJournal) {
      return { success: false, error: "Jurnal tidak ditemukan" };
    }

    if (existingJournal.userId !== user.uid) {
      return { success: false, error: "Unauthorized access" };
    }

    await prisma.journal.update({
      where: { id },
      data: {
        classId: validation.data.classId,
        topic: validation.data.topic,
        activities: validation.data.activities,
        incidents: validation.data.incidents || null,
        mood: validation.data.mood,
        date: validation.data.date || undefined,
      },
    });

    revalidatePath("/dashboard/guru");
    revalidatePath("/dashboard/guru/journals");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating journal (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal memperbarui jurnal" };
  }
}

export async function getJournalsSupabase(params: { classId?: string; page?: number; pageSize?: number } = {}): Promise<{ data: Journal[]; totalCount: number; totalPages: number }> {
  const { classId, page = 1, pageSize = 10 } = params;
  
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "Guru") {
      return { data: [], totalCount: 0, totalPages: 0 };
    }

    const where: any = { userId: user.uid };
    if (classId && classId !== "all") {
      where.classId = classId;
    }

    const [totalCount, snapshot] = await Promise.all([
      prisma.journal.count({ where }),
      prisma.journal.findMany({
        where,
        include: {
          class: {
            select: { name: true },
          },
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const data = snapshot.map((j: any) => ({
      id: j.id,
      classId: j.classId,
      className: j.class.name,
      guruId: j.userId,
      topic: j.topic,
      activities: j.activities,
      incidents: j.incidents || "",
      mood: j.mood,
      date: j.date.toISOString(),
      createdAt: j.createdAt.toISOString(),
    } as Journal));

    return {
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error("Error fetching journals (Supabase):", error);
    return { data: [], totalCount: 0, totalPages: 0 };
  }
}

export async function deleteJournalSupabase(id: string) {
  try {
    const user = await ensureGuru();

    const existingJournal = await prisma.journal.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingJournal) {
      return { success: false, error: "Jurnal tidak ditemukan" };
    }

    if (existingJournal.userId !== user.uid) {
      return { success: false, error: "Anda tidak memiliki akses untuk menghapus jurnal ini" };
    }

    await prisma.journal.delete({ where: { id } });

    revalidatePath("/dashboard/guru");
    revalidatePath("/dashboard/guru/journals");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting journal (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal menghapus jurnal" };
  }
}

export async function getJournalExportDataSupabase(params: { classId?: string; startDate: string; endDate: string }) {
  const { classId, startDate, endDate } = params;
  
  try {
    const user = await ensureGuru();
    
    // Get teacher name from User table
    const userData = await prisma.user.findUnique({
      where: { id: user.uid },
      select: { name: true },
    });
    const teacherName = userData?.name || "Guru";

    const where: any = { userId: user.uid };
    if (classId && classId !== "all") {
      where.classId = classId;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    where.date = {
      gte: start,
      lte: end,
    };

    const snapshot = await prisma.journal.findMany({
      where,
      include: {
        class: {
          select: { name: true },
        },
      },
      orderBy: { date: "asc" },
    });

    const journals = snapshot.map((j: any) => ({
      id: j.id,
      classId: j.classId,
      className: j.class.name,
      guruId: j.userId,
      topic: j.topic,
      activities: j.activities,
      incidents: j.incidents || "",
      mood: j.mood,
      date: j.date.toISOString(),
      createdAt: j.createdAt.toISOString(),
    } as Journal));

    return {
      success: true,
      data: {
        journals,
        teacherName,
      }
    };
  } catch (error: any) {
    console.error("Error fetching journal export data (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal mengambil data jurnal" };
  }
}
