"use client";

import { useState } from "react";
import { 
  Download, 
  Calendar as CalendarIcon, 
  NavArrowDown, 
  Book,
  Page,
  Journal
} from "iconoir-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getJournalExportDataSupabase } from "@/actions/journals-supabase";
import { exportJournalsToPdf } from "@/lib/export-journal-pdf";
import { exportJournalsToExcel } from "@/lib/export-journal-excel";

interface JournalExportActionsProps {
  classes: { id: string; name: string }[];
}

export function JournalExportActions({ classes }: JournalExportActionsProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classId, setClassId] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const handlePreset = (type: string) => {
    const now = new Date();
    const year = now.getFullYear();
    
    switch (type) {
      case "7-days":
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case "this-month":
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case "semester-1":
        // Semester Ganjil (July - December)
        setStartDate(new Date(year, 6, 1));
        setEndDate(new Date(year, 11, 31));
        break;
      case "semester-2":
        // Semester Genap (January - June)
        setStartDate(new Date(year, 0, 1));
        setEndDate(new Date(year, 5, 30));
        break;
    }
  };

  const handleExport = async (formatType: "pdf" | "excel") => {
    setLoading(true);
    const toastId = toast.loading("Menyiapkan data jurnal...");
    
    try {
      const result = await getJournalExportDataSupabase({
        classId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (!result.success || !result.data || result.data.journals.length === 0) {
        toast.error(result.error || "Tidak ada data", { 
          description: "Tidak ada jurnal ditemukan untuk rentang waktu tersebut.",
          id: toastId 
        });
        return;
      }

      const { data } = result;

      if (formatType === "pdf") {
        exportJournalsToPdf(data, {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        });
      } else {
        exportJournalsToExcel(data);
      }
      
      toast.success("Berhasil!", { 
        description: `Laporan jurnal dalam format ${formatType.toUpperCase()} telah diunduh.`,
        id: toastId 
      });
      setOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Terjadi Kesalahan", { 
        description: "Gagal mengekspor data jurnal. Silakan coba lagi.",
        id: toastId 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        variant="outline"
        className="rounded-full gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 h-10 px-4"
      >
        <Download className="w-4 h-4" />
        <span className="font-medium">Ekspor Jurnal</span>
      </Button>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Ekspor Jurnal Mengajar"
        description="Pilih kelas dan rentang waktu untuk menghasilkan laporan jurnal yang rapi."
        headerContent={
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
            <Page className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          </div>
        }
      >
        <div className="space-y-6 pt-2">
          {/* Class Selector */}
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Book className="w-4 h-4 text-zinc-400" />
              Pilih Kelas
            </label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 transition-all">
                <SelectValue placeholder="Semua Kelas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                <SelectItem value="all" className="rounded-lg">Semua Kelas</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="rounded-lg">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Mulai</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
                    <span className="font-medium">
                      {startDate ? format(startDate, "dd MMM yyyy", { locale: idLocale }) : "Pilih tanggal"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    locale={idLocale}
                    className="rounded-2xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tanggal Akhir</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
                    <span className="font-medium">
                      {endDate ? format(endDate, "dd MMM yyyy", { locale: idLocale }) : "Pilih tanggal"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    locale={idLocale}
                    className="rounded-2xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              Pilihan Cepat
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "7 Hari Terakhir", value: "7-days" },
                { label: "Bulan Ini", value: "this-month" },
                { label: "Semester 1", value: "semester-1" },
                { label: "Semester 2", value: "semester-2" },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handlePreset(preset.value)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  disabled={loading}
                  className="flex-1 rounded-xl h-14 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 gap-2 font-bold shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/5"
                >
                  {loading ? "Menyiapkan Laporan..." : "Unduh Laporan"}
                  {!loading && <NavArrowDown className="w-4 h-4 opacity-50" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] p-2 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xl" side="top">
                <DropdownMenuItem 
                  className="gap-3 font-semibold p-3 cursor-pointer rounded-xl focus:bg-zinc-50 dark:focus:bg-zinc-900"
                  onClick={() => handleExport("pdf")}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shrink-0">
                    <Page className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">Download PDF</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Format Laporan Resmi (Landscape)</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="gap-3 font-semibold p-3 cursor-pointer rounded-xl focus:bg-zinc-50 dark:focus:bg-zinc-900 mt-1"
                  onClick={() => handleExport("excel")}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">Download Excel</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Format Spreadsheet (Olah Data)</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              onClick={() => setOpen(false)}
              className="px-6 h-14 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 font-medium"
            >
              Batal
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
