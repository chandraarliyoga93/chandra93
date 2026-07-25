import * as XLSX from "xlsx";

export interface AttendanceExportData {
  attendance: { date: string; records: Record<string, string> }[];
  students: { uid: string; name: string; email: string }[];
}

export function exportAttendanceToExcel(
  data: AttendanceExportData,
  className: string,
  dateRange: { start: string; end: string }
) {
  // 1. Sort students by name A-Z
  const sortedStudents = [...data.students].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // 2. Prepare Header
  const headers = [
    "Nama Siswa",
    ...data.attendance.map((a) => a.date),
    "Total Hadir",
    "Total Tidak Hadir",
    "% Kehadiran",
  ];

  // 3. Status Mapping Logic
  const mapStatus = (status: string | undefined): string | number => {
    if (!status) return "";
    const lowerStatus = status.toLowerCase();
    if (lowerStatus === "present" || lowerStatus === "late") return 1;
    if (lowerStatus === "sick") return "S";
    if (lowerStatus === "excused") return "I";
    if (lowerStatus === "absent") return "A";
    return "";
  };

  // 4. Prepare Rows
  const rows = sortedStudents.map((student) => {
    let totalHadir = 0;
    let totalTidakHadir = 0;

    const studentRecords = data.attendance.map((record) => {
      const status = record.records[student.uid];
      const mappedValue = mapStatus(status);

      if (mappedValue === 1) {
        totalHadir++;
      } else if (["S", "I", "A"].includes(mappedValue as string)) {
        totalTidakHadir++;
      }

      return mappedValue;
    });

    const totalDays = totalHadir + totalTidakHadir;
    const attendancePercentage =
      totalDays > 0 ? ((totalHadir / totalDays) * 100).toFixed(2) + "%" : "0%";

    return [
      student.name,
      ...studentRecords,
      totalHadir,
      totalTidakHadir,
      attendancePercentage,
    ];
  });

  // 5. Create Worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // 6. Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");

  // 7. Export File
  const fileName = `Absensi-${className.replace(/[\/\\?%*:|"<>]/g, "-")}-${dateRange.start}-${dateRange.end}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
