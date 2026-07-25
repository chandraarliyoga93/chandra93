"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { randomUUID } from "crypto";

/**
 * Schema for individual student import data
 */
const StudentImportSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  username: z.string().min(3, "NIS/Username minimal 3 karakter"),
  email: z.string().email("Format email tidak valid").optional(),
});

/**
 * Server action to import students in bulk.
 * Uses prisma.user.upsert to either create new students or update existing ones.
 * Matches by username (NIS).
 * Wrapped in a transaction for atomicity.
 */
export async function importStudentsAction(data: any[]) {
  try {
    // 1. Authorization check
    await ensureGuru();

    // 2. Validate input data structure
    const validatedResult = z.array(StudentImportSchema).safeParse(data);
    if (!validatedResult.success) {
      return {
        success: false,
        error: "Data siswa tidak valid",
        details: validatedResult.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`),
      };
    }

    const students = validatedResult.data;
    
    // 3. Perform bulk upsert in a single transaction
    const summary = await prisma.$transaction(async (tx) => {
      let importedCount = 0;
      let updatedCount = 0;

      for (const student of students) {
        // We match by username as per requirements
        const existing = await tx.user.findUnique({
          where: { username: student.username },
          select: { id: true },
        });

        // Generate email if not provided (following existing pattern)
        const email = student.email || `${student.username.toLowerCase()}@siswa.kg`;
        
        await tx.user.upsert({
          where: { username: student.username },
          update: {
            name: student.name,
            email,
            role: "SISWA",
            isManual: true,
            // updatedAt is handled automatically by Prisma
          },
          create: {
            id: randomUUID(), // Primary key must be provided for new manual students
            username: student.username,
            name: student.name,
            email,
            password: student.username, // Initial password is their NIS
            role: "SISWA",
            isManual: true,
            xp: 0,
            level: 1,
            guruCoin: 0,
            inventory: [], // Ensure defaults are set
            equipped: {},
          },
        });

        if (existing) {
          updatedCount++;
        } else {
          importedCount++;
        }
      }

      return {
        total: students.length,
        imported: importedCount,
        updated: updatedCount,
      };
    });

    // 4. Revalidate student-related paths
    revalidatePath("/dashboard/guru/students");

    return {
      success: true,
      summary,
    };
  } catch (error: any) {
    console.error("CRITICAL IMPORT ERROR:", error);
    
    // Handle specific Prisma constraint errors (e.g., unique email conflict)
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "data";
      return {
        success: false,
        error: `Duplikasi data pada field: ${field}. Pastikan NIS dan Email unik.`,
      };
    }

    return {
      success: false,
      error: error.message || "Terjadi kesalahan saat mengimpor data siswa",
    };
  }
}
