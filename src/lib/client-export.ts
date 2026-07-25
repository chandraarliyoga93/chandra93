import { BulkExportData } from "@/types/bulk-export";

/**
 * Export bulk data to Excel format with multiple sheets
 * This function MUST only be called on the client side
 */
export async function exportBulkDataToExcel(data: BulkExportData): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;
  const { saveAs } = await import("file-saver");
  const { format } = await import("date-fns");

  const workbook = new ExcelJS.Workbook();
  const { classInfo } = data;
  const safeClassName = classInfo.name.replace(/[^a-zA-Z0-9]/g, "_");
  
  // Sheet 1: Students
  const studentsSheet = workbook.addWorksheet("Students");
  studentsSheet.properties.tabColor = { argb: "4472C4" };
  
  studentsSheet.addRow(["DAFTAR SISWA", classInfo.name, "", "", ""]);
  studentsSheet.addRow(["Term:", classInfo.term, "", "", ""]);
  studentsSheet.addRow(["Tanggal Export:", format(new Date(), "dd/MM/yyyy"), "", "", ""]);
  studentsSheet.addRow([]);
  
  const studentHeaders = ["ID Siswa", "Nama", "Email", "Status Kehadiran", "Rata-rata Nilai"];
  const studentHeaderRow = studentsSheet.addRow(studentHeaders);
  studentHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  studentHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4472C4" },
  };
  studentHeaderRow.alignment = { horizontal: "center" };
  
  data.students.forEach((student) => {
    studentsSheet.addRow([
      student.studentId,
      student.name,
      student.email,
      student.attendanceSummary,
      student.lastGradeSnapshot,
    ]);
  });
  
  // Set column widths for students sheet
  studentsSheet.getColumn(1).width = 15;
  studentsSheet.getColumn(2).width = 35;
  studentsSheet.getColumn(3).width = 35;
  studentsSheet.getColumn(4).width = 18;
  studentsSheet.getColumn(5).width = 15;

  // Sheet 2: Attendance Summary
  const attendanceSheet = workbook.addWorksheet("Attendance");
  attendanceSheet.properties.tabColor = { argb: "ED7D31" };
  
  attendanceSheet.addRow(["RINGKASAN KEHADIRAN", classInfo.name, "", "", "", ""]);
  attendanceSheet.addRow([]);
  
  const attendanceHeaders = ["Tanggal", "Total", "Hadir", "Izin", "Sakit", "Alpha"];
  const attendanceHeaderRow = attendanceSheet.addRow(attendanceHeaders);
  attendanceHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  attendanceHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "ED7D31" },
  };
  attendanceHeaderRow.alignment = { horizontal: "center" };
  
  data.attendance.forEach((record) => {
    const recordValues = Object.values(record.records) as string[];
    const present = recordValues.filter(s => s === "present" || s === "Hadir").length;
    const excused = recordValues.filter(s => s === "excused" || s === "Izin").length;
    const late = recordValues.filter(s => s === "late" || s === "Terlambat").length;
    const absent = recordValues.filter(s => s === "absent" || s === "Alpha" || s === "Alpa").length;
    const total = recordValues.length;
    
    attendanceSheet.addRow([record.date, total, present, excused, late, absent]);
  });
  
  attendanceSheet.getColumn(1).width = 15;
  attendanceSheet.getColumn(2).width = 12;
  attendanceSheet.getColumn(3).width = 12;
  attendanceSheet.getColumn(4).width = 12;
  attendanceSheet.getColumn(5).width = 12;
  attendanceSheet.getColumn(6).width = 12;

  // Sheet 3: Grades Summary
  const gradesSheet = workbook.addWorksheet("Grades");
  gradesSheet.properties.tabColor = { argb: "70AD47" };
  
  gradesSheet.addRow(["RINGKASAN NILAI", classInfo.name, "", "", "", "", ""]);
  gradesSheet.addRow([]);
  
  const gradeHeaders = ["Tugas", "Kategori", "Max Points", "Dinilai", "Rata-rata", "Completion Rate", "Min", "Max"];
  const gradeHeaderRow = gradesSheet.addRow(gradeHeaders);
  gradeHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  gradeHeaderRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "70AD47" },
  };
  gradeHeaderRow.alignment = { horizontal: "center" };
  
  data.grades.forEach((grade) => {
    const gradedValues = Object.values(grade.grades).filter(v => v !== null) as number[];
    const gradedCount = gradedValues.length;
    const avgGrade = gradedCount > 0 
      ? (gradedValues.reduce((sum, g) => sum + g, 0) / gradedCount).toFixed(1) 
      : "-";
    const completionRate = data.students.length > 0 
      ? ((gradedCount / data.students.length) * 100).toFixed(0) + "%" 
      : "0%";
    const minGrade = gradedValues.length > 0 ? Math.min(...gradedValues) : "-";
    const maxGrade = gradedValues.length > 0 ? Math.max(...gradedValues) : "-";
    
    gradesSheet.addRow([
      grade.taskTitle,
      grade.category,
      grade.maxPoints,
      `${gradedCount}/${data.students.length}`,
      avgGrade,
      completionRate,
      minGrade,
      maxGrade,
    ]);
  });
  
  gradesSheet.getColumn(1).width = 30;
  gradesSheet.getColumn(2).width = 15;
  gradesSheet.getColumn(3).width = 12;
  gradesSheet.getColumn(4).width = 15;
  gradesSheet.getColumn(5).width = 12;
  gradesSheet.getColumn(6).width = 15;
  gradesSheet.getColumn(7).width = 10;
  gradesSheet.getColumn(8).width = 10;

  // Generate and save the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Bulk_Export_${safeClassName}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}
