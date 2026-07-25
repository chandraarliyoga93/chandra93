"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
	courseRewardsToPrismaJson,
	type CourseRewardsValues,
} from "@/lib/lms/course-rewards";

import { ensureGuru, ensureSiswa, getAuthUser } from "@/lib/auth-server";
import { assertSiswaPublishedCourseEnrollment } from "@/lib/lms/student-course-access";
import { assignXPSupabase } from "@/actions/gamification-supabase";
import {
	buildCourseAnalyticsView,
	parseAnalyticsStatusFilter,
	type CourseAnalyticsLearnerSource,
} from "@/lib/lms/analytics";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/** Invalidate guru + siswa halaman yang menampilkan daftar LMS setelah assign/publish. */
function revalidateLmsPathsForClasses(courseId: string, classIds: string[]) {
	const unique = [...new Set(classIds)];
	revalidatePath(`/dashboard/guru/lms/${courseId}`);
	revalidatePath(`/dashboard/guru/lms/${courseId}/settings`);
	revalidatePath(`/dashboard/guru/lms/${courseId}/analytics`);
	revalidatePath("/dashboard/guru/lms");
	for (const classId of unique) {
		revalidatePath(`/dashboard/siswa/classes/${classId}/tasks`);
	}
	revalidatePath("/dashboard/siswa");
}

function formatClassLabel(
	classes: Array<{ name: string; code: string }>,
): string {
	const labels = classes.map((c) => `${c.name} (${c.code})`);
	return [...new Set(labels)].join(", ");
}

const createCourseSchema = z.object({
	title: z.string().min(1, "Judul tidak boleh kosong"),
	description: z.string().optional().nullable(),
	coverImage: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

const courseRewardsSchema = z.object({
	lessonXp: z.number().int().min(0).max(1_000_000),
	quizMaxXp: z.number().int().min(0).max(1_000_000),
	completionXp: z.number().int().min(0).max(1_000_000),
	badgeId: z.union([z.string().min(1), z.null()]).optional(),
});

const updateCourseSchema = z.object({
	title: z.string().min(1, "Judul tidak boleh kosong").optional(),
	description: z.string().optional().nullable(),
	coverImage: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
	rewards: courseRewardsSchema.optional(),
});

const createModuleSchema = z.object({
	title: z.string().min(1, "Judul modul tidak boleh kosong"),
	order: z.number().default(0),
	courseId: z.string().min(1, "ID Kursus tidak valid"),
});

const createLessonSchema = z.object({
	title: z.string().min(1, "Judul materi tidak boleh kosong"),
	content: z.string().optional().nullable(),
	attachments: z
		.array(
			z.object({
				name: z.string(),
				url: z.string(),
				type: z.string(),
			}),
		)
		.optional()
		.nullable(),
	order: z.number().default(0),
	moduleId: z.string().min(1, "ID Modul tidak valid"),
	type: z.enum(["TEXT", "QUIZ"]).default("TEXT"),
	quizData: z.any().optional().nullable(),
});

const updateLessonSchema = z.object({
	title: z.string().min(1, "Judul materi tidak boleh kosong").optional(),
	content: z.string().optional().nullable(),
	attachments: z
		.array(
			z.object({
				name: z.string(),
				url: z.string(),
				type: z.string(),
			}),
		)
		.optional()
		.nullable(),
	order: z.number().optional(),
	type: z.enum(["TEXT", "QUIZ"]).optional(),
	quizData: z.any().optional().nullable(),
});

export async function createCourse(data: z.infer<typeof createCourseSchema>) {
	try {
		const user = await ensureGuru();

		const validation = createCourseSchema.safeParse(data);
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const course = await prisma.course.create({
			data: {
				...validation.data,
				teacherId: user.uid,
			},
		});

		revalidatePath("/dashboard/guru/lms");
		return { success: true, data: course };
	} catch (error) {
		console.error("Error creating course:", error);
		return { success: false, error: "Gagal membuat kursus" };
	}
}

export async function getCoursesByTeacher(teacherId: string) {
	try {
		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };
		const isGuru = user.role === "Guru" || user.role === "ADMIN_GURU";

		// Access control: Guru can only see their own courses.
		if (isGuru && user.uid !== teacherId) {
			return { success: false, error: "Unauthorized" };
		}

		// Siswa can only see PUBLISHED courses.
		const whereClause = isGuru
			? { teacherId }
			: { teacherId, status: "PUBLISHED" };

		const courses = await prisma.course.findMany({
			where: whereClause,
			orderBy: { createdAt: "desc" },
		});

		return { success: true, data: courses };
	} catch (error) {
		console.error("Error fetching courses:", error);
		return { success: false, error: "Gagal mengambil data kursus" };
	}
}

export async function getCourseDetails(courseId: string) {
	try {
		const user = await getAuthUser();
		if (!user) return { success: false, error: "Unauthorized" };
		const isGuru = user.role === "Guru" || user.role === "ADMIN_GURU";
		const isSiswa = user.role === "Siswa" || user.role === "SISWA";

		const course = await prisma.course.findUnique({
			where: { id: courseId },
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

		if (isGuru && course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Anda tidak memiliki akses ke kursus ini",
			};
		}

		if (isSiswa && course.status !== "PUBLISHED") {
			return { success: false, error: "Kursus belum tersedia" };
		}

		return { success: true, data: course };
	} catch (error) {
		console.error("Error fetching course details:", error);
		return { success: false, error: "Gagal mengambil detail kursus" };
	}
}

export async function updateCourse(
	courseId: string,
	data: z.infer<typeof updateCourseSchema>,
) {
	try {
		const user = await ensureGuru();

		const validation = updateCourseSchema.safeParse(data);
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const existingCourse = await prisma.course.findUnique({
			where: { id: courseId },
		});

		if (!existingCourse || existingCourse.teacherId !== user.uid) {
			return {
				success: false,
				error: "Kursus tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const { rewards: rewardsInput, ...restFields } = validation.data;

		const updatePayload: Prisma.CourseUpdateInput = {};
		if (restFields.title !== undefined) updatePayload.title = restFields.title;
		if (restFields.description !== undefined)
			updatePayload.description = restFields.description;
		if (restFields.coverImage !== undefined)
			updatePayload.coverImage = restFields.coverImage;
		if (restFields.status !== undefined)
			updatePayload.status = restFields.status;

		if (rewardsInput !== undefined) {
			const normalized: CourseRewardsValues = {
				lessonXp: rewardsInput.lessonXp,
				quizMaxXp: rewardsInput.quizMaxXp,
				completionXp: rewardsInput.completionXp,
				badgeId:
					rewardsInput.badgeId != null && rewardsInput.badgeId.length > 0
						? rewardsInput.badgeId
						: null,
			};
			updatePayload.rewards = courseRewardsToPrismaJson(normalized);
		}

		const course = await prisma.course.update({
			where: { id: courseId },
			data: updatePayload,
		});

		const assigned = await prisma.courseAssignment.findMany({
			where: { courseId },
			select: { classId: true },
		});
		revalidateLmsPathsForClasses(
			courseId,
			assigned.map((a) => a.classId),
		);
		return { success: true, data: course };
	} catch (error) {
		console.error("Error updating course:", error);
		return { success: false, error: "Gagal memperbarui kursus" };
	}
}

export async function deleteCourse(courseId: string) {
	try {
		const user = await ensureGuru();

		const existingCourse = await prisma.course.findUnique({
			where: { id: courseId },
		});

		if (!existingCourse || existingCourse.teacherId !== user.uid) {
			return {
				success: false,
				error: "Kursus tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const assignedClassIds = (
			await prisma.courseAssignment.findMany({
				where: { courseId },
				select: { classId: true },
			})
		).map((a) => a.classId);

		await prisma.course.delete({
			where: { id: courseId },
		});

		revalidatePath("/dashboard/guru/lms");
		revalidateLmsPathsForClasses(courseId, assignedClassIds);
		return { success: true };
	} catch (error) {
		console.error("Error deleting course:", error);
		return { success: false, error: "Gagal menghapus kursus" };
	}
}

export async function createModule(data: z.infer<typeof createModuleSchema>) {
	try {
		const user = await ensureGuru();

		const validation = createModuleSchema.safeParse(data);
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const existingCourse = await prisma.course.findUnique({
			where: { id: validation.data.courseId },
		});

		if (!existingCourse || existingCourse.teacherId !== user.uid) {
			return {
				success: false,
				error: "Kursus tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const createdModule = await prisma.courseModule.create({
			data: validation.data,
		});

		revalidatePath(`/dashboard/guru/lms/${validation.data.courseId}`);
		return { success: true, data: createdModule };
	} catch (error) {
		console.error("Error creating module:", error);
		return { success: false, error: "Gagal membuat modul" };
	}
}

export async function createLesson(data: z.input<typeof createLessonSchema>) {
	try {
		const user = await ensureGuru();

		const validation = createLessonSchema.safeParse(data);
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		// Verify course ownership via module
		const courseModule = await prisma.courseModule.findUnique({
			where: { id: validation.data.moduleId },
			include: { course: true },
		});

		if (!courseModule || courseModule.course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Modul tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const lesson = await prisma.courseLesson.create({
			data: {
				title: validation.data.title,
				content: validation.data.content,
				attachments: validation.data.attachments ?? [],
				order: validation.data.order,
				moduleId: validation.data.moduleId,
				type: validation.data.type,
				quizData: validation.data.quizData ?? undefined,
			},
		});

		revalidatePath(`/dashboard/guru/lms/${courseModule.courseId}`);
		return { success: true, data: lesson };
	} catch (error) {
		console.error("Error creating lesson:", error);
		return { success: false, error: "Gagal membuat materi" };
	}
}

export async function updateLesson(
	lessonId: string,
	data: z.input<typeof updateLessonSchema>,
) {
	try {
		const user = await ensureGuru();

		const validation = updateLessonSchema.safeParse(data);
		if (!validation.success) {
			return { success: false, error: validation.error.issues[0].message };
		}

		const existingLesson = await prisma.courseLesson.findUnique({
			where: { id: lessonId },
			include: { module: { include: { course: true } } },
		});

		if (
			!existingLesson ||
			existingLesson.module.course.teacherId !== user.uid
		) {
			return {
				success: false,
				error: "Materi tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const lesson = await prisma.courseLesson.update({
			where: { id: lessonId },
			data: {
				...validation.data,
				attachments: validation.data.attachments ?? undefined,
				quizData: validation.data.quizData ?? undefined,
			},
		});

		revalidatePath(`/dashboard/guru/lms/${existingLesson.module.courseId}`);
		return { success: true, data: lesson };
	} catch (error) {
		console.error("Error updating lesson:", error);
		return { success: false, error: "Gagal memperbarui materi" };
	}
}

export async function deleteLesson(lessonId: string) {
	try {
		const user = await ensureGuru();

		const existingLesson = await prisma.courseLesson.findUnique({
			where: { id: lessonId },
			include: { module: { include: { course: true } } },
		});

		if (
			!existingLesson ||
			existingLesson.module.course.teacherId !== user.uid
		) {
			return {
				success: false,
				error: "Materi tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		await prisma.courseLesson.delete({ where: { id: lessonId } });
		revalidatePath(`/dashboard/guru/lms/${existingLesson.module.courseId}`);
		return { success: true };
	} catch (error) {
		console.error("Error deleting lesson:", error);
		return { success: false, error: "Gagal menghapus materi" };
	}
}

export async function deleteModule(moduleId: string) {
	try {
		const user = await ensureGuru();

		const existingModule = await prisma.courseModule.findUnique({
			where: { id: moduleId },
			include: { course: true },
		});

		if (!existingModule || existingModule.course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Modul tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		await prisma.courseModule.delete({ where: { id: moduleId } });
		revalidatePath(`/dashboard/guru/lms/${existingModule.courseId}`);
		return { success: true };
	} catch (error) {
		console.error("Error deleting module:", error);
		return { success: false, error: "Gagal menghapus modul" };
	}
}

export async function updateModule(
	moduleId: string,
	data: { title?: string; order?: number },
) {
	try {
		const user = await ensureGuru();

		const existingModule = await prisma.courseModule.findUnique({
			where: { id: moduleId },
			include: { course: true },
		});

		if (!existingModule || existingModule.course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Modul tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const updatedModule = await prisma.courseModule.update({
			where: { id: moduleId },
			data: data,
		});

		revalidatePath(`/dashboard/guru/lms/${existingModule.courseId}`);
		return { success: true, data: updatedModule };
	} catch (error) {
		console.error("Error updating module:", error);
		return { success: false, error: "Gagal memperbarui modul" };
	}
}

export async function getClassesByAdmin() {
	try {
		const user = await ensureGuru();

		const classes = await prisma.class.findMany({
			where: { adminId: user.uid },
			orderBy: { name: "asc" },
			select: {
				id: true,
				name: true,
				code: true,
			},
		});

		return { success: true, data: classes };
	} catch (error) {
		console.error("Error fetching classes:", error);
		return { success: false, error: "Gagal mengambil data kelas" };
	}
}

export async function getCourseAssignments(courseId: string) {
	try {
		const user = await ensureGuru();

		const course = await prisma.course.findUnique({
			where: { id: courseId },
		});

		if (!course || course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Kursus tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const assignments = await prisma.courseAssignment.findMany({
			where: { courseId },
			select: {
				id: true,
				classId: true,
				assignedAt: true,
				class: {
					select: { id: true, name: true, code: true },
				},
			},
		});

		return { success: true, data: assignments };
	} catch (error) {
		console.error("Error fetching course assignments:", error);
		return { success: false, error: "Gagal mengambil data penetapan" };
	}
}

export async function assignCourse(courseId: string, classId: string) {
	try {
		const user = await ensureGuru();

		const course = await prisma.course.findUnique({
			where: { id: courseId },
		});

		if (!course || course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Kursus tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const existingClass = await prisma.class.findUnique({
			where: { id: classId },
		});

		if (!existingClass || existingClass.adminId !== user.uid) {
			return {
				success: false,
				error: "Kelas tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const assignment = await prisma.courseAssignment.upsert({
			where: { courseId_classId: { courseId, classId } },
			update: {},
			create: { courseId, classId },
		});

		revalidateLmsPathsForClasses(courseId, [classId]);
		return { success: true, data: assignment };
	} catch (error) {
		console.error("Error assigning course:", error);
		return { success: false, error: "Gagal menetapkan kursus ke kelas" };
	}
}

const assignCourseToClassesSchema = z.object({
	courseId: z.string().min(1, "ID kursus tidak valid"),
	classIds: z
		.array(z.string().min(1))
		.min(1, "Pilih minimal satu kelas")
		.max(100, "Terlalu banyak kelas sekaligus"),
});

/** Menempatkan kursus ke banyak kelas sekaligus (boleh pilih banyak checkbox). */
export async function assignCourseToClasses(
	courseId: string,
	classIds: string[],
) {
	try {
		const validation = assignCourseToClassesSchema.safeParse({
			courseId,
			classIds,
		});
		if (!validation.success) {
			return {
				success: false,
				error: validation.error.issues[0]?.message ?? "Data tidak valid",
			};
		}

		const user = await ensureGuru();
		const unique = [...new Set(validation.data.classIds)];

		const course = await prisma.course.findUnique({
			where: { id: validation.data.courseId },
		});

		if (!course || course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Kursus tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const owned = await prisma.class.findMany({
			where: { id: { in: unique }, adminId: user.uid },
			select: { id: true },
		});

		if (owned.length !== unique.length) {
			return {
				success: false,
				error: "Salah satu kelas tidak ditemukan atau bukan kelas Anda",
			};
		}

		await prisma.courseAssignment.createMany({
			data: unique.map((classId) => ({ courseId, classId })),
			skipDuplicates: true,
		});

		revalidateLmsPathsForClasses(courseId, unique);
		return { success: true, data: { added: unique.length } };
	} catch (error) {
		console.error("Error bulk assigning course:", error);
		return { success: false, error: "Gagal menetapkan kursus ke kelas" };
	}
}

export async function unassignCourse(courseId: string, classId: string) {
	try {
		const user = await ensureGuru();

		const course = await prisma.course.findUnique({
			where: { id: courseId },
		});

		if (!course || course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Kursus tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		await prisma.courseAssignment.delete({
			where: { courseId_classId: { courseId, classId } },
		});

		revalidateLmsPathsForClasses(courseId, [classId]);
		return { success: true };
	} catch (error) {
		console.error("Error unassigning course:", error);
		return { success: false, error: "Gagal menghapus kursus dari kelas" };
	}
}

export async function getCourseAnalytics(
	courseId: string,
	options?: { status?: string; q?: string },
) {
	try {
		const user = await ensureGuru();

		const course = await prisma.course.findUnique({
			where: { id: courseId },
			select: { id: true, teacherId: true },
		});

		if (!course || course.teacherId !== user.uid) {
			return {
				success: false,
				error: "Kursus tidak ditemukan atau Anda tidak memiliki akses",
			};
		}

		const [totalLessons, assignments, lessonRows] = await Promise.all([
			prisma.courseLesson.count({
				where: { module: { courseId } },
			}),
			prisma.courseAssignment.findMany({
				where: { courseId },
				select: { classId: true },
			}),
			prisma.courseLesson.findMany({
				where: { module: { courseId } },
				select: { id: true },
			}),
		]);

		const classIds = [...new Set(assignments.map((a) => a.classId))];
		const lessonIds = lessonRows.map((l) => l.id);

		const enrollments =
			classIds.length === 0
				? []
				: await prisma.enrollment.findMany({
						where: { classId: { in: classIds } },
						include: {
							user: { select: { id: true, name: true, email: true } },
							class: { select: { name: true, code: true } },
						},
					});

		type Dedup = {
			user: { id: string; name: string; email: string };
			classes: Array<{ name: string; code: string }>;
		};
		const byStudent = new Map<string, Dedup>();
		for (const e of enrollments) {
			const cur = byStudent.get(e.userId);
			if (!cur) {
				byStudent.set(e.userId, {
					user: e.user,
					classes: [{ name: e.class.name, code: e.class.code }],
				});
			} else {
				cur.classes.push({ name: e.class.name, code: e.class.code });
			}
		}

		const studentIds = [...byStudent.keys()];
		const firstAccessRows =
			studentIds.length === 0
				? []
				: await prisma.courseStudentFirstAccess.findMany({
						where: {
							courseId,
							studentId: { in: studentIds },
						},
						select: { studentId: true, firstAccessedAt: true },
					});
		const firstAccessByStudent = new Map(
			firstAccessRows.map((r) => [r.studentId, r.firstAccessedAt]),
		);

		const progressByStudent = new Map<
			string,
			{ completedLessons: number; lastActivity: Date | null }
		>();

		if (lessonIds.length > 0) {
			const grouped = await prisma.lessonProgress.groupBy({
				by: ["studentId"],
				where: {
					lessonId: { in: lessonIds },
					isCompleted: true,
				},
				_count: { id: true },
				_max: { completedAt: true },
			});
			for (const g of grouped) {
				progressByStudent.set(g.studentId, {
					completedLessons: g._count.id,
					lastActivity: g._max.completedAt,
				});
			}
		}

		const sources: CourseAnalyticsLearnerSource[] = [...byStudent.values()]
			.map(({ user: u, classes }) => {
				const p = progressByStudent.get(u.id);
				return {
					studentId: u.id,
					name: u.name,
					email: u.email,
					classLabel: formatClassLabel(classes),
					completedLessons: p?.completedLessons ?? 0,
					lastActivity: p?.lastActivity ?? null,
					firstAccessedAt: firstAccessByStudent.get(u.id) ?? null,
				};
			})
			.sort((a, b) => a.name.localeCompare(b.name, "id"));

		const view = buildCourseAnalyticsView(totalLessons, sources, {
			status: parseAnalyticsStatusFilter(options?.status),
			q: options?.q,
		});

		return { success: true, data: view };
	} catch (error) {
		console.error("Error fetching course analytics:", error);
		return { success: false, error: "Gagal mengambil analitik kursus" };
	}
}

export async function submitQuizAttempt(lessonId: string, answers: number[]) {
	try {
		const user = await ensureSiswa();

		const lesson = await prisma.courseLesson.findUnique({
			where: { id: lessonId },
			include: { module: true },
		});

		if (!lesson || lesson.type !== "QUIZ" || !lesson.quizData) {
			return { success: false, error: "Kuis tidak ditemukan" };
		}

		const courseId = lesson.module.courseId;

		const access = await assertSiswaPublishedCourseEnrollment(
			user.uid,
			courseId,
		);
		if (!access.ok) {
			return { success: false, error: access.error };
		}

		// Fetch course rewards for XP calculation
		const course = await prisma.course.findUnique({
			where: { id: courseId },
			select: { rewards: true },
		});

		const rawRw = course?.rewards;
		const rewards: Record<string, unknown> =
			rawRw && typeof rawRw === "object" && !Array.isArray(rawRw)
				? (rawRw as Record<string, unknown>)
				: {};
		const quizMaxXp =
			typeof rewards.quizMaxXp === "number" ? rewards.quizMaxXp : 0;

		const quizData = lesson.quizData as {
			questions?: Array<{ answerIndex: number; explanation?: string }>;
			coolDownMinutes?: number;
			passingGrade?: number;
		};
		const questions = quizData.questions || [];
		const coolDownMinutes = quizData.coolDownMinutes || 0;
		const passingGrade = quizData.passingGrade || 0;

		const progress = await prisma.lessonProgress.findUnique({
			where: {
				studentId_lessonId: {
					studentId: user.uid,
					lessonId: lessonId,
				},
			},
		});

		// Check cool-down
		if (progress?.lastAttemptAt && coolDownMinutes > 0) {
			const now = new Date();
			const lastAttempt = new Date(progress.lastAttemptAt);
			const diffMs = now.getTime() - lastAttempt.getTime();
			const diffMins = diffMs / (1000 * 60);

			if (diffMins < coolDownMinutes) {
				const remaining = Math.ceil(coolDownMinutes - diffMins);
				return {
					success: false,
					error: `Silakan tunggu ${remaining} menit lagi sebelum mencoba kembali.`,
				};
			}
		}

		// Grading
		let correctCount = 0;
		const feedback = questions.map(
			(q: { answerIndex: number; explanation?: string }, index: number) => {
				const isCorrect = q.answerIndex === answers[index];
				if (isCorrect) correctCount++;
				return {
					correct: isCorrect,
					explanation: q.explanation,
				};
			},
		);

		const score =
			questions.length > 0 ? (correctCount / questions.length) * 100 : 0;
		const passed = score >= passingGrade;

		// Check if this is a better score than before
		const previousScore = progress?.score ?? 0;
		const isNewBest = score > previousScore;

		// Persistence
		await prisma.lessonProgress.upsert({
			where: {
				studentId_lessonId: {
					studentId: user.uid,
					lessonId: lessonId,
				},
			},
			update: {
				score,
				lastAttemptAt: new Date(),
				isCompleted: progress?.isCompleted || passed,
				completedAt:
					progress?.isCompleted || passed
						? progress?.completedAt || new Date()
						: undefined,
			},
			create: {
				studentId: user.uid,
				lessonId: lessonId,
				score,
				lastAttemptAt: new Date(),
				isCompleted: passed,
				completedAt: passed ? new Date() : undefined,
			},
		});

		// Award XP if passed and this is a better score than before
		if (passed && isNewBest && quizMaxXp > 0) {
			const calculatedXp = Math.round((score / 100) * quizMaxXp);
			await assignXPSupabase(
				user.uid,
				calculatedXp,
				`Lulus kuis: ${lesson.title}`,
				undefined,
				true,
			);
		}

		revalidatePath("/dashboard/siswa");
		revalidatePath(`/dashboard/siswa/lms/${courseId}`);
		return {
			success: true,
			data: {
				score,
				passed,
				feedback,
			},
		};
	} catch (error) {
		console.error("Error submitting quiz attempt:", error);
		return { success: false, error: "Gagal mengirim jawaban kuis" };
	}
}
