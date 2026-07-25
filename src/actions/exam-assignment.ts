"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AssignExamSchema = z.object({
  examId: z.string().min(1),
  classIds: z.array(z.string().min(1)),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

/**
 * Assign an exam to multiple classes.
 */
export async function assignExamToClassesAction(data: {
  examId: string;
  classIds: string[];
  startTime: Date;
  endTime: Date;
  status: "DRAFT" | "PUBLISHED";
}) {
  try {
    await ensureGuru();
    const validated = AssignExamSchema.parse(data);

    const assignments = await (prisma as any).examAssignment.createMany({
      data: validated.classIds.map((classId) => ({
        examId: validated.examId,
        classId,
        startTime: validated.startTime,
        endTime: validated.endTime,
        status: validated.status,
      })),
      skipDuplicates: true,
    });

    // If at least one assignment is PUBLISHED, update the template status
    if (validated.status === "PUBLISHED") {
      await (prisma.exam as any).update({
        where: { id: validated.examId },
        data: { status: "PUBLISHED" }
      });
    }

    revalidatePath("/dashboard/guru/cbt");
    return { success: true, count: assignments.count };
  } catch (error: any) {
    console.error("[ASSIGN_EXAM_TO_CLASSES]", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to assign exam to classes" 
    };
  }
}

const UpdateStatusSchema = z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]);

/**
 * Update the status of a specific exam assignment.
 */
export async function updateAssignmentStatusAction(
  id: string,
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED"
) {
  try {
    await ensureGuru();
    const validatedStatus = UpdateStatusSchema.parse(status);
    
    await (prisma as any).examAssignment.update({
      where: { id },
      data: { status: validatedStatus },
    });

    // If published, sync template status
    if (validatedStatus === "PUBLISHED") {
      const assignment = await (prisma as any).examAssignment.findUnique({
        where: { id },
        select: { examId: true }
      });
      if (assignment) {
        await (prisma.exam as any).update({
          where: { id: assignment.examId },
          data: { status: "PUBLISHED" }
        });
      }
    }

    revalidatePath("/dashboard/guru/cbt");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_ASSIGNMENT_STATUS]", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update assignment status" 
    };
  }
}

/**
 * Delete a specific exam assignment.
 */
export async function deleteAssignmentAction(id: string) {
  try {
    await ensureGuru();
    
    await (prisma as any).examAssignment.delete({
      where: { id },
    });

    revalidatePath("/dashboard/guru/cbt");
    return { success: true };
  } catch (error: any) {
    console.error("[DELETE_ASSIGNMENT]", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete assignment" 
    };
  }
}
