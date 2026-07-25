import { Student } from "./student";

export interface BulkExportData {
  students: Student[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  classInfo: {
    id: string;
    name: string;
    term: string;
  };
}

export interface AttendanceRecord {
  date: string;
  records: Record<string, "present" | "absent" | "late" | "excused">;
}

export interface GradeRecord {
  taskId: string;
  taskTitle: string;
  category: string;
  maxPoints: number;
  grades: Record<string, number | null>;
}

export interface ExportSummary {
  studentCount: number;
  attendanceDays: number;
  assignmentCount: number;
}
