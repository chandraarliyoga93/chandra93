"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChatBubble, Check, WarningTriangle, Medal, Flash } from "iconoir-react";
import { BadgePreset, getBadgesSupabase } from "@/actions/gamification-supabase";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface V2GradeCellProps {
  value: number | null;
  remarks?: string;
  rewardXP?: number;
  rewardBadgeId?: string;
  onValueChange: (value: number | null) => void;
  onRemarksChange: (remarks: string) => void;
  onPersist: (value: number | null, remarks?: string, xp?: number, badgeId?: string) => void;
  rowIndex: number;
  colIndex: number;
  studentId: string;
  assignmentId: string;
  maxPoints?: number;
  isSaving?: boolean;
}

export function V2GradeCell({
  value,
  remarks = "",
  rewardXP,
  rewardBadgeId,
  onValueChange,
  onRemarksChange,
  onPersist,
  rowIndex,
  colIndex,
  studentId,
  assignmentId,
  maxPoints = 100,
  isSaving = false,
}: V2GradeCellProps) {
  const [localValue, setLocalValue] = useState(value !== null ? value.toString() : "");
  const [localRemarks, setLocalRemarks] = useState(remarks);
  const [localXP, setLocalXP] = useState<string>(rewardXP?.toString() || "");
  const [localBadgeId, setLocalBadgeId] = useState<string>(rewardBadgeId || "none");
  const [badges, setBadges] = useState<BadgePreset[]>([]);
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value !== null ? value.toString() : "");
  }, [value]);

  useEffect(() => {
    setLocalRemarks(remarks);
  }, [remarks]);

  useEffect(() => {
    setLocalXP(rewardXP?.toString() || "");
  }, [rewardXP]);

  useEffect(() => {
    setLocalBadgeId(rewardBadgeId || "none");
  }, [rewardBadgeId]);

  useEffect(() => {
    getBadgesSupabase().then((data) => setBadges(data as any));
  }, []);

  const validate = (val: string) => {
    if (val === "") return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalValue(newVal);
    
    const isValid = validate(newVal);
    setIsError(!isValid);

    if (isValid) {
      const num = newVal === "" ? null : parseFloat(newVal);
      onValueChange(num);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onPersist(
          num, 
          localRemarks, 
          localXP ? parseInt(localXP) : undefined, 
          localBadgeId === "none" ? undefined : localBadgeId
        );
      }, 2000);
    }
  };

  const handleBlur = () => {
    if (isError) {
      setLocalValue(value !== null ? value.toString() : "");
      setIsError(false);
    } else {
      const num = localValue === "" ? null : parseFloat(localValue);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      onPersist(
        num, 
        localRemarks, 
        localXP ? parseInt(localXP) : undefined, 
        localBadgeId === "none" ? undefined : localBadgeId
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Tab"].includes(e.key)) {
      let nextRow = rowIndex;
      let nextCol = colIndex;

      if (e.key === "ArrowUp") nextRow--;
      if (e.key === "ArrowDown" || e.key === "Enter") nextRow++;
      if (e.key === "ArrowLeft") nextCol--;
      if (e.key === "ArrowRight" || (e.key === "Tab" && !e.shiftKey)) nextCol++;
      if (e.key === "Tab" && e.shiftKey) nextCol--;

      if (e.key !== "Tab") {
        const nextCell = document.querySelector(
          `input[data-row="${nextRow}"][data-col="${nextCol}"]`
        ) as HTMLInputElement;

        if (nextCell) {
          e.preventDefault();
          nextCell.focus();
          nextCell.select();
        }
      }
    }
  };

  const handleSettingsSave = () => {
    onRemarksChange(localRemarks);
    onPersist(
      value, 
      localRemarks, 
      localXP ? parseInt(localXP) : undefined, 
      localBadgeId === "none" ? undefined : localBadgeId
    );
    toast.success("Pengaturan nilai & feedback diperbarui", {
      description: localRemarks ? `Feedback: "${localRemarks}"` : undefined,
      icon: <Check className="h-4 w-4 text-green-500" />
    });
  };

  return (
    <div className="relative group w-full h-full flex items-center justify-center min-h-[44px]">
      <Input
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-row={rowIndex}
        data-col={colIndex}
        className={cn(
          "h-full w-full border-none bg-transparent px-3 text-center font-bold text-sm transition-all focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-400 shadow-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          isError && "bg-rose-50 text-rose-600 focus-visible:ring-rose-400",
          !isError && value !== null && "text-zinc-950 dark:text-zinc-50",
          !isError && value === null && "text-zinc-300 dark:text-zinc-700"
        )}
        placeholder="-"
      />

      {isSaving && (
        <div className="absolute right-1 top-1 text-[8px] text-zinc-400 animate-pulse">
          <Check className="h-2 w-2" />
        </div>
      )}

      {isError && (
        <div className="absolute right-1 top-1 text-rose-500">
          <WarningTriangle className="h-3 w-3" />
        </div>
      )}

      <Popover onOpenChange={(open) => !open && handleSettingsSave()}>
        <PopoverTrigger asChild>
          <button 
            className={cn(
              "absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1",
              (remarks || rewardXP || rewardBadgeId) && "opacity-100 text-zinc-950 dark:text-zinc-50"
            )}
          >
            <ChatBubble className={cn("h-3 w-3", (remarks || rewardXP || rewardBadgeId) ? "fill-current" : "")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 rounded-2xl border-zinc-200/50 shadow-xl p-4">
          <div className="grid gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-sm tracking-tight">Grade Settings</h4>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Customize rewards & feedback
              </p>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Keterangan</Label>
                <Textarea
                  id="remarks"
                  value={localRemarks}
                  onChange={(e) => setLocalRemarks(e.target.value)}
                  placeholder="Example: Remedial, Late submission, etc."
                  className="h-20 rounded-xl resize-none border-zinc-200/50 bg-zinc-50/50 dark:border-zinc-800/50 dark:bg-zinc-900/50 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="xp" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <Flash className="h-2.5 w-2.5" /> Bonus XP
                  </Label>
                  <Input
                    id="xp"
                    type="number"
                    value={localXP}
                    onChange={(e) => setLocalXP(e.target.value)}
                    placeholder="Auto"
                    className="h-9 rounded-xl border-zinc-200/50 bg-zinc-50/50 dark:border-zinc-800/50 dark:bg-zinc-900/50 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="badge" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <Medal className="h-2.5 w-2.5" /> Badge
                  </Label>
                  <Select value={localBadgeId} onValueChange={setLocalBadgeId}>
                    <SelectTrigger id="badge" className="h-9 rounded-xl border-zinc-200/50 bg-zinc-50/50 dark:border-zinc-800/50 dark:bg-zinc-900/50 text-[10px] font-bold">
                      <SelectValue placeholder="Pilih Badge" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-200/50 shadow-xl">
                      <SelectItem value="none" className="text-[10px] font-bold">Tanpa Badge</SelectItem>
                      {badges.map((badge) => (
                        <SelectItem key={badge.id} value={badge.id} className="text-[10px] font-bold">
                          {badge.emoji} {badge.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button size="sm" onClick={handleSettingsSave} className="w-full rounded-xl font-bold bg-zinc-950 dark:bg-zinc-50 text-xs h-9">
              Simpan Pengaturan
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
