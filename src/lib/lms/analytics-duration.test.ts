import { describe, expect, it } from "vitest";
import {
	bucketIndexForCompletionDays,
	computeTimeToCompleteMetrics,
	finalizeDurationCalendarDays,
} from "@/lib/lms/analytics";

describe("bucketIndexForCompletionDays", () => {
	it("assigns coarse buckets aligned with guru analytics UX", () => {
		expect(bucketIndexForCompletionDays(0)).toBe(0);
		expect(bucketIndexForCompletionDays(1)).toBe(0);
		expect(bucketIndexForCompletionDays(2)).toBe(1);
		expect(bucketIndexForCompletionDays(7)).toBe(2);
		expect(bucketIndexForCompletionDays(14)).toBe(3);
		expect(bucketIndexForCompletionDays(15)).toBe(4);
	});
});

describe("finalizeDurationCalendarDays", () => {
	it("floors differences by calendar days and never returns negative durations", () => {
		const a = new Date("2026-01-01T10:00:00.000Z");
		const b = new Date("2026-01-03T09:00:00.000Z");
		expect(finalizeDurationCalendarDays(a, b)).toBeGreaterThanOrEqual(0);
	});
});

describe("computeTimeToCompleteMetrics", () => {
	it("returns null summary stats when there is nothing to summarize", () => {
		const m = computeTimeToCompleteMetrics([]);
		expect(m.eligibleCount).toBe(0);
		expect(m.medianDays).toBeNull();
		expect(m.meanDays).toBeNull();
		expect(m.p90Days).toBeNull();
		expect(m.buckets.every((b) => b.count === 0)).toBe(true);
	});

	it("counts histogram buckets consistently with durations", () => {
		const m = computeTimeToCompleteMetrics([0, 10, 10, 100]);
		expect(m.eligibleCount).toBe(4);
		expect(m.buckets.reduce((acc, b) => acc + b.count, 0)).toBe(4);
		expect(m.p90Days).toBeGreaterThanOrEqual(10);
	});
});
