import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Journal } from "@/actions/journals-supabase";

export interface JournalExportData {
  journals: Journal[];
  teacherName: string;
}

const moodMapping: Record<string, string> = {
  "🤩": "Sangat Senang",
  "😊": "Senang",
  "😐": "Biasa",
  "😫": "Lelah",
  "😢": "Sedih",
};

const getMoodText = (moodEmoji: string) => {
  return moodMapping[moodEmoji] || "Biasa";
};

export const exportJournalsToPdf = (
  data: JournalExportData,
  dateRange: { start: string; end: string }
) => {
  const { journals, teacherName } = data;
  const { start, end } = dateRange;

  // Initialize jsPDF in landscape orientation
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Header Section ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("LAPORAN JURNAL MENGAJAR GURU", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Left side: Nama Guru
  doc.text(`Nama Guru: ${teacherName}`, 14, 25);
  
  // Right side: Periode
  const formattedStart = format(new Date(start), "dd MMM yyyy", { locale: id });
  const formattedEnd = format(new Date(end), "dd MMM yyyy", { locale: id });
  const periodText = `Periode: ${formattedStart} s/d ${formattedEnd}`;
  doc.text(periodText, pageWidth - 14, 25, { align: "right" });

  // --- Table Section ---
  const tableData = journals.map((journal, index) => [
    index + 1,
    format(new Date(journal.date), "dd MMM yyyy", { locale: id }),
    journal.className,
    journal.topic,
    journal.activities,
    journal.incidents || "-",
    getMoodText(journal.mood),
  ]);

  autoTable(doc, {
    startY: 30,
    head: [
      [
        "No",
        "Tanggal",
        "Kelas",
        "Topik/Materi",
        "Aktivitas Pembelajaran",
        "Kejadian Khusus",
        "Mood",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 9,
      valign: "top",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, // No
      1: { cellWidth: 30 }, // Tanggal
      2: { cellWidth: 30 }, // Kelas
      3: { cellWidth: 50 }, // Topik/Materi
      4: { cellWidth: 60 }, // Aktivitas Pembelajaran
      5: { cellWidth: 50 }, // Kejadian Khusus
      6: { cellWidth: 30 }, // Mood
    },
    styles: {
      font: "helvetica",
      cellPadding: 3,
    },
  });

  // --- Footer (Signature Area) ---
  let signatureY = (doc as any).lastAutoTable.finalY + 20;
  
  // Check if we need a new page for signatures
  if (signatureY > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    signatureY = 30; // Start at top of new page
  }

  // Left side: Kepala Sekolah
  doc.setFont("helvetica", "normal");
  doc.text("Mengetahui,", 14, signatureY);
  doc.text("Kepala Sekolah", 14, signatureY + 5);
  
  // Space for signature
  doc.text("( ________________________ )", 14, signatureY + 35);
  doc.text("NIP.", 14, signatureY + 40);

  // Right side: Guru Mata Pelajaran
  const rightColumnX = pageWidth - 14;
  doc.text("...................., " + format(new Date(), "dd MMM yyyy", { locale: id }), rightColumnX, signatureY, { align: "right" });
  doc.text("Guru Mata Pelajaran", rightColumnX, signatureY + 5, { align: "right" });
  
  // Space for signature
  doc.text(`( ${teacherName} )`, rightColumnX, signatureY + 35, { align: "right" });
  doc.text("NIP.", rightColumnX, signatureY + 40, { align: "right" });

  // Save the PDF
  doc.save(`Jurnal_Mengajar_${teacherName.replace(/\s+/g, '_')}_${format(new Date(start), "yyyy-MM-dd")}_${format(new Date(end), "yyyy-MM-dd")}.pdf`);
};
