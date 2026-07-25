import type { Prisma } from "@prisma/client";

/** Nilai hadiah XP/badge per kursus (kolom `Course.rewards`). */
export type CourseRewardsValues = {
	lessonXp: number;
	quizMaxXp: number;
	completionXp: number;
	badgeId: string | null;
};

export function parseCourseRewardsFromJson(raw: unknown): CourseRewardsValues {
	const r =
		raw && typeof raw === "object" && !Array.isArray(raw)
			? (raw as Record<string, unknown>)
			: {};
	return {
		lessonXp:
			typeof r.lessonXp === "number" && Number.isFinite(r.lessonXp)
				? r.lessonXp
				: 0,
		quizMaxXp:
			typeof r.quizMaxXp === "number" && Number.isFinite(r.quizMaxXp)
				? r.quizMaxXp
				: 0,
		completionXp:
			typeof r.completionXp === "number" && Number.isFinite(r.completionXp)
				? r.completionXp
				: 0,
		badgeId:
			typeof r.badgeId === "string" && r.badgeId.length > 0 ? r.badgeId : null,
	};
}

export function courseRewardsToPrismaJson(
	values: CourseRewardsValues,
): Prisma.InputJsonValue {
	const o: Record<string, unknown> = {
		lessonXp: Math.max(0, Math.floor(values.lessonXp)),
		quizMaxXp: Math.max(0, Math.floor(values.quizMaxXp)),
		completionXp: Math.max(0, Math.floor(values.completionXp)),
	};
	if (values.badgeId && values.badgeId.length > 0) {
		o.badgeId = values.badgeId;
	}
	return o as Prisma.InputJsonValue;
}
