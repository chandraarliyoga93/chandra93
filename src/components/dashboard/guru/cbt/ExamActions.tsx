"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVert, Plus, Settings, Trash, Edit, Eye, Book, Database, Calendar } from "iconoir-react";
import { CreateExamDialog } from "@/components/dashboard/guru/cbt/CreateExamDialog";
import { CreateQuestionDialog } from "@/components/questions/CreateQuestionDialog";
import { ExamQuestionsDialog } from "@/components/dashboard/guru/cbt/ExamQuestionsDialog";
import { deleteExamSupabase } from "@/actions/exam-supabase";
import { toast } from "sonner";
import { useTransition } from "react";
import { Exam } from "@/types/exam";
import { ClassData } from "@/actions/classes-supabase";
import { useModal } from "@/hooks/use-modal";
import Link from "next/link";

interface ExamActionsProps {
  exam: Exam;
  classes: ClassData[];
}

export function ExamActions({ exam, classes }: ExamActionsProps) {
  const [isPending, startTransition] = useTransition();
  const { onOpen } = useModal();

  const handleDelete = () => {
    onOpen("alert", {
      title: "Hapus Ujian?",
      description: "Tindakan ini tidak dapat dibatalkan. Semua data hasil ujian siswa juga akan hilang.",
      confirmText: "Hapus",
      onConfirm: async () => {
        const result = await deleteExamSupabase(exam.id!);
        if (result.success) {
          toast.success("Berhasil!", { description: "Ujian berhasil dihapus" });
        } else {
          toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus ujian" });
        }
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <ExamQuestionsDialog 
        exam={exam}
        trigger={
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title="Daftar Soal"
          >
            <Book className="w-4 h-4 text-zinc-400" />
          </Button>
        }
      />

      <CreateExamDialog 
        classes={classes}
        initialData={exam}
        trigger={
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            title="Pengaturan Ujian"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
          </Button>
        }
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <MoreVert className="w-4 h-4 text-zinc-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl border-zinc-200 shadow-xl w-48">
          <DropdownMenuItem asChild>
            <CreateQuestionDialog 
              examId={exam.id}
              trigger={
                <div className="flex items-center gap-2 px-2 py-1.5 cursor-pointer w-full font-bold text-xs uppercase tracking-tight">
                  <Plus className="w-3.5 h-3.5" />
                  Tambah Soal
                </div>
              }
            />
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <ExamQuestionsDialog 
              exam={exam}
              trigger={
                <div className="flex items-center gap-2 px-2 py-1.5 cursor-pointer w-full font-bold text-xs uppercase tracking-tight text-zinc-600 dark:text-zinc-300">
                  <Book className="w-3.5 h-3.5" />
                  Lihat Soal
                </div>
              }
            />
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <CreateExamDialog 
              classes={classes}
              initialData={exam}
              trigger={
                <div className="flex items-center gap-2 px-2 py-1.5 cursor-pointer w-full font-bold text-xs uppercase tracking-tight">
                  <Edit className="w-3.5 h-3.5" />
                  Edit Ujian
                </div>
              }
            />
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link 
              href={`/dashboard/guru/cbt/${exam.id}`}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer w-full font-bold text-xs uppercase tracking-tight"
            >
              <Calendar className="w-3.5 h-3.5" />
              Kelola Penugasan
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link 
              href={`/dashboard/guru/cbt/${exam.id}/results`}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer w-full font-bold text-xs uppercase tracking-tight"
            >
              <Eye className="w-3.5 h-3.5" />
              Lihat Hasil
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/guru/cbt/${exam.id}/monitoring`}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer w-full font-bold text-xs uppercase tracking-tight"
            >
              <Database className="w-3.5 h-3.5" />
              Live Monitor
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem 
            className="font-bold text-xs uppercase tracking-tight gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash className="w-3.5 h-3.5" />
            Hapus Ujian
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

