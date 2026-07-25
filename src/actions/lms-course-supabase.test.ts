import { describe, expect, it } from "vitest";
import {
	buildCourseAnalyticsView,
	type CourseAnalyticsLearnerSource,
} from "@/lib/lms/analytics";

function learner(
	overrides: Partial<CourseAnalyticsLearnerSource> &
		Pick<CourseAnalyticsLearnerSource, "studentId" | "name">,
): CourseAnalyticsLearnerSource {
	return {
		email: "x@example.com",
		classLabel: "7A (A1)",
		completedLessons: 0,
		lastActivity: null,
		firstAccessedAt: null,
		...overrides,
	};
}

describe("buildCourseAnalyticsView", () => {
	it("counts NOT_STARTED, IN_PROGRESS, COMPLETED and completion rate across all learners", () => {
		const sources: CourseAnalyticsLearnerSource[] = [
			learner({ studentId: "a", name: "Ada", completedLessons: 0 }),
			learner({ studentId: "b", name: "Ben", completedLessons: 2 }),
			learner({ studentId: "c", name: "Cia", completedLessons: 4 }),
		];
		const { metrics, learners } = buildCourseAnalyticsView(4, sources);

		expect(metrics.totalLessons).toBe(4);
		expect(metrics.totalLearners).toBe(3);
		expect(metrics.notStartedCount).toBe(1);
		expect(metrics.inProgressCount).toBe(1);
		expect(metrics.completedCount).toBe(1);
		expect(metrics.completionRatePercent).toBe(33);
		expect(learners).toHaveLength(3);
	});

	it("treats zero lessons as safe: all NOT_STARTED, zero completion rate, no divide-by-zero", () => {
		const sources: CourseAnalyticsLearnerSource[] = [
			learner({ studentId: "a", name: "Ada", completedLessons: 0 }),
			learner({ studentId: "b", name: "Ben", completedLessons: 99 }),
		];
		const { metrics, learners } = buildCourseAnalyticsView(0, sources);

		expect(metrics.totalLessons).toBe(0);
		expect(metrics.totalLearners).toBe(2);
		expect(metrics.notStartedCount).toBe(2);
		expect(metrics.inProgressCount).toBe(0);
		expect(metrics.completedCount).toBe(0);
		expect(metrics.completionRatePercent).toBe(0);
		expect(learners.every((r) => r.status === "NOT_STARTED")).toBe(true);
	});

	it("keeps aggregate metrics on full cohort while status filter only narrows the table rows", () => {
		const sources: CourseAnalyticsLearnerSource[] = [
			learner({ studentId: "a", name: "Ada", completedLessons: 0 }),
			learner({ studentId: "b", name: "Ben", completedLessons: 2 }),
			learner({ studentId: "c", name: "Cia", completedLessons: 5 }),
		];
		const { metrics, learners } = buildCourseAnalyticsView(5, sources, {
			status: "COMPLETED",
		});

		expect(metrics.notStartedCount).toBe(1);
		expect(metrics.inProgressCount).toBe(1);
		expect(metrics.completedCount).toBe(1);
		expect(metrics.completionRatePercent).toBe(33);
		expect(learners).toHaveLength(1);
		expect(learners[0]?.studentId).toBe("c");
	});

	it("filters learners by search query without changing aggregate metrics", () => {
		const sources: CourseAnalyticsLearnerSource[] = [
			learner({
				studentId: "a",
				name: "Budi Santoso",
				email: "budi@school.id",
				completedLessons: 0,
			}),
			learner({
				studentId: "b",
				name: "Ani Wijaya",
				email: "ani@school.id",
				completedLessons: 3,
			}),
		];
		const { metrics, learners } = buildCourseAnalyticsView(3, sources, {
			q: "ani",
		});

		expect(metrics.totalLearners).toBe(2);
		expect(metrics.notStartedCount).toBe(1);
		expect(metrics.completedCount).toBe(1);
		expect(metrics.completionRatePercent).toBe(50);
		expect(learners).toHaveLength(1);
		expect(learners[0]?.name).toBe("Ani Wijaya");
	});

	it("matches email case-insensitively for search", () => {
		const sources: CourseAnalyticsLearnerSource[] = [
			learner({
				studentId: "a",
				name: "Budi",
				email: "BUDI@School.ID",
				completedLessons: 0,
			}),
			learner({
				studentId: "b",
				name: "Ani",
				email: "ani@other.id",
				completedLessons: 0,
			}),
		];
		const { learners } = buildCourseAnalyticsView(2, sources, {
			q: "school",
		});
		expect(learners).toHaveLength(1);
		expect(learners[0]?.studentId).toBe("a");
	});
});
