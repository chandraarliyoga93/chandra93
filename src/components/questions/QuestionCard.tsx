"use client";

import { Question, deleteQuestionSupabase } from "@/actions/questions-supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  Trash, 
  EditPencil, 
  CheckCircle, 
  XmarkCircle,
  QuestionMark,
  Menu,
  MoreHoriz
} from "iconoir-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { MathRenderer } from "@/components/ui/math-renderer";

interface QuestionCardProps {
  question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleCopy = () => {
    let text = `${question.text}\n\n`;
    
    if (question.type === 'pg' || question.type === 'pg_kompleks') {
      question.options?.forEach((opt, i) => {
        text += `${String.fromCharCode(65 + i)}. ${opt.text}\n`;
      });
    } else if (question.type === 'bs') {
      text += "A. Benar\nB. Salah\n";
    } else if (question.type === 'menjodohkan') {
      question.pairs?.forEach((pair) => {
        text += `- ${pair.left} = [....]\n`;
      });
    }

    navigator.clipboard.writeText(text);
    toast.success("Berhasil!", { description: "Teks soal berhasil disalin" });
  };

  const handleDelete = () => {
    if (confirm("Hapus pertanyaan ini dari bank soal?")) {
      startTransition(async () => {
        const result = await deleteQuestionSupabase(question.id);
        if (result.success) {
          toast.success("Berhasil!", { description: "Pertanyaan dihapus" });
        } else {
          toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus" });
        }
      });
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'pg': return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case 'pg_kompleks': return "bg-sky-100 text-sky-700 border-sky-200";
      case 'bs': return "bg-amber-100 text-amber-700 border-amber-200";
      case 'menjodohkan': return "bg-indigo-100 text-indigo-700 border-indigo-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pg': return "Pilihan Ganda";
      case 'pg_kompleks': return "PG Kompleks";
      case 'bs': return "Benar/Salah";
      case 'menjodohkan': return "Menjodohkan";
      case 'essay': return "Essay";
      default: return type;
    }
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start gap-4 mb-4">
          <Badge variant="outline" className={cn("font-semibold uppercase text-[10px]", getBadgeVariant(question.type))}>
            {getTypeLabel(question.type)}
          </Badge>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleCopy} title="Salin Teks">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Edit">
              <EditPencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDelete} disabled={isPending} title="Hapus">
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {question.imageUrl && (
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-zinc-100 bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 flex items-center justify-center">
              <img 
                src={question.imageUrl} 
                alt="Question media" 
                className="max-w-full max-h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/600x400?text=Gambar+Gagal+Dimuat";
                }}
              />
            </div>
          )}

          <div className="font-medium text-foreground leading-relaxed">
            <MathRenderer text={question.text} />
          </div>

          {/* Type Specific Content */}
          {(question.type === 'pg' || question.type === 'pg_kompleks') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {question.options?.map((opt, i) => (
                <div 
                  key={opt.id} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-sm",
                    (Array.isArray(question.answer) ? question.answer.includes(opt.id) : question.answer === opt.id)
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold"
                      : "bg-muted/30 border-transparent"
                  )}
                >
                  <span className="w-6 h-6 rounded-full bg-background border flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <MathRenderer text={opt.text} />
                </div>
              ))}
            </div>
          )}

          {question.type === 'bs' && (
            <div className="flex gap-4 mt-2">
              <Badge variant={question.answer === true ? "default" : "outline"} className={cn(question.answer === true && "bg-emerald-600")}>BENAR</Badge>
              <Badge variant={question.answer === false ? "default" : "outline"} className={cn(question.answer === false && "bg-rose-600")}>SALAH</Badge>
            </div>
          )}

           {question.type === 'menjodohkan' && (
            <div className="space-y-2 mt-2">
              {question.pairs?.map((pair) => (
                <div key={pair.id} className="flex items-center gap-4 text-sm">
                  <div className="flex-1 p-2 bg-muted/50 rounded border text-center">
                    <MathRenderer text={pair.left} />
                  </div>
                  <div className="w-4 h-px bg-muted-foreground/30" />
                  <div className="flex-1 p-2 bg-primary/5 border border-primary/20 rounded text-center font-semibold text-primary">
                    <MathRenderer text={pair.right} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {question.explanation && (
            <div className="mt-6 p-4 bg-muted/30 border rounded-lg text-xs italic text-muted-foreground">
              <span className="font-bold uppercase not-italic block mb-1">Pembahasan:</span>
              <MathRenderer text={question.explanation} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
