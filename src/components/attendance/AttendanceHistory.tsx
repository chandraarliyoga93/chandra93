"use client";

import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Calendar, Group, StatsUpSquare, NavArrowRight } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { cn } from "@/lib/utils";
import AttendanceDetailSheet from "./AttendanceDetailSheet";
import { useState, useEffect } from "react";
import { progressBar } from "@/lib/progress-bar";

interface HistoryItem {
  date: string;
  totalStudents: number;
  presentCount: number;
  attendancePercentage: number;
}

interface AttendanceHistoryProps {
  classId: string;
  data: HistoryItem[];
  total: number;
  currentPage: number;
  limit: number;
}

export default function AttendanceHistory({
  classId,
  data,
  total,
  currentPage,
  limit,
}: AttendanceHistoryProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    progressBar.done();
  }, [currentPage, data]);

  const handleViewDetail = (date: string) => {
    setSelectedDate(date);
    setIsSheetOpen(true);
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-emerald-600";
    if (percentage >= 75) return "text-sky-600";
    if (percentage >= 50) return "text-amber-600";
    return "text-rose-600";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "[&>[data-slot=progress-indicator]]:bg-emerald-500";
    if (percentage >= 75) return "[&>[data-slot=progress-indicator]]:bg-sky-500";
    if (percentage >= 50) return "[&>[data-slot=progress-indicator]]:bg-amber-500";
    return "[&>[data-slot=progress-indicator]]:bg-rose-500";
  };

  // Calculate average attendance for history view
  const averageAttendance = data.length > 0 
    ? Math.round(data.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / data.length)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* History Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Catatan</p>
              <h3 className="text-2xl font-bold">{total} Hari</h3>
            </div>
            <div className="p-2 bg-muted rounded-full">
              <Calendar className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm md:col-span-2">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rata-Rata Kehadiran (Halaman Ini)</p>
              <h3 className="text-2xl font-bold">{averageAttendance}%</h3>
            </div>
            <div className="p-2 bg-primary/10 rounded-full">
              <StatsUpSquare className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[200px] pl-6 font-semibold text-xs uppercase tracking-wider">
                Tanggal
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">
                Siswa
              </TableHead>
              <TableHead className="font-semibold text-xs uppercase tracking-wider">
                Kehadiran
              </TableHead>
              <TableHead className="text-right pr-6 font-semibold text-xs uppercase tracking-wider">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Calendar className="w-10 h-10 opacity-20" />
                    <p className="font-medium">Belum Ada Riwayat</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.date} className="group transition-colors border-muted/60">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {format(parseISO(item.date), "dd MMM yyyy", { locale: idLocale })}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                          {format(parseISO(item.date), "EEEE", { locale: idLocale })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full w-fit border border-muted-foreground/10">
                      <Group className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-bold text-xs">
                        {item.presentCount} / {item.totalStudents}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-1.5 min-w-[150px] max-w-[200px]">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className={getPercentageColor(item.attendancePercentage)}>
                          {item.attendancePercentage}%
                        </span>
                        <span className="text-muted-foreground/60 font-medium">Target 100%</span>
                      </div>
                      <Progress 
                        value={item.attendancePercentage} 
                        className={cn("h-1.5 bg-muted transition-all", getProgressColor(item.attendancePercentage))} 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(item.date)}
                      className="h-8 px-3 text-xs font-semibold hover:bg-primary/10 hover:text-primary"
                    >
                      Detail
                      <NavArrowRight className="w-3.5 h-3.5 ml-1 stroke-[2.5]" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <DataPagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        className="pt-2"
      />

      <AttendanceDetailSheet 
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        classId={classId}
        date={selectedDate || ""}
      />
    </div>
  );
}
