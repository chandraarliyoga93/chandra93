export type GradeCategory = "Homework" | "Quiz" | "Exam" | "Project" | "Other";

/**
 * Represents an academic assignment or task.
 */
export interface Assignment {
  id: string;
  title: string;
  category: GradeCategory;
  maxPoints: number;
  date: string; // ISO string
  classId: string;
}

/**
 * Represents an individual grade entry for a student and assignment.
 */
export interface Grade {
  value: number | null;
  remarks?: string;
}

/**
 * A composite structure representing a row in the gradebook table.
 * Includes student information and dynamic assignment grades.
 */
export interface GradebookRow {
  studentId: string;
  studentName: string;
  /**
   * Dynamic keys represent assignment IDs.
   * e.g., "assignment-123": { value: 85, remarks: "Good job" }
   */
  [assignmentId: string]: string | number | Grade | undefined;
}
