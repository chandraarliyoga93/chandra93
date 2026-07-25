"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, CheckCircle, XmarkCircle, Timer } from "iconoir-react";
import { Exam, ExamAttempt } from "@/types/exam";
import { MathRenderer } from "@/components/ui/math-renderer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExamAttemptDetailDialogProps {
  exam: Exam;
  attempt: ExamAttempt;
}

export function ExamAttemptDetailDialog({ exam, attempt }: ExamAttemptDetailDialogProps) {
  const questions = exam.questions || [];
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
          <Eye className="w-4 h-4 text-zinc-400" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 sm:rounded-2xl shadow-lg">
        <DialogHeader className="p-8 border-b bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center font-bold text-xl text-zinc-400">
                {attempt.studentName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">{attempt.studentName}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="rounded-md px-1.5 py-0 text-[10px] font-bold uppercase">
                    {exam.title}
                  </Badge>
                  <span className="text-xs text-zinc-500 font-medium uppercase tracking-tighter flex items-center gap-1">
                    <Timer className="w-3 h-3" /> {attempt.timeTaken}m
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
               <div className={cn(
                 "px-6 py-3 rounded-xl border flex flex-col items-center justify-center shadow-sm transition-colors",
                 attempt.score >= 75 ? "bg-emerald-50 border-emerald-200 text-emerald-700" : 
                 attempt.score >= 50 ? "bg-yellow-50 border-yellow-200 text-yellow-700" : 
                 "bg-rose-50 border-rose-200 text-rose-700"
               )}>
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 opacity-60">Skor Akhir</span>
                  <span className="text-3xl font-bold leading-none tabular-nums">{attempt.score}</span>
               </div>
               <div className="px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Pelanggaran</span>
                  <span className={cn("text-2xl font-bold leading-none tabular-nums", attempt.violations > 0 ? "text-rose-600" : "text-zinc-400")}>
                    {attempt.violations}
                  </span>
               </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          <div className="space-y-8 pb-20">
            {questions.map((q, index) => {
              const studentAnswer = attempt.answers[q.id];
              let isCorrect = false;
              let partialScore = 0;
              
              if (studentAnswer !== undefined && studentAnswer !== null) {
                switch (q.type) {
                  case "pg":
                    isCorrect = String(studentAnswer) === String(q.answer);
                    break;
                  case "bs":
                    isCorrect = Boolean(studentAnswer) === Boolean(q.answer);
                    break;
                  case "pg_kompleks":
                    const sChoices = (Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer]).filter(Boolean).map(v => String(v));
                    const cKeys = (Array.isArray(q.answer) ? q.answer : [q.answer]).filter(Boolean).map(v => String(v));
                    if (sChoices.length > 0 && cKeys.length > 0) {
                      isCorrect = sChoices.length === cKeys.length && sChoices.every(v => cKeys.includes(v));
                    }
                    break;
                  case "menjodohkan":
                    if (typeof studentAnswer === "object" && studentAnswer !== null) {
                      const correctPairMap = q.answer as Record<string, string>;
                      const studentPairMap = studentAnswer as Record<string, string>;
                      const pairIds = Object.keys(correctPairMap);
                      let correctCount = 0;
                      pairIds.forEach((leftId) => {
                        const sAns = String(studentPairMap[leftId] || "").trim().toLowerCase();
                        const cAns = String(correctPairMap[leftId] || "").trim().toLowerCase();
                        if (sAns === cAns && cAns !== "") {
                          correctCount++;
                        }
                      });
                      isCorrect = pairIds.length > 0 && correctCount === pairIds.length;
                      partialScore = pairIds.length > 0 ? (correctCount / pairIds.length) : 0;
                    }
                    break;
                  case "mengurutkan":
                    const sOrder = (Array.isArray(studentAnswer) ? studentAnswer : []).map(v => String(v));
                    const cOrder = (Array.isArray(q.answer) ? q.answer : []).map(v => String(v));
                    if (sOrder.length > 0 && sOrder.length === cOrder.length) {
                      isCorrect = sOrder.every((val, idx) => val === cOrder[idx]);
                    }
                    break;
                  case "matrix":
                    if (typeof studentAnswer === "object" && studentAnswer !== null) {
                      const correctAnswerMap = q.answer as Record<string, string>;
                      const studentAnswerMap = studentAnswer as Record<string, string>;
                      const rowIds = Object.keys(correctAnswerMap);
                      let correctCount = 0;
                      rowIds.forEach((rowId) => {
                        if (String(studentAnswerMap[rowId] || "") === String(correctAnswerMap[rowId] || "")) {
                          correctCount++;
                        }
                      });
                      isCorrect = rowIds.length > 0 && correctCount === rowIds.length;
                      partialScore = rowIds.length > 0 ? (correctCount / rowIds.length) : 0;
                    }
                    break;
                  case "essay": {
                    const studentAnsStr = String(studentAnswer ?? "").trim().toLowerCase();
                    const cfg = q.essayConfig as
                      | { maxPoints: number; keywords: { text: string; weight: number; type: "required" | "bonus" }[] }
                      | undefined;

                    if (cfg && cfg.keywords.length > 0) {
                      const maxPts = cfg.maxPoints || 1;
                      let rawScore = 0;
                      let hasMissingRequired = false;

                      cfg.keywords.forEach((kw) => {
                        const needle = kw.text.trim().toLowerCase();
                        if (!needle) return;
                        const found = studentAnsStr.includes(needle);
                        if (kw.type === "required" && !found) {
                          hasMissingRequired = true;
                        }
                        if (found) {
                          rawScore += kw.weight;
                        }
                      });

                      let earned = Math.min(rawScore, maxPts);
                      if (hasMissingRequired && earned > maxPts * 0.7) {
                        earned = maxPts * 0.7;
                      }
                      partialScore = maxPts > 0 ? earned / maxPts : 0;
                      isCorrect = partialScore === 1;
                    } else {
                      const correctAnsStr = String(q.answer ?? "").trim().toLowerCase();
                      const keywords = correctAnsStr.split(",").map(k => k.trim()).filter(k => k !== "");
                      
                      if (keywords.length === 0) {
                        isCorrect = studentAnsStr === correctAnsStr && correctAnsStr !== "";
                        partialScore = isCorrect ? 1 : 0;
                      } else {
                        const matched = keywords.filter(k => studentAnsStr.includes(k));
                        partialScore = matched.length / keywords.length;
                        isCorrect = partialScore === 1;
                      }
                    }
                    break;
                  }
                }
              }

              return (
                <div 
                  key={q.id} 
                  className={cn(
                    "p-6 rounded-2xl border transition-all space-y-4 shadow-sm",
                    isCorrect ? "border-emerald-100 bg-emerald-50/20" : 
                    (partialScore > 0 ? "border-yellow-100 bg-yellow-50/20" : "border-rose-100 bg-rose-50/20")
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 w-full">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0",
                        isCorrect ? "bg-emerald-500 text-white" : 
                        (partialScore > 0 ? "bg-yellow-500 text-white" : "bg-rose-500 text-white")
                      )}>
                        {index + 1}
                      </div>
                      <div className="space-y-4 flex-1 min-w-0">
                        <div className="text-lg font-bold leading-relaxed text-zinc-900 dark:text-zinc-100">
                          <MathRenderer text={q.text} />
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Jawaban Siswa:</p>
                            {partialScore > 0 && partialScore < 1 && (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[9px] font-bold uppercase">Skor Parsial: {Math.round(partialScore * 100)}%</Badge>
                            )}
                          </div>
                          
                          {q.type === 'pg' || q.type === 'pg_kompleks' ? (
                            <div className="grid grid-cols-1 gap-2">
                              {q.options?.map((opt, i) => {
                                const isStudentChoice = Array.isArray(studentAnswer) 
                                  ? studentAnswer.map(v => String(v)).includes(String(opt.id)) 
                                  : String(studentAnswer) === String(opt.id);
                                const isActuallyCorrect = Array.isArray(q.answer)
                                  ? q.answer.map(v => String(v)).includes(String(opt.id))
                                  : String(q.answer) === String(opt.id);
                                
                                return (
                                  <div 
                                    key={opt.id} 
                                    className={cn(
                                      "flex items-center gap-3 p-3 rounded-xl border text-sm transition-all",
                                      isStudentChoice && isActuallyCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold" :
                                      isStudentChoice && !isActuallyCorrect ? "bg-rose-50 border-rose-200 text-rose-700" :
                                      !isStudentChoice && isActuallyCorrect ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 opacity-60" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-700 opacity-40"
                                    )}
                                  >
                                    <span className={cn(
                                      "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 border",
                                      isStudentChoice ? (isActuallyCorrect ? "bg-emerald-500 text-white" : "bg-rose-500 text-white border-rose-600") : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                                    )}>
                                      {String.fromCharCode(65 + i)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <MathRenderer text={opt.text} />
                                    </div>
                                    {isStudentChoice && (
                                      <span className="ml-auto shrink-0">
                                        {isActuallyCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XmarkCircle className="w-4 h-4 text-rose-500" />}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : q.type === 'mengurutkan' ? (
                            <div className="space-y-2">
                              {Array.isArray(studentAnswer) ? (
                                studentAnswer.map((optId, i) => {
                                  const option = q.options?.find(o => o.id === optId);
                                  const isCorrectPos = String(q.answer[i]) === String(optId);
                                  return (
                                    <div key={optId} className={cn(
                                      "flex items-center gap-3 p-3 rounded-xl border text-sm transition-all shadow-sm",
                                      isCorrectPos ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"
                                    )}>
                                      <span className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white",
                                        isCorrectPos ? "bg-emerald-500" : "bg-rose-500"
                                      )}>{i + 1}</span>
                                      <div className="flex-1 min-w-0 font-medium">
                                        <MathRenderer text={option?.text || "Opsi Hilang"} />
                                      </div>
                                      {!isCorrectPos && (
                                        <span className="ml-auto text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Harusnya: {q.answer.map((v: string | number) => String(v)).indexOf(String(optId)) + 1}</span>
                                      )}
                                    </div>
                                  );
                                })
                              ) : <p className="text-sm italic text-rose-500 font-medium">Siswa tidak mengurutkan item.</p>}
                            </div>
                           ) : q.type === 'menjodohkan' ? (
                             <div className="space-y-2">
                               {q.pairs?.map((pair) => {
                                 const studentMatchedText = studentAnswer?.[pair.id];
                                 const isPairCorrect = studentMatchedText && 
                                   String(studentMatchedText).trim().toLowerCase() === String(pair.right).trim().toLowerCase();
                                 
                                 return (
                                   <div key={pair.id} className="flex items-center gap-4 text-sm">
                                     <div className="flex-1 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 font-bold text-center shadow-sm">
                                       <MathRenderer text={pair.left} />
                                     </div>
                                     <div className="text-zinc-300 font-bold">→</div>
                                     <div className={cn(
                                       "flex-1 p-3 rounded-xl border font-bold text-center relative shadow-sm",
                                       isPairCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                                     )}>
                                       <MathRenderer text={studentMatchedText || "Tidak dijawab"} />
                                       {!isPairCorrect && (
                                         <div className="absolute -bottom-6 left-0 right-0 text-[9px] font-bold text-emerald-600 uppercase">
                                           Kunci: <MathRenderer text={pair.right} />
                                         </div>
                                       )}
                                     </div>
                                   </div>
                                 );
                               })}
                             </div>
                          ) : q.type === 'matrix' ? (
                            <div className="overflow-x-auto rounded-xl border border-zinc-200 shadow-sm bg-white dark:bg-zinc-900">
                              <table className="w-full text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-widest text-[10px] w-1/2">
                                      Pernyataan
                                    </th>
                                    <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-widest text-[10px]">
                                      Jawaban
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                  {q.rows?.map((row) => {
                                    const studentColId = studentAnswer?.[row.id];
                                    const correctColId = q.answer?.[row.id];
                                    const isRowCorrect = String(studentColId || "") === String(correctColId || "");
                                    
                                    const studentCol = q.columns?.find(c => String(c.id) === String(studentColId));
                                    const correctCol = q.columns?.find(c => String(c.id) === String(correctColId));

                                    return (
                                      <tr key={row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-4 py-4 font-medium text-zinc-700 dark:text-zinc-300">
                                          <MathRenderer text={row.text} />
                                        </td>
                                        <td className="px-4 py-4">
                                          <div className="flex flex-col gap-1">
                                            <div className={cn(
                                              "flex items-center gap-2 font-bold",
                                              isRowCorrect ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                              {isRowCorrect ? (
                                                <CheckCircle className="w-3.5 h-3.5" />
                                              ) : (
                                                <XmarkCircle className="w-3.5 h-3.5" />
                                              )}
                                              <div className="flex-1">
                                                <MathRenderer text={studentCol?.text || "Tidak dijawab"} />
                                              </div>
                                            </div>
                                            {!isRowCorrect && (
                                              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5 uppercase tracking-tight">
                                                <span className="opacity-50 text-[8px]">Kunci:</span>
                                                <div className="flex-1">
                                                  <MathRenderer text={correctCol?.text || "???"} />
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : q.type === 'bs' ? (
                            <div className="flex gap-3">
                              <Badge variant="outline" className={cn("px-4 py-1.5 rounded-lg font-bold border-2", Boolean(studentAnswer) === true && studentAnswer !== null ? (Boolean(q.answer) === true ? "bg-emerald-500 text-white border-emerald-600" : "bg-rose-500 text-white border-rose-600") : "bg-zinc-50 text-zinc-400 opacity-50 border-zinc-200")}>BENAR</Badge>
                              <Badge variant="outline" className={cn("px-4 py-1.5 rounded-lg font-bold border-2", Boolean(studentAnswer) === false && studentAnswer !== null ? (Boolean(q.answer) === false ? "bg-emerald-500 text-white border-emerald-600" : "bg-rose-500 text-white border-rose-600") : "bg-zinc-50 text-zinc-400 opacity-50 border-zinc-200")}>SALAH</Badge>
                            </div>
                          ) : (
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 shadow-sm min-h-[100px]">
                                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                  {studentAnswer ? <MathRenderer text={studentAnswer} /> : "Tidak ada jawaban."}
                                </div>
                            </div>
                          )}

                        </div>

                        {q.explanation && (
                          <div className="mt-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 block mb-2">Pembahasan:</span>
                            <div className="text-sm italic font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                              <MathRenderer text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[9px] font-bold uppercase shrink-0 px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 text-zinc-500">
                      {q.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="p-6 border-t bg-white dark:bg-zinc-950 flex justify-end shrink-0">
          <DialogClose asChild>
            <Button variant="ghost" className="rounded-xl font-bold">
              Tutup
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
