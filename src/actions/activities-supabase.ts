"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru } from "@/lib/auth-server";

export interface Activity {
  id: string;
  type: "XP_GAIN" | "JOURNAL" | "EXAM_COMPLETION" | "NEW_STUDENT" | "MARKET_BUY";
  studentName?: string;
  studentPhoto?: string;
  className?: string;
  description?: string;
  timestamp: string;
}

export async function getRecentActivitiesSupabase(limit: number = 15) {
  try {
    const user = await ensureGuru();
    
    // 1. Fetch XP Logs (Recent Achievements)
    const xpLogs = await prisma.xpLog.findMany({
      where: {
        user: {
          enrollments: {
            some: { class: { adminId: user.uid } }
          }
        }
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    // 2. Fetch Exam Completions
    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        status: "COMPLETED",
        exam: { adminId: user.uid }
      },
      include: {
        student: true,
        exam: true
      },
      orderBy: { submittedAt: "desc" },
      take: limit
    });

    // 3. Fetch New Enrollments
    const newEnrollments = await prisma.enrollment.findMany({
      where: {
        class: { adminId: user.uid }
      },
      include: {
        user: true,
        class: true
      },
      orderBy: { joinedAt: "desc" },
      take: limit
    });

    // 4. Fetch Journal Entries (Teacher's own activity)
    const journals = await prisma.journal.findMany({
      where: { userId: user.uid },
      include: { class: true },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    // Combine all into a single timeline
    const allActivities: Activity[] = [
      ...xpLogs.map((log: any) => ({
        id: `xp-${log.id}`,
        type: "XP_GAIN" as const,
        studentName: log.user.name,
        studentPhoto: log.user.photo,
        description: `Mendapatkan ${log.amount} XP: ${log.reason}`,
        timestamp: log.createdAt.toISOString()
      })),
      ...examAttempts.map((att: any) => ({
        id: `exam-${att.id}`,
        type: "EXAM_COMPLETION" as const,
        studentName: att.student.name,
        studentPhoto: att.student.photo,
        description: `Menyelesaikan ujian: ${att.exam.title}`,
        timestamp: att.submittedAt?.toISOString() || att.startedAt.toISOString()
      })),
      ...newEnrollments.map((en: any) => ({
        id: `enr-${en.id}`,
        type: "NEW_STUDENT" as const,
        studentName: en.user.name,
        studentPhoto: en.user.photo,
        className: en.class.name,
        description: `Baru bergabung di kelas: ${en.class.name}`,
        timestamp: en.joinedAt.toISOString()
      })),
      ...journals.map((j: any) => ({
        id: `jou-${j.id}`,
        type: "JOURNAL" as const,
        className: j.class.name,
        description: `Menyusun jurnal: ${j.topic} di kelas ${j.class.name}`,
        timestamp: j.createdAt.toISOString()
      }))
    ];

    // Sort by timestamp and limit
    return allActivities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
}
