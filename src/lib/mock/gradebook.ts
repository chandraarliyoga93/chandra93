import { Assignment, GradebookRow, GradeCategory, Grade } from "@/types/gradebook";

/**
 * Mock data generator for the gradebook system.
 */

const CATEGORIES: GradeCategory[] = ["Homework", "Quiz", "Exam", "Project", "Other"];

/**
 * Generates a set of mock assignments for a specific class.
 */
export function generateMockAssignments(classId: string): Assignment[] {
  const assignments: Assignment[] = [];
  // Generate 6 assignments for varied coverage
  const assignmentConfig = [
    { title: "Introduction Quiz", category: "Quiz" as GradeCategory },
    { title: "Midterm Exam", category: "Exam" as GradeCategory },
    { title: "Final Project", category: "Project" as GradeCategory },
    { title: "Homework #1", category: "Homework" as GradeCategory },
    { title: "Homework #2", category: "Homework" as GradeCategory },
    { title: "Class Participation", category: "Other" as GradeCategory },
  ];

  assignmentConfig.forEach((cfg, i) => {
    assignments.push({
      id: `asgn-${classId}-${i + 1}`,
      title: cfg.title,
      category: cfg.category,
      maxPoints: 100,
      date: new Date(Date.now() - (5 - i) * 86400000 * 7).toISOString(), // Spread over weeks
      classId,
    });
  });

  return assignments;
}

/**
 * Generates realistic mock gradebook rows for a list of students and assignments.
 */
export function generateMockGradebookRows(
  students: { id: string; name: string }[],
  assignments: Assignment[]
): GradebookRow[] {
  return students.map((student) => {
    const row: GradebookRow = {
      studentId: student.id,
      studentName: student.name,
    };

    assignments.forEach((assignment) => {
      // Randomly assign grades with some "missing" entries
      const roll = Math.random();
      let grade: Grade;

      if (roll > 0.95) {
        // 5% missing
        grade = { value: null, remarks: "Not submitted" };
      } else if (roll > 0.8) {
        // 15% high performers
        grade = { value: Math.floor(Math.random() * 10) + 91, remarks: "Excellent work!" };
      } else if (roll > 0.3) {
        // 50% average
        grade = { value: Math.floor(Math.random() * 20) + 71 };
      } else {
        // 30% needs improvement
        grade = { value: Math.floor(Math.random() * 15) + 56, remarks: "Needs more practice" };
      }

      row[assignment.id] = grade;
    });

    return row;
  });
}
