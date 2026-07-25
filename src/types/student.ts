import { z } from "zod";

/**
 * Student schema for validation and type inference.
 * Represents a student record in the system.
 */
export const studentSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  studentId: z.string(), // NIS (Nomor Induk Siswa)
  role: z.literal("Siswa"),
  xp: z.number().default(0),
  level: z.number().default(1),
  classId: z.string().optional(),
  className: z.string().optional(),
  attendanceSummary: z.string(), // e.g., "Hadir", "Alpa", etc.
  lastGradeSnapshot: z.union([z.number(), z.string()]),
  photo: z.string().optional(),
  password: z.string().optional(),
  alias: z.string().optional(),
  guruCoin: z.number().default(0),
  inventory: z.array(z.object({
    itemId: z.string(),
    itemName: z.string(),
    purchasedAt: z.string(),
    status: z.string(),
  })).optional(),
  equipped: z.record(z.string(), z.string()).optional(),
  createdAt: z.union([z.string(), z.date()]),
});

export type Student = z.infer<typeof studentSchema>;
