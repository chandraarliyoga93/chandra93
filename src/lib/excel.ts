import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
}

export interface ExportOptions {
  fileName?: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  teacherName?: string;
  className?: string;
  includeDate?: boolean;
}

/**
 * Converts a 1-based column number to an Excel-style column letter (A, B, ..., AA, AB, ...)
 */
function getColumnLetter(colNumber: number): string {
  let letter = "";
  while (colNumber > 0) {
    const remainder = (colNumber - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    colNumber = Math.floor((colNumber - remainder) / 26);
  }
  return letter;
}

export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn[],
  options: ExportOptions = {}
): Promise<void> {
  const { 
    fileName = "export", 
    sheetName = "Data", 
    title, 
    subtitle,
    teacherName,
    className,
    includeDate = true 
  } = options;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Styling constants
  const primaryColor = "4F46E5"; // Indigo-600
  const secondaryColor = "F3F4F6"; // Gray-100
  const textColor = "FFFFFF";
  const borderColor = "D1D5DB"; // Gray-300

  let currentRow = 1;

  // Add Professional Header
  if (title) {
    const titleRow = worksheet.addRow([title]);
    titleRow.font = { bold: true, size: 18, color: { argb: textColor } };
    titleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: primaryColor },
    };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.height = 30;
    
    const lastColLetter = getColumnLetter(columns.length);
    worksheet.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`);
    currentRow++;
  }

  // Add Subtitle / Meta Info
  if (subtitle || teacherName || className || includeDate) {
    const metaInfo = [];
    if (className) metaInfo.push(`Kelas: ${className}`);
    if (teacherName) metaInfo.push(`Guru: ${teacherName}`);
    if (includeDate) metaInfo.push(`Tanggal: ${new Date().toLocaleDateString("id-ID")}`);
    
    if (metaInfo.length > 0) {
      const metaRow = worksheet.addRow([metaInfo.join("  |  ")]);
      metaRow.font = { italic: true, size: 10, color: { argb: "4B5563" } };
      metaRow.alignment = { horizontal: "center", vertical: "middle" };
      metaRow.height = 20;
      
      const lastColLetter = getColumnLetter(columns.length);
      worksheet.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`);
      currentRow++;
    }
    
    if (subtitle) {
      const subtitleRow = worksheet.addRow([subtitle]);
      subtitleRow.font = { size: 11, color: { argb: "6B7280" } };
      subtitleRow.alignment = { horizontal: "center", vertical: "middle" };
      subtitleRow.height = 20;
      const lastColLetter = getColumnLetter(columns.length);
      worksheet.mergeCells(`A${currentRow}:${lastColLetter}${currentRow}`);
      currentRow++;
    }
  }

  // Add spacing
  worksheet.addRow([]);
  currentRow++;

  // Add header row
  const headerRow = worksheet.addRow(columns.map((col) => col.header));
  headerRow.font = { bold: true, color: { argb: textColor } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F2937" }, // Gray-800
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;
  
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: borderColor } },
      left: { style: "thin", color: { argb: borderColor } },
      bottom: { style: "medium", color: { argb: borderColor } },
      right: { style: "thin", color: { argb: borderColor } },
    };
  });

  // Add data rows
  data.forEach((row, index) => {
    const dataRow = worksheet.addRow(
      columns.map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return "";
        
        // Handle nested objects (like { value: 80, remarks: "Good" })
        if (typeof value === "object" && "value" in (value as any)) {
          return (value as any).value;
        }
        
        return value;
      })
    );

    const isAltRow = index % 2 === 1;
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: borderColor } },
        left: { style: "thin", color: { argb: borderColor } },
        bottom: { style: "thin", color: { argb: borderColor } },
        right: { style: "thin", color: { argb: borderColor } },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      
      if (isAltRow) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F9FAFB" },
        };
      }
    });
  });

  // Set column widths and formatting
  columns.forEach((col, index) => {
    const worksheetColumn = worksheet.getColumn(index + 1);
    worksheetColumn.width = col.width || 18;
    
    // First column (usually Name) should be left aligned
    if (index === 0) {
      worksheetColumn.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    }
  });

  // Freeze panes: Header row
  worksheet.views = [
    { state: "frozen", xSplit: 1, ySplit: currentRow, topLeftCell: "B" + (currentRow + 1) }
  ];

  // Auto filter
  const lastColLetter = getColumnLetter(columns.length);
  worksheet.autoFilter = `A${currentRow}:${lastColLetter}${currentRow}`;

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `${fileName}_${new Date().getTime()}.xlsx`);
}
