import {
	getCourseAnalytics,
	getCourseDetails,
} from "@/actions/lms-course-supabase";
import {
	parseAnalyticsStatusFilter,
	type CourseAnalyticsStatusFilter,
} from "@/lib/lms/analytics";
import { GuruCourseAnalyticsPanel } from "@/components/lms/GuruCourseAnalyticsPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NavArrowLeft, Settings } from "iconoir-react";
import type { Metadata } from "next";

interface CourseAnalyticsPageProps {
	params: Promise<{ courseId: string }>;
	searchParams?: Promise<{ status?: string; q?: string }>;
}

export async function generateMetadata({
	params,
}: CourseAnalyticsPageProps): Promise<Metadata> {
	const { courseId } = await params;
	const result = await getCourseDetails(courseId);
	const title =
		result.success && result.data
			? `${result.data.title} · Analitik`
			: "Analitik kursus";
	return { title: `${title} | LMS` };
}

export default async function CourseAnalyticsPage({
	params,
	searchParams,
}: CourseAnalyticsPageProps) {
	const { courseId } = await params;
	const sp = (await searchParams) ?? {};
	const analyticsStatus: CourseAnalyticsStatusFilter =
		parseAnalyticsStatusFilter(sp.status);
	const analyticsQuery = typeof sp.q === "string" ? sp.q : "";

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

	const analyticsResult = await getCourseAnalytics(courseId, {
		status: analyticsStatus,
		q: analyticsQuery,
	});

	return (
		<div className="space-y-8 pb-10">
			<div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 pt-6">
				<Button asChild variant="ghost" size="icon" className="shrink-0">
					<Link
						href={`/dashboard/guru/lms/${courseId}`}
						aria-label="Kembali ke editor kursus"
					>
						<NavArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="min-w-0 flex-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Analitik kursus
					</h1>
					<p className="truncate text-sm text-muted-foreground">
						{course.title}
					</p>
				</div>
				<Button asChild variant="outline" size="sm" className="shrink-0">
					<Link href={`/dashboard/guru/lms/${courseId}/settings`}>
						<Settings className="mr-2 h-4 w-4" />
						Pengaturan
					</Link>
				</Button>
			</div>

			{analyticsResult.success && analyticsResult.data ? (
				<div className="mx-auto max-w-5xl px-6">
					<GuruCourseAnalyticsPanel
						courseId={courseId}
						data={analyticsResult.data}
						currentStatus={analyticsStatus}
						currentQuery={analyticsQuery}
					/>
				</div>
			) : (
				<div className="mx-auto max-w-5xl px-6">
					<p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
						{analyticsResult.error ??
							"Analitik kursus tidak dapat dimuat saat ini."}
					</p>
				</div>
			)}
		</div>
	);
}
