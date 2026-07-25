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
import { BadgePreset, getBadgesSupabase as getBadges } from "@/actions/gamification-supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GradeCellProps {
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

export function GradeCell({
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
}: GradeCellProps) {
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
    getBadges().then((data) => setBadges(data as any));
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

      // Debounced persist
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
      // Revert to previous valid value
      setLocalValue(value !== null ? value.toString() : "");
      setIsError(false);
    } else {
      const num = localValue === "" ? null : parseFloat(localValue);
      // Cancel debounce and persist immediately on blur
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

      // Prevent default for arrows and Enter to handle navigation
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
  };

  return (
    <div className="relative group w-full h-full flex items-center justify-center min-h-[40px]">
      <Input
        ref={inputRef}
        type="number"
        aria-label={`Nilai untuk ${studentId} - ${assignmentId}`}
        aria-invalid={isError}
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-row={rowIndex}
        data-col={colIndex}
        className={cn(
          "h-full w-full border-none bg-transparent px-2 text-center font-bold transition-all focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary shadow-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          isError && "bg-destructive/10 text-destructive focus-visible:ring-destructive",
          !isError && value !== null && "text-foreground",
          !isError && value === null && "text-muted-foreground/50"
        )}
        placeholder="-"
      />

      {/* Saving Indicator */}
      {isSaving && (
        <div className="absolute right-1 top-1 text-[8px] text-muted-foreground animate-pulse">
          <Check className="h-2 w-2" />
        </div>
      )}

      {/* Error Indicator */}
      {isError && (
        <div className="absolute right-1 top-1 text-destructive">
          <WarningTriangle className="h-3 w-3" />
        </div>
      )}

      {/* Settings Indicator & Popover */}
      <Popover onOpenChange={(open) => !open && handleSettingsSave()}>
        <PopoverTrigger asChild>
          <button 
            className={cn(
              "absolute left-0.5 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm hover:bg-muted p-0.5",
              (remarks || rewardXP || rewardBadgeId) && "opacity-100 text-primary"
            )}
          >
            <ChatBubble className={cn("h-3 w-3", (remarks || rewardXP || rewardBadgeId) ? "fill-current" : "")} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-bold text-sm tracking-tight">Grade Settings</h4>
              <p className="text-xs text-muted-foreground font-medium">
                Customize rewards & feedback for this student
              </p>
            </div>

            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-xs font-bold text-zinc-500">Keterangan</Label>
                <Textarea
                  id="remarks"
                  value={localRemarks}
                  onChange={(e) => setLocalRemarks(e.target.value)}
                  placeholder="Misal: Remedial, Terlambat, dll."
                  className="h-20 rounded-xl resize-none border-zinc-200/50 bg-zinc-50/50 dark:border-zinc-800/50 dark:bg-zinc-900/50 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="xp" className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                    <Flash className="h-3 w-3" /> Bonus XP
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
                  <Label htmlFor="badge" className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                    <Medal className="h-3 w-3" /> Hadiah Badge
                  </Label>
                  <Select value={localBadgeId} onValueChange={setLocalBadgeId}>
                    <SelectTrigger id="badge" className="h-9 rounded-xl border-zinc-200/50 bg-zinc-50/50 font-bold dark:border-zinc-800/50 dark:bg-zinc-900/50 text-[10px] font-bold">
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

            <Button size="sm" onClick={handleSettingsSave} className="w-full rounded-xl font-bold">
              Simpan Pengaturan
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
