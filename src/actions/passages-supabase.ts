"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser, ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { Passage } from "@/types/exam";
import { z } from "zod";

const passageSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Judul bacaan wajib diisi"),
  content: z.string().min(1, "Konten bacaan wajib diisi"),
  imageUrl: z.string().optional().nullable(),
});

export async function getPassagesSupabase(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const { page = 1, pageSize = 10, search = "" } = params;
  
  try {
    const user = await ensureGuru();

    const where: any = {
      guruId: user.uid,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [snapshot, totalCount] = await Promise.all([
      prisma.passage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.passage.count({ where }),
    ]);

    const data = snapshot.map((p: any) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })) as Passage[];

    return { 
      success: true, 
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error: any) {
    console.error("Error fetching passages (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized", data: [], totalCount: 0, totalPages: 0 };
    }
    return { success: false, error: "Gagal mengambil data bacaan", data: [], totalCount: 0, totalPages: 0 };
  }
}

export async function savePassageSupabase(data: z.infer<typeof passageSchema>) {
  try {
    const user = await ensureGuru();

    const validation = passageSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }

    const { id, ...passageData } = validation.data;

    if (id) {
      const existing = await prisma.passage.findUnique({
        where: { id },
        select: { guruId: true },
      });

      if (!existing) {
        return { success: false, error: "Bacaan tidak ditemukan" };
      }

      if (existing.guruId !== user.uid) {
        return { success: false, error: "Unauthorized access" };
      }

      await prisma.passage.update({
        where: { id },
        data: passageData,
      });

      revalidatePath("/dashboard/guru/bank-soal");
      return { success: true, id };
    } else {
      const result = await prisma.passage.create({
        data: {
          ...passageData,
          guruId: user.uid,
        },
      });

      revalidatePath("/dashboard/guru/bank-soal");
      return { success: true, id: result.id };
    }
  } catch (error: any) {
    console.error("Error saving passage (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal menyimpan bacaan" };
  }
}

export async function deletePassageSupabase(id: string) {
  try {
    const user = await ensureGuru();

    const existing = await prisma.passage.findUnique({
      where: { id },
      select: { guruId: true },
    });

    if (!existing) {
      return { success: false, error: "Bacaan tidak ditemukan" };
    }

    if (existing.guruId !== user.uid) {
      return { success: false, error: "Unauthorized access" };
    }

    await prisma.passage.delete({ where: { id } });

    revalidatePath("/dashboard/guru/bank-soal");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting passage (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal menghapus bacaan" };
  }
}

export async function getPassageByIdSupabase(id: string) {
  try {
    const user = await ensureGuru();

    const doc = await prisma.passage.findUnique({
      where: { id },
    });
    
    if (!doc) {
      return { success: false, error: "Bacaan tidak ditemukan" };
    }

    if (doc.guruId !== user.uid) {
      return { success: false, error: "Unauthorized access" };
    }

    const passage = {
      ...doc,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    } as Passage;

    return { success: true, data: passage };
  } catch (error: any) {
    console.error("Error fetching passage by id (Supabase):", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal mengambil data bacaan" };
  }
}
