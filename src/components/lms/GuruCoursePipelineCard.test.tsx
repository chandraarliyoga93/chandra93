import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { CoursePipelineState } from "@/lib/lms/flow";
import { getLmsStatusLabelIdn } from "@/lib/lms/flow";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href }, children),
}));

import {
  GuruCoursePipelineCard,
  GuruLmsCoursesGrid,
} from "./GuruCoursePipelineCard";

const baseCourse = {
  id: "course-1",
  title: "Matematika X",
  description: "Deskripsi",
  coverImage: null as string | null,
};

function renderCard(pipelineState: CoursePipelineState) {
  return renderToStaticMarkup(
    <GuruCoursePipelineCard
      course={baseCourse}
      pipelineState={pipelineState}
    />,
  );
}

describe("GuruCoursePipelineCard", () => {
  it("shows pipeline badge label for Draft, Assigned, and Published states", () => {
    const states: CoursePipelineState[] = [
      "DRAFT",
      "READY_TO_ASSIGN",
      "ASSIGNED",
      "PUBLISHED",
    ];
    for (const state of states) {
      const html = renderCard(state);
      expect(html).toContain(getLmsStatusLabelIdn(state));
    }
  });

  it("shows contextual quick action copy and target href per pipeline state", () => {
    expect(renderCard("DRAFT")).toContain("Lengkapi Materi");
    expect(renderCard("DRAFT")).toContain('href="/dashboard/guru/lms/course-1"');

    expect(renderCard("READY_TO_ASSIGN")).toContain("Atur Kelas");
    expect(renderCard("READY_TO_ASSIGN")).toContain(
      'href="/dashboard/guru/lms/course-1/settings"',
    );

    expect(renderCard("ASSIGNED")).toContain("Atur Kelas");
    expect(renderCard("ASSIGNED")).toContain(
      'href="/dashboard/guru/lms/course-1/settings"',
    );

    expect(renderCard("PUBLISHED")).toContain("Buka Editor");
    expect(renderCard("PUBLISHED")).toContain(
      'href="/dashboard/guru/lms/course-1"',
    );
  });
});

describe("Guru LMS index composition", () => {
  it("shows empty state when there are no courses", () => {
    const html = renderToStaticMarkup(<GuruLmsCoursesGrid courses={[]} />);
    expect(html).toContain("Belum ada kursus");
    expect(html).toContain('data-testid="guru-lms-empty-courses"');
  });

  it("renders pipeline cards when course list is non-empty", () => {
    const courses = [
      { ...baseCourse, id: "a", title: "Kursus A" },
      { ...baseCourse, id: "b", title: "Kursus B" },
    ];
    const html = renderToStaticMarkup(
      <GuruLmsCoursesGrid
        courses={courses.map((c) => ({
          ...c,
          pipelineState: "READY_TO_ASSIGN" as const,
        }))}
      />,
    );
    expect(html).toContain("Kursus A");
    expect(html).toContain("Kursus B");
    expect(html).not.toContain('data-testid="guru-lms-empty-courses"');
  });
});
