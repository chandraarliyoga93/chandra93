"use client";

import { useState, useTransition } from "react";
import { Coins, Medal, Check, Wallet } from "iconoir-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { assignXPSupabase as assignXP, awardBadgeSupabase as assignBadge, BadgePreset } from "@/actions/gamification-supabase";
import { giveManualCoinSupabase as giveManualCoin } from "@/actions/market-supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBadges } from "@/hooks/use-badges";

interface RewardActionsProps {
  studentId: string;
  studentName: string;
}

const XP_OPTIONS = [5, 10, 25, 50, 100];
const COIN_OPTIONS = [10, 25, 50, 100, 250];

export function RewardActions({ studentId, studentName }: RewardActionsProps) {
  const { badges } = useBadges();
  const [xpReason, setXpReason] = useState("");
  const [coinReason, setCoinReason] = useState("");
  const [customCoin, setCustomCoin] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isXpOpen, setIsXpOpen] = useState(false);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);
  const [isCoinOpen, setIsCoinOpen] = useState(false);

  const handleAssignXP = (amount: number) => {
    if (isPending) return;

    startTransition(async () => {
      const reason = xpReason.trim() || `Bonus XP (+${amount})`;
      const loadingToast = toast.loading(`Memberikan +${amount} XP ke ${studentName}…`);

      try {
        const result = await assignXP(studentId, amount, reason);
        if (result.success) {
          toast.success(`Berhasil memberikan +${amount} XP ke ${studentName}`, { id: loadingToast });
          setIsXpOpen(false);
          setXpReason("");
        } else {
          toast.error((result as any).error || "Gagal memberikan XP", { id: loadingToast });
        }
      } catch (error) {
        console.error("Assign XP error:", error);
        toast.error("Terjadi kesalahan sistem", { id: loadingToast });
      }
    });
  };

  const handleGiveCoin = (amount: number) => {
    if (isPending || isNaN(amount) || amount === 0) return;

    startTransition(async () => {
      const reason = coinReason.trim() || `Reward Guru (+${amount} Koin)`;
      const loadingToast = toast.loading(`Memberikan ${amount} Koin ke ${studentName}…`);

      try {
        const result = await giveManualCoin(studentId, amount, reason);
        if (result.success) {
          toast.success(`Berhasil memberikan ${amount} Koin ke ${studentName}`, { id: loadingToast });
          setIsCoinOpen(false);
          setCoinReason("");
          setCustomCoin("");
        } else {
          toast.error((result as any).error || "Gagal memberikan koin", { id: loadingToast });
        }

      } catch (error) {
        console.error("Give coin error:", error);
        toast.error("Terjadi kesalahan sistem", { id: loadingToast });
      }
    });
  };

  const handleAssignBadge = (badge: BadgePreset) => {
    if (isPending) return;

    startTransition(async () => {
      const loadingToast = toast.loading(`Memberikan badge ${badge.emoji} ke ${studentName}…`);

      try {
        const result = await assignBadge(studentId, badge.id);
        if (result.success) {
          toast.success(`Berhasil memberikan badge ${badge.emoji} ${badge.label} ke ${studentName}`, { id: loadingToast });
          setIsBadgeOpen(false);
        } else {
          toast.error((result as any).error || "Gagal memberikan badge", { id: loadingToast });
        }
      } catch (error) {
        console.error("Assign badge error:", error);
        toast.error("Terjadi kesalahan sistem", { id: loadingToast });
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* XP Popover */}
      <Popover open={isXpOpen} onOpenChange={setIsXpOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Beri XP"
            className={cn(
              "h-8 w-8 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors",
              isXpOpen && "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
            )}
            disabled={isPending}
          >
            <Coins className="w-4 h-4" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-3 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-950">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alasan (Opsional)</Label>
              <Input
                placeholder="Contoh: Aktif bertanya"
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
                className="h-8 text-xs rounded-lg"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pilih Jumlah XP</Label>
              <div className="grid grid-cols-1 gap-1">
                {XP_OPTIONS.map((xp) => (
                  <Button
                    key={xp}
                    variant="ghost"
                    size="sm"
                    className="group justify-between h-8 px-2 rounded-md text-xs font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    onClick={() => handleAssignXP(xp)}
                  >
                    <span className="flex items-center gap-2">
                      <Coins className="w-3 h-3 text-amber-500" aria-hidden="true" />
                      +{xp} XP
                    </span>
                    <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" aria-hidden="true" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* GuruCoin Popover */}
      <Popover open={isCoinOpen} onOpenChange={setIsCoinOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Beri Koin"
            className={cn(
              "h-8 w-8 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-950/30 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors",
              isCoinOpen && "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400"
            )}
            disabled={isPending}
          >
            <Wallet className="w-4 h-4" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-3 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-950">
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Alasan</Label>
              <Input
                placeholder="Contoh: Juara Lomba"
                value={coinReason}
                onChange={(e) => setCoinReason(e.target.value)}
                className="h-8 text-xs rounded-lg"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Input Manual</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Jumlah..."
                  value={customCoin}
                  onChange={(e) => setCustomCoin(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGiveCoin(parseInt(customCoin));
                  }}
                />
                <Button 
                  size="sm" 
                  className="h-8 px-3 rounded-lg text-[10px] font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-none"
                  onClick={() => handleGiveCoin(parseInt(customCoin))}
                  disabled={!customCoin || isPending}
                >
                  Kirim
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pilih Cepat</Label>
              <div className="grid grid-cols-1 gap-1">
                {COIN_OPTIONS.map((coin) => (
                  <Button
                    key={coin}
                    variant="ghost"
                    size="sm"
                    className="group justify-between h-8 px-2 rounded-md text-xs font-medium hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                    onClick={() => handleGiveCoin(coin)}
                  >
                    <span className="flex items-center gap-2">
                      <Wallet className="w-3 h-3 text-yellow-500" aria-hidden="true" />
                      +{coin} Koin
                    </span>
                    <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-yellow-600" aria-hidden="true" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Badge Popover */}
      <Popover open={isBadgeOpen} onOpenChange={setIsBadgeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Beri Badge"
            className={cn(
              "h-8 w-8 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors",
              isBadgeOpen && "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
            )}
            disabled={isPending}
          >
            <Medal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-2 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-950">
          <div className="max-h-[280px] overflow-y-auto space-y-1 p-1">
            <div className="px-2 py-1 mb-1">
              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pilih Badge</Label>
            </div>
            {badges.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500 italic">
                Belum ada badge tersedia
              </div>
            ) : (
              badges.map((badge) => (
                <Button
                  key={badge.id}
                  variant="ghost"
                  size="sm"
                  className="group justify-start h-10 w-full px-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-3"
                  onClick={() => handleAssignBadge(badge)}
                >
                  <span className="text-base bg-zinc-100 dark:bg-zinc-900 h-7 w-7 rounded flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
                    {badge.emoji}
                  </span>
                  <div className="flex flex-col items-start overflow-hidden flex-1">
                    <span className="text-xs font-bold truncate w-full text-left">{badge.label}</span>
                    <span className="text-[10px] text-zinc-500">+{badge.xp} XP</span>
                  </div>
                    <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" aria-hidden="true" />
                </Button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
