"use client";

import { MathRenderer } from "@/components/ui/math-renderer";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { ExamQuestion, QuestionOption, MatchingPair, MatrixRow, MatrixColumn, Passage } from "@/types/exam";

interface QuestionLivePreviewProps {
  data: Partial<ExamQuestion> & { topicId?: string };
  isNewPassage?: boolean;
  draftPassageTitle?: string;
  draftPassageContent?: string;
  draftPassageImageUrl?: string | null;
  availablePassages?: Passage[];
}

export function QuestionLivePreview({ 
  data,
  isNewPassage,
  draftPassageTitle,
  draftPassageContent,
  draftPassageImageUrl,
  availablePassages
}: QuestionLivePreviewProps) {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pg': return "Pilihan Ganda";
      case 'pg_kompleks': return "PG Kompleks";
      case 'bs': return "Benar/Salah";
      case 'menjodohkan': return "Menjodohkan";
      case 'mengurutkan': return "Mengurutkan";
      case 'essay': return "Essay";
      case 'matrix': return "Matriks / Tabel";
      case 'short_answer': return "Isian Singkat";
      default: return type;
    }
  };

  // Resolve passage data
  const passageData = isNewPassage 
    ? { title: draftPassageTitle, content: draftPassageContent, imageUrl: draftPassageImageUrl || null }
    : data.passageId && availablePassages 
      ? availablePassages.find(p => p.id === data.passageId)
      : null;

  const passageImageUrl =
    passageData &&
    typeof passageData.imageUrl === "string" &&
    passageData.imageUrl.trim()
      ? passageData.imageUrl.trim()
      : null;

  return (
    <div className="sticky top-0 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Preview (Student Mode)</span>
      </div>

      {passageData && (passageData.title || passageData.content || passageImageUrl) && (
        <div className="border-4 border-neo-border bg-zinc-50 dark:bg-zinc-900 shadow-[8px_8px_0px_0px_var(--neo-border)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-indigo-600 border-b-4 border-neo-border p-3">
            <h3 className="text-xs font-black italic uppercase tracking-widest text-white">
              WACANA
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {passageData.title && (
              <h4 className="text-xl font-black leading-tight tracking-tight text-foreground uppercase italic border-b-2 border-neo-border/20 pb-2">
                {passageData.title}
              </h4>
            )}
            {passageImageUrl && (
              <div className="border-4 border-neo-border p-2 bg-white dark:bg-zinc-950 shadow-[4px_4px_0px_0px_var(--neo-border)] flex justify-center overflow-hidden">
                <img
                  src={passageImageUrl}
                  alt=""
                  className="max-w-full max-h-[280px] object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://placehold.co/600x400?text=URL+Gambar+Tidak+Valid";
                  }}
                />
              </div>
            )}
            <div className="text-sm font-medium leading-relaxed text-foreground/80">
              <MathRenderer text={passageData.content || ""} />
            </div>
          </div>
        </div>
      )}

      <Card className="border-4 border-neo-border rounded-none shadow-[8px_8px_0px_0px_var(--neo-border)] overflow-hidden bg-white dark:bg-zinc-950">
        <CardHeader className="bg-yellow-400 border-b-4 border-neo-border p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black italic uppercase tracking-tighter text-black">
              PERTANYAAN
            </h2>
            <Badge className="rounded-none border-2 border-black bg-white text-black text-[10px] font-black uppercase hover:bg-white">
              {getTypeLabel(data.type || "")}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {data.imageUrl && (
            <div className="border-4 border-neo-border p-2 bg-zinc-50 dark:bg-zinc-900 shadow-[4px_4px_0px_0px_var(--neo-border)] flex items-center justify-center min-h-[150px]">
              <img 
                src={data.imageUrl} 
                alt="Question media" 
                className="max-w-full max-h-[300px] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/600x400?text=URL+Gambar+Tidak+Valid";
                }}
              />
            </div>
          )}

          <div className="text-lg font-bold leading-tight text-foreground">
            {data.text ? (
              <MathRenderer text={data.text} />
            ) : (
              <span className="text-zinc-300 italic">Belum ada pertanyaan...</span>
            )}
          </div>

          {/* Type Specific Content */}
          {(data.type === 'pg' || data.type === 'pg_kompleks' || data.type === 'mengurutkan') && (
            <div className="space-y-3">
              {data.options && data.options.length > 0 ? (
                data.options.map((opt, i) => {
                  const isCorrect = data.type === 'pg' 
                    ? data.answer === opt.id 
                    : data.type === 'pg_kompleks' 
                      ? Array.isArray(data.answer) && data.answer.includes(opt.id)
                      : false;
                  return (
                  <div 
                    key={opt.id} 
                    className={cn(
                      "flex flex-col gap-3 p-4 border-4 border-neo-border transition-all",
                      "hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_var(--neo-border)]",
                      data.type === 'mengurutkan' ? "bg-cyan-50 border-cyan-500" : "bg-white dark:bg-zinc-900",
                      isCorrect && "ring-2 ring-green-500 ring-offset-2 bg-green-50 dark:bg-green-950/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      {data.type !== 'pg_kompleks' && (
                        <div className={cn(
                          "w-8 h-8 shrink-0 border-2 border-neo-border flex items-center justify-center font-black text-sm",
                          isCorrect ? "bg-green-600 text-white border-green-600" : "bg-black text-white"
                        )}>
                          {data.type === 'mengurutkan' ? i + 1 : String.fromCharCode(65 + i)}
                        </div>
                      )}
                      <div className="font-bold flex-1">
                        <MathRenderer text={opt.text || `Opsi ${data.type === 'pg_kompleks' ? i + 1 : String.fromCharCode(65 + i)}...`} />
                      </div>
                      {isCorrect && (
                        <span className="text-[10px] font-black uppercase text-green-600 shrink-0">✓ Kunci</span>
                      )}
                    </div>
                    
                    {opt.imageUrl && (
                      <div className="ml-12 border-2 border-neo-border p-1 bg-zinc-50 dark:bg-zinc-800 shadow-[2px_2px_0px_0px_var(--neo-border)] inline-block self-start max-w-full overflow-hidden">
                        <img 
                          src={opt.imageUrl} 
                          alt={`Option ${String.fromCharCode(65 + i)}`}
                          className="max-h-[150px] object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/200x150?text=Error";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  );
                })
              ) : (
                <div className="p-4 border-4 border-dashed border-zinc-200 text-zinc-400 text-center font-bold text-sm">
                  Belum ada opsi
                </div>
              )}
            </div>
          )}

          {data.type === 'short_answer' && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Jawaban Singkat (Contoh Benar)
              </p>
              <div className="p-4 border-4 border-neo-border bg-zinc-50 dark:bg-zinc-900 shadow-[4px_4px_0px_0px_var(--neo-border)] text-sm font-medium min-h-[60px]">
                {Array.isArray((data as any).shortAnswerConfig?.acceptableAnswers) &&
                (data as any).shortAnswerConfig.acceptableAnswers.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {(data as any).shortAnswerConfig.acceptableAnswers.map((ans: string, idx: number) => (
                      <li key={idx}><MathRenderer text={ans} /></li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-zinc-400 italic">
                    Belum ada daftar jawaban benar. Siswa akan mengisi teks pendek sebagai jawaban.
                  </span>
                )}
              </div>
            </div>
          )}

          {data.type === 'bs' && (
            <div className="grid grid-cols-2 gap-4">
              <div className={cn(
                "p-4 border-4 border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)] text-center font-black italic uppercase relative",
                data.answer === true ? "bg-emerald-200 dark:bg-emerald-900 ring-2 ring-green-500 ring-offset-2" : "bg-emerald-100 dark:bg-emerald-950"
              )}>
                Benar
                {data.answer === true && <span className="absolute top-2 right-2 text-green-600 text-sm">✓</span>}
              </div>
              <div className={cn(
                "p-4 border-4 border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)] text-center font-black italic uppercase relative",
                data.answer === false ? "bg-rose-200 dark:bg-rose-900 ring-2 ring-rose-500 ring-offset-2" : "bg-rose-100 dark:bg-rose-950"
              )}>
                Salah
                {data.answer === false && <span className="absolute top-2 right-2 text-rose-600 text-sm">✓</span>}
              </div>
            </div>
          )}

          {data.type === 'menjodohkan' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase text-zinc-400 text-center mb-2 tracking-widest">KIRIMAN</div>
                  {data.pairs && data.pairs.length > 0 ? (
                    data.pairs.map((pair) => (
                      <div key={`left-${pair.id}`} className="p-3 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-xs min-h-[60px] flex items-center justify-center text-center">
                        <MathRenderer text={pair.left || "Item Kiri"} />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 border-4 border-dashed border-zinc-200 text-zinc-400 text-center font-bold text-xs uppercase italic">Belum ada item</div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-[10px] font-black uppercase text-zinc-400 text-center mb-2 tracking-widest">PASANGAN</div>
                  {data.pairs && data.pairs.length > 0 ? (
                    [...data.pairs].map((pair) => (
                      <div key={`right-${pair.id}`} className="p-3 border-4 border-black bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-xs min-h-[60px] flex items-center justify-center text-center">
                        <MathRenderer text={pair.right || "Item Kanan"} />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 border-4 border-dashed border-zinc-200 text-zinc-400 text-center font-bold text-xs uppercase italic">Belum ada item</div>
                  )}
                </div>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 text-center italic mt-2 uppercase tracking-tight">* Siswa akan menarik garis atau memilih pasangan secara interaktif</p>
            </div>
          )}

          {data.type === 'matrix' && (
            <div className="border-4 border-neo-border overflow-hidden shadow-[4px_4px_0px_0px_var(--neo-border)]">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] sm:text-xs min-w-[300px]">
                  <thead className="bg-black text-white border-b-4 border-neo-border">
                    <tr>
                      <th className="p-2 sm:p-3 text-left italic uppercase font-black">Pernyataan</th>
                      {data.columns?.map(col => (
                        <th key={col.id} className="p-2 sm:p-3 text-center italic uppercase font-black min-w-[80px]">
                          <MathRenderer text={col.text || "..."} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-neo-border bg-white dark:bg-zinc-900">
                    {data.rows && data.rows.length > 0 ? (
                      data.rows.map(row => (
                        <tr key={row.id}>
                          <td className="p-2 sm:p-3 font-bold border-r-2 border-neo-border">
                            <MathRenderer text={row.text || "Pernyataan..."} />
                          </td>
                          {data.columns?.map(col => {
                            const answerMap = (data.answer || {}) as Record<string, string>;
                            const isSelected = answerMap[row.id] === col.id;
                            return (
                            <td key={col.id} className="p-2 sm:p-3">
                              <div className="flex justify-center">
                                {isSelected ? (
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-black">✓</div>
                                ) : (
                                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-neo-border rounded-full" />
                                )}
                              </div>
                            </td>
                            );
                          })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={(data.columns?.length || 0) + 1} className="p-4 text-center font-bold text-zinc-400">
                          Belum ada baris pernyataan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.type === 'essay' && (
            <div className="space-y-4">
              <div className="border-4 border-neo-border p-4 bg-zinc-50 dark:bg-zinc-900 shadow-[4px_4px_0px_0px_var(--neo-border)] min-h-[80px]">
                <div className="text-zinc-400 font-mono text-xs uppercase font-black mb-2 italic">Jawaban Anda...</div>
              </div>
              {(data.answer && typeof data.answer === "string" && data.answer.trim()) || ((data as any).essayConfig?.keywords?.length ?? 0) > 0 ? (
                <div className="border-4 border-neo-border p-4 bg-amber-50 dark:bg-amber-950/30 shadow-[4px_4px_0px_0px_var(--neo-border)]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">Kunci Jawaban (Preview Guru)</p>
                  {data.answer && typeof data.answer === "string" && data.answer.trim() ? (
                    <div className="text-sm font-medium mb-3">
                      <MathRenderer text={data.answer} />
                    </div>
                  ) : null}
                  {Array.isArray((data as any).essayConfig?.keywords) && (data as any).essayConfig.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {(data as any).essayConfig.keywords.map((kw: { text: string; type?: string }, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 text-xs font-bold bg-amber-200 dark:bg-amber-800 rounded border border-amber-400">
                          {kw.text}
                          {kw.type === "required" && " *"}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-400 italic">Belum ada kunci jawaban atau kata kunci</p>
              )}
            </div>
          )}

          {data.explanation && (
            <div className="mt-8 border-t-4 border-neo-border pt-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="inline-block bg-black text-white px-3 py-1 text-[10px] font-black uppercase italic mb-3">
                PEMBAHASAN (GURU)
              </div>
              <div className="p-4 border-4 border-neo-border bg-indigo-50 dark:bg-indigo-950 shadow-[4px_4px_0px_0px_var(--neo-border)] text-sm italic font-medium">
                <MathRenderer text={data.explanation} />
              </div>
            </div>
          )}
        </CardContent>

        <div className="h-4 bg-neo-border flex border-t-4 border-neo-border">
          <div className="flex-1 bg-indigo-600 border-r-2 border-neo-border"></div>
          <div className="flex-1 bg-cyan-400 border-r-2 border-neo-border"></div>
          <div className="flex-1 bg-yellow-400 border-r-2 border-neo-border"></div>
          <div className="flex-1 bg-rose-500"></div>
        </div>
      </Card>
      
      <p className="text-[10px] text-zinc-400 text-center font-medium">
        Tampilan di atas adalah simulasi apa yang akan dilihat oleh siswa.
      </p>
    </div>
  );
}
