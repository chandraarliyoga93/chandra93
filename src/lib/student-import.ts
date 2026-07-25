import * as XLSX from "xlsx";
import { z } from "zod";

/**
 * Simplified schema for student import validation.
 * Maps:
 * - NIS -> username
 * - Nama Lengkap -> name
 * - Email -> email
 */
export const importStudentSchema = z.object({
  username: z.string().min(1, "NIS tidak boleh kosong"),
  name: z.string().min(1, "Nama Lengkap tidak boleh kosong"),
  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),
});

export type ImportStudent = z.infer<typeof importStudentSchema>;

export type ImportStatus = "VALID" | "INVALID" | "DUPLICATE_IN_FILE";

export interface ParsedStudentRecord extends ImportStudent {
  status: ImportStatus;
  errors: string[];
  originalRow: number;
}

/**
 * Parses an uploaded .xlsx file into a JSON array of student records.
 * Performs validation and duplicate detection.
 */
export async function parseStudentExcel(file: File): Promise<ParsedStudentRecord[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert worksheet to JSON array of objects
        // We expect headers: NIS, Nama Lengkap, Email
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

        const results: ParsedStudentRecord[] = [];
        const seenNIS = new Set<string>();

        rawData.forEach((row, index) => {
          const originalRow = index + 2; // Excel rows are 1-indexed, header is row 1
          
          // Map Excel columns to our model
          const student: ImportStudent = {
            username: String(row["NIS"] || "").trim(),
            name: String(row["Nama Lengkap"] || "").trim(),
            email: String(row["Email"] || "").trim(),
          };

          const errors: string[] = [];
          let status: ImportStatus = "VALID";

          // 1. Check for duplicates within the file
          if (student.username && seenNIS.has(student.username)) {
            status = "DUPLICATE_IN_FILE";
            errors.push(`NIS ganda dalam file: ${student.username}`);
          } else if (student.username) {
            seenNIS.add(student.username);
          }

          // 2. Validate with Zod
          const validation = importStudentSchema.safeParse(student);
          if (!validation.success) {
            if (status !== "DUPLICATE_IN_FILE") {
              status = "INVALID";
            }
            validation.error.issues.forEach((issue) => {
              errors.push(issue.message);
            });
          }

          // Special check for missing required fields if not caught by zod (though zod should catch them)
          if (!student.username) {
            if (status !== "DUPLICATE_IN_FILE") status = "INVALID";
            if (!errors.includes("NIS tidak boleh kosong")) {
              errors.push("NIS tidak boleh kosong");
            }
          }
          if (!student.name) {
            if (status !== "DUPLICATE_IN_FILE") status = "INVALID";
            if (!errors.includes("Nama Lengkap tidak boleh kosong")) {
              errors.push("Nama Lengkap tidak boleh kosong");
            }
          }

          results.push({
            ...student,
            status,
            errors,
            originalRow,
          });
        });

        resolve(results);
      } catch (error) {
        reject(new Error("Gagal membaca file Excel. Pastikan format file benar."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file."));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and downloads a .xlsx template for student imports.
 */
export function downloadStudentImportTemplate() {
  const headers = [["NIS", "Nama Lengkap", "Email"]];
  const sampleData = [
    ["2024001", "Ahmad Siswa", "ahmad@example.com"],
    ["2024002", "Budi Siswa", "budi@example.com"],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
  
  // Set column widths
  const wscols = [
    { wch: 15 }, // NIS
    { wch: 30 }, // Nama Lengkap
    { wch: 25 }, // Email
  ];
  worksheet["!cols"] = wscols;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Import Siswa");

  // Generate and download
  XLSX.writeFile(workbook, "Template_Import_Siswa.xlsx");
}
