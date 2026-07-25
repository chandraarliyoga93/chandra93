"use client";

import * as React from "react";
import { useQueryState } from "nuqs";
import { Task } from "@/actions/tasks-supabase";
import { saveBulkGradesSupabase } from "@/actions/grades-supabase";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ChatBubble, 
  Check, 
  InfoCircle, 
  NavArrowDown, 
  FloppyDisk, 
  Flash, 
  Medal 
} from "iconoir-react";
import { toast } from "sonner";
import { BadgePreset, getBadgesSupabase } from "@/actions/gamification-supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface InputNilaiTabProps {
  classId: string;
  tasks: Task[];
  students: { uid: string; name: string }[];
  grades: Record<string, { grade: number; feedback: string; rewardXP?: number; rewardBadgeId?: string }>;
}

export function InputNilaiTab({ classId, tasks, students, grades }: InputNilaiTabProps) {
  const [taskId, setTaskId] = useQueryState("taskId");
  const [localScores, setLocalScores] = React.useState<Record<string, string>>({});
  const [localFeedbacks, setLocalFeedbacks] = React.useState<Record<string, string>>({});
  const [rewardXP, setRewardXP] = React.useState<string>("");
  const [rewardBadgeId, setRewardBadgeId] = React.useState<string>("none");
  const [badges, setBadges] = React.useState<BadgePreset[]>([]);
  const [isPending, startTransition] = React.useTransition();

  // Fetch badges
  React.useEffect(() => {
    getBadgesSupabase().then((data) => setBadges(data as any));
  }, []);

  // Initialize local scores when taskId or grades change
  React.useEffect(() => {
    if (!taskId) {
      setLocalScores({});
      setRewardXP("");
      setRewardBadgeId("none");
      return;
    }

    const initialScores: Record<string, string> = {};
    const initialFeedbacks: Record<string, string> = {};
    students.forEach((student) => {
      const gradeKey = `${taskId}_${student.uid}`;
      const gradeData = grades[gradeKey];
      initialScores[student.uid] = gradeData ? gradeData.grade.toString() : "";
      initialFeedbacks[student.uid] = gradeData ? gradeData.feedback : "";
    });
    setLocalScores(initialScores);
    setLocalFeedbacks(initialFeedbacks);

    // Default XP from task
    const activeTask = tasks.find(t => t.id === taskId);
    if (activeTask?.rewards?.xp) {
      setRewardXP(activeTask.rewards.xp.toString());
    }
  }, [taskId, grades, students, tasks]);

  const handleScoreChange = (uid: string, value: string) => {
    // Basic validation: allow empty or numbers 0-100
    if (value === "" || (/^\d+$/.test(value) && parseInt(value) <= 100)) {
      setLocalScores((prev) => ({ ...prev, [uid]: value }));
    }
  };

  const handleSaveAll = () => {
    if (!taskId) return;

    const updates = Object.entries(localScores)
      .filter(([, score]) => score !== "")
      .map(([uid, score]) => ({
        studentId: uid,
        grade: parseInt(score),
        feedback: localFeedbacks[uid] || "",
      }));

    if (updates.length === 0) {
      toast.info("Tidak ada nilai untuk disimpan");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveBulkGradesSupabase(
          classId, 
          taskId, 
          updates, 
          rewardXP ? parseInt(rewardXP) : undefined,
          rewardBadgeId === "none" ? undefined : rewardBadgeId
        );
        if (result.success) {
          toast.success("Semua nilai berhasil disimpan", {
            icon: <Check className="h-4 w-4 text-green-500" />,
          });
        } else {
          toast.error(result.error || "Gagal menyimpan nilai");
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat menyimpan nilai");
      }
    });
  };

  const activeTask = tasks.find((t) => t.id === taskId);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl border border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800/50 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Pilih Tugas
            </h3>
            <p className="text-sm text-zinc-500 font-medium">
              Pilih tugas untuk menginput nilai secara massal
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-full sm:w-[300px]">
              <Select value={taskId || ""} onValueChange={setTaskId}>
                <SelectTrigger className="w-full h-11 rounded-xl border-zinc-200 bg-zinc-50/50 font-bold dark:border-zinc-800 dark:bg-zinc-900/50 transition-all focus:ring-zinc-400">
                  <SelectValue placeholder="Pilih Tugas..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                  {tasks.map((task) => (
                    <SelectItem 
                      key={task.id} 
                      value={task.id}
                      className="rounded-lg font-medium focus:bg-zinc-100 dark:focus:bg-zinc-900"
                    >
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {taskId && (
              <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex flex-col gap-1.5 w-full sm:w-[120px]">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 ml-1">
                    <Flash className="h-2.5 w-2.5" /> Bonus XP
                  </Label>
                  <Input
                    type="number"
                    value={rewardXP}
                    onChange={(e) => setRewardXP(e.target.value)}
                    placeholder="50"
                    className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 font-black dark:border-zinc-800 dark:bg-zinc-900/50 focus:ring-zinc-400"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-full sm:w-[180px]">
                  <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 ml-1">
                    <Medal className="h-2.5 w-2.5" /> Hadiah Badge
                  </Label>
                  <Select value={rewardBadgeId} onValueChange={setRewardBadgeId}>
                    <SelectTrigger className="h-11 rounded-xl border-zinc-200 bg-zinc-50/50 font-bold dark:border-zinc-800 dark:bg-zinc-900/50 focus:ring-zinc-400">
                      <SelectValue placeholder="Pilih Badge" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                      <SelectItem value="none" className="font-bold">Tanpa Badge</SelectItem>
                      {badges.map((badge) => (
                        <SelectItem key={badge.id} value={badge.id} className="font-bold">
                          {badge.emoji} {badge.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        {taskId && (
          <div className="flex items-center gap-3 self-end md:self-end mb-1">
            <Button
              onClick={handleSaveAll}
              disabled={isPending}
              className="h-11 px-8 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 font-black shadow-lg shadow-zinc-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 gap-2"
            >
              {isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FloppyDisk className="h-4 w-4" />
              )}
              Simpan Semua
            </Button>
          </div>
        )}
      </div>

      {!taskId ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-[2.5rem] border border-dashed border-zinc-200 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/10">
          <div className="h-16 w-16 rounded-3xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-4">
            <InfoCircle className="h-8 w-8 text-zinc-400" />
          </div>
          <h4 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
            Belum Ada Tugas Dipilih
          </h4>
          <p className="text-zinc-500 font-medium text-center max-w-[300px]">
            Silakan pilih tugas dari menu di atas untuk mulai memasukkan nilai.
          </p>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black italic">
                {activeTask?.title?.charAt(0) || "T"}
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  {activeTask?.title}
                </h4>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Menginput nilai untuk {students.length} siswa
                </p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-zinc-200/50 hover:bg-transparent">
                  <TableHead className="h-12 px-6 text-zinc-500 font-bold text-[10px] uppercase tracking-widest w-[60%]">
                    Nama Siswa
                  </TableHead>
                  <TableHead className="h-12 px-6 text-zinc-500 font-bold text-[10px] uppercase tracking-widest text-right">
                    Nilai (0-100)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow 
                    key={student.uid} 
                    className="border-b-zinc-100 dark:border-zinc-900 last:border-0 hover:bg-zinc-50/50 transition-colors"
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400">
                          {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm tracking-tight text-zinc-800 dark:text-zinc-200">
                          {student.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex justify-end items-center gap-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button 
                              className={cn(
                                "p-2 rounded-lg transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                localFeedbacks[student.uid] ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-300 dark:text-zinc-700"
                              )}
                              title="Tambah Feedback"
                            >
                              <ChatBubble className={cn("h-4 w-4", localFeedbacks[student.uid] ? "fill-current" : "")} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 rounded-2xl p-4 shadow-xl border-zinc-200/50">
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <h4 className="font-bold text-sm tracking-tight">Bisikan untuk {student.name}</h4>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Catatan ini akan tampil di dashboard siswa</p>
                              </div>
                              <Textarea 
                                placeholder="Tulis feedback Anda di sini..."
                                value={localFeedbacks[student.uid] || ""}
                                onChange={(e) => setLocalFeedbacks(prev => ({ ...prev, [student.uid]: e.target.value }))}
                                className="min-h-[100px] rounded-xl text-xs bg-zinc-50/50 border-zinc-200/50 focus:ring-zinc-400"
                              />
                            </div>
                          </PopoverContent>
                        </Popover>

                        <div className="relative w-24 group">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={localScores[student.uid] || ""}
                            onChange={(e) => handleScoreChange(student.uid, e.target.value)}
                            placeholder="0"
                            className="h-10 text-right pr-4 font-black text-base rounded-xl border-zinc-200 bg-white focus:ring-2 focus:ring-zinc-900/5 transition-all group-hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-zinc-100/5"
                          />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 dark:border-zinc-900 dark:bg-zinc-900/20">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">
              <NavArrowDown className="h-3 w-3" />
              Gunakan Tab untuk berpindah antar input nilai dengan cepat
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
