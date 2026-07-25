import { cn } from "@/lib/utils";
import { LevelConfig } from "@/actions/gamification-supabase";

interface GradesSummaryProps {
  xp: number;
  level: number;
  totalTasks?: number;
  completedTasks?: number;
  averageGrade?: number;
  thresholds?: LevelConfig[];
  className?: string;
}

export function GradesSummary({
  xp,
  level,
  totalTasks = 0,
  completedTasks = 0,
  averageGrade = 0,
  className,
}: GradesSummaryProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 md:grid-cols-3", className)}>
      {/* Level Block - Yellow - compact on mobile */}
      <div className="group relative overflow-hidden border-2 sm:border-4 border-neo-border bg-yellow-400 dark:bg-yellow-500 p-3 sm:p-4 md:p-6 shadow-[4px_4px_0px_0px_var(--neo-border)] sm:shadow-[6px_6px_0px_0px_var(--neo-border)] md:shadow-[8px_8px_0px_0px_var(--neo-border)] transition-all hover:-translate-y-0.5 md:hover:-translate-y-1 hover:shadow-none">
        <div className="absolute -right-2 -top-2 h-10 w-10 sm:h-16 sm:w-16 md:h-24 md:w-24 rounded-full bg-yellow-300 dark:bg-yellow-400 transition-transform group-hover:scale-150 opacity-80" />
        <div className="relative flex flex-col items-center justify-center text-center min-h-[72px] sm:min-h-0">
          <h3 className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-zinc-950 italic">
            Level
          </h3>
          <span className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter text-black dark:text-zinc-950 italic leading-none">
            {level}
          </span>
          <p className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest bg-white dark:bg-zinc-100 border border-black sm:border-2 px-1.5 py-0.5 sm:px-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {xp.toLocaleString()} XP
          </p>
        </div>
      </div>

      {/* Tasks Block - Cyan */}
      <div className="group relative overflow-hidden border-2 sm:border-4 border-neo-border bg-cyan-400 dark:bg-cyan-500 p-3 sm:p-4 md:p-6 shadow-[4px_4px_0px_0px_var(--neo-border)] sm:shadow-[6px_6px_0px_0px_var(--neo-border)] md:shadow-[8px_8px_0px_0px_var(--neo-border)] transition-all hover:-translate-y-0.5 md:hover:-translate-y-1 hover:shadow-none">
        <div className="absolute -left-2 -bottom-2 h-10 w-10 sm:h-16 sm:w-16 md:h-24 md:w-24 rounded-full bg-cyan-300 dark:bg-cyan-400 transition-transform group-hover:scale-150 opacity-80" />
        <div className="relative flex flex-col items-center justify-center text-center min-h-[72px] sm:min-h-0">
          <h3 className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-zinc-950 italic">
            Misi Selesai
          </h3>
          <span className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter text-black dark:text-zinc-950 italic leading-none">
            {completedTasks}
          </span>
          <p className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest bg-white dark:bg-zinc-100 border border-black sm:border-2 px-1.5 py-0.5 sm:px-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Dari {totalTasks} Misi
          </p>
        </div>
      </div>

      {/* Average Block - Pink */}
      <div className="group relative overflow-hidden border-2 sm:border-4 border-neo-border bg-pink-400 dark:bg-pink-500 p-3 sm:p-4 md:p-6 shadow-[4px_4px_0px_0px_var(--neo-border)] sm:shadow-[6px_6px_0px_0px_var(--neo-border)] md:shadow-[8px_8px_0px_0px_var(--neo-border)] transition-all hover:-translate-y-0.5 md:hover:-translate-y-1 hover:shadow-none">
        <div className="absolute -right-2 -bottom-2 h-10 w-10 sm:h-16 sm:w-16 md:h-24 md:w-24 rounded-full bg-pink-300 dark:bg-pink-400 transition-transform group-hover:scale-150 opacity-80" />
        <div className="relative flex flex-col items-center justify-center text-center min-h-[72px] sm:min-h-0">
          <h3 className="mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-black dark:text-zinc-950 italic">
            Rata-Rata
          </h3>
          <span className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter text-black dark:text-zinc-950 italic leading-none">
            {averageGrade > 0 ? averageGrade.toFixed(1) : "-"}
          </span>
          <p className="mt-1 sm:mt-2 text-[9px] sm:text-[10px] font-black text-black uppercase tracking-widest bg-white dark:bg-zinc-100 border border-black sm:border-2 px-1.5 py-0.5 sm:px-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Nilai Kamu
          </p>
        </div>
      </div>
    </div>
  );
}

