import { getExamFullInfoSupabase, getExamResultsSupabase, updateEssayScoreSupabase } from "@/actions/exam-supabase";
import { id as idLocale } from "date-fns/locale";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { NavArrowLeft } from "iconoir-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default async function EssayGradingPage({
  params,
}: {
  params: Promise<{ id: string; questionId: string }>;
}) {
  const { id, questionId } = await params;

  const [infoRes, resultsRes] = await Promise.all([
    getExamFullInfoSupabase(id),
    getExamResultsSupabase(id, { pageSize: 100 }),
  ]);

  if (!infoRes.success || !infoRes.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-lg font-bold">Ujian tidak ditemukan</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/guru/cbt/${id}/results`}>Kembali ke hasil ujian</Link>
        </Button>
      </div>
    );
  }

  const exam = infoRes.data;
  const question = exam.questions.find((q: any) => q.id === questionId);
  if (!question || question.type !== "essay") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-lg font-bold">Soal essay tidak ditemukan</p>
        <Button asChild variant="outline">
          <Link href={`/dashboard/guru/cbt/${id}/results`}>Kembali ke hasil ujian</Link>
        </Button>
      </div>
    );
  }

  const attempts = (resultsRes.success ? resultsRes.data : []) || [];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href={`/dashboard/guru/cbt/${id}/results`}>
            <NavArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Kembali ke hasil ujian
          </p>
          <h1 className="text-xl font-black tracking-tight">
            Koreksi Essay - {exam.title}
          </h1>
          <p className="text-xs text-zinc-500 font-medium">
            Soal: <span className="font-semibold">{question.text}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {attempts.length === 0 ? (
          <p className="text-zinc-500 text-sm italic">
            Belum ada siswa yang mengerjakan ujian ini.
          </p>
        ) : (
          attempts.map((attempt: any) => {
            const rawAnswer = attempt.answers?.[questionId];
            const perQScore = attempt.perQuestionScores?.[questionId];
            const maxPts =
              (question as any).essayConfig?.maxPoints ??
              (question as any).maxPoints ??
              1;

            const initialAutoScore = typeof perQScore === "number" ? perQScore : undefined;

            // NOTE: This is a server component stub. For full interactivity,
            // this page should be refactored to a client component or a client
            // wrapper that calls updateEssayScore via useTransition/server actions.

            return (
              <div
                key={attempt.id}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">
                      {attempt.studentName || "Siswa"}
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                      Selesai:{" "}
                      {attempt.submittedAt
                        ? format(
                            new Date(
                              (attempt.submittedAt as any)?.toDate
                                ? (attempt.submittedAt as any).toDate()
                                : attempt.submittedAt,
                            ),
                            "dd MMM yyyy HH:mm",
                            { locale: idLocale },
                          )
                        : "-"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        typeof initialAutoScore === "number"
                          ? "border-emerald-500 text-emerald-600"
                          : "border-zinc-300 text-zinc-500",
                      )}
                    >
                      Auto:{" "}
                      {typeof initialAutoScore === "number"
                        ? `${initialAutoScore.toFixed(2)} / ${maxPts}`
                        : "Belum dihitung"}
                    </Badge>
                    {typeof attempt.perQuestionScores?.[questionId] === "number" && (
                      <Badge className="text-[10px] font-bold uppercase">
                        Override:{" "}
                        {attempt.perQuestionScores?.[questionId]?.toFixed(2)} / {maxPts}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Jawaban Siswa
                  </p>
                  <div className="rounded-xl border bg-zinc-50 dark:bg-zinc-900 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {rawAnswer ? String(rawAnswer) : <span className="italic text-zinc-400">Tidak ada jawaban</span>}
                  </div>
                </div>

                <form
                  action={async (formData) => {
                    "use server";
                    const scoreStr = formData.get("score") as string;
                    const score = parseFloat(scoreStr);
                    if (!Number.isFinite(score)) return;
                    await updateEssayScoreSupabase(id, attempt.id!, questionId, score);
                  }}
                  className="flex items-center justify-end gap-3 pt-2"
                >
                  <Input
                    type="number"
                    name="score"
                    min={0}
                    max={maxPts}
                    step={0.1}
                    defaultValue={
                      typeof attempt.perQuestionScores?.[questionId] === "number"
                        ? attempt.perQuestionScores[questionId]
                        : initialAutoScore ?? 0
                    }
                    className="w-24 h-9 text-sm font-bold text-right"
                  />
                  <Button type="submit" size="sm" className="h-9 text-xs font-bold">
                    Simpan Skor
                  </Button>
                </form>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

