import { describe, expect, it } from "vitest";
import {
  getCoursePipelineState,
  getLmsStatusLabelIdn,
  getStudentCourseStatus,
} from "@/lib/lms/flow";

describe("getStudentCourseStatus", () => {
  it("returns NOT_STARTED when totalLessons is 0", () => {
    expect(getStudentCourseStatus(0, 0)).toBe("NOT_STARTED");
    expect(getStudentCourseStatus(5, 0)).toBe("NOT_STARTED");
  });

  it("returns NOT_STARTED when no lessons completed but course has lessons", () => {
    expect(getStudentCourseStatus(0, 3)).toBe("NOT_STARTED");
  });

  it("returns IN_PROGRESS when some but not all lessons are completed", () => {
    expect(getStudentCourseStatus(1, 3)).toBe("IN_PROGRESS");
    expect(getStudentCourseStatus(2, 3)).toBe("IN_PROGRESS");
  });

  it("returns COMPLETED when all lessons are completed", () => {
    expect(getStudentCourseStatus(3, 3)).toBe("COMPLETED");
  });
});

describe("getCoursePipelineState", () => {
  it("returns DRAFT when modules or lessons are missing", () => {
    expect(
      getCoursePipelineState({
        hasModules: false,
        hasLessons: true,
        hasAssignments: true,
        status: "DRAFT",
      }),
    ).toBe("DRAFT");
    expect(
      getCoursePipelineState({
        hasModules: true,
        hasLessons: false,
        hasAssignments: true,
        status: "DRAFT",
      }),
    ).toBe("DRAFT");
  });

  it("returns READY_TO_ASSIGN when structure exists but assignments are missing", () => {
    expect(
      getCoursePipelineState({
        hasModules: true,
        hasLessons: true,
        hasAssignments: false,
        status: "DRAFT",
      }),
    ).toBe("READY_TO_ASSIGN");
  });

  it("returns ASSIGNED when assignments exist and course is not published", () => {
    expect(
      getCoursePipelineState({
        hasModules: true,
        hasLessons: true,
        hasAssignments: true,
        status: "DRAFT",
      }),
    ).toBe("ASSIGNED");
  });

  it("returns PUBLISHED when status is published", () => {
    expect(
      getCoursePipelineState({
        hasModules: true,
        hasLessons: true,
        hasAssignments: true,
        status: "PUBLISHED",
      }),
    ).toBe("PUBLISHED");
    expect(
      getCoursePipelineState({
        hasModules: false,
        hasLessons: false,
        hasAssignments: false,
        status: "PUBLISHED",
      }),
    ).toBe("PUBLISHED");
  });
});

describe("getLmsStatusLabelIdn", () => {
  it("returns consistent LMS flow labels for known statuses", () => {
    expect(getLmsStatusLabelIdn("NOT_STARTED")).toBe("Belum Mulai");
    expect(getLmsStatusLabelIdn("PUBLISHED")).toBe("Published");
  });
});
