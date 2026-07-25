"use client";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ClipboardCheck, Group, ArrowRight, StatsReport, Page } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Table,

  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter, useSearchParams } from "next/navigation";
import { TaskHistory } from "@/actions/grades-supabase";

interface GradingHistoryProps {
  data: TaskHistory[];
}

export function GradingHistory({ data }: GradingHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleViewDetail = (taskId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("taskId", taskId);
    params.set("tab", "input");
    params.set("view", "focus"); // Switch to focus view within input tab
    router.push(`?${params.toString()}`);
  };

  const getGradeColor = (avg: number) => {
    if (avg >= 85) return "text-emerald-600";
    if (avg >= 70) return "text-sky-600";
    if (avg >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 100) return "text-emerald-600";
    if (percentage >= 75) return "text-sky-600";
    if (percentage >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  const getCompletionBg = (percentage: number) => {
    if (percentage >= 100) return "bg-emerald-500";
    if (percentage >= 75) return "bg-sky-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-2 border-border/50 rounded-3xl shadow-sm bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-b border-border/50 hover:bg-transparent h-14 px-6">
              <TableHead className="w-[300px] font-bold uppercase text-[10px] tracking-widest text-muted-foreground px-6">
                Nama Tugas
              </TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground px-6">
                Rata-rata Nilai
              </TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground px-6">
                Penyelesaian
              </TableHead>
              <TableHead className="text-right h-14 px-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <StatsReport className="w-10 h-10 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Belum ada riwayat penilaian</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id} className="group hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 text-primary rounded-xl group-hover:bg-primary/10 transition-colors">
                        <ClipboardCheck className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold tracking-tight text-foreground leading-none truncate max-w-[200px]">
                          {item.title}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
                          {format(parseISO(item.createdAt), "dd MMM yyyy", { locale: idLocale })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`text-xl font-extrabold ${getGradeColor(item.averageGrade)}`}>
                        {item.averageGrade}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
                        Avg Score
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="space-y-2 max-w-[180px]">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>{item.completionRate}% Done</span>
                        <Group className="w-3 h-3" />
                      </div>
                      <Progress value={item.completionRate} className="h-1.5 w-full bg-muted" />
                      <p className="text-[9px] font-medium text-muted-foreground uppercase">
                        {item.totalStudentsGraded}/{item.totalStudentsInClass} Siswa
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(item.id)}
                      className="rounded-xl text-primary font-bold gap-2 hover:bg-primary/5 active:scale-95 transition-all"
                    >
                      Lihat Detail
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
