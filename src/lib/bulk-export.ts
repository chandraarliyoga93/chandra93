import { BulkExportData, ExportSummary } from "@/types/bulk-export";

/**
 * Generate summary statistics for bulk export
 */
export function generateExportSummary(data: BulkExportData): ExportSummary {
  return {
    studentCount: data.students.length,
    attendanceDays: data.attendance.length,
    assignmentCount: data.grades.length,
  };
}
