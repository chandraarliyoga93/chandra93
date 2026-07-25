"use client";

import { Group, ArrowRight, Trophy } from "iconoir-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getLevelConfigSupabase as getLevelConfig, LevelConfig } from "@/actions/gamification-supabase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EnrolledClassCardProps {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  xp: number;
  level: number;
}

export function EnrolledClassCard({ id, name, description, studentCount, xp, level }: EnrolledClassCardProps) {
  const [levels, setLevels] = useState<LevelConfig[]>([]);

  useEffect(() => {
    const loadThresholds = async () => {
      const config = await getLevelConfig();
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
    <Card className="neo-card flex flex-col justify-between h-full bg-neo-bg p-0 overflow-hidden group gap-0">
      {/* Header: Class Info */}
      <CardHeader className="p-3 border-b-4 border-neo-border bg-yellow-400 dark:bg-indigo-900 space-y-0 block">
        <div className="flex justify-end items-start mb-1">
          <div className="flex items-center gap-1 bg-neo-bg border-2 border-neo-border px-1.5 py-0.5 shadow-[2px_2px_0px_0px_var(--neo-border)]">
            <Trophy className="h-2.5 w-2.5 text-foreground" />
            <span className="text-[10px] font-black text-foreground">LVL {level}</span>
          </div>
        </div>
        <h3 className="font-black text-lg uppercase leading-tight text-black dark:text-white line-clamp-1 italic tracking-tighter">
          {name}
        </h3>
      </CardHeader>

      {/* Body: Stats & Progress */}
      <CardContent className="p-3 flex-1 flex flex-col gap-3 bg-neo-bg">
        <div className="flex items-center gap-1.5 text-foreground font-black text-[10px] border-2 border-neo-border p-1.5 bg-muted uppercase tracking-widest">
          <Group className="h-3.5 w-3.5" />
          <span>{studentCount} Students</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-black text-foreground uppercase tracking-widest">
            <span>XP PROGRESS</span>
            <span>{xp} / {nextLevelXP}</span>
          </div>
          <div className="relative h-4 border-2 border-neo-border bg-muted p-0.5">
            <Progress 
              value={progress} 
              className="h-full w-full bg-transparent rounded-none [&>[data-slot=progress-indicator]]:bg-neo-primary [&>[data-slot=progress-indicator]]:border-r-2 [&>[data-slot=progress-indicator]]:border-neo-border" 
            />
          </div>
        </div>
        
        <p className="text-[10px] font-bold text-muted-foreground line-clamp-1 uppercase italic">
          {description || "No description available."}
        </p>
      </CardContent>

      {/* Footer: Action */}
      <CardFooter className="p-3 pt-0 block">
        <Button asChild className="neo-btn w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 py-2 h-auto rounded-none hover:text-white text-xs font-black italic">
          <Link href={`/dashboard/siswa?classId=${id}`}>
            MASUK KELAS
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
