import { differenceInCalendarDays } from "date-fns";
import {
	getStudentCourseStatus,
	type StudentCourseStatus,
} from "@/lib/lms/flow";

const ANALYTICS_STATUS_FILTER = [
	"NOT_STARTED",
	"IN_PROGRESS",
	"COMPLETED",
	"ALL",
] as const;

export type CourseAnalyticsStatusFilter =
	(typeof ANALYTICS_STATUS_FILTER)[number];

export type CourseAnalyticsLearnerSource = {
	studentId: string;
	name: string;
	email: string;
	classLabel: string;
	completedLessons: number;
	lastActivity: Date | null;
	firstAccessedAt: Date | null;
};

export type CourseLearnerAnalyticsRow = CourseAnalyticsLearnerSource & {
	totalLessons: number;
	status: StudentCourseStatus;
};

export type CourseAnalyticsMetrics = {
	totalLessons: number;
	totalLearners: number;
	notStartedCount: number;
	inProgressCount: number;
	completedCount: number;
	completionRatePercent: number;
};

export const TIME_COMPLETION_BUCKET_LABELS = [
	"0–1 hari",
	"2–3 hari",
	"4–7 hari",
	"8–14 hari",
	"15+ hari",
] as const;

export type CourseAnalyticsTimeBucket = {
	label: (typeof TIME_COMPLETION_BUCKET_LABELS)[number];
	count: number;
};

export type CourseAnalyticsTimeMetrics = {
	eligibleCount: number;
	medianDays: number | null;
	meanDays: number | null;
	p90Days: number | null;
	buckets: CourseAnalyticsTimeBucket[];
};

export type CourseAnalyticsView = {
	metrics: CourseAnalyticsMetrics;
	learners: CourseLearnerAnalyticsRow[];
	timeToComplete: CourseAnalyticsTimeMetrics;
	generatedAt: string;
};

export function parseAnalyticsStatusFilter(
	raw: string | undefined,
): CourseAnalyticsStatusFilter {
	if (raw && (ANALYTICS_STATUS_FILTER as readonly string[]).includes(raw)) {
		return raw as CourseAnalyticsStatusFilter;
	}
	return "ALL";
}

export function bucketIndexForCompletionDays(days: number): number {
	if (days <= 1) return 0;
	if (days <= 3) return 1;
	if (days <= 7) return 2;
	if (days <= 14) return 3;
	return 4;
}

export function finalizeDurationCalendarDays(
	firstAccessedAt: Date,
	completedAt: Date,
): number {
	return Math.max(0, differenceInCalendarDays(completedAt, firstAccessedAt));
}

function medianDiscrete(sortedDays: number[]): number {
	const n = sortedDays.length;
	if (n === 0) return 0;
	const mid = Math.floor(n / 2);
	if (n % 2 === 1) return sortedDays[mid];
	return (sortedDays[mid - 1] + sortedDays[mid]) / 2;
}

function p90Discrete(sortedDays: number[]): number {
	const n = sortedDays.length;
	if (n === 0) return 0;
	const idx = Math.floor(0.9 * (n - 1));
	return sortedDays[idx];
}

export function computeTimeToCompleteMetrics(
	finalDurationsDays: number[],
): CourseAnalyticsTimeMetrics {
	const buckets: CourseAnalyticsTimeBucket[] =
		TIME_COMPLETION_BUCKET_LABELS.map((label) => ({
			label,
			count: 0,
		}));
	const n = finalDurationsDays.length;
	if (n === 0) {
		return {
			eligibleCount: 0,
			medianDays: null,
			meanDays: null,
			p90Days: null,
			buckets,
		};
	}
	const sorted = [...finalDurationsDays].sort((a, b) => a - b);
	const mean = sorted.reduce((a, b) => a + b, 0) / n;

	for (const d of finalDurationsDays) {
		buckets[bucketIndexForCompletionDays(d)].count += 1;
	}

	const med = medianDiscrete(sorted);
	const p90 = p90Discrete(sorted);

	return {
		eligibleCount: n,
		medianDays: Math.round(med * 10) / 10,
		meanDays: Math.round(mean * 10) / 10,
		p90Days: p90,
		buckets,
	};
}

export function buildCourseAnalyticsView(
	totalLessons: number,
	sources: CourseAnalyticsLearnerSource[],
	options?: { status?: CourseAnalyticsStatusFilter; q?: string },
): CourseAnalyticsView {
	const statusFilter = options?.status ?? "ALL";
	const q = (options?.q ?? "").trim().toLowerCase();
	const generatedAt = new Date().toISOString();

	const fullRows: CourseLearnerAnalyticsRow[] = sources.map((s) => ({
		...s,
		totalLessons,
		status: getStudentCourseStatus(s.completedLessons, totalLessons),
	}));

	const totalLearners = fullRows.length;
	const notStartedCount = fullRows.filter(
		(r) => r.status === "NOT_STARTED",
	).length;
	const inProgressCount = fullRows.filter(
		(r) => r.status === "IN_PROGRESS",
	).length;
	const completedCount = fullRows.filter(
		(r) => r.status === "COMPLETED",
	).length;
	const completionRatePercent =
		totalLearners === 0
			? 0
			: Math.round((completedCount / totalLearners) * 100);

	const finalDurationDays: number[] = [];
	for (const r of fullRows) {
		if (r.status !== "COMPLETED") continue;
		if (!r.firstAccessedAt || !r.lastActivity) continue;
		finalDurationDays.push(
			finalizeDurationCalendarDays(r.firstAccessedAt, r.lastActivity),
		);
	}
	const timeToComplete = computeTimeToCompleteMetrics(finalDurationDays);

	let learners = fullRows;
	if (q.length > 0) {
		learners = learners.filter(
			(r) =>
				r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q),
		);
	}
	if (statusFilter !== "ALL") {
		learners = learners.filter((r) => r.status === statusFilter);
	}

	return {
		metrics: {
			totalLessons,
			totalLearners,
			notStartedCount,
			inProgressCount,
			completedCount,
			completionRatePercent,
		},
		learners,
		timeToComplete,
		generatedAt,
	};
}
