"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ensureGuru } from "@/lib/auth-server";
import { QuestionType as PrismaQuestionType } from "@prisma/client";
import { ExamQuestion } from "@/types/exam";

export interface Question extends ExamQuestion {
  guruId: string;
  topicId: string;
  createdAt: string;
  updatedAt: string;
  answer: string | string[] | boolean | Record<string, string>;
  passageId?: string | null;
}

// Zod schema for validation (reused from Firestore logic)
const matrixRowSchema = z.object({
  id: z.string(),
  text: z.string().optional()
});

const matrixColumnSchema = z.object({
  id: z.string(),
  text: z.string().optional()
});

const shortAnswerConfigSchema = z.object({
  acceptableAnswers: z.array(z.string()).default([]),
}).optional();

const essayKeywordSchema = z.object({
  text: z.string(),
  weight: z.number(),
  type: z.enum(["required", "bonus"]),
});

const essayConfigSchema = z.object({
  maxPoints: z.number(),
  keywords: z.array(essayKeywordSchema).default([]),
}).optional();

const questionSchema = z.object({
  id: z.string().optional(),
  topicId: z.string().min(1, "Topik wajib diisi"), // This maps to QuestionBank name or ID
  type: z.enum(['pg', 'pg_kompleks', 'bs', 'menjodohkan', 'mengurutkan', 'essay', 'matrix', 'short_answer']),
  text: z.string().min(1, "Pertanyaan wajib diisi"),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  options: z.array(z.object({
    id: z.string(),
    text: z.string().optional(),
    imageUrl: z.string().optional().nullable().or(z.literal("")),
  })).optional(),
  pairs: z.array(z.object({
    id: z.string(),
    left: z.string().optional(),
    right: z.string().optional()
  })).optional(),
  rows: z.array(matrixRowSchema).optional(),
  columns: z.array(matrixColumnSchema).optional(),
  answer: z.any().optional(),
  explanation: z.string().optional(),
  passageId: z.string().optional().nullable(),
  maxPoints: z.number().min(0.5).max(100).optional(),
  shortAnswerConfig: shortAnswerConfigSchema,
  essayConfig: essayConfigSchema,
}).superRefine((data, ctx) => {
  // Validation logic mirrored from original file
  if (data.type === 'pg' || data.type === 'pg_kompleks' || data.type === 'mengurutkan') {
    if (!data.options || data.options.length < 2 || data.options.length > 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Opsi PG harus antara 2 sampai 6 pilihan",
        path: ["options"],
      });
    } else {
      data.options.forEach((opt, index) => {
        if (!opt.text || opt.text.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Opsi/Item ${index + 1} tidak boleh kosong`,
            path: ["options", index, "text"],
          });
        }
      });
    }
  }

  if (data.type === 'menjodohkan') {
    if (!data.pairs || data.pairs.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimal harus ada 1 pasangan",
        path: ["pairs"],
      });
    } else {
      data.pairs.forEach((pair, index) => {
        if (!pair.left?.trim() || !pair.right?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Kedua sisi pasangan harus diisi",
            path: ["pairs", index, (!pair.left?.trim() ? "left" : "right")],
          });
        }
      });
    }
  }

  if (data.type === 'matrix') {
    if (!data.rows || data.rows.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimal harus ada 1 baris matriks",
        path: ["rows"],
      });
    } else {
      data.rows.forEach((row, index) => {
        if (!row.text || row.text.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Baris matriks ${index + 1} tidak boleh kosong`,
            path: ["rows", index, "text"],
          });
        }
      });
    }

    if (!data.columns || data.columns.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimal harus ada 2 kolom matriks",
        path: ["columns"],
      });
    } else {
      data.columns.forEach((col, index) => {
        if (!col.text || col.text.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Kolom matriks ${index + 1} tidak boleh kosong`,
            path: ["columns", index, "text"],
          });
        }
      });
    }
  }
});

const TYPE_MAP: Record<string, PrismaQuestionType> = {
  pg: "PG",
  pg_kompleks: "PG_KOMPLEKS",
  bs: "BS",
  menjodohkan: "MENJODOHKAN",
  mengurutkan: "MENGURUTKAN",
  essay: "ESSAY",
  matrix: "MATRIX",
  short_answer: "SHORT_ANSWER",
};

/**
 * Fetches unique topic names (QuestionBank) for the current Guru
 */
export async function getQuestionTopicsSupabase(params: { page?: number; pageSize?: number; search?: string } = {}) {
  const { page = 1, pageSize = 10, search } = params;
  const user = await ensureGuru();

  try {
    const where = {
      guruId: user.uid,
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [data, totalCount] = await Promise.all([
      prisma.questionBank.findMany({
        where,
        select: {
          id: true,
          name: true,
          questions: {
            where: { examId: null },
            select: { id: true }
          }
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.questionBank.count({ where }),
    ]);

    return {
      data: data.map((t) => ({ 
        id: t.id, 
        name: t.name, 
        count: t.questions.length 
      })),
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error("Error fetching question topics (Supabase):", error);
    return { data: [], totalCount: 0, totalPages: 0 };
  }
}

/**
 * Fetches questions for a specific topic with pagination and search
 */
export async function getQuestionsByTopicSupabase(params: { 
  topicId: string; 
  page?: number; 
  pageSize?: number;
  search?: string;
  type?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { 
    topicId, 
    page = 1, 
    pageSize = 10, 
    search = "", 
    type,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = params;
  
  const user = await ensureGuru();

  try {
    const where: any = {
      bankId: topicId,
      bank: { guruId: user.uid },
      examId: null, // Only fetch bank questions, not exam-linked clones
    };

    if (search) {
      where.text = { contains: search, mode: "insensitive" as const };
    }

    if (type && type !== "all") {
      where.type = TYPE_MAP[type];
    }

    const [data, totalCount] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          bank: {
            select: { name: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.question.count({ where }),
    ]);

    return {
      data: data.map((q: any) => {
        const type = q.type.toLowerCase();
        return {
          ...q,
          type,
          topicId: q.bank?.name || q.bankId, // Map bank name to topicId for the UI
          options: q.options as any,
          pairs: q.pairs as any,
          rows: q.rows as any,
          columns: q.columns as any,
          answer: q.answer as any,
          config: q.config as any,
          // Map Prisma config back to shortAnswerConfig/essayConfig for frontend compatibility
          shortAnswerConfig: type === "short_answer" ? (q.config as any) : undefined,
          essayConfig: type === "essay" ? (q.config as any) : undefined,
        };
      }),
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error(`Error fetching questions (Supabase):`, error);
    return { data: [], totalCount: 0, totalPages: 0 };
  }
}

/**
 * Handles create/update for the Question model
 */
export async function saveQuestionSupabase(data: z.infer<typeof questionSchema>) {
  const user = await ensureGuru();

  const validation = questionSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    const { id, topicId, ...rawData } = validation.data;
    
    // 1. Find or create QuestionBank (Topic)
    // Try finding by ID first, then by name
    let bank = await prisma.questionBank.findFirst({
        where: { 
            OR: [
                { id: topicId },
                { name: topicId }
            ],
            guruId: user.uid 
        }
    });

    if (!bank) {
      bank = await prisma.questionBank.create({
        data: {
          name: topicId,
          guruId: user.uid,
        }
      });
    }

    // 2. Prepare data for Prisma
    const questionData: any = {
      text: rawData.text,
      type: TYPE_MAP[rawData.type],
      imageUrl: rawData.imageUrl || null,
      explanation: rawData.explanation || "",
      maxPoints: rawData.maxPoints ?? 1,
      answer: rawData.answer ?? null,
      bankId: bank.id,
      passageId: rawData.passageId || null,
    };

    // Handle configs
    if (rawData.type === 'short_answer') {
      questionData.config = rawData.shortAnswerConfig || { acceptableAnswers: [] };
      // Fallback answer for grading if not provided
      if (!questionData.answer) {
          questionData.answer = rawData.shortAnswerConfig?.acceptableAnswers?.[0] || null;
      }
    } else if (rawData.type === 'essay') {
      questionData.config = rawData.essayConfig || null;
    }

    // Handle JSON fields
    if (['pg', 'pg_kompleks', 'mengurutkan'].includes(rawData.type)) {
      questionData.options = rawData.options || null;
    } else {
      questionData.options = null;
    }

    if (rawData.type === 'menjodohkan') {
      questionData.pairs = rawData.pairs || null;
    } else {
      questionData.pairs = null;
    }

    if (rawData.type === 'matrix') {
      questionData.rows = rawData.rows || null;
      questionData.columns = rawData.columns || null;
    } else {
      questionData.rows = null;
      questionData.columns = null;
    }

    let result;
    if (id) {
      // Check ownership
      const existing = await prisma.question.findFirst({
          where: { id, bank: { guruId: user.uid } }
      });
      if (!existing) return { success: false, error: "Unauthorized or not found" };

      result = await prisma.question.update({
        where: { id },
        data: questionData,
      });
    } else {
      result = await prisma.question.create({
        data: questionData,
      });
    }

    revalidatePath("/dashboard/guru/bank-soal");
    return { success: true, id: result.id };
  } catch (error) {
    console.error("Error saving question (Supabase):", error);
    return { success: false, error: "Gagal menyimpan pertanyaan" };
  }
}

/**
 * Fetches a single topic (QuestionBank) by ID
 */
export async function getTopicByIdSupabase(id: string) {
  const user = await ensureGuru();

  try {
    const topic = await prisma.questionBank.findFirst({
      where: { id, guruId: user.uid },
      select: {
        id: true,
        name: true,
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!topic) {
      return { success: false, error: "Topik tidak ditemukan" };
    }

    return {
      success: true,
      data: {
        id: topic.id,
        name: topic.name,
        count: topic._count.questions
      }
    };
  } catch (error) {
    console.error("Error fetching topic (Supabase):", error);
    return { success: false, error: "Gagal mengambil data topik" };
  }
}

/**
 * Removes a question
 */
export async function deleteQuestionSupabase(id: string) {
  const user = await ensureGuru();

  try {
    const existing = await prisma.question.findFirst({
        where: { id, bank: { guruId: user.uid } },
        include: { bank: true }
    });

    if (!existing) {
      return { success: false, error: "Pertanyaan tidak ditemukan" };
    }

    await prisma.question.delete({ where: { id } });

    revalidatePath("/dashboard/guru/bank-soal");
    if (existing.bankId) {
      revalidatePath(`/dashboard/guru/bank-soal/${existing.bankId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting question (Supabase):", error);
    return { success: false, error: "Gagal menghapus pertanyaan" };
  }
}

/**
 * Removes all questions in a topic (deletes the QuestionBank)
 */
export async function deleteTopicSupabase(topicId: string) {
  const user = await ensureGuru();

  try {
    const bank = await prisma.questionBank.findFirst({
        where: { id: topicId, guruId: user.uid }
    });

    if (!bank) {
        return { success: false, error: "Topik tidak ditemukan" };
    }

    await prisma.questionBank.delete({ where: { id: topicId } });

    revalidatePath("/dashboard/guru/bank-soal");
    return { success: true };
  } catch (error) {
    console.error("Error deleting topic (Supabase):", error);
    return { success: false, error: "Gagal menghapus topik" };
  }
}

/**
 * Updates a topic name (QuestionBank)
 */
export async function updateTopicSupabase(topicId: string, newName: string) {
  const user = await ensureGuru();

  try {
    const bank = await prisma.questionBank.findFirst({
        where: { id: topicId, guruId: user.uid }
    });

    if (!bank) {
        return { success: false, error: "Topik tidak ditemukan" };
    }

    await prisma.questionBank.update({
      where: { id: topicId },
      data: { name: newName }
    });

    revalidatePath("/dashboard/guru/bank-soal");
    return { success: true };
  } catch (error) {
    console.error("Error updating topic (Supabase):", error);
    return { success: false, error: "Gagal memperbarui topik" };
  }
}
