"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru } from "@/lib/auth-server";

export async function getBulkExportDataSupabase(params: { classId: string; term: string }) {
  try {
    await ensureGuru();
    
    // Fetch all necessary data for export
    const cls = await prisma.class.findUnique({
      where: { id: params.classId },
      include: {
        students: {
          include: {
            user: true
          }
        },
        tasks: {
          include: {
            grades: true
          }
        },
        attendance: true
      }
    });

    if (!cls) return { success: false, error: "Kelas tidak ditemukan" };

    // Map attendance to the expected format
    const attendanceMap: Record<string, Record<string, any>> = {};
    cls.attendance.forEach((a: any) => {
      const dateStr = a.date.toISOString().split('T')[0];
      if (!attendanceMap[dateStr]) attendanceMap[dateStr] = {};
      
      let status = 'present';
      if (a.status === 'ABSENT') status = 'absent';
      else if (a.status === 'LATE') status = 'late';
      else if (a.status === 'PERMISSION' || a.status === 'SICK') status = 'excused';
      
      attendanceMap[dateStr][a.userId] = status;
    });

    const formattedAttendance = Object.entries(attendanceMap).map(([date, records]) => ({
      date,
      records
    }));

    // Map tasks and grades to the expected format
    const formattedGrades = cls.tasks.map((t: any) => {
      const gradeMap: Record<string, number | null> = {};
      t.grades.forEach((g: any) => {
        gradeMap[g.studentId] = g.value;
      });

      return {
        taskId: t.id,
        taskTitle: t.title,
        category: t.category,
        maxPoints: t.maxPoints,
        grades: gradeMap
      };
    });

    return {
      success: true,
      data: {
        classInfo: {
          id: cls.id,
          name: cls.name,
          term: params.term
        },
        students: cls.students.map((e: any) => ({
          ...e.user,
          uid: e.user.id,
          joinedAt: e.joinedAt.toISOString()
        })),
        attendance: formattedAttendance,
        tasks: cls.tasks.map((t: any) => ({ ...t, createdAt: t.date.toISOString() })),
        grades: formattedGrades
      }
    };
  } catch (error) {
    return { success: false, error: "Gagal memuat data export" };
  }
}
