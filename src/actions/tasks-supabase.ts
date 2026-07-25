"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureGuru } from "@/lib/auth-server";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  description: z.string().optional(),
  rewards: z.object({
    xp: z.number().min(0).default(50),
    badgeId: z.string().optional(),
  }).optional(),
});

export interface Task {
  id: string;
  classId: string;
  title: string;
  description: string;
  rewards?: {
    xp: number;
    badgeId?: string;
  };
  createdAt: string;
  guruId: string;
}

export async function createTaskSupabase(classId: string, data: { 
  title: string; 
  description: string;
  rewards?: { xp: number; badgeId?: string };
}) {
  try {
    const user = await ensureGuru();
    const validated = taskSchema.parse(data);

    const newTask = await prisma.task.create({
      data: {
        classId,
        title: validated.title,
        description: validated.description || "",
        rewards: (validated.rewards || { xp: 50 }) as any,
        date: new Date(),
      },
    });

    revalidatePath(`/dashboard/guru/classes/${classId}/tasks`);
    revalidatePath(`/dashboard/guru/classes/${classId}/grades`);
    return { success: true, id: newTask.id };
  } catch (error: any) {
    console.error("Error creating task (Supabase):", error);
    return { success: false, error: error.message || "Gagal membuat tugas" };
  }
}

export async function updateTaskSupabase(taskId: string, data: { 
  title: string; 
  description: string;
  rewards?: { xp: number; badgeId?: string };
}) {
  try {
    const user = await ensureGuru();
    const validated = taskSchema.parse(data);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { class: true }
    });

    if (!task || task.class.adminId !== user.uid) {
      return { success: false, error: "Tugas tidak ditemukan atau akses ditolak" };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        title: validated.title,
        description: validated.description || "",
        rewards: (validated.rewards || { xp: 50 }) as any,
      },
    });

    revalidatePath(`/dashboard/guru/classes/${task.classId}/tasks`);
    revalidatePath(`/dashboard/guru/classes/${task.classId}/grades`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Error updating task (Supabase):", error);
    return { success: false, error: error.message || "Gagal memperbarui tugas" };
  }
}

export async function deleteTaskSupabase(taskId: string, classId: string) {
  try {
    const user = await ensureGuru();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { class: true }
    });

    if (!task || task.class.adminId !== user.uid) {
      return { success: false, error: "Tugas tidak ditemukan atau akses ditolak" };
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath(`/dashboard/guru/classes/${classId}/tasks`);
    revalidatePath(`/dashboard/guru/classes/${classId}/grades`);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting task (Supabase):", error);
    return { success: false, error: error.message || "Gagal menghapus tugas" };
  }
}

export async function getTasksSupabase(classId: string): Promise<Task[]> {
  try {
    const tasks = await prisma.task.findMany({
      where: { classId },
      orderBy: { date: "desc" },
      include: { class: true }
    });

    return tasks.map((t: any) => ({
      id: t.id,
      classId: t.classId,
      title: t.title,
      description: t.description || "",
      rewards: t.rewards as any,
      guruId: t.class.adminId,
      createdAt: t.date.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching tasks (Supabase):", error);
    return [];
  }
}

export async function getTasksWithPaginationSupabase(classId: string, limit: number = 5, page: any = 1): Promise<Task[]> {
  try {
    const skip = typeof page === 'number' ? (page - 1) * limit : 0;
    const tasks = await prisma.task.findMany({
      where: { classId },
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: { class: true }
    });

    return tasks.map((t: any) => ({
      id: t.id,
      classId: t.classId,
      title: t.title,
      description: t.description || "",
      rewards: t.rewards as any,
      guruId: t.class.adminId,
      createdAt: t.date.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching paginated tasks (Supabase):", error);
    return [];
  }
}

export async function getTaskCountSupabase(classId: string): Promise<number> {
  try {
    const count = await prisma.task.count({
      where: { classId },
    });
    return count;
  } catch (error) {
    console.error("Error counting tasks (Supabase):", error);
    return 0;
  }
}

export async function createTask(classId: string, data: any) { return createTaskSupabase(classId, data); }
export async function updateTask(taskId: string, data: any) { return updateTaskSupabase(taskId, data); }
export async function deleteTask(taskId: string, classId: string) { return deleteTaskSupabase(taskId, classId); }
export async function getTasks(classId: string) { return getTasksSupabase(classId); }
export async function getTasksWithPagination(classId: string, limit: number = 5, page: number = 1) { return getTasksWithPaginationSupabase(classId, limit, page); }
export async function getTaskCount(classId: string) { return getTaskCountSupabase(classId); }
