"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Gift, Medal, Refresh } from "iconoir-react";
import { BadgePreset, getBadgesSupabase as getBadges, awardBadgeSupabase as assignBadge } from "@/actions/gamification-supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BadgePickerProps {
  studentId: string;
  studentName: string;
  onAssign?: (amount: number) => void;
  className?: string;
  size?: "sm" | "md" | "lg" | "icon";
  initialBadges?: BadgePreset[];
}

export function BadgePicker({
  studentId,
  studentName,
  onAssign,
  className,
  size = "md",
  initialBadges,
}: BadgePickerProps) {
  const [badges, setBadges] = useState<BadgePreset[]>(initialBadges || []);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(!initialBadges);

  useEffect(() => {
    if (!initialBadges && isOpen && badges.length === 0) {
      const fetchBadges = async () => {
        setIsFetching(true);
        try {
          const data = await getBadges();
          setBadges(data as any);
        } catch (error) {
          console.error("Failed to fetch badges", error);
        } finally {
          setIsFetching(false);
        }
      };
      fetchBadges();
    }
  }, [isOpen, initialBadges, badges.length]);

  const handleAssign = async (badge: BadgePreset) => {
    setIsLoading(true);
    // Optimistic update
    if (onAssign) onAssign(badge.xp);

    try {
      const result = await assignBadge(studentId, badge.id);
        if (result.success) {
          toast.success(`Berhasil memberikan ${badge.emoji} ${badge.label} kepada ${studentName}`);
          setIsOpen(false);
        } else {
          toast.error((result as any).error || "Gagal memberikan badge");
        }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size === "icon" ? "icon" : "sm"}
          className={cn(
            "gap-2 text-xs font-bold transition-all",
            size === "icon" ? "rounded-full h-8 w-8" : "rounded-lg",
            "hover:bg-primary hover:text-primary-foreground",
            className
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <Refresh className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Gift className="w-4 h-4" />
              {size !== "icon" && "Reward"}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden" align="end">
        <div className="p-4 bg-muted/50 border-b">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Medal className="w-4 h-4 text-primary" />
            Beri Badge untuk {studentName.split(" ")[0]}
          </h4>
          <p className="text-[10px] text-muted-foreground mt-1">
            Pilih reward XP untuk diberikan secara instan.
          </p>
        </div>
        
        <div className="p-2 max-h-[300px] overflow-y-auto">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Refresh className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs">Memuat badge...</p>
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm text-muted-foreground">Belum ada badge preset.</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Buat di tab "Pustaka Badge" terlebih dahulu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {badges.map((badge) => (
                <button
                  key={badge.id}
                  onClick={() => handleAssign(badge)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left group w-full"
                >
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-xl shadow-sm border group-hover:border-primary/50">
                    {badge.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{badge.label}</p>
                    <p className="text-[10px] font-medium text-primary">+{badge.xp} XP</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
