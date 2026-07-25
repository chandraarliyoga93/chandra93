import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type {
	CourseAnalyticsStatusFilter,
	CourseAnalyticsView,
} from "@/lib/lms/analytics";
import { GuruLearnerProgressTable } from "@/components/lms/GuruLearnerProgressTable";
import { getLmsStatusLabelIdn } from "@/lib/lms/flow";

export function GuruCourseAnalyticsPanel({
	courseId,
	data,
	currentStatus,
	currentQuery,
}: {
	courseId: string;
	data: CourseAnalyticsView;
	currentStatus: CourseAnalyticsStatusFilter;
	currentQuery: string;
}) {
	const { metrics, learners, timeToComplete, generatedAt } = data;
	const histogramMax = Math.max(
		1,
		...timeToComplete.buckets.map((b) => b.count),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Analitik kursus</CardTitle>
				<CardDescription>
					Progres siswa di kelas yang ditetapkan untuk kursus ini. Metrik
					ringkas mencakup semua siswa terdaftar; tabel dapat difilter. Durasi
					rampung memakai akses pertama siswa ke halaman kursus; metrik agregat
					bersifat global (tidak ikut filter tabel).
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div>
					<h3 className="text-sm font-medium">Lamanya menyelesaikan kursus</h3>
					<p className="mt-1 text-xs text-muted-foreground">
						Hanya siswa selesai dengan data akses pertama yang dihitung dalam
						median/rata-rata/p90 beserta grafik distribusi.
					</p>
					<div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
						<div className="rounded-lg border bg-card p-4">
							<p className="text-xs font-medium text-muted-foreground">
								Median (hari)
							</p>
							<p className="mt-1 text-2xl font-semibold tabular-nums">
								{timeToComplete.medianDays ?? "—"}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								N = {timeToComplete.eligibleCount} siswa
							</p>
						</div>
						<div className="rounded-lg border bg-card p-4">
							<p className="text-xs font-medium text-muted-foreground">
								Rata-rata (hari)
							</p>
							<p className="mt-1 text-2xl font-semibold tabular-nums">
								{timeToComplete.meanDays ?? "—"}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Hari kalender
							</p>
						</div>
						<div className="rounded-lg border bg-card p-4">
							<p className="text-xs font-medium text-muted-foreground">
								Persentil 90
							</p>
							<p className="mt-1 text-2xl font-semibold tabular-nums">
								{timeToComplete.p90Days ?? "—"}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Hari kalender
							</p>
						</div>
						<div className="rounded-lg border bg-card p-4">
							<p className="text-xs font-medium text-muted-foreground">
								Rentang grafik
							</p>
							<p className="mt-1 text-lg font-semibold leading-snug">
								Bucket 0–15+ hari
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Siswa lain di luar agregat bila akses pertama belum ada
							</p>
						</div>
					</div>

					<div className="mt-4 space-y-2">
						{timeToComplete.buckets.map((b) => (
							<div key={b.label} className="space-y-1">
								<div className="flex justify-between gap-4 text-xs text-muted-foreground">
									<span>{b.label}</span>
									<span className="tabular-nums">{b.count}</span>
								</div>
								<div className="h-2 rounded-md bg-muted">
									<div
										className="h-2 rounded-md bg-primary/70"
										style={{
											width: `${Math.round((b.count / histogramMax) * 100)}%`,
										}}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<div className="rounded-lg border bg-card p-4">
						<p className="text-xs font-medium text-muted-foreground">
							{getLmsStatusLabelIdn("NOT_STARTED")}
						</p>
						<p className="mt-1 text-2xl font-semibold tabular-nums">
							{metrics.notStartedCount}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							dari {metrics.totalLearners} siswa
						</p>
					</div>
					<div className="rounded-lg border bg-card p-4">
						<p className="text-xs font-medium text-muted-foreground">
							{getLmsStatusLabelIdn("IN_PROGRESS")}
						</p>
						<p className="mt-1 text-2xl font-semibold tabular-nums">
							{metrics.inProgressCount}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							dari {metrics.totalLearners} siswa
						</p>
					</div>
					<div className="rounded-lg border bg-card p-4">
						<p className="text-xs font-medium text-muted-foreground">
							{getLmsStatusLabelIdn("COMPLETED")}
						</p>
						<p className="mt-1 text-2xl font-semibold tabular-nums">
							{metrics.completedCount}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							dari {metrics.totalLearners} siswa
						</p>
					</div>
					<div className="rounded-lg border bg-card p-4">
						<p className="text-xs font-medium text-muted-foreground">
							Tingkat penyelesaian
						</p>
						<p className="mt-1 text-2xl font-semibold tabular-nums">
							{metrics.completionRatePercent}%
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							{metrics.totalLessons} materi dalam kursus
						</p>
					</div>
				</div>

				<GuruLearnerProgressTable
					courseId={courseId}
					learners={learners}
					currentStatus={currentStatus}
					currentQuery={currentQuery}
					referenceTime={new Date(generatedAt)}
				/>
			</CardContent>
		</Card>
	);
}
