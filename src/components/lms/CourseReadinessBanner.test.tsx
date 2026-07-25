import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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
  CoursePublishSettingsCta,
  CourseReadinessBanner,
  getPublishSettingsDisabledReason,
} from "./CourseReadinessBanner";

describe("CourseReadinessBanner", () => {
  it("shows readiness guidance when there are no modules or lessons", () => {
    const html = renderToStaticMarkup(
      <CourseReadinessBanner moduleCount={0} lessonCount={0} courseStatus="DRAFT" />,
    );
    expect(html).toContain('data-testid="course-readiness-banner"');
    expect(html).toContain("Lengkapi struktur kursus");
    expect(html).toContain("Modul (0)");
    expect(html).toContain("Materi (0)");
    expect(html).toContain("Buat modul pertama");
  });

  it("shows lesson gap guidance when modules exist but there are no lessons", () => {
    const html = renderToStaticMarkup(
      <CourseReadinessBanner moduleCount={2} lessonCount={0} courseStatus="DRAFT" />,
    );
    expect(html).toContain("Modul (2)");
    expect(html).toContain("Materi (0)");
    expect(html).toContain("Tambah materi");
  });
});

describe("getPublishSettingsDisabledReason", () => {
  it("returns module-first reason when there are no modules", () => {
    expect(getPublishSettingsDisabledReason(0, 0)).toContain("modul");
  });

  it("returns lesson reason when modules exist but lessons do not", () => {
    expect(getPublishSettingsDisabledReason(1, 0)).toContain("materi");
  });

  it("returns null when structure is ready", () => {
    expect(getPublishSettingsDisabledReason(1, 3)).toBeNull();
  });
});

describe("CoursePublishSettingsCta", () => {
  it("disables publish path with title and accessible description matching readiness rule", () => {
    const reason = getPublishSettingsDisabledReason(0, 0);
    expect(reason).not.toBeNull();

    const html = renderToStaticMarkup(
      <CoursePublishSettingsCta
        courseId="c1"
        moduleCount={0}
        lessonCount={0}
        courseStatus="DRAFT"
      />,
    );

    expect(html).toContain('data-testid="course-publish-settings-cta"');
    expect(html).toContain("disabled");
    expect(html).toContain(`title="${reason}"`);
    expect(html).toContain("course-publish-settings-disabled-reason");
    expect(html).toContain(reason as string);
  });

  it("renders enabled link to settings when draft course is structurally ready", () => {
    const html = renderToStaticMarkup(
      <CoursePublishSettingsCta
        courseId="course-xyz"
        moduleCount={1}
        lessonCount={1}
        courseStatus="DRAFT"
      />,
    );
    expect(html).toContain('href="/dashboard/guru/lms/course-xyz/settings"');
    expect(html).not.toContain("disabled");
  });

  it("keeps settings link enabled when course is already published", () => {
    const html = renderToStaticMarkup(
      <CoursePublishSettingsCta
        courseId="pub-1"
        moduleCount={0}
        lessonCount={0}
        courseStatus="PUBLISHED"
      />,
    );
    expect(html).toContain('href="/dashboard/guru/lms/pub-1/settings"');
    expect(html).not.toContain("disabled");
  });
});
