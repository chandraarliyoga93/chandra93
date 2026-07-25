"use client";

import { AttendanceStatus } from "@/actions/attendance-supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Student {
  id: string;
  name: string;
  photo?: string;
}

interface MobileAttendanceCardProps {
  student: Student;
  status: AttendanceStatus | undefined;
  onStatusChange: (status: AttendanceStatus | undefined) => void;
  selected: boolean;
  onToggleSelect: () => void;
}

const attendanceButtons = [
  { value: "present", label: "H", full: "Hadir", activeColor: "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 border-zinc-950 dark:border-zinc-50" },
  { value: "sick", label: "S", full: "Sakit", activeColor: "bg-zinc-500 text-white border-zinc-500" },
  { value: "excused", label: "I", full: "Izin", activeColor: "bg-zinc-400 text-white border-zinc-400" },
  { value: "late", label: "T", full: "Telat", activeColor: "bg-zinc-300 text-zinc-900 border-zinc-300" },
  { value: "absent", label: "A", full: "Alpa", activeColor: "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 border-zinc-200 dark:border-zinc-800" },
] as const;

export function MobileAttendanceCard({
  student,
  status,
  onStatusChange,
  selected,
  onToggleSelect,
}: MobileAttendanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border transition-all duration-200 bg-white dark:bg-zinc-950",
        selected 
          ? "border-zinc-950 dark:border-zinc-50 ring-1 ring-zinc-950 dark:ring-zinc-50" 
          : "border-zinc-200/50 dark:border-zinc-800/50"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            className="rounded-lg border-zinc-300 h-5 w-5"
          />
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
              <AvatarImage src={student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`} />
              <AvatarFallback className="text-xs font-bold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {student.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-950 dark:text-zinc-50 tracking-tight leading-none mb-1">
                {student.name}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-tighter">
                ID: {student.id.substring(0, 8)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-900/50 p-2 rounded-2xl">
        {attendanceButtons.map((btn) => {
          const isActive = status === btn.value;
          return (
            <button
              key={btn.value}
              onClick={() => onStatusChange(isActive ? undefined : btn.value)}
              className={cn(
                "h-11 flex-1 rounded-xl flex items-center justify-center text-xs font-black transition-all border-2",
                isActive
                  ? `${btn.activeColor} shadow-sm scale-[1.02]`
                  : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
              aria-label={btn.full}
            >
              {btn.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
