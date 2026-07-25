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
import { Book, NavArrowRight, Eye } from "iconoir-react";
import { Exam } from "@/types/exam";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MathRenderer } from "@/components/ui/math-renderer";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExamQuestionsDialogProps {
  exam: Exam;
  trigger?: React.ReactNode;
}

export function ExamQuestionsDialog({ exam, trigger }: ExamQuestionsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl font-bold">
            <Book className="w-4 h-4" />
            Lihat Soal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
        <DialogHeader className="p-8 border-b bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                <Book className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">Daftar Pertanyaan</DialogTitle>
                <p className="text-sm text-zinc-500">{exam.title} • {(exam.questions || []).length} Soal</p>
              </div>
            </div>
            <Badge variant="outline" className="rounded-lg font-black px-3 py-1 uppercase text-[10px]">
              {exam.type}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          <div className="space-y-6">
            {(exam.questions || []).map((q, index) => (
              <div 
                key={q.id || index} 
                className="p-6 rounded-[1.5rem] border-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 w-full">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="space-y-4 flex-1 min-w-0">
                      <div className="text-base font-bold leading-relaxed text-zinc-900 dark:text-zinc-100">
                        <MathRenderer text={q.text} />
                      </div>
                      
                      {q.imageUrl && (
                        <div className="w-full max-w-md aspect-video rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                          <img src={q.imageUrl} alt="Question" className="w-full h-full object-contain" />
                        </div>
                      )}

                      {/* Options / Pairs */}
                      {q.type === 'pg' || q.type === 'pg_kompleks' || q.type === 'mengurutkan' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          {q.options?.map((opt, i) => {
                            const isCorrect = Array.isArray(q.answer) 
                              ? q.answer.includes(opt.id) 
                              : q.answer === opt.id;
                            
                            return (
                              <div 
                                key={opt.id} 
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-xl border text-sm transition-all",
                                  isCorrect 
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm shadow-emerald-500/10" 
                                    : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 text-zinc-500"
                                )}
                              >
                                <span className={cn(
                                  "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border",
                                  isCorrect ? "bg-emerald-500 text-white border-emerald-600" : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700"
                                )}>
                                  {q.type === 'mengurutkan' ? i + 1 : String.fromCharCode(65 + i)}
                                </span>
                                <div className="flex-1">
                                  <MathRenderer text={opt.text} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : q.type === 'menjodohkan' ? (
                        <div className="space-y-3 mt-4">
                          {q.pairs?.map((pair) => (
                            <div key={pair.id} className="flex items-center gap-4 text-sm">
                              <div className="flex-1 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center font-bold">
                                <MathRenderer text={pair.left} />
                              </div>
                              <div className="w-10 h-px bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                              <div className="flex-1 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center font-black text-emerald-600">
                                <MathRenderer text={pair.right} />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : q.type === 'bs' ? (
                        <div className="flex gap-3 mt-4">
                          <Badge className={cn("px-4 py-1.5 rounded-lg font-black", q.answer === true ? "bg-emerald-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500")}>BENAR</Badge>
                          <Badge className={cn("px-4 py-1.5 rounded-lg font-black", q.answer === false ? "bg-rose-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500")}>SALAH</Badge>
                        </div>
                      ) : (
                        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Kunci Jawaban Essay</p>
                           <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                             <MathRenderer text={String(q.answer)} />
                           </div>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block mb-2">Pembahasan:</span>
                          <div className="text-sm italic font-medium text-zinc-600 dark:text-zinc-400">
                            <MathRenderer text={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0 px-2 py-0.5 border-zinc-200 dark:border-zinc-800 text-zinc-400">
                    {q.type}
                  </Badge>
                </div>
              </div>
            ))}
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
