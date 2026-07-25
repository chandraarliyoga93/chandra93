import {
	ensureStudentCourseFirstAccess,
	getCourseContent,
	getCourseRewardClaimStatus,
	getStudentProgress,
} from "@/actions/lms-student-supabase";
import { getStudentStatsSupabase } from "@/actions/gamification-supabase";
import { getAuthUser } from "@/lib/auth-server";
import { CoursePlayer } from "@/components/lms/CoursePlayer";
import PageContainer from "@/components/layout/PageContainer";
import { PageTransition } from "@/components/layout/PageTransition";
import { cn } from "@/lib/utils";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Belajar | Kelas Guru",
	description:
		"Buka materi kapan saja; tandai selesai untuk memperbarui progres (Belum Mulai → Sedang Belajar → Selesai).",
};

interface PageProps {
	params: Promise<{ courseId: string }>;
}

interface LessonProgress {
	lessonId: string;
	isCompleted: boolean;
	completedAt: Date;
}

export default async function CoursePlayerPage({ params }: PageProps) {
	const { courseId } = await params;
	const user = await getAuthUser();

	// Critical: Role verification
	if (!user) {
		redirect("/login");
	}

	if (user.role !== "SISWA" && user.role !== "Siswa") {
		redirect("/");
	}

	// Fetch course content, progress, XP/level, and reward claim in parallel
	const [courseResult, progressResult, studentStats, claimResult] =
		await Promise.all([
			getCourseContent(courseId),
			getStudentProgress(courseId, user.uid),
			getStudentStatsSupabase(user.uid),
			getCourseRewardClaimStatus(courseId),
		]);

	if (!courseResult.success || !courseResult.data) {
		// Handle error or not found
		console.error("Course fetch error:", courseResult.error);
		notFound();
	}

	const course = courseResult.data;

	await ensureStudentCourseFirstAccess(courseId);

	const initialRewardClaimed =
		claimResult.success && claimResult.data ? claimResult.data.claimed : false;

	const rawProgress =
		progressResult.success && progressResult.data ? progressResult.data : [];
	const initialProgress: LessonProgress[] = rawProgress.map((p) => ({
		lessonId: p.lessonId,
		isCompleted: p.isCompleted,
		completedAt:
			p.completedAt instanceof Date
				? p.completedAt
				: new Date(String(p.completedAt)),
	}));

	return (
		<PageContainer
			scrollable={false}
			className={cn(
				"bg-neo-bg md:bg-background p-0",
				// Biarkan tinggi mengikuti kontainer induk (`SiswaLayout`) untuk menghindari
				// double-subtraction tinggi viewport yang mengunci area scroll materi di mobile.
				"h-full",
			)}
			innerClassName="p-0 h-full min-h-0 flex flex-1 flex-col md:p-0"
		>
			<PageTransition>
				<div className="flex min-h-0 flex-1 flex-col md:p-3">
					<CoursePlayer
						course={course}
						initialProgress={initialProgress}
						studentId={user.uid}
						initialRewardClaimed={initialRewardClaimed}
						viewerStats={{
							xp: studentStats?.xp ?? 0,
							level: studentStats?.level ?? 1,
						}}
					/>
				</div>
			</PageTransition>
		</PageContainer>
	);
}
