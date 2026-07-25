import { prisma } from "@/lib/prisma";

/**
 * Verifies a student is enrolled in a class that has this course assigned,
 * and the course is published.
 */
export async function assertSiswaPublishedCourseEnrollment(
	userId: string,
	courseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
	const course = await prisma.course.findUnique({
		where: { id: courseId },
		select: { status: true },
	});
	if (!course) {
		return { ok: false, error: "Kursus tidak ditemukan" };
	}
	if (course.status !== "PUBLISHED") {
		return { ok: false, error: "Kursus belum tersedia" };
	}

	const studentEnrollments = await prisma.enrollment.findMany({
		where: { userId },
		select: { classId: true },
	});
	const classIds = studentEnrollments.map((e) => e.classId);
	if (classIds.length === 0) {
		return { ok: false, error: "Anda tidak memiliki akses ke kursus ini" };
	}

	const assignment = await prisma.courseAssignment.findFirst({
		where: {
			courseId,
			classId: { in: classIds },
		},
	});
	if (!assignment) {
		return { ok: false, error: "Anda tidak memiliki akses ke kursus ini" };
	}

	return { ok: true };
}
