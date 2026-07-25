"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Trash, Group, NavArrowRight } from "iconoir-react";
import { toast } from "sonner";
import { deleteClassSupabase as deleteClass } from "@/actions/classes-supabase";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal";

interface ClassCardProps {
  id: string;
  name: string;
  description?: string;
  code: string;
  studentCount: number;
  createdAt: string;
}

export function ClassCard({ id: classId, name, description, code, studentCount, createdAt }: ClassCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { onOpen } = useModal();

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Berhasil!", { description: "Kode kelas berhasil disalin" });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteClass(classId);
    if (result.success) {
      toast.success("Berhasil!", { description: "Kelas berhasil dihapus" });
    } else {
      toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menghapus kelas" });
      setIsDeleting(false);
    }
  };

  return (
    <Card className="h-full border shadow-sm flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl leading-none">{name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {description || "Tidak ada deskripsi kelas."}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors -mt-1 -mr-2"
            disabled={isDeleting}
            aria-label="Hapus Kelas"
            onClick={() => onOpen("alert", {
              title: "Hapus Kelas?",
              description: "Tindakan ini tidak dapat dibatalkan. Ini akan menghapus kelas secara permanen dan mengeluarkan semua siswa dari kelas ini.",
              confirmText: "Hapus",
              onConfirm: handleDelete
            })}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Group className="w-4 h-4" />
          <span>{studentCount} Siswa</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50 border">
          <span className="text-xs font-medium text-muted-foreground uppercase">Kode</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 hover:bg-background"
            onClick={copyCode}
          >
            <span className="font-mono text-sm font-semibold">{code}</span>
            <Copy className="w-3 h-3 ml-2 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 pt-4 border-t bg-muted/5">
        <div className="text-xs text-muted-foreground">
          {format(new Date(createdAt), "d MMM yyyy", { locale: id })}
        </div>
        <Link href={`/dashboard/guru/classes/${classId}`}>
          <Button size="sm" className="gap-2">
            Kelola
            <NavArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
