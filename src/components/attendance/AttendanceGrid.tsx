"use client";

import { useState, useEffect, useMemo } from "react";
import { format, isWeekend as isDateWeekend, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useQueryState, parseAsString } from "nuqs";
import { progressBar } from "@/lib/progress-bar";
import { 
  saveBulkAttendanceSupabase as saveBulkAttendance, AttendanceStatus 
} from "@/actions/attendance-supabase";
import { 
  Infinite, 
  FloppyDisk, 
  CheckCircle, 
  UserBadgeCheck, 
  Check,
  Xmark,
  WarningTriangle,
  StatsUpSquare,
  EditPencil,
  ArrowLeft,
  InfoCircle,
  Calendar
} from "iconoir-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Search } from "iconoir-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface AttendanceGridProps {
  classId: string;
  students: Student[];
  initialAttendance: Record<string, AttendanceStatus>;
  date: string;
  searchQuery?: string;
}

export default function AttendanceGrid({ 
  classId, 
  students, 
  initialAttendance,
  date: initialDate,
  searchQuery: initialSearchQuery = ""
}: AttendanceGridProps) {
  const [date] = useQueryState("date", parseAsString.withDefault(initialDate));
  const [tab] = useQueryState("tab", parseAsString.withDefault("input"));
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(initialAttendance);
  const [lastSavedAttendance, setLastSavedAttendance] = useState<Record<string, AttendanceStatus>>(initialAttendance);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(Object.keys(initialAttendance).length === 0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Handle progress bar on mount and tab/date transitions
  useEffect(() => {
    progressBar.done();
  }, [date, tab, initialAttendance]);

  useEffect(() => {
    const normalized = { ...initialAttendance };
    Object.keys(normalized).forEach(key => {
      const val = normalized[key] as string;
      if (val === "Hadir") normalized[key] = "present" as AttendanceStatus;
      if (val === "Izin") normalized[key] = "excused" as AttendanceStatus;
      if (val === "Sakit") normalized[key] = "sick" as AttendanceStatus;
      if (val === "Alpha") normalized[key] = "absent" as AttendanceStatus;
      if (val === "Terlambat") normalized[key] = "late" as AttendanceStatus;
    });
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
      newAttendance[student.id] = 'present';
    });
    setAttendance(newAttendance);
    toast.info(`${filteredStudents.length} siswa diset Hadir (Belum disimpan)`);
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
        setIsEditing(false);
        toast.success("Presensi berhasil disimpan", {
          icon: <CheckCircle className="w-4 h-4 text-emerald-500" />,
        });
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

  const isWeekend = isDateWeekend(parseISO(date));

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter(s => s === 'present').length,
    excused: Object.values(attendance).filter(s => s === 'excused').length,
    sick: Object.values(attendance).filter(s => s === 'sick').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
    unmarked: students.length - Object.keys(attendance).length
  };

  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

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
    { value: "present", label: "H", full: "Hadir", color: "bg-emerald-500", hover: "hover:bg-emerald-600" },
    { value: "sick", label: "S", full: "Sakit", color: "bg-amber-500", hover: "hover:bg-amber-600" },
    { value: "excused", label: "I", full: "Izin", color: "bg-sky-500", hover: "hover:bg-sky-600" },
    { value: "late", label: "T", full: "Telat", color: "bg-orange-500", hover: "hover:bg-orange-600" },
    { value: "absent", label: "A", full: "Alpha", color: "bg-rose-500", hover: "hover:bg-rose-600" },
  ] as const;

  if (!isEditing && Object.keys(initialAttendance).length > 0) {
    const groupedNonPresent = {
      absent: filteredStudents.filter(s => attendance[s.id] === 'absent'),
      excused: filteredStudents.filter(s => attendance[s.id] === 'excused'),
      sick: filteredStudents.filter(s => attendance[s.id] === 'sick'),
      late: filteredStudents.filter(s => attendance[s.id] === 'late'),
    };

    const nonPresentStudents = [
      ...groupedNonPresent.absent,
      ...groupedNonPresent.excused,
      ...groupedNonPresent.sick,
      ...groupedNonPresent.late
    ];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Alert className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-emerald-800 dark:text-emerald-300 font-semibold">Presensi Terrekam</AlertTitle>
          <AlertDescription className="text-emerald-700/80 dark:text-emerald-400/80 text-xs">
            Data kehadiran untuk tanggal {format(new Date(date), "dd MMMM yyyy", { locale: idLocale })} telah disimpan.
          </AlertDescription>
        </Alert>

        {/* Stats Summary Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rate Kehadiran</p>
                <h3 className="text-xl font-black">{attendanceRate}%</h3>
              </div>
              <StatsUpSquare className="w-6 h-6 text-primary/20" />
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hadir</p>
                <h3 className="text-xl font-black">{stats.present} <span className="text-xs text-muted-foreground font-medium">/ {stats.total}</span></h3>
              </div>
              <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Izin/Sakit</p>
                <h3 className="text-xl font-black">{stats.excused + stats.sick}</h3>
              </div>
              <div className="w-6 h-6 bg-sky-100 dark:bg-sky-950 rounded-full flex items-center justify-center">
                <InfoCircle className="w-3.5 h-3.5 text-sky-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Terlambat</p>
                <h3 className="text-xl font-black">{stats.late}</h3>
              </div>
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center">
                <WarningTriangle className="w-3.5 h-3.5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Alpha</p>
                <h3 className="text-xl font-black">{stats.absent}</h3>
              </div>
              <div className="w-6 h-6 bg-rose-100 dark:bg-rose-950 rounded-full flex items-center justify-center">
                <Xmark className="w-3.5 h-3.5 text-rose-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border overflow-hidden">
          <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Ringkasan Ketidakhadiran</h3>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Daftar siswa yang tidak hadir penuh</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="h-9 px-4 text-xs font-bold gap-2"
            >
              <EditPencil className="w-3.5 h-3.5" />
              Update Kehadiran
            </Button>
          </div>
          <CardContent className="p-6">
            {nonPresentStudents.length > 0 ? (
              <div className="space-y-6">
                {groupedNonPresent.absent.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Alpha</Badge>
                      <div className="h-px flex-1 bg-muted" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupedNonPresent.absent.map(s => (
                        <div key={s.id} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/50">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={s.photo} />
                            <AvatarFallback className="text-[8px] font-bold">{s.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {groupedNonPresent.excused.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border-sky-200">Izin</Badge>
                      <div className="h-px flex-1 bg-muted" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupedNonPresent.excused.map(s => (
                        <div key={s.id} className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 rounded-lg border border-sky-100 dark:border-sky-900/50">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={s.photo} />
                            <AvatarFallback className="text-[8px] font-bold">{s.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupedNonPresent.sick.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200">Sakit</Badge>
                      <div className="h-px flex-1 bg-muted" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupedNonPresent.sick.map(s => (
                        <div key={s.id} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={s.photo} />
                            <AvatarFallback className="text-[8px] font-bold">{s.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groupedNonPresent.late.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border-amber-200">Terlambat</Badge>
                      <div className="h-px flex-1 bg-muted" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupedNonPresent.late.map(s => (
                        <div key={s.id} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={s.photo} />
                            <AvatarFallback className="text-[8px] font-bold">{s.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
                  <UserBadgeCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Semua Siswa Hadir</p>
                  <p className="text-xs text-muted-foreground font-medium">Luar biasa! Tidak ada catatan ketidakhadiran untuk hari ini.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Header section with back button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {Object.keys(initialAttendance).length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsEditing(false)}
                className="h-8 w-8 rounded-full hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold tracking-tight">
                {Object.keys(initialAttendance).length > 0 ? "Update Presensi" : "Input Presensi"}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {format(new Date(date), "EEEE, dd MMMM yyyy", { locale: idLocale })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {Object.keys(initialAttendance).length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setAttendance(initialAttendance);
                  setIsEditing(false);
                }}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Batal
              </Button>
            )}
            <Button 
              variant="outline"
              size="sm"
              onClick={handleSetAllPresent}
              className="font-bold text-xs h-9"
            >
              <UserBadgeCheck className="w-4 h-4 mr-2 text-emerald-600" />
              Set Semua Hadir
            </Button>

            {isDirty && (
              <Button 
                size="sm"
                onClick={handleBulkSave}
                disabled={isUpdating}
                className="shadow-sm h-9 px-4 font-bold text-xs"
              >
                {isUpdating ? <Infinite className="w-4 h-4 mr-2 animate-spin" /> : <FloppyDisk className="w-4 h-4 mr-2" />}
                Simpan
              </Button>
            )}
          </div>
        </div>

        {/* Stats Summary Section in Edit Mode */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rate Kehadiran</p>
                <h3 className="text-xl font-black">{attendanceRate}%</h3>
              </div>
              <StatsUpSquare className="w-6 h-6 text-primary/20" />
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hadir</p>
                <h3 className="text-xl font-black">{stats.present} / {stats.total}</h3>
              </div>
              <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Izin/Sakit</p>
                <h3 className="text-xl font-black">{stats.excused + stats.sick}</h3>
              </div>
              <div className="w-6 h-6 bg-sky-100 dark:bg-sky-950 rounded-full flex items-center justify-center">
                <InfoCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Telat</p>
                <h3 className="text-xl font-black">{stats.late}</h3>
              </div>
              <div className="w-6 h-6 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center">
                <WarningTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Alpha</p>
                <h3 className="text-xl font-black">{stats.absent}</h3>
              </div>
              <div className="w-6 h-6 bg-rose-100 dark:bg-rose-950 rounded-full flex items-center justify-center">
                <Xmark className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Manual Table */}
        <Card className="border shadow-sm overflow-hidden rounded-xl bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="w-[50px] pl-6 h-12">
                    <Checkbox 
                      checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest h-12">Siswa</TableHead>
                  <TableHead className="text-center font-bold text-[10px] uppercase tracking-widest h-12">Status Presensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground font-medium">
                      Siswa tidak ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => {
                    const currentStatus = attendance[student.id];
                    return (
                      <TableRow key={student.id} className="group hover:bg-muted/5 transition-colors border-b last:border-0">
                        <TableCell className="pl-6 py-4">
                          <Checkbox 
                            checked={selectedIds.includes(student.id)}
                            onCheckedChange={() => toggleSelect(student.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                              <AvatarImage src={student.photo} />
                              <AvatarFallback className="text-[10px] font-bold bg-primary/5 text-primary">
                                {student.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm text-foreground/90">{student.name}</span>
                              <span className="text-[9px] text-muted-foreground font-mono uppercase tracking-tighter">ID: {student.id.substring(0, 8)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {attendanceButtons.map((btn) => {
                              const isActive = currentStatus === btn.value;
                              return (
                                <button
                                  key={btn.value}
                                  onClick={() => handleStatusChange(student.id, isActive ? undefined : btn.value)}
                                  disabled={isWeekend}
                                  title={btn.full}
                                  className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all border-2",
                                    isActive 
                                      ? `${btn.color} border-transparent text-white shadow-md scale-110 z-10` 
                                      : "bg-background border-muted text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
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
        </Card>

        {/* Bulk Action Bar (Manual Implementation) */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ y: 100, x: "-50%", opacity: 0 }}
              animate={{ y: 0, x: "-50%", opacity: 1 }}
              exit={{ y: 100, x: "-50%", opacity: 0 }}
              className="fixed bottom-10 left-1/2 z-50 flex items-center gap-3 bg-card border shadow-2xl px-6 py-2 rounded-full w-max max-w-[95vw]"
            >
              <div className="flex items-center gap-2 border-r pr-4 mr-1">
                <Badge className="rounded-full h-5 w-5 p-0 flex items-center justify-center font-bold bg-primary text-primary-foreground">{selectedIds.length}</Badge>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap hidden sm:inline">Siswa Terpilih</span>
              </div>
              <div className="flex items-center gap-1">
                {attendanceButtons.map(btn => (
                  <Button
                    key={btn.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkStatusChange(btn.value)}
                    className="h-9 rounded-full px-3 text-[10px] font-black gap-2 hover:bg-muted"
                  >
                    <span className={cn("h-2 w-2 rounded-full", btn.color)} />
                    {btn.full}
                  </Button>
                ))}
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedIds([])}
                  className="h-8 w-8 rounded-full hover:bg-muted"
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
