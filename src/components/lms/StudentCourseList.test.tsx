import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { getLmsStatusLabelIdn } from "@/lib/lms/flow";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		...rest
	}: {
		children: React.ReactNode;
		href: string;
		"data-testid"?: string;
	}) => React.createElement("a", { href, ...rest }, children),
}));

vi.mock("@/lib/auth-server", () => ({
	getAuthUser: vi.fn(),
}));

vi.mock("@/actions/lms-student-supabase", () => ({
	getStudentCourses: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
	prisma: {
		courseLesson: { count: vi.fn() },
		lessonProgress: { count: vi.fn() },
	},
}));

import { getAuthUser } from "@/lib/auth-server";
import { getStudentCourses } from "@/actions/lms-student-supabase";
import { prisma } from "@/lib/prisma";
import StudentCourseList, {
	STUDENT_GLOBAL_LMS_HREF,
	studentClassTasksLmsHref,
	studentCoursePlayerHref,
	StudentCourseListGrid,
	type StudentCourseListItem,
} from "./StudentCourseList";

function item(
	overrides: Partial<StudentCourseListItem>,
): StudentCourseListItem {
	return {
		id: "c-default",
		title: "Course",
		description: null,
		coverImage: null,
		status: "PUBLISHED",
		teacher: { name: "Guru" },
		completedLessons: 0,
		totalLessons: 0,
		studentStatus: "NOT_STARTED",
		...overrides,
	};
}

describe("StudentCourseList routing (dual entry)", () => {
	it("exposes global LMS shortcut href matching nav entry", () => {
		expect(STUDENT_GLOBAL_LMS_HREF).toBe("/dashboard/siswa?view=lms");
	});

	it("builds class-context tasks URL with Materi tab", () => {
		expect(studentClassTasksLmsHref("class-xyz")).toBe(
			"/dashboard/siswa/classes/class-xyz/tasks?view=lms",
		);
	});

	it("builds course player links used by list CTAs", () => {
		expect(studentCoursePlayerHref("course-99")).toBe(
			"/dashboard/siswa/lms/course-99",
		);
	});
});

describe("StudentCourseListGrid", () => {
	it("renders LMS status badges for NOT_STARTED, IN_PROGRESS, and COMPLETED", () => {
		const statuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;
		const items: StudentCourseListItem[] = statuses.map((studentStatus, i) =>
			item({
				id: `c-${i}`,
				title: `Kursus ${i}`,
				studentStatus,
				completedLessons:
					studentStatus === "NOT_STARTED"
						? 0
						: studentStatus === "IN_PROGRESS"
							? 1
							: 3,
				totalLessons: 3,
			}),
		);

		const html = renderToStaticMarkup(<StudentCourseListGrid items={items} />);

		for (const s of statuses) {
			expect(html).toContain(`data-testid="lms-student-status-${s}"`);
			expect(html).toContain(getLmsStatusLabelIdn(s));
		}
	});

	it("links each card to the siswa course player route", () => {
		const items: StudentCourseListItem[] = [
			item({
				id: "alpha",
				title: "Alpha",
				totalLessons: 1,
				completedLessons: 0,
				studentStatus: "NOT_STARTED",
			}),
		];
		const html = renderToStaticMarkup(<StudentCourseListGrid items={items} />);
		expect(html).toContain('href="/dashboard/siswa/lms/alpha"');
		expect(html).toContain('data-testid="lms-open-course-alpha"');
	});
});

describe("StudentCourseList (server)", () => {
	beforeEach(() => {
		vi.mocked(getAuthUser).mockReset();
		vi.mocked(getStudentCourses).mockReset();
		vi.mocked(prisma.courseLesson.count).mockReset();
		vi.mocked(prisma.lessonProgress.count).mockReset();
	});

	it("class variant: shows COMPLETED when all lessons done", async () => {
		vi.mocked(getAuthUser).mockResolvedValue({
			uid: "student-1",
			role: "Siswa",
		} as Awaited<ReturnType<typeof getAuthUser>>);

		vi.mocked(getStudentCourses).mockResolvedValue({
			success: true,
			data: [
				{
					id: "course-done",
					title: "Done",
					description: null,
					coverImage: null,
					status: "PUBLISHED",
					teacher: { name: "G" },
				},
			],
		});

		vi.mocked(prisma.courseLesson.count).mockResolvedValue(3);
		vi.mocked(prisma.lessonProgress.count).mockResolvedValue(3);

		const node = await StudentCourseList({ variant: "class", classId: "k-1" });
		const html = renderToStaticMarkup(node as React.ReactElement);

		expect(html).toContain("lms-student-status-COMPLETED");
		expect(html).toContain('href="/dashboard/siswa/lms/course-done"');
	});

	it("global variant: dedupes courses across classes", async () => {
		vi.mocked(getAuthUser).mockResolvedValue({
			uid: "student-1",
			role: "Siswa",
		} as Awaited<ReturnType<typeof getAuthUser>>);

		const shared = {
			id: "shared",
			title: "Shared",
			description: null,
			coverImage: null,
			status: "PUBLISHED",
			teacher: { name: "G" },
		};

		vi.mocked(getStudentCourses)
			.mockResolvedValueOnce({ success: true, data: [shared] })
			.mockResolvedValueOnce({ success: true, data: [shared] });

		vi.mocked(prisma.courseLesson.count).mockResolvedValue(1);
		vi.mocked(prisma.lessonProgress.count).mockResolvedValue(0);

		const node = await StudentCourseList({
			variant: "global",
			enrolledClassIds: ["a", "b"],
		});
		const html = renderToStaticMarkup(node as React.ReactElement);

		const matches = html.match(/lms-open-course-shared/g);
		expect(matches?.length).toBe(1);
	});
});
