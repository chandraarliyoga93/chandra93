"use client";

import * as React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Helvetica",
  },
  accentBar: {
    height: 4,
    backgroundColor: "#4F46E5",
    width: "100%",
    marginBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: 500,
  },
  brandName: {
    fontSize: 10,
    fontWeight: 700,
    color: "#4F46E5",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 15,
  },
  metaItem: {
    fontSize: 9,
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1F2937",
  },
  tableHeaderCell: {
    padding: 10,
    fontSize: 8,
    fontWeight: 700,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    minHeight: 35,
    alignItems: "center",
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 9,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  pageNumber: {
    fontSize: 8,
    color: "#9CA3AF",
    fontWeight: 600,
  },
  summarySection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#111827",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#6B7280",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111827",
  },
  gradeCell: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 9,
    fontWeight: 700,
    textAlign: "center",
    borderRadius: 4,
  },
  gradePass: {
    color: "#059669",
    backgroundColor: "#ECFDF5",
  },
  gradeWarning: {
    color: "#D97706",
    backgroundColor: "#FFFBEB",
  },
  gradeFail: {
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
});

// Helper types for PDF data
export interface PDFHeaderData {
  title: string;
  subtitle?: string;
  className?: string;
  date?: string;
  teacherName?: string;
  /**
   * Optional deterministic document identifier (e.g. examId or classId),
   * used instead of generating a random ID during render.
   */
  documentId?: string;
}

export interface PDFTableColumn {
  key: string;
  header: string;
  width: number | string;
  isStatus?: boolean;
  isNumeric?: boolean;
}

export interface PDFTableRow {
  [key: string]: string | number | undefined;
}

interface AttendancePDFProps {
  header: PDFHeaderData;
  columns: PDFTableColumn[];
  data: PDFTableRow[];
  summary?: {
    present: number;
    excused: number;
    late: number;
    absent: number;
    total: number;
  };
}

interface GradebookPDFProps {
  header: PDFHeaderData;
  columns: PDFTableColumn[];
  data: PDFTableRow[];
  averages?: { name: string; average: string }[];
  groupByKey?: string;
  groupLabel?: string;
}

// Attendance PDF Document
export function AttendancePDFDocument({ header, columns, data, summary }: AttendancePDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.accentBar} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>Kelas Guru Official Report</Text>
            <Text style={styles.headerTitle}>{header.title}</Text>
            {header.subtitle && <Text style={styles.headerSubtitle}>{header.subtitle}</Text>}
            
            <View style={styles.metaGrid}>
              {header.className && <Text style={styles.metaItem}>Kelas: {header.className}</Text>}
              {header.teacherName && <Text style={styles.metaItem}>Guru: {header.teacherName}</Text>}
              {header.date && <Text style={styles.metaItem}>Periode: {header.date}</Text>}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 8, color: "#9CA3AF", textAlign: "right" }}>DOCUMENT ID</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>
              ATT-{(header.documentId || header.date || header.className || "AUTO").toString().toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            {columns.map((col, index) => (
              <View
                key={col.key}
                style={{
                  width: col.width,
                  borderRightWidth: index < columns.length - 1 ? 1 : 0,
                  borderRightColor: "#374151",
                }}
              >
                <Text
                  style={{
                    ...styles.tableHeaderCell,
                    textAlign: col.isNumeric ? "right" : "left",
                  }}
                >
                  {col.header}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {data.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                ...styles.tableRow,
                backgroundColor: rowIndex % 2 === 0 ? "#ffffff" : "#F9FAFB",
              }}
            >
              {columns.map((col, colIndex) => {
                const value = row[col.key];
                const cellStyle = { ...styles.tableCell };
                let textContent = String(value ?? "-");

                // Color coding for status
                if (col.isStatus && value) {
                  const status = String(value).toLowerCase();
                  if (status === "hadir" || status === "present") {
                    (cellStyle as any).color = "#059669";
                    (cellStyle as any).fontWeight = 700;
                    textContent = "HADIR";
                  } else if (status === "izin" || status === "excused" || status === "sakit") {
                    (cellStyle as any).color = "#0284C7";
                    textContent = status.toUpperCase();
                  } else if (status === "terlambat" || status === "late") {
                    (cellStyle as any).color = "#D97706";
                    textContent = "TERLAMBAT";
                  } else if (status === "alpha" || status === "absent") {
                    (cellStyle as any).color = "#DC2626";
                    (cellStyle as any).fontWeight = 700;
                    textContent = "ALPHA";
                  }
                }

                return (
                  <View
                    key={col.key}
                    style={{
                      width: col.width,
                      borderRightWidth: colIndex < columns.length - 1 ? 1 : 0,
                      borderRightColor: "#E5E7EB",
                    }}
                  >
                    <Text
                      style={{
                        ...cellStyle,
                        textAlign: col.isNumeric ? "right" : "left",
                      }}
                    >
                      {textContent}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Summary */}
        {summary && (
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Attendance Analytics Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Students</Text>
                <Text style={styles.summaryValue}>{summary.total}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Present</Text>
                <Text style={{ ...styles.summaryValue, color: "#059669" }}>
                  {summary.present}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Presence Rate</Text>
                <Text style={{ ...styles.summaryValue, color: "#4F46E5" }}>
                  {Math.round((summary.present / summary.total) * 100)}%
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Excused/Sick</Text>
                <Text style={{ ...styles.summaryValue, color: "#0284C7" }}>
                  {summary.excused}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Late</Text>
                <Text style={{ ...styles.summaryValue, color: "#D97706" }}>
                  {summary.late}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Absent</Text>
                <Text style={{ ...styles.summaryValue, color: "#DC2626" }}>
                  {summary.absent}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Kelas Guru System | {format(new Date(), "dd MMM yyyy HH:mm", { locale: idLocale })}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// Gradebook PDF Document
export function GradebookPDFDocument({ header, columns, data, averages, groupByKey, groupLabel }: GradebookPDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.accentBar} />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>Kelas Guru Official Report</Text>
            <Text style={styles.headerTitle}>{header.title}</Text>
            {header.subtitle && <Text style={styles.headerSubtitle}>{header.subtitle}</Text>}
            
            <View style={styles.metaGrid}>
              {header.className && <Text style={styles.metaItem}>Kelas: {header.className}</Text>}
              {header.teacherName && <Text style={styles.metaItem}>Guru: {header.teacherName}</Text>}
              {header.date && <Text style={styles.metaItem}>Tanggal Export: {header.date}</Text>}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 8, color: "#9CA3AF", textAlign: "right" }}>DOCUMENT ID</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: "#374151" }}>
              GRD-{(header.documentId || header.date || header.className || "AUTO").toString().toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            {columns.map((col, index) => (
              <View
                key={col.key}
                style={{
                  width: col.width,
                  borderRightWidth: index < columns.length - 1 ? 1 : 0,
                  borderRightColor: "#374151",
                }}
              >
                <Text
                  style={{
                    ...styles.tableHeaderCell,
                    textAlign: col.isNumeric ? "right" : "left",
                  }}
                >
                  {col.header}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {data.map((row, rowIndex) => {
            const groupValue =
              groupByKey && row[groupByKey] !== undefined
                ? String(row[groupByKey] ?? "-")
                : null;
            const prevGroupValue =
              groupByKey && rowIndex > 0 && data[rowIndex - 1]?.[groupByKey] !== undefined
                ? String(data[rowIndex - 1]?.[groupByKey] ?? "-")
                : null;
            const showGroupHeader = !!groupByKey && groupValue !== prevGroupValue;

            return (
              <React.Fragment key={rowIndex}>
                {showGroupHeader && (
                  <View
                    style={{
                      backgroundColor: "#EEF2FF",
                      borderTopWidth: rowIndex === 0 ? 0 : 1,
                      borderTopColor: "#E5E7EB",
                      borderBottomWidth: 1,
                      borderBottomColor: "#E5E7EB",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 9, fontWeight: 700, color: "#312E81" }}>
                      {groupLabel || "Grup"}: {groupValue}
                    </Text>
                  </View>
                )}

                <View
                  style={{
                    ...styles.tableRow,
                    backgroundColor: rowIndex % 2 === 0 ? "#ffffff" : "#F9FAFB",
                  }}
                >
                  {columns.map((col, colIndex) => {
                    const value = row[col.key];
                    let cellStyle = { ...styles.tableCell };
                    const textContent = String(value ?? "-");

                    // Color coding for grades
                    if (col.isNumeric && value !== undefined && value !== "-") {
                      const numValue = Number(value);
                      if (numValue >= 75) {
                        cellStyle = { ...styles.gradeCell, ...styles.gradePass };
                      } else if (numValue >= 60) {
                        cellStyle = { ...styles.gradeCell, ...styles.gradeWarning };
                      } else {
                        cellStyle = { ...styles.gradeCell, ...styles.gradeFail };
                      }
                    }

                    return (
                      <View
                        key={col.key}
                        style={{
                          width: col.width,
                          borderRightWidth: colIndex < columns.length - 1 ? 1 : 0,
                          borderRightColor: "#E5E7EB",
                        }}
                      >
                        <Text
                          style={{
                            ...cellStyle,
                            textAlign: col.isNumeric ? "right" : "left",
                          }}
                        >
                          {textContent}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by Kelas Guru System | {format(new Date(), "dd MMM yyyy HH:mm", { locale: idLocale })}
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

// Export function for PDF generation
export async function exportToPdf(
  data: Record<string, unknown>[],
  columns: PDFTableColumn[],
  options: {
    fileName: string;
    title: string;
    subtitle?: string;
    className?: string;
    date?: string;
    teacherName?: string;
    type: "attendance" | "gradebook";
    summary?: AttendancePDFProps["summary"];
    groupByKey?: string;
    groupLabel?: string;
  }
): Promise<void> {
  const { pdf } = await import("@react-pdf/renderer");

  const header: PDFHeaderData = {
    title: options.title,
    subtitle: options.subtitle,
    className: options.className,
    date: options.date,
    teacherName: options.teacherName,
  };

  const DocumentComponent = options.type === "attendance" ? AttendancePDFDocument : GradebookPDFDocument;
  const docOptions = options.type === "attendance"
    ? {
        header,
        columns,
        data: data as PDFTableRow[],
        summary: options.summary,
      }
    : {
        header,
        columns,
        data: data as PDFTableRow[],
        groupByKey: options.groupByKey,
        groupLabel: options.groupLabel,
      };

  // Create a proper document element
  const doc = React.createElement(DocumentComponent, docOptions) as unknown as React.ReactElement<any>;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${options.fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper to create export columns from table columns
export function createPdfColumns(
  tableColumns: { id: string; columnDef: { header: string | (() => string) } }[],
  columnWidths?: Record<string, number | string>
): PDFTableColumn[] {
  return tableColumns.map((col) => ({
    key: col.id,
    header: typeof col.columnDef.header === "string" ? col.columnDef.header : col.id,
    width: columnWidths?.[col.id] ?? 120,
  }));
}
