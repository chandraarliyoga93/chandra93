"use server";

import { prisma } from "@/lib/prisma";
import { Student } from "@/types/student";
import { getAuthUser, ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

/**
 * Fetches current student profile data using Supabase/Prisma.
 */
export async function getStudentProfileSupabase() {
  try {
    const user = await getAuthUser();

    if (!user || user.role !== "Siswa") return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.uid },
    });

    if (!dbUser) return null;

    return {
      ...dbUser,
      id: dbUser.id,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
      alias: "",
      photo: "",
      equipped: {},
      inventory: [],
      guruCoin: dbUser.guruCoin || 0,
      studentId: dbUser.username || "",
    };
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return null;
  }
}

/**
 * Fetches public student profile data by UID using Supabase/Prisma.
 */
export async function getPublicStudentProfileSupabase(uid: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!dbUser) return null;
    
    return {
      uid: dbUser.id,
      name: dbUser.name,
      level: dbUser.level,
      xp: dbUser.xp,
      joinedAt: dbUser.createdAt.toISOString(),
      // Add missing fields for UI compatibility during migration
      alias: (dbUser as any).alias || "",
      photo: (dbUser as any).photo || "",
      equipped: (dbUser as any).equipped || {},
      role: dbUser.role,
      guruCoin: dbUser.guruCoin || 0,
    };
  } catch (error) {
    console.error("Error fetching public student profile:", error);
    return null;
  }
}

/**
 * Server action to fetch the current user's profile for the AuthProvider.
 * This is safer than fetching from client-side Supabase due to RLS.
 */
export async function getUserProfileActionSupabase(uid: string) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!dbUser) return null;

    return {
      uid: dbUser.id,
      name: dbUser.name,
      role: dbUser.role === "ADMIN_GURU" ? "Guru" : "Siswa", // Map to UI roles
      level: dbUser.level,
      xp: dbUser.xp,
      photo: (dbUser as any).photo || "",
      guruCoin: dbUser.guruCoin || 0,
    };
  } catch (error) {
    console.error("Error fetching user profile action:", error);
    return null;
  }
}

/**
 * Paginated list of students for the Guru dashboard.
 * Supports search (name/username) and includes current class info via enrollments.class.
 */
export async function getStudentsActionSupabase(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  try {
    const user = await ensureGuru();

    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      role: "SISWA",
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { username: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          enrollments: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },
            },
            orderBy: {
              joinedAt: "desc",
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: students.map((s: any) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        enrollments: s.enrollments.map((e: any) => ({
          ...e,
          joinedAt: e.joinedAt.toISOString(),
          class: e.class,
        })),
        // Add missing fields for UI compatibility
        alias: "",
        photo: "",
        equipped: {},
        inventory: [],
        guruCoin: s.guruCoin || 0,
        studentId: s.username || "", // Map username to studentId if needed
        password: s.password || (s.isManual ? "Siswa123!" : ""), // Include password for login cards
      })),
      totalPages: Math.ceil(total / limit),
      totalCount: total,
    };
  } catch (error) {
    console.error("Error fetching students:", error);
    return { success: false, error: "Gagal memuat data siswa" };
  }
}

/**
 * Fetches students enrolled in a specific class using Supabase/Prisma.
 */
export async function getStudentsByClassSupabase(classId: string, params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  try {
    await ensureGuru();

    const page = params.page || 1;
    const limit = params.limit === 0 ? undefined : (params.limit || undefined);
    const skip = limit ? (page - 1) * limit : undefined;

    const where: any = {
      enrollments: {
        some: {
          classId: classId,
        },
      },
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { username: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const orderBy: any = {};
    if (params.sortBy) {
      orderBy[params.sortBy] = params.sortOrder || "asc";
    } else {
      orderBy.name = "asc";
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          enrollments: {
            where: { classId },
            include: {
              class: true,
            },
          },
        },
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      success: true,
      data: students.map((s: any) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
        joinedAt: s.enrollments[0]?.joinedAt?.toISOString() || s.createdAt.toISOString(),
        // Map username to studentId if needed
        studentId: s.username || "",
        alias: (s as any).alias || "",
        photo: (s as any).photo || "",
        password: s.password || (s.isManual ? "Siswa123!" : ""), // Include password for login cards
        equipped: (s as any).equipped || {},
        inventory: (s as any).inventory || [],
        guruCoin: s.guruCoin || 0,
      })),
      totalPages: limit ? Math.ceil(total / limit) : 1,
      totalCount: total,
      totalEnrolled: total,
    };
  } catch (error) {
    console.error("Error fetching students in class:", error);
    return { success: false, error: "Gagal memuat data siswa kelas", data: [], totalPages: 0, totalCount: 0, totalEnrolled: 0 };
  }
}

