"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NavArrowRight, Coins } from "iconoir-react";
import { RewardActions } from "./RewardActions";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  joinedAt: string;
  studentId?: string;
  photo?: string;
  alias?: string;
}

interface MobileStudentCardProps {
  student: Student;
  isSelected: boolean;
  onSelect: (id: string) => void;
  actions?: React.ReactNode;
}

export function MobileStudentCard({
  student,
  isSelected,
  onSelect,
  actions,
}: MobileStudentCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-[background-color,border-color,box-shadow] duration-300",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 shadow-sm"
      )}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Selection & Avatar */}
          <div className="relative group">
            <Avatar className="h-16 w-16 border-2 border-white dark:border-zinc-900 shadow-sm">
              <AvatarImage
                src={student.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  student.name
                )}`}
              />
              <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-lg font-bold">
                {student.name ? student.name.substring(0, 2).toUpperCase() : "??"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-1 -left-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(student.id)}
                aria-label={`Pilih ${student.name}`}
                className="h-6 w-6 rounded-full border-zinc-300 bg-white dark:bg-zinc-900 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-colors shadow-sm"
              />
            </div>
          </div>

          {/* Student Info */}
          <div className="flex-1 min-w-0 py-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                {student.name}
              </h3>
              {student.alias && (
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0">
                  @{student.alias}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-medium truncate uppercase tracking-widest mt-0.5">
              {student.email}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <Badge
                variant="secondary"
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 border-none font-bold text-[10px] px-2 py-0.5 rounded-lg"
              >
                LVL {student.level}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-none font-bold text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1"
              >
                <Coins className="w-3 h-3" aria-hidden="true" />
                {student.xp.toLocaleString()} XP
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RewardActions studentId={student.id} studentName={student.name} />
            {actions}
          </div>

          <Button
            variant="secondary"
            className="flex-1 max-w-[140px] h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-sm gap-2 transition-[background-color,transform] active:scale-95"
            onClick={() => {
              /* View Profile Logic */
            }}
          >
            Profile
            <NavArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
