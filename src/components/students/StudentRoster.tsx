"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Search, ShareAndroid, Group, Check, Xmark, EditPencil, UserXmark } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DataPagination } from "@/components/ui/data-pagination";
import { useState, useTransition } from "react";
import { updateStudentName } from "@/actions/users-supabase";
import { Input } from "@/components/ui/input";
import { useModal } from "@/hooks/use-modal";
import { removeStudentFromClassSupabase as removeStudentFromClass } from "@/actions/enrollment-supabase";

interface Student {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  joinedAt: string;
}

interface StudentRosterProps {
  students: Student[];
  classId: string;
  classCode: string;
  totalPages: number;
  currentPage: number;
  totalCount: number;
  totalEnrolled: number;
}

export function StudentRoster({ 
  students, 
  classId, 
  classCode,
  totalPages,
  currentPage,
  totalCount,
  totalEnrolled
}: StudentRosterProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isPending, startTransition] = useTransition();
  const { onOpen } = useModal();

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setTempName(student.name);
  };

  const handleCancel = () => {
    setEditingId(null);
    setTempName("");
  };

  const handleSave = (studentId: string) => {
    if (!tempName.trim()) {
      toast.error("Nama tidak boleh kosong");
      return;
    }
    if (tempName.length < 3) {
      toast.error("Nama minimal 3 karakter");
      return;
    }

    startTransition(async () => {
      const result = await updateStudentName(studentId, tempName);
      if (result.success) {
        toast.success("Nama siswa diperbarui");
        setEditingId(null);
      } else {
        toast.error(result.error || "Gagal memperbarui nama");
      }
    });
  };

  const copyClassCode = () => {
    navigator.clipboard.writeText(classCode);
    toast.success("Kode kelas disalin ke clipboard!");
  };

  if (totalEnrolled === 0) {
    return (
      <Card className="border-2 border-dashed rounded-3xl bg-muted/5 py-12">
        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Group className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Belum ada siswa</h3>
            <p className="text-muted-foreground max-w-sm">
              Bagikan kode kelas di bawah ini agar siswa dapat bergabung dengan kelas Anda.
            </p>
          </div>
          <Button 
            onClick={copyClassCode}
            variant="outline" 
            className="rounded-2xl border-2 gap-2 mt-4 hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
          >
            <ShareAndroid className="w-4 h-4" />
            Salin Kode: <span className="font-mono font-bold">{classCode}</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0 && totalEnrolled > 0) {
    return (
      <Card className="border-2 border-dashed rounded-3xl bg-muted/5 py-12">
        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Siswa tidak ditemukan</h3>
            <p className="text-muted-foreground max-w-sm">
              Tidak ada siswa yang cocok dengan kriteria pencarian Anda.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2 rounded-3xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent border-b-2">
              <TableHead className="font-bold text-foreground">Siswa</TableHead>
              <TableHead className="font-bold text-foreground text-center">Level</TableHead>
              <TableHead className="font-bold text-foreground text-center">XP</TableHead>
              <TableHead className="font-bold text-foreground hidden md:table-cell">Tanggal Bergabung</TableHead>
              <TableHead className="font-bold text-foreground text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id} className="group border-b-2 transition-colors hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {student.name ? student.name.substring(0, 2).toUpperCase() : "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      {editingId === student.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="h-8 max-w-[300px] rounded-xl text-sm font-bold focus-visible:ring-1"
                            autoFocus
                            disabled={isPending}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(student.id);
                              if (e.key === "Escape") handleCancel();
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Simpan nama"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all"
                            onClick={() => handleSave(student.id)}
                            disabled={isPending}
                          >
                            <Check className="h-4 w-4 stroke-[3]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Batal"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                            onClick={handleCancel}
                            disabled={isPending}
                          >
                            <Xmark className="h-4 w-4 stroke-[3]" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/name">
                          <span 
                            className="font-bold text-sm tracking-tight cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleStartEdit(student)}
                          >
                            {student.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit nama"
                            className="h-6 w-6 opacity-0 group-hover/name:opacity-100 transition-all rounded-lg"
                            onClick={() => handleStartEdit(student)}
                          >
                            <EditPencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">{student.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="rounded-lg font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none">
                    LVL {student.level}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono font-medium text-sm">{student.xp.toLocaleString()} XP</span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {format(new Date(student.joinedAt), "dd MMM yyyy", { locale: id })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label="Keluarkan Siswa"
                    onClick={() => onOpen("alert", {
                      title: "Keluarkan Siswa?",
                      description: `Apakah Anda yakin ingin mengeluarkan ${student.name} dari kelas ini? Siswa tidak akan lagi memiliki akses ke materi dan tugas kelas ini.`,
                      confirmText: "Ya, Keluarkan",
                      onConfirm: async () => {
                        try {
                          const result = await removeStudentFromClass(classId, student.id);
                          if (result.success) {
                            toast.success(`Berhasil mengeluarkan ${student.name} dari kelas`);
                          } else {
                            toast.error(result.error || "Gagal mengeluarkan siswa");
                          }
                        } catch (error) {
                          console.error("Remove student error:", error);
                          toast.error("Terjadi kesalahan sistem");
                        }
                      }
                    })}
                  >
                    <UserXmark className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <DataPagination 
        totalPages={totalPages} 
        currentPage={currentPage} 
      />
    </div>
  );
}
