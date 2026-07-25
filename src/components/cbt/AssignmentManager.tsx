"use client";

import { useState, useTransition } from "react";
import { ExamAssignment } from "@/types/exam";
import { ClassData } from "@/actions/classes-supabase";
import { 
  Plus, 
  Trash, 
  Clock, 
  Calendar, 
  Eye, 
  NavArrowDown
} from "iconoir-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  assignExamToClassesAction, 
  updateAssignmentStatusAction, 
  deleteAssignmentAction 
} from "@/actions/exam-assignment";
import { id as idLocale } from "date-fns/locale";

interface AssignmentManagerProps {
  examId: string;
  assignments: ExamAssignment[];
  availableClasses: ClassData[];
}

export function AssignmentManager({ 
  examId, 
  assignments, 
  availableClasses 
}: AssignmentManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Add Assignment Form State
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  const handleAddAssignment = async () => {
    if (selectedClasses.length === 0) {
      toast.error("Pilih setidaknya satu kelas");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("Atur waktu mulai dan selesai");
      return;
    }

    startTransition(async () => {
      const result = await assignExamToClassesAction({
        examId,
        classIds: selectedClasses,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: isPublished ? "PUBLISHED" : "DRAFT",
      });

      if (result.success) {
        toast.success("Penugasan Berhasil!", {
          description: `Ujian telah ditugaskan ke ${result.count} kelas.`,
        });
        setIsAddOpen(false);
        setSelectedClasses([]);
        setStartTime("");
        setEndTime("");
        setIsPublished(false);
      } else {
        toast.error("Gagal Menugaskan", {
          description: result.error,
        });
      }
    });
  };

  const handleUpdateStatus = async (id: string, status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED") => {
    startTransition(async () => {
      const result = await updateAssignmentStatusAction(id, status);
      if (result.success) {
        toast.success("Status Diperbarui");
      } else {
        toast.error("Gagal memperbarui status");
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus penugasan ini?")) return;
    
    startTransition(async () => {
      const result = await deleteAssignmentAction(id);
      if (result.success) {
        toast.success("Penugasan Dihapus");
      } else {
        toast.error("Gagal menghapus penugasan");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-zinc-950 dark:text-zinc-50 tracking-tight uppercase">
            Penugasan Kelas
          </h3>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter">
            Kelola jadwal ujian untuk setiap kelas.
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2">
              <Plus className="w-4 h-4" />
              Tambah Penugasan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                Tambah Penugasan
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Pilih Kelas
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {availableClasses.map((cls) => (
                    <div 
                      key={cls.id} 
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer",
                        selectedClasses.includes(cls.id!) 
                          ? "bg-zinc-900 border-zinc-900 text-white dark:bg-white dark:border-white dark:text-zinc-950" 
                          : "bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800"
                      )}
                      onClick={() => {
                        setSelectedClasses(prev => 
                          prev.includes(cls.id!) 
                            ? prev.filter(id => id !== cls.id) 
                            : [...prev, cls.id!]
                        );
                      }}
                    >
                      <Checkbox 
                        checked={selectedClasses.includes(cls.id!)}
                        className="border-zinc-400 data-[state=checked]:bg-white data-[state=checked]:text-zinc-950"
                      />
                      <span className="text-xs font-bold truncate">{cls.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Mulai
                  </Label>
                  <Input 
                    type="datetime-local" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-bold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Selesai
                  </Label>
                  <Input 
                    type="datetime-local" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="rounded-xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-bold text-xs"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {isPublished ? <Eye className="w-4 h-4 text-emerald-500" /> : <Eye className="w-4 h-4 text-zinc-400" />}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase">Status Publikasi</span>
                    <span className="text-[8px] font-medium text-zinc-500 uppercase tracking-tighter">
                      {isPublished ? "Siswa dapat melihat ujian" : "Draft (Tersembunyi)"}
                    </span>
                  </div>
                </div>
                <Switch 
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                onClick={handleAddAssignment} 
                disabled={isPending}
                className="w-full rounded-xl font-bold uppercase text-[10px] tracking-widest"
              >
                {isPending ? "Sedang Memproses..." : "Simpan Penugasan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50/50 dark:bg-zinc-950/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Kelas</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Jadwal</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {assignments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic text-sm">
                  Belum ada kelas yang ditugaskan untuk ujian ini.
                </td>
              </tr>
            ) : (
              assignments.map((assignment) => (
                <tr key={assignment.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight">
                        {assignment.class?.name || "Unknown Class"}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium tracking-tight uppercase">ID: {assignment.classId.substring(0, 8)}...</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(assignment.startTime), "dd MMM yyyy", { locale: idLocale })}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 tracking-tighter uppercase">
                        <Clock className="w-3 h-3" />
                        {format(new Date(assignment.startTime), "HH:mm")} - {format(new Date(assignment.endTime), "HH:mm")}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={cn(
                            "rounded-full px-3 py-0.5 h-6 text-[9px] font-black uppercase tracking-widest gap-2",
                            assignment.status === "PUBLISHED" 
                              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/20"
                              : assignment.status === "DRAFT"
                              ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border border-zinc-200"
                              : "bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20"
                          )}
                        >
                          {assignment.status}
                          <NavArrowDown className="w-2.5 h-2.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="rounded-xl border-zinc-200 dark:border-zinc-800">
                        <DropdownMenuItem onClick={() => handleUpdateStatus(assignment.id, "DRAFT")} className="font-bold text-[10px] uppercase">
                          Set as Draft
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(assignment.id, "PUBLISHED")} className="font-bold text-[10px] uppercase text-emerald-600">
                          Publish
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(assignment.id, "CLOSED")} className="font-bold text-[10px] uppercase text-rose-600">
                          Close
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(assignment.id)}
                      className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
