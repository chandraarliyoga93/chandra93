"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Star, Flash, ClipboardCheck, StatsUpSquare } from "iconoir-react";
import { useState, useEffect } from "react";
import { getLevelConfigSupabase, LevelConfig } from "@/actions/gamification-supabase";

interface ClassStats {
  name: string;
  totalTasks: number;
  completedTasks: number;
  averageGrade: number;
}

interface StudentProgressHeroProps {
  xp: number;
  level: number;
  displayName: string;
  classStats?: ClassStats;
}

export function StudentProgressHero({ xp, level, displayName, classStats }: StudentProgressHeroProps) {
  const [levels, setLevels] = useState<LevelConfig[]>([]);

  useEffect(() => {
    const loadThresholds = async () => {
      const config = await getLevelConfigSupabase();
      setLevels(config);
    };
    loadThresholds();
  }, []);

  const currentLevelConfig = levels.find(l => l.rank === level);
  const nextLevelConfig = levels.find(l => l.rank === level + 1);

  const currentLevelXP = currentLevelConfig?.minXp || 0;
  const nextLevelXP = nextLevelConfig?.minXp || currentLevelXP + 1000;
  // Ensure progress is between 0 and 100
  const rawProgress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  const progress = Math.min(100, Math.max(0, rawProgress));
  
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border-4 border-neo-border bg-neo-bg p-6 md:p-10 shadow-[8px_8px_0px_0px_var(--neo-border)]">
      {/* Background patterns */}
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-neo-accent/20 blur-3xl" />
      <div className="absolute left-0 bottom-0 h-32 w-32 translate-y-12 -translate-x-12 rounded-full bg-neo-primary/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground md:text-5xl uppercase leading-none">
              {classStats ? `Kelas: ${classStats.name}` : `Yo, ${displayName}!`}
            </h1>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Flash className="h-8 w-8 md:h-10 md:w-10 text-neo-accent" />
            </motion.div>
          </div>
          <p className="text-lg font-bold text-muted-foreground uppercase italic max-w-lg leading-tight">
            {classStats 
              ? "Pantau perkembangan belajarmu di kelas ini. Tetap gokil!"
              : "Misi hari ini udah nunggu buat ditaklukin."}
          </p>

          {/* Class Specific Metrics if available */}
          {classStats && (
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-neo-border p-2 px-4 shadow-[4px_4px_0px_0px_var(--neo-border)]">
                <ClipboardCheck className="h-5 w-5 text-neo-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-muted-foreground leading-none">Misi Selesai</span>
                  <span className="text-lg font-black italic leading-none">{classStats.completedTasks}/{classStats.totalTasks}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border-2 border-neo-border p-2 px-4 shadow-[4px_4px_0px_0px_var(--neo-border)]">
                <StatsUpSquare className="h-5 w-5 text-neo-accent" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-muted-foreground leading-none">Rata-Rata</span>
                  <span className="text-lg font-black italic leading-none">{classStats.averageGrade > 0 ? classStats.averageGrade.toFixed(1) : "-"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 bg-white/50 dark:bg-zinc-900/70 border-4 border-neo-border p-4 rounded-[2rem] shadow-[4px_4px_0px_0px_var(--neo-border)] self-start lg:self-center">
          <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl border-4 border-neo-border bg-yellow-400 text-3xl md:text-4xl font-black shadow-[4px_4px_0px_0px_var(--neo-border)] italic">
            {level}
          </div>
          <div className="space-y-1">
            <Badge className="bg-neo-accent text-black border-2 border-neo-border font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_var(--neo-border)]">
              {level > 5 ? "ELITE SCHOLAR" : "STUDENT WARRIOR"}
            </Badge>
            <p className="font-black text-lg md:text-xl uppercase italic leading-tight text-foreground">Level {level}</p>
            <p className="text-[10px] font-black text-muted-foreground uppercase">{xp.toLocaleString()} Total XP</p>
          </div>
        </div>
      </div>

      <div className="mt-8 md:mt-12 space-y-3">
        <div className="flex justify-between items-end mb-1">
          <span className="font-black text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Star className="h-4 w-4" />
            Progres Level Global
          </span>
          <span className="text-xl md:text-2xl font-black italic">{xp} <span className="text-xs md:text-sm opacity-50">/ {nextLevelXP} XP</span></span>
        </div>
        <div className="h-8 md:h-10 w-full rounded-2xl border-4 border-neo-border bg-slate-100 dark:bg-zinc-800 overflow-hidden shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-neo-primary border-r-4 border-neo-border"
          />
        </div>
        <p className="text-[9px] md:text-[10px] font-black text-muted-foreground uppercase italic text-right">
          Butuh {Math.max(0, nextLevelXP - xp)} XP lagi buat naik level!
        </p>
      </div>
    </section>
  );
}
