"use client";

import { useState, useEffect, useMemo } from "react";
import { format, parseISO, addDays, isSameDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  saveBulkAttendanceSupabase as saveBulkAttendance, AttendanceStatus 
} from "@/actions/attendance-supabase";
import { 
  Check, 
  Xmark, 
  InfoCircle,
  Search,
  Infinite,
  FloppyDisk,
  StatsUpSquare,
  Calendar
} from "iconoir-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { V2StatsCard } from "@/components/shared/V2StatsCard";
import { MobileAttendanceCard } from "./MobileAttendanceCard";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface V2AttendanceGridProps {
  classId: string;
  students: Student[];
  initialAttendance: Record<string, AttendanceStatus>;
  date: string;
}

export default function V2AttendanceGrid({ 
  classId, 
  students, 
  initialAttendance,
  date
}: V2AttendanceGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(initialAttendance);
  const [lastSavedAttendance, setLastSavedAttendance] = useState<Record<string, AttendanceStatus>>(initialAttendance);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const dateScrollerDays = useMemo(() => {
    const centerDate = parseISO(date);
    return Array.from({ length: 7 }, (_, i) => addDays(centerDate, i - 3));
  }, [date]);

  const handleDateChange = (newDate: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(newDate, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const normalized = { ...initialAttendance };
    setAttendance(normalized);
    setLastSavedAttendance(normalized);
  }, [initialAttendance]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus | undefined) => {
    setAttendance(prev => {
      const newAttendance = { ...prev };
      if (status === undefined) {
        delete newAttendance[studentId];
      } else {
        newAttendance[studentId] = status;
      }
      return newAttendance;
    });
  };

  const handleSetAllPresent = () => {
    const newAttendance = { ...attendance };
    filteredStudents.forEach(student => {
      newAttendance[student.id] = "present";
    });
    setAttendance(newAttendance);
    toast.info(`${filteredStudents.length} siswa ditandai Hadir (Belum disimpan)`);
  };

  const handleBulkSave = async () => {
    if (isUpdating) return;
    
    const changes: Record<string, AttendanceStatus | null> = {};
    let hasChanges = false;
    
    Object.entries(attendance).forEach(([id, status]) => {
      if (status !== lastSavedAttendance[id]) {
        changes[id] = status;
        hasChanges = true;
      }
    });

    Object.keys(lastSavedAttendance).forEach(id => {
      if (!(id in attendance)) {
        changes[id] = null;
        hasChanges = true;
      }
    });

    if (!hasChanges) {
      toast.info("Tidak ada perubahan untuk disimpan");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await saveBulkAttendance(classId, date, changes);
      if (result.success) {
        setLastSavedAttendance({ ...attendance });
        toast.success("Presensi berhasil disimpan");
        // Reload to trigger the locked state in parent
        window.location.reload();
      } else {
        toast.error(result.error || "Gagal menyimpan presensi");
      }
    } catch (error) {
      console.error("Error saving bulk attendance:", error);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsUpdating(false);
    }
  };

  const isDirty = JSON.stringify(attendance) !== JSON.stringify(lastSavedAttendance);

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(s => s === "present").length,
    excused: Object.values(attendance).filter(s => s === "excused").length,
    sick: Object.values(attendance).filter(s => s === "sick").length,
    late: Object.values(attendance).filter(s => s === "late").length,
    absent: Object.values(attendance).filter(s => s === "absent").length,
  };

  const attendanceRate = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

  const handleBulkStatusChange = (status: AttendanceStatus | undefined) => {
    const newAttendance = { ...attendance };
    selectedIds.forEach(id => {
      if (status === undefined) {
        delete newAttendance[id];
      } else {
        newAttendance[id] = status;
      }
    });
    setAttendance(newAttendance);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const attendanceButtons = [
    { value: "present", label: "H", full: "Hadir", color: "bg-zinc-950", activeColor: "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950" },
    { value: "sick", label: "S", full: "Sakit", color: "bg-zinc-500", activeColor: "bg-zinc-500 text-white" },
    { value: "excused", label: "I", full: "Izin", color: "bg-zinc-400", activeColor: "bg-zinc-400 text-white" },
    { value: "late", label: "T", full: "Telat", color: "bg-zinc-300", activeColor: "bg-zinc-300 text-zinc-900" },
    { value: "absent", label: "A", full: "Alpa", color: "bg-zinc-200", activeColor: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50" },
  ] as const;

  return (
    <TooltipProvider>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Mobile Date Scroller */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pilih Tanggal</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
            {dateScrollerDays.map((day) => {
              const isActive = isSameDay(day, parseISO(date));
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateChange(day)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[64px] h-[84px] rounded-3xl border-2 transition-all shrink-0",
                    isActive
                      ? "bg-zinc-950 border-zinc-950 text-white dark:bg-zinc-50 dark:border-zinc-50 dark:text-zinc-950 shadow-xl shadow-zinc-200/50 dark:shadow-none scale-105"
                      : "bg-white border-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800"
                  )}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                    {format(day, "EEE", { locale: idLocale })}
                  </span>
                  <span className="text-xl font-black tracking-tighter leading-none mt-1">
                    {format(day, "dd")}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeDate"
                      className="w-1.5 h-1.5 rounded-full mt-2 bg-white dark:bg-zinc-950" 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <V2StatsCard
            title="Rasio Kehadiran"
            value={`${attendanceRate}%`}
            description="Keseluruhan hari ini"
            icon={<StatsUpSquare className="w-4 h-4" />}
          />
          <V2StatsCard
            title="Hadir"
            value={stats.present}
            description={`Dari ${stats.total} siswa`}
            icon={<Check className="w-4 h-4" />}
          />
          <V2StatsCard
            title="Alpa"
            value={stats.absent}
            description="Tanpa keterangan"
            icon={<Xmark className="w-4 h-4" />}
          />
          <V2StatsCard
            title="Lainnya"
            value={stats.sick + stats.excused + stats.late}
            description="Sakit, Izin, Telat"
            icon={<InfoCircle className="w-4 h-4" />}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Cari nama atau ID siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 rounded-2xl border-zinc-200/50 bg-white/50 backdrop-blur-sm dark:border-zinc-800/50 dark:bg-zinc-950/50"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button 
                variant="outline"
                size="sm"
                onClick={handleSetAllPresent}
                className="h-11 px-6 rounded-2xl border-zinc-200/50 font-bold text-xs hover:bg-zinc-50"
              >
                Set Semua Hadir
              </Button>

              {isDirty && (
                <Button 
                  size="sm"
                  onClick={handleBulkSave}
                  disabled={isUpdating}
                  className="h-11 px-8 rounded-2xl bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 font-bold text-xs shadow-xl"
                >
                  {isUpdating ? <Infinite className="w-4 h-4 mr-2 animate-spin" /> : <FloppyDisk className="w-4 h-4 mr-2" />}
                  Simpan Presensi
                </Button>
              )}
            </div>
          </div>

          <div className="hidden md:block rounded-xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 overflow-hidden shadow-sm">
            <div className="relative overflow-auto max-h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-white/80 backdrop-blur-md dark:bg-zinc-950/80">
                  <TableRow className="border-b-zinc-200/50 hover:bg-transparent dark:border-b-zinc-800/50 h-14">
                    <TableHead className="w-[50px] pl-8">
                      <Checkbox 
                        checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="rounded-md border-zinc-300"
                      />
                    </TableHead>
                    <TableHead className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Siswa</TableHead>
                    <TableHead className="text-center text-zinc-500 font-bold text-[10px] uppercase tracking-widest">Status Kehadiran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-zinc-500 font-medium">
                        Tidak ada siswa ditemukan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const currentStatus = attendance[student.id];
                      return (
                        <TableRow key={student.id} className="group border-b-zinc-200/50 last:border-0 hover:bg-zinc-50/50 transition-colors duration-150 dark:border-b-zinc-800/50 dark:hover:bg-zinc-900/50">
                          <TableCell className="pl-8 py-5">
                            <Checkbox 
                              checked={selectedIds.includes(student.id)}
                              onCheckedChange={() => toggleSelect(student.id)}
                              className="rounded-md border-zinc-300"
                            />
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                  <AvatarImage src={student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`} />
                                  <AvatarFallback className="text-xs font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                    {student.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">{student.name}</span>
                                <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-tighter">ID: {student.id.substring(0, 8)}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex items-center justify-center gap-2">
                              {attendanceButtons.map((btn) => {
                                const isActive = currentStatus === btn.value;
                                return (
                                  <button
                                    key={btn.value}
                                    onClick={() => handleStatusChange(student.id, isActive ? undefined : btn.value)}
                                    title={btn.full}
                                    className={cn(
                                      "h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-black transition-all border-2",
                                      isActive 
                                        ? `${btn.activeColor} border-transparent shadow-md scale-110 z-10` 
                                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-200"
                                    )}
                                  >
                                    {btn.label}
                                  </button>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-4 pb-20">
            {filteredStudents.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-zinc-500 font-medium bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <span>Tidak ada siswa ditemukan.</span>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <MobileAttendanceCard
                  key={student.id}
                  student={student}
                  status={attendance[student.id]}
                  onStatusChange={(status) => handleStatusChange(student.id, status)}
                  selected={selectedIds.includes(student.id)}
                  onToggleSelect={() => toggleSelect(student.id)}
                />
              ))
            )}
          </div>
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 100, x: "-50%", opacity: 0 }}
              animate={{ y: 0, x: "-50%", opacity: 1 }}
              exit={{ y: 100, x: "-50%", opacity: 0 }}
              className="fixed bottom-12 left-1/2 z-50 flex items-center gap-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl px-6 py-3 rounded-3xl w-max max-w-[95vw]"
            >
              <div className="flex items-center gap-3 border-r border-zinc-200 dark:border-zinc-800 pr-6">
                <Badge className="rounded-full h-6 w-6 p-0 flex items-center justify-center font-bold bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">{selectedIds.length}</Badge>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                {attendanceButtons.map(btn => (
                  <Button
                    key={btn.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkStatusChange(btn.value)}
                    className="h-10 rounded-xl px-4 text-[10px] font-black gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <span className={cn("h-2 w-2 rounded-full", btn.color)} />
                    {btn.full}
                  </Button>
                ))}
                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedIds([])}
                  className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  <Xmark className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
