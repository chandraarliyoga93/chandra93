import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
	CourseAnalyticsStatusFilter,
	CourseLearnerAnalyticsRow,
} from "@/lib/lms/analytics";
import { finalizeDurationCalendarDays } from "@/lib/lms/analytics";
import { getLmsStatusLabelIdn } from "@/lib/lms/flow";
import type { StudentCourseStatus } from "@/lib/lms/flow";
import { differenceInCalendarDays } from "date-fns";

function statusBadgeVariant(
	status: StudentCourseStatus,
): "secondary" | "default" | "outline" {
	switch (status) {
		case "NOT_STARTED":
			return "secondary";
		case "IN_PROGRESS":
			return "default";
		case "COMPLETED":
			return "outline";
		default:
			return "secondary";
	}
}

function formatDurationCell(row: CourseLearnerAnalyticsRow, reference: Date) {
	if (!row.firstAccessedAt) {
		return <span className="text-muted-foreground">Tidak tersedia</span>;
	}

	if (row.status === "COMPLETED") {
		if (!row.lastActivity) {
			return <span className="text-muted-foreground">—</span>;
		}
		const days = finalizeDurationCalendarDays(
			row.firstAccessedAt,
			row.lastActivity,
		);
		return <span className="tabular-nums">{days} hari</span>;
	}

	const days = Math.max(
		0,
		differenceInCalendarDays(reference, row.firstAccessedAt),
	);
	return (
		<div className="flex flex-col gap-1">
			<Badge variant="secondary" className="w-fit">
				Berjalan
			</Badge>
			<span className="tabular-nums text-muted-foreground">{days} hari</span>
		</div>
	);
}

export function GuruLearnerProgressTable({
	courseId,
	learners,
	currentStatus,
	currentQuery,
	referenceTime,
}: {
	courseId: string;
	learners: CourseLearnerAnalyticsRow[];
	currentStatus: CourseAnalyticsStatusFilter;
	currentQuery: string;
	referenceTime: Date;
}) {
	const analyticsPath = `/dashboard/guru/lms/${courseId}/analytics`;

	return (
		<div className="space-y-4">
			<form
				action={analyticsPath}
				method="get"
				className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
			>
				<div className="space-y-1.5 min-w-[180px]">
					<Label htmlFor="analytics-status">Status</Label>
					<select
						id="analytics-status"
						name="status"
						defaultValue={currentStatus}
						className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value="ALL">Semua</option>
						<option value="NOT_STARTED">
							{getLmsStatusLabelIdn("NOT_STARTED")}
						</option>
						<option value="IN_PROGRESS">
							{getLmsStatusLabelIdn("IN_PROGRESS")}
						</option>
						<option value="COMPLETED">
							{getLmsStatusLabelIdn("COMPLETED")}
						</option>
					</select>
				</div>
				<div className="space-y-1.5 flex-1 min-w-[200px]">
					<Label htmlFor="analytics-q">Cari nama atau email</Label>
					<Input
						id="analytics-q"
						name="q"
						type="search"
						placeholder="Contoh: budi"
						defaultValue={currentQuery}
					/>
				</div>
				<Button type="submit" variant="secondary" className="w-full sm:w-auto">
					Terapkan
				</Button>
			</form>

			<div className="rounded-md border overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b bg-muted/40 text-left">
							<th className="p-3 font-medium">Siswa</th>
							<th className="p-3 font-medium">Kelas</th>
							<th className="p-3 font-medium">Progres</th>
							<th className="p-3 font-medium">Status</th>
							<th className="p-3 font-medium">Durasi</th>
							<th className="p-3 font-medium">Aktivitas terakhir</th>
						</tr>
					</thead>
					<tbody>
						{learners.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="p-6 text-center text-muted-foreground"
								>
									Tidak ada siswa yang cocok dengan filter ini.
								</td>
							</tr>
						) : (
							learners.map((row) => (
								<tr key={row.studentId} className="border-b last:border-0">
									<td className="p-3 align-top">
										<div className="font-medium">{row.name}</div>
										<div className="text-xs text-muted-foreground">
											{row.email}
										</div>
									</td>
									<td className="p-3 align-top text-muted-foreground">
										{row.classLabel || "—"}
									</td>
									<td className="p-3 align-top tabular-nums">
										{row.completedLessons}/{row.totalLessons}
									</td>
									<td className="p-3 align-top">
										<Badge variant={statusBadgeVariant(row.status)}>
											{getLmsStatusLabelIdn(row.status)}
										</Badge>
									</td>
									<td className="p-3 align-top">
										{formatDurationCell(row, referenceTime)}
									</td>
									<td className="p-3 align-top text-muted-foreground">
										{row.lastActivity
											? row.lastActivity.toLocaleString("id-ID", {
													dateStyle: "medium",
													timeStyle: "short",
												})
											: "—"}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
