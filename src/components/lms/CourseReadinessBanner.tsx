"use client";

import Link from "next/link";
import { InfoCircle, CheckCircle, WarningTriangle } from "iconoir-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type CourseLifecycleStatus,
} from "@/lib/lms/flow";

export function isCourseStructurallyReadyForPublish(
  moduleCount: number,
  lessonCount: number,
): boolean {
  return moduleCount > 0 && lessonCount > 0;
}

/** Alasan tombol menuju pengaturan/publikasi dinonaktifkan; null jika boleh dibuka. */
export function getPublishSettingsDisabledReason(
  moduleCount: number,
  lessonCount: number,
): string | null {
  if (moduleCount <= 0) {
    return "Tambahkan minimal satu modul di panel Kurikulum sebelum mempublikasikan.";
  }
  if (lessonCount <= 0) {
    return "Tambahkan minimal satu materi di salah satu modul sebelum mempublikasikan.";
  }
  return null;
}

export type CourseReadinessBannerProps = {
  moduleCount: number;
  lessonCount: number;
  courseStatus: CourseLifecycleStatus;
  className?: string;
};

function ReadinessRow({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-600" aria-hidden />
      ) : (
        <WarningTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
      )}
      <div>
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground"> — {detail}</span>
      </div>
    </div>
  );
}

export function CourseReadinessBanner({
  moduleCount,
  lessonCount,
  courseStatus,
  className,
}: CourseReadinessBannerProps) {
  const hasModules = moduleCount > 0;
  const hasLessons = lessonCount > 0;
  const ready = isCourseStructurallyReadyForPublish(moduleCount, lessonCount);

  const isPublished = courseStatus === "PUBLISHED";

  return (
    <div
      data-testid="course-readiness-banner"
      className={cn("space-y-3", className)}
    >
      <Alert
        variant={!ready && !isPublished ? "destructive" : "default"}
        className={cn(isPublished && "border-green-600/30 bg-green-50/50 dark:bg-green-950/20")}
      >
        {isPublished ? (
          <CheckCircle className="text-green-600" aria-hidden />
        ) : ready ? (
          <InfoCircle className="text-primary" aria-hidden />
        ) : (
          <WarningTriangle aria-hidden />
        )}
        <AlertTitle>
          {isPublished
            ? "Published"
            : ready
              ? "Struktur siap — lanjut assign & Published"
              : "Lengkapi struktur kursus (Draft)"}
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <div className="grid gap-2">
            <ReadinessRow
              ok={hasModules}
              label={`Modul (${moduleCount})`}
              detail={
                hasModules
                  ? "Modul sudah ada; lanjut pastikan setiap modul berisi materi."
                  : "Buat modul pertama lewat tombol + di header panel Kurikulum."
              }
            />
            <ReadinessRow
              ok={hasLessons}
              label={`Materi (${lessonCount})`}
              detail={
                hasLessons
                  ? "Minimal satu materi ada; Anda bisa mengisi konten lalu ke Pengaturan."
                  : "Tambah materi lewat + pada modul, atau buka modul lalu tambah materi baru."
              }
            />
          </div>
          {!isPublished && (
            <p className="text-sm text-foreground pt-1">
              {ready ? (
                <>
                  Berikutnya: buka{" "}
                  <span className="font-medium">Pengaturan Kursus</span> untuk{" "}
                  <span className="font-medium">Siap Di-assign</span> /{" "}
                  <span className="font-medium">Sudah Di-assign</span>, lalu set status{" "}
                  <span className="font-medium">Published</span> bila siap dibuka siswa.
                </>
              ) : (
                <>
                  Selesaikan langkah di atas dulu. Tombol{" "}
                  <span className="font-medium">Kelola &amp; Publikasi</span> di header aktif
                  otomatis setelah ada modul dan materi (tahap Draft → struktur lengkap).
                </>
              )}
            </p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

export type CoursePublishSettingsCtaProps = {
  courseId: string;
  moduleCount: number;
  lessonCount: number;
  courseStatus: CourseLifecycleStatus;
  className?: string;
};

/** Tombol menuju halaman pengaturan (status publikasi & penetapan kelas), dinonaktifkan jika struktur belum siap. */
export function CoursePublishSettingsCta({
  courseId,
  moduleCount,
  lessonCount,
  courseStatus,
  className,
}: CoursePublishSettingsCtaProps) {
  const reason = getPublishSettingsDisabledReason(moduleCount, lessonCount);
  const disabled = courseStatus === "DRAFT" && reason !== null;
  const href = `/dashboard/guru/lms/${courseId}/settings`;

  if (disabled && reason) {
    return (
      <>
        <span id="course-publish-settings-disabled-reason" className="sr-only">
          {reason}
        </span>
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled
          title={reason}
          aria-describedby="course-publish-settings-disabled-reason"
          className={className}
          data-testid="course-publish-settings-cta"
        >
          Kelola &amp; Publikasi
        </Button>
      </>
    );
  }

  return (
    <Button asChild variant="default" size="sm" className={className} data-testid="course-publish-settings-cta">
      <Link href={href}>Kelola &amp; Publikasi</Link>
    </Button>
  );
}
