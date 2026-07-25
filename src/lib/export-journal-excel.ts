import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { JournalExportData } from "./export-journal-pdf";

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

export function exportJournalsToExcel(data: JournalExportData) {
  const { journals } = data;

  const worksheetData = journals.map((journal) => ({
    Tanggal: format(new Date(journal.date), "dd MMM yyyy", { locale: id }),
    Kelas: journal.className,
    "Topik/Materi": journal.topic,
    Aktivitas: journal.activities,
    "Kejadian Khusus": journal.incidents || "-",
    Mood: getMoodText(journal.mood),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Jurnal Mengajar");

  // Set column widths
  const wscols = [
    { wch: 15 }, // Tanggal
    { wch: 15 }, // Kelas
    { wch: 30 }, // Topik/Materi
    { wch: 40 }, // Aktivitas
    { wch: 30 }, // Kejadian Khusus
    { wch: 15 }, // Mood
  ];
  worksheet["!cols"] = wscols;

  const fileName = `Jurnal_Mengajar_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
