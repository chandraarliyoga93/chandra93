"use client";

import * as React from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  Download, 
  Calendar as CalendarIcon, 
  NavArrowDown
} from "iconoir-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { getAttendanceRangeDataSupabase } from "@/actions/attendance-supabase";
import { exportAttendanceToExcel } from "@/lib/export-attendance";

interface AttendanceExportDialogProps {
  classId: string;
  className: string;
}

export function AttendanceExportDialog({
  classId,
  className,
}: AttendanceExportDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [startDate, setStartDate] = React.useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = React.useState<Date>(new Date());

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Pilih rentang tanggal terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      const result = await getAttendanceRangeDataSupabase(classId, startStr, endStr);

      if (result.success && result.data) {
        exportAttendanceToExcel(result.data as any, className, {
          start: startStr,
          end: endStr,
        });
        toast.success("Laporan berhasil diekspor");
        setOpen(false);
      } else {
        toast.error(result.error || "Gagal mengambil data absensi");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Terjadi kesalahan saat mengekspor laporan");
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (type: "7days" | "thisMonth") => {
    const today = new Date();
    if (type === "7days") {
      setStartDate(subDays(today, 7));
      setEndDate(today);
    } else if (type === "thisMonth") {
      setStartDate(startOfMonth(today));
      setEndDate(endOfMonth(today));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 h-10 px-4 border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all">
          <Download className="w-4 h-4 text-zinc-500" />
          <span className="font-medium">Export Laporan</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl rounded-[1.5rem]">
        <div className="bg-white dark:bg-zinc-950 p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Export Laporan Absensi
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Pilih rentang tanggal untuk mengekspor laporan absensi kelas <span className="font-semibold text-zinc-900 dark:text-zinc-100">{className}</span> ke Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-date" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">
                  Tanggal Mulai
                </Label>
                <DatePicker date={startDate} setDate={setStartDate} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-date" className="text-sm font-medium text-zinc-500 dark:text-zinc-400 ml-1">
                  Tanggal Selesai
                </Label>
                <DatePicker date={endDate} setDate={setEndDate} />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.1em] ml-1">
                Quick Presets
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-4 h-8 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                  onClick={() => setPreset("7days")}
                >
                  7 Hari Terakhir
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-4 h-8 text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                  onClick={() => setPreset("thisMonth")}
                >
                  Bulan Ini
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 flex flex-col sm:flex-row gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="flex-1 rounded-xl h-11 font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Batal
          </Button>
          <Button
            onClick={handleExport}
            disabled={loading}
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Mengekspor...
              </span>
            ) : (
              "Export ke Excel"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DatePicker({
  date,
  setDate,
}: {
  date: Date | undefined;
  setDate: (date: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-medium h-11 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
          <span className="truncate">
            {date ? (
              format(date, "dd MMM yyyy", { locale: idLocale })
            ) : (
              <span>Pilih tanggal</span>
            )}
          </span>
          <NavArrowDown className="ml-auto h-4 w-4 text-zinc-400 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xl" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && setDate(d)}
          initialFocus
          locale={idLocale}
          className="rounded-2xl"
        />
      </PopoverContent>
    </Popover>
  );
}
