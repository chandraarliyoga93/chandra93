"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { parseISO, startOfDay, isAfter } from "date-fns";


/**
 * UI-facing attendance status type, mirroring the original implementation.
 */
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'sick';

const mapStatusToPrisma = (status: AttendanceStatus): any => {
  switch (status) {
    case 'present': return 'PRESENT';
    case 'absent': return 'ABSENT';
    case 'late': return 'LATE';
    case 'excused': return 'PERMISSION';
    case 'sick': return 'SICK';
    default: return 'PRESENT';
  }
};

const mapStatusFromPrisma = (status: any): AttendanceStatus => {
  switch (status) {
    case 'PRESENT': return 'present';
    case 'ABSENT': return 'absent';
    case 'LATE': return 'late';
    case 'PERMISSION': return 'excused';
    case 'SICK': return 'sick';
    default: return 'present';
  }
};

/**
 * Saves bulk attendance records for a class on a specific date.
 * Uses a Prisma transaction with upsert for each student.
 */
export async function saveBulkAttendanceSupabase(
  classId: string,
  date: string,
  records: Record<string, AttendanceStatus | null>
) {
  try {
    await ensureGuru();

    // Future date check
    const attendanceDate = startOfDay(parseISO(date));
    const today = startOfDay(new Date());
    if (isAfter(attendanceDate, today)) {
      return { success: false, error: "Tidak bisa melakukan presensi untuk tanggal mendatang" };
    }

    await prisma.$transaction(async (tx) => {
      for (const [studentId, status] of Object.entries(records)) {
        if (status === null) {
          await tx.attendance.deleteMany({
            where: {
              classId,
              userId: studentId,
              date: attendanceDate,
            },
          });
        } else {
          const prismaStatus = mapStatusToPrisma(status);
          await tx.attendance.upsert({
            where: {
              classId_userId_date: {
                classId,
                userId: studentId,
                date: attendanceDate,
              },
            },
            update: {
              status: prismaStatus,
            },
            create: {
              classId,
              userId: studentId,
              date: attendanceDate,
              status: prismaStatus,
            },
          });
        }
      }
    }, { timeout: 30000 });

    revalidatePath(`/dashboard/guru/classes/${classId}/attendance`);
    return { success: true };
  } catch (error: any) {
    console.error("Error saving bulk attendance:", error);
    if (error.message.includes("Unauthorized")) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: false, error: "Gagal menyimpan presensi" };
  }
}

/**
 * Fetches attendance records for a specific class and date.
 */
export async function getAttendanceByDateSupabase(classId: string, date: string) {
  try {
    const attendanceDate = startOfDay(parseISO(date));
    
    const records = await prisma.attendance.findMany({
      where: {
        classId,
        date: attendanceDate,
      },
      select: {
        userId: true,
        status: true,
      },
    });

    const normalizedRecords: Record<string, AttendanceStatus> = {};
    records.forEach((r: { userId: string, status: any }) => {
      normalizedRecords[r.userId] = mapStatusFromPrisma(r.status);
    });

    return normalizedRecords;
  } catch (error) {
    console.error("Error fetching attendance by date:", error);
    return {};
  }
}

/**
 * Fetches paginated attendance history for a class, grouped by date.
 */
export async function getAttendanceHistorySupabase(classId: string, page: number = 1, limit: number = 10) {
  try {
    await ensureGuru();

    // Get total students enrolled in the class
    const totalStudents = await prisma.enrollment.count({
      where: { classId },
    });

    // Get distinct dates for this class to calculate total history events
    const allDatesResult = await prisma.attendance.groupBy({
      by: ['date'],
      where: { classId },
    });
    const total = allDatesResult.length;

    // Get paginated dates
    const paginatedDates = await prisma.attendance.groupBy({
      by: ['date'],
      where: { classId },
      orderBy: {
        date: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Fetch stats for each date
    const dataPromises = paginatedDates.map(async (group: { date: Date }) => {
      const date = group.date;
      
      const [presentCount, totalAtDate] = await Promise.all([
        prisma.attendance.count({
          where: {
            classId,
            date,
            status: {
              in: ['PRESENT', 'LATE'] as any,
            },
          },
        }),
        prisma.attendance.count({
          where: {
            classId,
            date,
          },
        })
      ]);

      const attendancePercentage = totalAtDate > 0 ? (presentCount / totalAtDate) * 100 : 0;

      return {
        date: date.toISOString().split('T')[0],
        totalStudents: totalAtDate,
        presentCount,
        attendancePercentage: Math.round(attendancePercentage),
      };
    });

    const data = await Promise.all(dataPromises);

    return { data, total };
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return { data: [], total: 0 };
  }
}

/**
 * Fetches attendance data for a date range.
 */
export async function getAttendanceRangeDataSupabase(classId: string, startDate: string, endDate: string) {
  try {
    await ensureGuru();

    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));

    const records = await prisma.attendance.findMany({
      where: {
        classId,
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Group by date
    const datesMap: Record<string, Record<string, AttendanceStatus>> = {};
    records.forEach((r: any) => {
      const dateStr = r.date.toISOString().split("T")[0];
      if (!datesMap[dateStr]) datesMap[dateStr] = {};
      datesMap[dateStr][r.userId] = mapStatusFromPrisma(r.status);
    });

    const attendance = Object.entries(datesMap).map(([date, records]) => ({
      date,
      records,
    }));

    // Fetch students for export
    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const students = enrollments.map((e: any) => ({
      uid: e.user.id,
      name: e.user.name,
      email: e.user.email,
    }));

    return { success: true, data: { attendance, students } };
  } catch (error) {
    console.error("Error fetching attendance range data:", error);
    return { success: false, error: "Gagal memuat data absensi" };
  }
}
