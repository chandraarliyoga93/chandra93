/**
 * Grading utility functions for academic performance tracking.
 */

/**
 * Calculates the average of an array of numeric grades.
 * Ignores null or undefined values.
 * Returns "0.00" if no valid grades are found.
 * @returns Formatted average string with 2 decimal places.
 */
export function calculateAverage(grades: (number | null | undefined)[]): string {
  const validGrades = grades.filter(
    (g): g is number => g !== null && g !== undefined && typeof g === "number"
  );
  
  if (validGrades.length === 0) return "0.00";

  const sum = validGrades.reduce((acc, val) => acc + val, 0);
  const avg = sum / validGrades.length;
  
  return avg.toFixed(2);
}

/**
 * Formats a single grade value to 2 decimal places.
 * Returns "-" if the grade is null or undefined.
 */
export function formatGradeValue(grade: number | null | undefined): string {
  if (grade === null || grade === undefined) return "-";
  return grade.toFixed(2);
}

/**
 * Validates if a numeric grade is within the standard 0-100 range.
 */
export function isValidGradeRange(grade: number): boolean {
  return grade >= 0 && grade <= 100;
}

/**
 * Sanitizes input to ensure it's a valid grade number or null.
 * Handles string inputs from forms/cells.
 */
export function parseGradeInput(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined || input === "") return null;
  
  const parsed = typeof input === "string" ? parseFloat(input) : input;
  
  if (isNaN(parsed)) return null;
  
  return parsed;
}
