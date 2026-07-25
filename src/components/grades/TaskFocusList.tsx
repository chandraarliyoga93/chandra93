"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "@/actions/tasks-supabase";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { GradeCell } from "./GradeCell";
import { FeedbackButton } from "./FeedbackButton";
import { saveMatrixGrades } from "@/actions/grades-supabase";
import { toast } from "sonner";
import { Infinite, Flash, FloppyDisk, CheckCircle } from "iconoir-react";
import { useRouter } from "next/navigation";

interface Student {
  uid: string;
  name: string;
  email: string;
  photo?: string;
}

interface TaskFocusListProps {
  classId: string;
  students: Student[];
  tasks: Task[];
  grades: Record<string, { grade: number; feedback: string; rewardXP?: number; rewardBadgeId?: string }>;
  initialTaskId?: string;
}

export function TaskFocusList({ classId, students, tasks, grades, initialTaskId }: TaskFocusListProps) {
  const router = useRouter();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskId || tasks[0]?.id || "");
  const [localGrades, setLocalGrades] = useState<Record<string, { 
    grade: number; 
    feedback: string;
    rewardXP?: number;
    rewardBadgeId?: string;
  }>>(grades);
  const [originalGrades, setOriginalGrades] = useState(grades);
  const [fillGrade, setFillGrade] = useState<string>("80");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when props change
  useEffect(() => {
    setLocalGrades(grades);
    setOriginalGrades(grades);
  }, [grades]);

  // Sync selectedTaskId to URL
  useEffect(() => {
    if (!selectedTaskId) return;
    
    const currentUrl = new URL(window.location.href);
    const currentTaskId = currentUrl.searchParams.get('taskId');
    
    if (currentTaskId !== selectedTaskId) {
      currentUrl.searchParams.set('taskId', selectedTaskId);
      currentUrl.searchParams.set('view', 'focus');
      router.push(currentUrl.pathname + currentUrl.search, { scroll: false });
    }
  }, [selectedTaskId, router]);

  // Sync selectedTaskId from initialTaskId
  useEffect(() => {
    if (initialTaskId && initialTaskId !== selectedTaskId) {
      setSelectedTaskId(initialTaskId);
    }
  }, [initialTaskId, selectedTaskId]);

  const handleGradeChange = useCallback((
    taskId: string, 
    studentId: string, 
    value: number, 
    feedback: string,
    rewardXP?: number,
    rewardBadgeId?: string
  ) => {
    const key = `${taskId}_${studentId}`;
    setLocalGrades((prev) => ({
      ...prev,
      [key]: { 
        grade: value, 
        feedback,
        rewardXP: rewardXP !== undefined ? rewardXP : prev[key]?.rewardXP,
        rewardBadgeId: rewardBadgeId !== undefined ? rewardBadgeId : prev[key]?.rewardBadgeId
      },
    }));
  }, []);

  const handleBulkFill = () => {
    const numGrade = parseFloat(fillGrade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 100) {
      toast.error("Nilai tidak valid");
      return;
    }

    if (!confirm(`Set semua siswa ke nilai ${numGrade} untuk tugas ini? (Perubahan belum disimpan)`)) return;

    setLocalGrades((prev) => {
      const next = { ...prev };
      students.forEach((student) => {
        const key = `${selectedTaskId}_${student.uid}`;
        next[key] = { 
          grade: numGrade, 
          feedback: next[key]?.feedback || "",
          rewardXP: next[key]?.rewardXP,
          rewardBadgeId: next[key]?.rewardBadgeId
        };
      });
      return next;
    });
    
    toast.info("Nilai diisi. Klik 'Simpan Perubahan' untuk menyimpan.");
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updates = [];

    for (const key in localGrades) {
      const local = localGrades[key];
      const original = originalGrades[key];
      
      if (
        local.grade !== original?.grade ||
        local.feedback !== original?.feedback ||
        local.rewardXP !== original?.rewardXP ||
        local.rewardBadgeId !== original?.rewardBadgeId
      ) {
        const [taskId, studentId] = key.split("_");
        updates.push({
          taskId,
          studentId,
          grade: local.grade,
          feedback: local.feedback,
          rewardXP: local.rewardXP,
          rewardBadgeId: local.rewardBadgeId,
        });
      }
    }

    if (updates.length === 0) {
      toast.info("Tidak ada perubahan untuk disimpan");
      setIsSaving(false);
      return;
    }

    const result = await saveMatrixGrades(classId, updates as any[]);

    if (result.success) {
      setOriginalGrades(localGrades);
      toast.success("Nilai berhasil disimpan", {
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
      });
      router.refresh();
    } else {
      toast.error(result.error || "Gagal menyimpan nilai");
    }
    setIsSaving(false);
  };

  const isDirty = JSON.stringify(localGrades) !== JSON.stringify(originalGrades);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-secondary/10">
        <p className="font-bold uppercase tracking-tight text-muted-foreground">Buat tugas terlebih dahulu untuk mulai menilai.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 bg-card border-2 border-border/50 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Pilih Tugas:</span>
          <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
            <SelectTrigger className="w-full sm:w-[300px] bg-background border-2 border-border/50 rounded-xl font-bold text-xs h-11 focus:ring-primary/20">
              <SelectValue placeholder="Pilih tugas..." />
            </SelectTrigger>
            <SelectContent className="border-2 border-border/50 rounded-xl">
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id} className="font-medium text-xs">
                  {task.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-24">
            <Input
              type="number"
              value={fillGrade}
              onChange={(e) => setFillGrade(e.target.value)}
              className="h-11 bg-background border-2 border-border/50 rounded-xl font-bold text-center focus-visible:ring-primary/20"
              placeholder="Nilai"
            />
          </div>
          <Button 
            variant="default" 
            onClick={handleBulkFill}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-wider text-[10px] h-11 px-6 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
          >
            <Flash className="mr-2 h-4 w-4 fill-white text-white" />
            Isi Semua
          </Button>
        </div>
      </div>

      <div className="flex justify-end min-h-[44px]">
        {isDirty && (
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 animate-in fade-in slide-in-from-bottom-2"
          >
            {isSaving ? <Infinite className="w-4 h-4 mr-2 animate-spin" /> : <FloppyDisk className="w-4 h-4 mr-2" />}
            Simpan Perubahan
          </Button>
        )}
      </div>

      <div className="rounded-2xl border-2 border-border/50 bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-border/50">
              <TableHead className="w-[300px] pl-6 h-14 text-xs font-bold uppercase tracking-wider text-muted-foreground">Siswa</TableHead>
              <TableHead className="text-center w-[120px] h-14 text-xs font-bold uppercase tracking-wider text-muted-foreground">Nilai</TableHead>
              <TableHead className="text-center w-[100px] h-14 text-xs font-bold uppercase tracking-wider text-muted-foreground">Feedback</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, index) => {
              const key = `${selectedTaskId}_${student.uid}`;
              const gradeData = localGrades[key];
              const currentGrade = gradeData?.grade || 0;
              const currentFeedback = gradeData?.feedback || "";

              return (
                <TableRow key={student.uid} className="hover:bg-muted/30 border-b-border/50 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        <AvatarImage src={student.photo} alt={student.name} />
                        <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                          {student.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-bold text-foreground text-sm tracking-tight">{student.name}</h4>
                        <p className="text-[10px] font-medium text-slate-400">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-0 text-center">
                    <div className="flex justify-center h-full">
                      <GradeCell
                        studentId={student.uid}
                        assignmentId={selectedTaskId}
                        value={currentGrade}
                        remarks={currentFeedback}
                        rewardXP={gradeData?.rewardXP}
                        rewardBadgeId={gradeData?.rewardBadgeId}
                        onValueChange={(val) => handleGradeChange(
                          selectedTaskId, 
                          student.uid, 
                          val || 0, 
                          currentFeedback,
                          gradeData?.rewardXP,
                          gradeData?.rewardBadgeId
                        )}
                        onRemarksChange={(rem) => handleGradeChange(
                          selectedTaskId, 
                          student.uid, 
                          currentGrade, 
                          rem,
                          gradeData?.rewardXP,
                          gradeData?.rewardBadgeId
                        )}
                        onPersist={(val, rem, xp, badgeId) => handleGradeChange(
                          selectedTaskId, 
                          student.uid, 
                          val || 0, 
                          rem || "", 
                          xp, 
                          badgeId
                        )}
                        rowIndex={index}
                        colIndex={0}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <FeedbackButton
                      studentName={student.name}
                      feedback={currentFeedback}
                      onChange={(fb) => handleGradeChange(
                        selectedTaskId, 
                        student.uid, 
                        currentGrade, 
                        fb,
                        gradeData?.rewardXP,
                        gradeData?.rewardBadgeId
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
