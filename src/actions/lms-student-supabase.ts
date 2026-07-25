"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-server";
import { assignXPSupabase } from "@/actions/gamification-supabase";
import { assertSiswaPublishedCourseEnrollment } from "@/lib/lms/student-course-access";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const getStudentCoursesSchema = z.object({
	classId: z.string().min(1, "ID Kelas tidak valid"),
});

const getCourseContentSchema = z.object({
	courseId: z.string().min(1, "ID Kursus tidak valid"),
});

const getStudentProgressSchema = z.object({
	courseId: z.string().min(1, "ID Kursus tidak valid"),
	studentId: z.string().min(1, "ID Siswa tidak valid"),
});

const markLessonCompleteSchema = z.object({
	lessonId: z.string().min(1, "ID Materi tidak valid"),
	studentId: z.string().min(1, "ID Siswa tidak valid"),
});

/**
 * Fetch courses assigned to the student's class.
 * Ensures the user is in the class or is a Guru.
 */
export async function getStudentCourses(classId: string) {
	try {
		const validation = getStudentCoursesSchema.safeParse({ classId });
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };
		const isGuru = user.role === "Guru" || user.role === "ADMIN_GURU";
		const isSiswa = user.role === "Siswa" || user.role === "SISWA";

		// Access control: Guru can see anything, Siswa must be enrolled in the class.
		if (isSiswa) {
			const enrollment = await prisma.enrollment.findUnique({
				where: {
					userId_classId: {
						userId: user.uid,
						classId: validation.data.classId,
					},
				},
			});

			if (!enrollment) {
				return { success: false, error: "Anda tidak terdaftar di kelas ini" };
			}
		}

		const assignments = await prisma.courseAssignment.findMany({
			where: { classId: validation.data.classId },
			include: {
				course: {
					select: {
						id: true,
						title: true,
						description: true,
						coverImage: true,
						status: true,
						teacher: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		// Only return PUBLISHED courses for students.
		const courses = assignments
			.map((a) => a.course)
			.filter((c) => isGuru || c.status === "PUBLISHED");

		return { success: true, data: courses };
	} catch (error) {
		console.error("Error fetching student courses:", error);
		return { success: false, error: "Gagal mengambil data kursus" };
	}
}

/**
 * Fetch course details, modules, and lessons.
 * Only returns PUBLISHED content for students.
 */
export async function getCourseContent(courseId: string) {
	try {
		const validation = getCourseContentSchema.safeParse({ courseId });
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };
		const isSiswa = user.role === "Siswa" || user.role === "SISWA";

		const course = await prisma.course.findUnique({
			where: { id: validation.data.courseId },
			include: {
				modules: {
					orderBy: { order: "asc" },
					include: {
						lessons: {
							orderBy: { order: "asc" },
						},
					},
				},
			},
		});

		if (!course) {
			return { success: false, error: "Kursus tidak ditemukan" };
		}

		// Access control: If student, check if course is published and assigned to their class.
		if (isSiswa) {
			if (course.status !== "PUBLISHED") {
				return { success: false, error: "Kursus belum tersedia" };
			}

			// Check if assigned to any of student's classes.
			const studentEnrollments = await prisma.enrollment.findMany({
				where: { userId: user.uid },
				select: { classId: true },
			});

			const classIds = studentEnrollments.map((e) => e.classId);

			const assignment = await prisma.courseAssignment.findFirst({
				where: {
					courseId: validation.data.courseId,
					classId: { in: classIds },
				},
			});

			if (!assignment) {
				return {
					success: false,
					error: "Anda tidak memiliki akses ke kursus ini",
				};
			}
		}

		return { success: true, data: course };
	} catch (error) {
		console.error("Error fetching course content:", error);
		return { success: false, error: "Gagal mengambil detail kursus" };
	}
}

/**
 * Records the first time a student opens this course shell (analytics).
 */
export async function ensureStudentCourseFirstAccess(courseId: string) {
	try {
		const validation = getCourseContentSchema.safeParse({ courseId });
		if (!validation.success) {
			return {
				success: false,
				error: validation.error.issues[0]?.message ?? "Permintaan tidak valid",
			};
		}

		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };

		const isSiswa = user.role === "Siswa" || user.role === "SISWA";
		if (!isSiswa) {
			return { success: true };
		}

		const gate = await assertSiswaPublishedCourseEnrollment(
			user.uid,
			validation.data.courseId,
		);
		if (!gate.ok) {
			return { success: false, error: gate.error };
		}

		const cid = validation.data.courseId;
		const existing = await prisma.courseStudentFirstAccess.findUnique({
			where: {
				courseId_studentId: {
					courseId: cid,
					studentId: user.uid,
				},
			},
			select: { id: true },
		});

		if (!existing) {
			try {
				await prisma.courseStudentFirstAccess.create({
					data: {
						courseId: cid,
						studentId: user.uid,
					},
				});
			} catch (e: unknown) {
				const code =
					typeof e === "object" && e && "code" in e
						? (e as { code?: string }).code
						: undefined;
				if (code !== "P2002") {
					throw e;
				}
			}
		}

		return { success: true };
	} catch (error) {
		console.error("Error ensuring course first access:", error);
		return { success: false, error: "Gagal mencatat akses kursus" };
	}
}

/**
 * Whether the student has claimed the course completion reward (XP/badge).
 */
export async function getCourseRewardClaimStatus(courseId: string) {
	try {
		const validation = getCourseContentSchema.safeParse({ courseId });
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };
		const isSiswa = user.role === "Siswa" || user.role === "SISWA";
		if (!isSiswa) {
			return { success: false, error: "Unauthorized" };
		}

		const gate = await assertSiswaPublishedCourseEnrollment(
			user.uid,
			validation.data.courseId,
		);
		if (!gate.ok) {
			return { success: false, error: gate.error };
		}

		const claim = await prisma.courseRewardClaim.findUnique({
			where: {
				courseId_studentId: {
					courseId: validation.data.courseId,
					studentId: user.uid,
				},
			},
		});

		return { success: true, data: { claimed: !!claim } };
	} catch (error) {
		console.error("Error fetching reward claim status:", error);
		return { success: false, error: "Gagal memuat status hadiah" };
	}
}

/**
 * Fetch LessonProgress records for a specific course and student.
 */
export async function getStudentProgress(courseId: string, studentId: string) {
	try {
		const validation = getStudentProgressSchema.safeParse({
			courseId,
			studentId,
		});
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };
		const isSiswa = user.role === "Siswa" || user.role === "SISWA";
		const isGuru = user.role === "Guru" || user.role === "ADMIN_GURU";

		if (isSiswa) {
			if (user.uid !== validation.data.studentId) {
				return { success: false, error: "Unauthorized" };
			}
			const gate = await assertSiswaPublishedCourseEnrollment(
				user.uid,
				validation.data.courseId,
			);
			if (!gate.ok) {
				return { success: false, error: gate.error };
			}
		} else if (isGuru) {
			const course = await prisma.course.findUnique({
				where: { id: validation.data.courseId },
				select: { teacherId: true },
			});
			if (!course || course.teacherId !== user.uid) {
				return {
					success: false,
					error: "Anda tidak memiliki akses ke kursus ini",
				};
			}
		} else {
			return { success: false, error: "Unauthorized" };
		}

		const progress = await prisma.lessonProgress.findMany({
			where: {
				studentId: validation.data.studentId,
				lesson: {
					module: {
						courseId: validation.data.courseId,
					},
				},
			},
			select: {
				lessonId: true,
				isCompleted: true,
				completedAt: true,
				score: true,
				lastAttemptAt: true,
			},
		});

		return { success: true, data: progress };
	} catch (error) {
		console.error("Error fetching student progress:", error);
		return { success: false, error: "Gagal mengambil progres belajar" };
	}
}

/**
 * Create or update a LessonProgress record.
 * Ensures the student is actually enrolled in a class that has access to this course.
 * Awards XP for completing TEXT lessons.
 */
export async function markLessonComplete(lessonId: string, studentId: string) {
	try {
		const validation = markLessonCompleteSchema.safeParse({
			lessonId,
			studentId,
		});
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };
		const isSiswa = user.role === "Siswa" || user.role === "SISWA";

		if (!isSiswa || user.uid !== validation.data.studentId) {
			return { success: false, error: "Unauthorized" };
		}

		// 1. Verify lesson exists and get courseId, also fetch course rewards.
		const lesson = await prisma.courseLesson.findUnique({
			where: { id: validation.data.lessonId },
			include: {
				module: {
					select: { courseId: true },
				},
			},
		});

		if (!lesson) {
			return { success: false, error: "Materi tidak ditemukan" };
		}

		const courseId = lesson.module.courseId;

		const access = await assertSiswaPublishedCourseEnrollment(
			validation.data.studentId,
			courseId,
		);
		if (!access.ok) {
			return { success: false, error: access.error };
		}

		// Fetch course rewards
		const course = await prisma.course.findUnique({
			where: { id: courseId },
			select: { rewards: true },
		});

		const rawRewards = course?.rewards;
		const rewards: Record<string, unknown> =
			rawRewards && typeof rawRewards === "object" && !Array.isArray(rawRewards)
				? (rawRewards as Record<string, unknown>)
				: {};
		const lessonXp =
			typeof rewards.lessonXp === "number" ? rewards.lessonXp : 0;

		// 2. Check if already completed (skip XP if already done).
		const existingProgress = await prisma.lessonProgress.findUnique({
			where: {
				studentId_lessonId: {
					studentId: validation.data.studentId,
					lessonId: validation.data.lessonId,
				},
			},
		});

		if (existingProgress?.isCompleted) {
			// Already completed, no XP needed.
			revalidatePath(`/dashboard/siswa/lms/${courseId}`);
			return {
				success: true,
				data: {
					lessonId: existingProgress.lessonId,
					isCompleted: existingProgress.isCompleted,
					completedAt: existingProgress.completedAt,
					courseId,
				},
			};
		}

		// 3. Create or update progress (idempotent upsert — safe to call repeatedly).
		const progressRow = await prisma.lessonProgress.upsert({
			where: {
				studentId_lessonId: {
					studentId: validation.data.studentId,
					lessonId: validation.data.lessonId,
				},
			},
			update: {
				isCompleted: true,
				completedAt: new Date(),
			},
			create: {
				studentId: validation.data.studentId,
				lessonId: validation.data.lessonId,
				isCompleted: true,
				completedAt: new Date(),
			},
		});

		// 4. Award XP if TEXT lesson and lessonXp is defined (QUIZ awards XP on submitQuizAttempt).
		if (lesson.type === "TEXT" && lessonXp > 0) {
			await assignXPSupabase(
				validation.data.studentId,
				lessonXp,
				`Menyelesaikan materi: ${lesson.title}`,
				undefined,
				true,
			);
		}

		revalidatePath(`/dashboard/siswa/lms/${courseId}`);

		return {
			success: true,
			data: {
				lessonId: progressRow.lessonId,
				isCompleted: progressRow.isCompleted,
				completedAt: progressRow.completedAt,
				courseId,
			},
		};
	} catch (error) {
		console.error("Error marking lesson complete:", error);
		return { success: false, error: "Gagal memperbarui progres" };
	}
}

const claimCourseRewardSchema = z.object({
	courseId: z.string().min(1, "ID Kursus tidak valid"),
	studentId: z.string().min(1, "ID Siswa tidak valid"),
});

/**
 * Claim reward for completing a course (100% progress).
 * Validates enrollment, completion, and awards completionXp and badge if set.
 */
export async function claimCourseReward(courseId: string, studentId: string) {
	try {
		const validation = claimCourseRewardSchema.safeParse({
			courseId,
			studentId,
		});
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };
		const isSiswa = user.role === "Siswa" || user.role === "SISWA";

		if (!isSiswa || user.uid !== validation.data.studentId) {
			return { success: false, error: "Unauthorized" };
		}

		// 1. Verify course exists
		const course = await prisma.course.findUnique({
			where: { id: validation.data.courseId },
			select: { id: true, title: true, rewards: true, status: true },
		});

		if (!course) {
			return { success: false, error: "Kursus tidak ditemukan" };
		}
		if (course.status !== "PUBLISHED") {
			return { success: false, error: "Kursus belum tersedia" };
		}

		const rawRewards = course.rewards;
		const rewards: Record<string, unknown> =
			rawRewards && typeof rawRewards === "object" && !Array.isArray(rawRewards)
				? (rawRewards as Record<string, unknown>)
				: {};
		const completionXp =
			typeof rewards.completionXp === "number" ? rewards.completionXp : 0;
		const badgeId =
			typeof rewards.badgeId === "string" ? rewards.badgeId : null;

		// 2. Verify student is enrolled in a class that has this course
		const studentEnrollments = await prisma.enrollment.findMany({
			where: { userId: validation.data.studentId },
			select: { classId: true },
		});

		const classIds = studentEnrollments.map((e) => e.classId);

		const assignment = await prisma.courseAssignment.findFirst({
			where: {
				courseId: validation.data.courseId,
				classId: { in: classIds },
			},
		});

		if (!assignment) {
			return {
				success: false,
				error: "Anda tidak terdaftar di kelas kursus ini",
			};
		}

		// 3. Get all lessons in the course
		const lessonRows = await prisma.courseLesson.findMany({
			where: { module: { courseId: validation.data.courseId } },
			select: { id: true },
		});

		const totalLessons = lessonRows.length;

		if (totalLessons === 0) {
			return { success: false, error: "Kursus tidak memiliki materi" };
		}

		// 4. Get completed lessons count
		const completedCount = await prisma.lessonProgress.count({
			where: {
				studentId: validation.data.studentId,
				lessonId: { in: lessonRows.map((l) => l.id) },
				isCompleted: true,
			},
		});

		// 5. Validate 100% progress
		if (completedCount < totalLessons) {
			return {
				success: false,
				error: `Belum menyelesaikan semua materi (${completedCount}/${totalLessons})`,
			};
		}

		// 6. Check if already claimed
		const existingClaim = await prisma.courseRewardClaim.findUnique({
			where: {
				courseId_studentId: {
					courseId: validation.data.courseId,
					studentId: validation.data.studentId,
				},
			},
		});

		if (existingClaim) {
			return { success: false, error: "Hadiah kursus sudah diklaim" };
		}

		// 7. Award XP and badge (if set)
		let awardedXp = 0;
		let awardedBadge: string | null = null;

		if (completionXp > 0) {
			const xpResult = await assignXPSupabase(
				validation.data.studentId,
				completionXp,
				`Menyelesaikan kursus: ${course.title}`,
				undefined,
				true,
			);
			if (xpResult.success) {
				awardedXp = completionXp;
			}
		}

		if (badgeId) {
			const { awardBadgeSupabase } = await import(
				"@/actions/gamification-supabase"
			);
			try {
				const badgeResult = await awardBadgeSupabase(
					validation.data.studentId,
					badgeId,
					undefined,
					true,
				);
				if (badgeResult.success) {
					awardedBadge = badgeId;
				}
			} catch {
				// Badge already awarded or other issue - ignore silently for idempotency
			}
		}

		// 8. Record claim in DB
		await prisma.courseRewardClaim.create({
			data: {
				courseId: validation.data.courseId,
				studentId: validation.data.studentId,
			},
		});

		revalidatePath(`/dashboard/siswa/lms/${courseId}`);

		return {
			success: true,
			data: {
				xp: awardedXp,
				badge: awardedBadge,
			},
		};
	} catch (error) {
		console.error("Error claiming course reward:", error);
		return { success: false, error: "Gagal mengklaim hadiah" };
	}
}
