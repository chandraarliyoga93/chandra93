import * as XLSX from "xlsx";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Exam, ExamAttempt } from "@/types/exam";

type AttemptWithClassName = ExamAttempt & { className?: string };
type GradingQuestion = { type: string; answer: unknown };

/**
 * Calculates points for a single question based on student answer.
 * Returns { points: number, context: string }
 * Points is between 0 and 1.
 */
function calculateQuestionScore(q: GradingQuestion, studentAnswer: unknown): { points: number; context: string } {
  if (studentAnswer === undefined || studentAnswer === null) {
    return { points: 0, context: "-" };
  }

  let points = 0;
  let context = "";

  switch (q.type) {
    case "pg":
      points = String(studentAnswer) === String(q.answer) ? 1 : 0;
      context = String(studentAnswer);
      break;

    case "bs":
      points = Boolean(studentAnswer) === Boolean(q.answer) ? 1 : 0;
      context = studentAnswer ? "B" : "S";
      break;

    case "pg_kompleks":
      const studentChoices = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer])
        .filter(Boolean)
        .map((val: unknown) => String(val));
      const correctKeys = (Array.isArray(q.answer) ? q.answer : [q.answer])
        .filter(Boolean)
        .map((val: unknown) => String(val));

      if (studentChoices.length > 0 && correctKeys.length > 0) {
        let correctCount = 0;
        studentChoices.forEach((choice) => {
          if (correctKeys.includes(choice)) {
            correctCount++;
          } else {
            correctCount--;
          }
        });
        points = Math.max(0, correctCount / correctKeys.length);
      }
      context = studentChoices.join(", ");
      break;

    case "menjodohkan":
      if (typeof studentAnswer === "object" && studentAnswer !== null) {
        const correctPairMap = q.answer as Record<string, string>;
        const studentPairMap = studentAnswer as Record<string, string>;
        const pairIds = Object.keys(correctPairMap);
        let correctCountInQ = 0;

        pairIds.forEach((leftId) => {
          const sAns = String(studentPairMap[leftId] || "").trim().toLowerCase();
          const cAns = String(correctPairMap[leftId] || "").trim().toLowerCase();
          if (sAns === cAns && cAns !== "") {
            correctCountInQ++;
          }
        });

        if (pairIds.length > 0) {
          points = correctCountInQ / pairIds.length;
          context = `${correctCountInQ}/${pairIds.length}`;
        }
      }
      break;

    case "mengurutkan":
      const sOrder = (Array.isArray(studentAnswer) ? studentAnswer : []).map((val: unknown) => String(val));
      const cOrder = (Array.isArray(q.answer) ? q.answer : []).map((val: unknown) => String(val));

      if (sOrder.length > 0 && sOrder.length === cOrder.length) {
        const isCorrect = sOrder.every((val, index) => val === cOrder[index]);
        points = isCorrect ? 1 : 0;
      }
      context = sOrder.join("-");
      break;

    case "essay":
      const studentAnswerStr = String(studentAnswer).trim().toLowerCase();
      const correctAnswerStr = String(q.answer).trim().toLowerCase();
      const keywords = correctAnswerStr.split(",").map((k) => k.trim()).filter((k) => k !== "");

      if (keywords.length === 0) {
        if (studentAnswerStr === correctAnswerStr && correctAnswerStr !== "") {
          points = 1;
        }
      } else {
        const matchedKeywords = keywords.filter((k) => studentAnswerStr.includes(k));
        points = matchedKeywords.length / keywords.length;
      }
      context = studentAnswerStr.length > 30 ? studentAnswerStr.substring(0, 30) + "..." : studentAnswerStr;
      break;

    case "matrix":
      if (typeof studentAnswer === "object" && studentAnswer !== null && typeof q.answer === "object" && q.answer !== null) {
        const correctPairMap = q.answer as Record<string, string>;
        const studentPairMap = studentAnswer as Record<string, string>;
        const rowIds = Object.keys(correctPairMap);
        let correctCountInQ = 0;

        rowIds.forEach((rowId) => {
          const sAns = String(studentPairMap[rowId] || "").trim();
          const cAns = String(correctPairMap[rowId] || "").trim();
          if (sAns === cAns && cAns !== "") {
            correctCountInQ++;
          }
        });

        if (rowIds.length > 0) {
          points = correctCountInQ / rowIds.length;
          context = `${correctCountInQ}/${rowIds.length}`;
        }
      }
      break;
  }

  return { points, context: context || "-" };
}

function getClassLabel(attempt: AttemptWithClassName) {
  return attempt.className?.trim() || "Tanpa Kelas";
}

function sanitizeSheetName(name: string) {
  return name.replace(/[:\\/?*\[\]]/g, "").slice(0, 31) || "Kelas";
}

export function exportCBTToExcel(exam: Exam, results: AttemptWithClassName[]) {
  // Sort by class then student name.
  const sortedResults = [...results].sort((a, b) => {
    const classDiff = getClassLabel(a).localeCompare(getClassLabel(b));
    if (classDiff !== 0) return classDiff;
    return (a.studentName || "").localeCompare(b.studentName || "");
  });

  // --- Sheet 1: Ringkasan Nilai ---
  const summaryHeaders = [
    "Kelas",
    "Nama Siswa",
    "Skor",
    "Total Benar",
    "Durasi (m)",
    "Pelanggaran",
    "Waktu Selesai",
  ];

  const summaryRows = sortedResults.map((result) => {
    // Re-calculate total points if correctCount is missing or for verification
    let totalPoints = 0;
    exam.questions.forEach((q) => {
      const { points } = calculateQuestionScore(q, result.answers[q.id]);
      totalPoints += points;
    });

    const totalBenar = Number(totalPoints.toFixed(2));
    const formattedDate = result.submittedAt
      ? format(new Date(result.submittedAt), "dd MMMM yyyy HH:mm", { locale: id })
      : "-";

    return [
      getClassLabel(result),
      result.studentName || "Siswa",
      result.score,
      totalBenar,
      result.timeTaken || 0,
      result.violations || 0,
      formattedDate,
    ];
  });

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);

  // --- Sheet 2: Analisis Butir Soal ---
  const analysisHeaders = ["Kelas", "Nama Siswa"];
  exam.questions.forEach((_, idx) => {
    analysisHeaders.push(`Soal ${idx + 1}`);
  });

  const analysisRows = sortedResults.map((result) => {
    const rowData: (string | number)[] = [getClassLabel(result), result.studentName || "Siswa"];
    
    exam.questions.forEach((q) => {
      const { points, context } = calculateQuestionScore(q, result.answers[q.id]);
      const formattedPoints = Number.isInteger(points) ? points : Number(points.toFixed(2));
      rowData.push(`${formattedPoints} - ${context}`);
    });
    
    return rowData;
  });

  const wsAnalysis = XLSX.utils.aoa_to_sheet([analysisHeaders, ...analysisRows]);

  // Create Workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsSummary, "Ringkasan Nilai");
  XLSX.utils.book_append_sheet(workbook, wsAnalysis, "Analisis Butir Soal");

  // Per-class sheets for cleaner class-based reporting.
  const grouped = sortedResults.reduce<Record<string, AttemptWithClassName[]>>((acc, item) => {
    const className = getClassLabel(item);
    if (!acc[className]) acc[className] = [];
    acc[className].push(item);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([className, classResults]) => {
    const classRows = classResults.map((result) => {
      let totalPoints = 0;
      exam.questions.forEach((q) => {
        const { points } = calculateQuestionScore(q, result.answers[q.id]);
        totalPoints += points;
      });

      return [
        result.studentName || "Siswa",
        result.score,
        Number(totalPoints.toFixed(2)),
        result.timeTaken || 0,
        result.violations || 0,
        result.submittedAt
          ? format(new Date(result.submittedAt), "dd MMMM yyyy HH:mm", { locale: id })
          : "-",
      ];
    });

    const classSheet = XLSX.utils.aoa_to_sheet([
      ["Kelas", className],
      [],
      ["Nama Siswa", "Skor", "Total Benar", "Durasi (m)", "Pelanggaran", "Waktu Selesai"],
      ...classRows,
    ]);

    XLSX.utils.book_append_sheet(workbook, classSheet, sanitizeSheetName(`Kelas ${className}`));
  });

  // Export File
  const fileName = `Hasil_CBT_${exam.title.replace(/[\/\\?%*:|"<>]/g, "_")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
