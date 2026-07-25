import { z } from "zod";

/**
 * Export Job schema to track status of document generation.
 */
export const exportJobSchema = z.object({
  id: z.string(),
  type: z.enum(["PDF", "XLSX"]),
  status: z.enum(["pending", "complete", "failed"]),
  url: z.string().url().optional(),
  filename: z.string(),
  teacherId: z.string(),
  error: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export type ExportJob = z.infer<typeof exportJobSchema>;
