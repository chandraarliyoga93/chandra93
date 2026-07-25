/** Progress siswa terhadap isi course (agregat lesson). */
export type StudentCourseStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

/** Tahapan operasional course di sisi guru (orchestration). */
export type CoursePipelineState =
  | "DRAFT"
  | "READY_TO_ASSIGN"
  | "ASSIGNED"
  | "PUBLISHED";

/** Nilai `status` course dari persistence. */
export type CourseLifecycleStatus = "DRAFT" | "PUBLISHED";

export function getStudentCourseStatus(
  completedLessons: number,
  totalLessons: number,
): StudentCourseStatus {
  if (totalLessons <= 0) {
    return "NOT_STARTED";
  }
  if (completedLessons <= 0) {
    return "NOT_STARTED";
  }
  if (completedLessons >= totalLessons) {
    return "COMPLETED";
  }
  return "IN_PROGRESS";
}

export type CoursePipelineInput = {
  hasModules: boolean;
  hasLessons: boolean;
  hasAssignments: boolean;
  status: CourseLifecycleStatus;
};

export function getCoursePipelineState(
  input: CoursePipelineInput,
): CoursePipelineState {
  if (input.status === "PUBLISHED") {
    return "PUBLISHED";
  }
  // Keep structural readiness explicit before assignment-level state.
  if (!input.hasModules || !input.hasLessons) {
    return "DRAFT";
  }
  if (input.hasAssignments) {
    return "ASSIGNED";
  }
  return "READY_TO_ASSIGN";
}

/** Teks badge/status konsisten alur LMS (campuran istilah operasional yang dipakai di UI). */
const LMS_STATUS_LABELS_ID: Record<
  StudentCourseStatus | CoursePipelineState,
  string
> = {
  NOT_STARTED: "Belum Mulai",
  IN_PROGRESS: "Sedang Belajar",
  COMPLETED: "Selesai",
  DRAFT: "Draft",
  READY_TO_ASSIGN: "Siap Di-assign",
  ASSIGNED: "Sudah Di-assign",
  PUBLISHED: "Published",
};

/** Label UI status LMS (konsisten di badge, filter, analitik). */
export function getLmsStatusLabelIdn(
  status: StudentCourseStatus | CoursePipelineState,
): string {
  return LMS_STATUS_LABELS_ID[status];
}
