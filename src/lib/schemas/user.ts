import { z } from "zod";

export const teacherProfileSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Email tidak valid"),
  bio: z.string().max(500, "Bio maksimal 500 karakter").optional(),
  school: z.string().optional(),
  subject: z.string().optional(),
  nip: z.string().optional(),
});

export type TeacherProfileFormValues = z.infer<typeof teacherProfileSchema>;
