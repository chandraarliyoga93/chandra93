"use client";

import { useState, useEffect } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { getStudentsByClassSupabase as getClassStudents } from "@/actions/students";
import { 
  getAttendanceByDateSupabase as getAttendanceByDate, 
  AttendanceStatus,
  saveBulkAttendanceSupabase as saveBulkAttendance 
} from "@/actions/attendance-supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  CheckCircle, 
  XmarkCircle, 
  Clock, 
  InfoCircle, 
  Infinite, 
  EditPencil,
  FloppyDisk,
  Xmark
} from "iconoir-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Student {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

interface AttendanceDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  date: string;
}

export default function AttendanceDetailSheet({
  isOpen,
  onOpenChange,
  classId,
  date,
}: AttendanceDetailSheetProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [studentsResult, attendanceData] = await Promise.all([
            getClassStudents(classId),
            getAttendanceByDate(classId, date),
          ]);

          setStudents((studentsResult as any).data || []);
          setAttendance(attendanceData);
          setLocalAttendance(attendanceData);
        } catch (error) {
          console.error("Error fetching detail data:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
      setIsEditing(false);
    }
  }, [isOpen, classId, date]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus | undefined) => {
    setLocalAttendance(prev => {
      const next = { ...prev };
      if (status === undefined) {
        delete next[studentId];
      } else {
        next[studentId] = status;
      }
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const changes: Record<string, AttendanceStatus | null> = {};
      
      // Compare local with original to find changes
      students.forEach(s => {
        if (localAttendance[s.id] !== attendance[s.id]) {
          changes[s.id] = localAttendance[s.id] || null;
        }
      });

      if (Object.keys(changes).length === 0) {
        setIsEditing(false);
        return;
      }

      const res = await saveBulkAttendance(classId, date, changes);
      if (res.success) {
        setAttendance(localAttendance);
        setIsEditing(false);
        toast.success("Perubahan presensi berhasil disimpan");
      } else {
        toast.error((res as any).error || "Gagal menyimpan perubahan");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  const attendanceButtons = [
    { value: "present", label: "H", full: "Hadir", color: "bg-emerald-500" },
    { value: "sick", label: "S", full: "Sakit", color: "bg-amber-500" },
    { value: "excused", label: "I", full: "Izin", color: "bg-sky-500" },
    { value: "late", label: "T", full: "Telat", color: "bg-orange-500" },
    { value: "absent", label: "A", full: "Alpa", color: "bg-rose-500" },
  ] as const;

  const getStatusBadge = (status: AttendanceStatus | undefined) => {
    switch (status) {
      case "present":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-medium">
            <CheckCircle className="w-3 h-3" />
            Hadir
          </Badge>
        );
      case "sick":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-medium">
            <InfoCircle className="w-3 h-3" />
            Sakit
          </Badge>
        );
      case "excused":
        return (
          <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 gap-1 font-medium">
            <InfoCircle className="w-3 h-3" />
            Izin
          </Badge>
        );
      case "absent":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1 font-medium">
            <XmarkCircle className="w-3 h-3" />
            Alpa
          </Badge>
        );
      case "late":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1 font-medium">
            <Clock className="w-3 h-3" />
            Terlambat
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border font-medium">
            Belum Diisi
          </Badge>
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col h-full p-0 gap-0 overflow-hidden">
        <SheetHeader className="p-6 border-b bg-card relative">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl font-bold flex items-center gap-2">
                Detail Presensi
              </SheetTitle>
              <SheetDescription className="text-sm">
                {date && format(parseISO(date), "EEEE, dd MMMM yyyy", { locale: idLocale })}
              </SheetDescription>
            </div>
            {!isLoading && students.length > 0 && !isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="h-8 gap-1.5 font-bold text-[10px] uppercase tracking-widest"
              >
                <EditPencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
            {isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsEditing(false);
                  setLocalAttendance(attendance);
                }}
                className="h-8 gap-1.5 font-bold text-[10px] uppercase tracking-widest"
              >
                <Xmark className="w-3.5 h-3.5" />
                Batal
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full px-6 bg-background">
            <div className="py-6 space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                  <Infinite className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium">Memuat data...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Tidak ada siswa di kelas ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {students.map((student) => {
                    const currentStatus = isEditing ? localAttendance[student.id] : attendance[student.id];
                    
                    return (
                      <div 
                        key={student.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all",
                          isEditing ? "bg-muted/20 border-border" : "border-border/50 bg-card/50 hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-muted-foreground/10">
                            <AvatarImage src={student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`} alt={student.name} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-0.5">
                            <p className="text-sm font-semibold leading-none">{student.name}</p>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                              ID: {student.id.substring(0, 8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                        
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            {attendanceButtons.map((btn) => {
                              const isActive = currentStatus === btn.value;
                              return (
                                <button
                                  key={btn.value}
                                  onClick={() => handleStatusChange(student.id, isActive ? undefined : btn.value)}
                                  className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black transition-all border-2",
                                    isActive 
                                      ? `${btn.color} border-transparent text-white shadow-sm scale-110 z-10` 
                                      : "bg-background border-muted text-muted-foreground hover:border-muted-foreground/30"
                                  )}
                                  title={btn.full}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div>
                            {getStatusBadge(currentStatus)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <div className="p-6 border-t bg-muted/30">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Klik tombol untuk mengubah status</span>
                <span className="text-primary">{Object.keys(localAttendance).length} Terisi</span>
              </div>
              <Button 
                className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Infinite className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FloppyDisk className="w-4 h-4 mr-2" />
                )}
                Simpan Perubahan
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Ringkasan Kehadiran
              </div>
              {!isLoading && (
                <div className="flex gap-2">
                  <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                    {Object.values(attendance).filter(v => v === 'present').length} Hadir
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
                    {Object.values(attendance).filter(v => v === 'absent').length} Alpa
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
