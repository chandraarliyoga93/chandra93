import { getStudentCourses } from "@/actions/lms-student-supabase";
import { getAuthUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
	getLmsStatusLabelIdn,
	getStudentCourseStatus,
	type StudentCourseStatus,
} from "@/lib/lms/flow";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, ArrowRight, User } from "iconoir-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { normalizeCoverImageUrl } from "@/lib/lms/course-cover";

/** Shortcut nav + tests: daftar LMS lintas kelas. */
export const STUDENT_GLOBAL_LMS_HREF = "/dashboard/siswa?view=lms" as const;

/** Tab Materi dalam konteks satu kelas (tasks page / dashboard dengan classId). */
export function studentClassTasksLmsHref(classId: string): string {
	return `/dashboard/siswa/classes/${encodeURIComponent(classId)}/tasks?view=lms`;
}

type CourseBase = {
	id: string;
	title: string;
	description: string | null;
	coverImage: string | null;
	status: string;
	teacher: {
		name: string;
	};
};

export type StudentCourseListItem = CourseBase & {
	studentStatus: StudentCourseStatus;
	completedLessons: number;
	totalLessons: number;
};

export function studentCoursePlayerHref(courseId: string): string {
	return `/dashboard/siswa/lms/${encodeURIComponent(courseId)}`;
}

function LmsProgressBadge({ status }: { status: StudentCourseStatus }) {
	const label = getLmsStatusLabelIdn(status);
	return (
		<span
			data-testid={`lms-student-status-${status}`}
			className={cn(
				"inline-flex shrink-0 items-center px-2 py-1 text-[10px] font-black uppercase italic tracking-tight border-2 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] rounded-md",
				status === "NOT_STARTED" &&
					"bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
				status === "IN_PROGRESS" && "bg-yellow-400 text-black",
				status === "COMPLETED" && "bg-emerald-400 text-black",
			)}
		>
			{label}
		</span>
	);
}

export function StudentCourseListGrid({
	items,
}: {
	items: StudentCourseListItem[];
}) {
	if (items.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center">
				<Book className="w-12 h-12 mb-4 text-muted-foreground" />
				<h3 className="text-xl font-black italic uppercase">
					Belum Ada Materi
				</h3>
				<p className="font-bold text-muted-foreground italic">
					Guru belum membagikan materi untuk circle ini.
				</p>
			</div>
		);
	}

	return (
		<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{items.map((course) => (
				<Card
					key={course.id}
					className="neo-card flex flex-col justify-between h-full bg-neo-bg p-0 overflow-hidden group gap-0 rounded-2xl"
				>
					<CardHeader className="p-4 border-b-2 border-neo-border bg-emerald-300/80 dark:bg-emerald-900/80 space-y-0 block">
						<div className="flex items-start justify-between gap-2">
							<h3 className="font-black text-lg leading-tight text-black dark:text-white line-clamp-2 italic tracking-tight min-w-0">
								{course.title}
							</h3>
							<LmsProgressBadge status={course.studentStatus} />
						</div>
					</CardHeader>

					<CardContent className="p-4 flex-1 flex flex-col gap-4 bg-neo-bg">
						{course.coverImage ? (
							<div className="relative aspect-video border-2 border-neo-border shadow-[3px_3px_0px_0px_var(--neo-border)] overflow-hidden bg-muted rounded-lg">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={normalizeCoverImageUrl(course.coverImage)}
									alt={course.title}
									className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
									loading="lazy"
									decoding="async"
								/>
							</div>
						) : (
							<div className="aspect-video border-2 border-neo-border bg-muted flex items-center justify-center shadow-[3px_3px_0px_0px_var(--neo-border)] rounded-lg">
								<Book className="w-12 h-12 text-muted-foreground opacity-20" />
							</div>
						)}

						<div className="flex items-center gap-2 text-foreground font-black text-xs border-2 border-neo-border p-2 bg-muted rounded-md">
							<User className="h-4 w-4 shrink-0" />
							<span className="truncate">{course.teacher?.name || "Guru"}</span>
						</div>

						<p className="text-[11px] font-black text-muted-foreground border-2 border-dashed border-neo-border/60 px-2 py-1.5 rounded-md bg-muted/40">
							Progres:{" "}
							<span className="text-foreground">
								{course.completedLessons}/{course.totalLessons}
							</span>{" "}
							materi
						</p>

						{course.description && (
							<p className="text-xs font-bold text-muted-foreground line-clamp-3 italic leading-relaxed">
								{course.description}
							</p>
						)}
					</CardContent>

					<CardFooter className="p-4 pt-0 block">
						<Button
							asChild
							className="neo-btn w-full bg-black hover:bg-zinc-800 text-white gap-2 py-3 h-auto rounded-lg text-sm font-black italic shadow-[3px_3px_0px_0px_var(--neo-border)] hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 hover:shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
						>
							<Link
								href={studentCoursePlayerHref(course.id)}
								data-testid={`lms-open-course-${course.id}`}
							>
								PELAJARI MATERI
								<ArrowRight className="h-4 w-4" />
							</Link>
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}

async function enrichWithProgress(
	courses: CourseBase[],
	studentId: string,
): Promise<StudentCourseListItem[]> {
	if (courses.length === 0) return [];

	return Promise.all(
		courses.map(async (course) => {
			const [totalLessons, completedLessons] = await Promise.all([
				prisma.courseLesson.count({
					where: { module: { courseId: course.id } },
				}),
				prisma.lessonProgress.count({
					where: {
						studentId,
						isCompleted: true,
						lesson: { module: { courseId: course.id } },
					},
				}),
			]);

			const studentStatus = getStudentCourseStatus(
				completedLessons,
				totalLessons,
			);

			return {
				...course,
				totalLessons,
				completedLessons,
				studentStatus,
			};
		}),
	);
}

async function mergeCoursesFromClasses(
	classIds: string[],
): Promise<CourseBase[]> {
	const seen = new Set<string>();
	const merged: CourseBase[] = [];

	for (const cid of classIds) {
		const result = await getStudentCourses(cid);
		if (!result.success || !result.data) continue;
		const batch = result.data as CourseBase[];
		for (const c of batch) {
			if (seen.has(c.id)) continue;
			seen.add(c.id);
			merged.push(c);
		}
	}

	return merged;
}

export type StudentCourseListProps =
	| { variant: "class"; classId: string }
	| { variant: "global"; enrolledClassIds: string[] };

export default async function StudentCourseList(props: StudentCourseListProps) {
	const user = await getAuthUser();
	if (!user) {
		return (
			<div className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center">
				<h3 className="text-xl font-black italic uppercase text-red-500">
					Error
				</h3>
				<p className="font-bold text-muted-foreground italic">Unauthorized</p>
			</div>
		);
	}

	let courses: CourseBase[] = [];

	if (props.variant === "class") {
		const result = await getStudentCourses(props.classId);
		if (!result.success || !result.data) {
			return (
				<div className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center">
					<h3 className="text-xl font-black italic uppercase text-red-500">
						Error
					</h3>
					<p className="font-bold text-muted-foreground italic">
						{result.error || "Gagal mengambil data materi"}
					</p>
				</div>
			);
		}
		courses = result.data as CourseBase[];
	} else {
		if (props.enrolledClassIds.length === 0) {
			return (
				<div className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center">
					<Book className="w-12 h-12 mb-4 text-muted-foreground" />
					<h3 className="text-xl font-black italic uppercase">
						Belum Ada Circle
					</h3>
					<p className="font-bold text-muted-foreground italic">
						Gabung circle dulu untuk melihat materi di sini.
					</p>
				</div>
			);
		}
		courses = await mergeCoursesFromClasses(props.enrolledClassIds);
	}

	const items = await enrichWithProgress(courses, user.uid);

	return <StudentCourseListGrid items={items} />;
}
