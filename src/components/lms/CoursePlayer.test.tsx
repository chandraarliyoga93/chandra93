import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { Course, Lesson } from "./CoursePlayer";
import {
  LessonSidebarRow,
  applyLessonCompletion,
  getNextLessonId,
  upsertLessonCompleted,
  parseProgressCompletedAt,
} from "./CoursePlayer";

function lesson(overrides: Partial<Lesson>): Lesson {
  return {
    id: "l1",
    title: "Materi A",
    content: "<p>x</p>",
    attachments: null,
    order: 1,
    moduleId: "m1",
    type: "TEXT",
    quizData: null,
    ...overrides,
  };
}

function sampleCourse(): Course {
  return {
    id: "c1",
    title: "Kursus Uji",
    description: null,
    modules: [
      {
        id: "m1",
        title: "Modul 1",
        order: 1,
        lessons: [
          lesson({ id: "l1", title: "A", order: 1 }),
          lesson({ id: "l2", title: "B", order: 2 }),
          lesson({ id: "l3", title: "C", order: 3 }),
        ],
      },
    ],
  };
}

describe("CoursePlayer self-paced helpers", () => {
  it("getNextLessonId returns the next lesson in module order", () => {
    const course = sampleCourse();
    expect(getNextLessonId(course, "l1")).toBe("l2");
    expect(getNextLessonId(course, "l2")).toBe("l3");
    expect(getNextLessonId(course, "l3")).toBeNull();
  });

  it("upsertLessonCompleted is idempotent-friendly (always completed + latest timestamp)", () => {
    const t1 = new Date("2026-04-01T00:00:00.000Z");
    const t2 = new Date("2026-04-08T12:00:00.000Z");
    const once = upsertLessonCompleted([], "l1", t1);
    expect(once).toEqual([{ lessonId: "l1", isCompleted: true, completedAt: t1 }]);
    const twice = upsertLessonCompleted(once, "l1", t2);
    expect(twice).toEqual([{ lessonId: "l1", isCompleted: true, completedAt: t2 }]);
  });

  it("parseProgressCompletedAt accepts Date, ISO string, and falls back safely", () => {
    const d = new Date("2026-04-08T10:00:00.000Z");
    expect(parseProgressCompletedAt(d).toISOString()).toBe(d.toISOString());
    expect(parseProgressCompletedAt(d.toISOString()).toISOString()).toBe(d.toISOString());
    const parsed = parseProgressCompletedAt(undefined);
    expect(parsed).toBeInstanceOf(Date);
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });
});

describe("LessonSidebarRow (sidebar progress + self-paced)", () => {
  it("renders a non-disabled button so any lesson can be selected (no lock)", () => {
    const html = renderToStaticMarkup(
      <LessonSidebarRow
        lesson={lesson({ id: "l2", title: "Kedua" })}
        activeLessonId="l1"
        isComplete={false}
        onSelect={vi.fn()}
      />,
    );
    expect(html).toContain('data-testid="course-player-lesson-row-l2"');
    expect(html).toContain('type="button"');
    expect(html).not.toContain("disabled");
    expect(html).toContain('data-lesson-complete="false"');
  });

  it("exposes completion state for sidebar indicators when done", () => {
    const html = renderToStaticMarkup(
      <LessonSidebarRow
        lesson={lesson({ id: "l1" })}
        activeLessonId="l1"
        isComplete
        onSelect={vi.fn()}
      />,
    );
    expect(html).toContain('data-lesson-complete="true"');
    expect(html).toContain("Selesai");
  });
});

describe("Selesai & Lanjut default navigation contract", () => {
  it("after completing a lesson, resolves next lesson id for default navigation", () => {
    const course = sampleCourse();
    const currentId = "l1";
    const completedAt = new Date("2026-04-08T12:00:00.000Z");
    const transition = applyLessonCompletion(course, [], currentId, completedAt);
    expect(transition.nextLessonId).toBe("l2");
    expect(transition.nextProgress[0]?.isCompleted).toBe(true);
  });

  it("updates sidebar completion state after marking a lesson complete", () => {
    const course = sampleCourse();
    const completedAt = new Date("2026-04-08T12:00:00.000Z");
    const transition = applyLessonCompletion(course, [], "l1", completedAt);

    const statusByLessonId = new Map(
      transition.nextProgress.map((item) => [item.lessonId, item.isCompleted]),
    );

    expect(statusByLessonId.get("l1")).toBe(true);
    expect(statusByLessonId.get("l2") ?? false).toBe(false);
  });
});
