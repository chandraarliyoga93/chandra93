import {
	getCourseAssignments,
	getCourseDetails,
} from "@/actions/lms-course-supabase";
import { getBadgesSupabase } from "@/actions/gamification-supabase";
import { parseCourseRewardsFromJson } from "@/lib/lms/course-rewards";
import { CourseSettingsClient } from "@/components/lms/CourseSettingsClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CourseSettingsPageProps {
	params: Promise<{ courseId: string }>;
}

export default async function CourseSettingsPage({
	params,
}: CourseSettingsPageProps) {
	const { courseId } = await params;

	const result = await getCourseDetails(courseId);

	if (!result.success || !result.data) {
		return (
			<div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
				<h2 className="text-xl font-semibold">Kursus tidak ditemukan</h2>
				<p className="text-muted-foreground">
					{result.error || "Terjadi kesalahan."}
				</p>
				<Button asChild variant="outline">
					<Link href="/dashboard/guru/lms">Kembali ke Daftar Kursus</Link>
				</Button>
			</div>
		);
	}

	const course = result.data;

	const assignmentsResult = await getCourseAssignments(courseId);
	const assignments: Array<{
		id: string;
		classId: string;
		assignedAt: Date;
		class: { id: string; name: string; code: string };
	}> =
		assignmentsResult.success && assignmentsResult.data
			? assignmentsResult.data
			: [];

	const badgeRows = await getBadgesSupabase();
	const badgesForPicker = badgeRows.map((b) => ({
		id: b.id,
		label: b.label,
		emoji: b.emoji ?? "✨",
	}));

	const courseData = {
		id: course.id,
		title: course.title,
		description: course.description,
		coverImage: course.coverImage,
		status: course.status as "DRAFT" | "PUBLISHED",
		teacherId: course.teacherId,
		initialRewards: parseCourseRewardsFromJson(course.rewards),
		badges: badgesForPicker,
	};

	return (
		<CourseSettingsClient
			key={course.updatedAt.toISOString()}
			course={courseData}
			assignments={assignments}
		/>
	);
}
