"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Medal, Xmark, Check, NavArrowDown, Wallet } from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { batchAssignXPSupabase as batchAssignXP, batchAssignBadgeSupabase as batchAssignBadge, BadgePreset } from "@/actions/gamification-supabase";
import { batchGiveManualCoinSupabase as batchGiveManualCoin } from "@/actions/market-supabase";
import { DownloadCardsButton } from "./DownloadCardsButton";
import { toast } from "sonner";
import { useBadges } from "@/hooks/use-badges";

interface Student {
  id: string;
  name: string;
  studentId: string;
  password?: string;
}

interface FloatingRewardBarProps {
  selectedIds: string[];
  students?: Student[]; // Added this to pass student data
  onClear: () => void;
}

const XP_OPTIONS = [5, 10, 25, 50, 100];
const COIN_OPTIONS = [10, 25, 50, 100, 250];

export function FloatingRewardBar({ selectedIds, students, onClear }: FloatingRewardBarProps) {
  const selectedStudents = (students || []).filter(s => selectedIds.includes(s.id));
  const { badges } = useBadges();
  const [isPending, startTransition] = useTransition();
  const [coinReason, setCoinReason] = useState("");
  const [customCoin, setCustomCoin] = useState("");
  const [isCoinOpen, setIsCoinOpen] = useState(false);

  const handleBatchXP = (amount: number) => {
    if (isPending || selectedIds.length === 0) return;
    
    startTransition(async () => {
      const loadingToast = toast.loading(`Memberikan +${amount} XP ke ${selectedIds.length} siswa…`);
      
      try {
        const result = await batchAssignXP(selectedIds, amount, `Bonus XP Massal (+${amount})`);
        if (result.success) {
          toast.success(`Berhasil memberikan +${amount} XP ke ${selectedIds.length} siswa`, { id: loadingToast });
          onClear();
        } else {
          toast.error(result.error || "Gagal memberikan XP", { id: loadingToast });
        }
      } catch (error) {
        console.error("Batch XP error:", error);
        toast.error("Terjadi kesalahan sistem", { id: loadingToast });
      }
    });
  };

  const handleBatchCoin = (amount: number) => {
    if (isPending || selectedIds.length === 0 || isNaN(amount) || amount === 0) return;

    startTransition(async () => {
      const reason = coinReason.trim() || `Reward Guru Massal (+${amount} Koin)`;
      const loadingToast = toast.loading(`Memberikan ${amount} Koin ke ${selectedIds.length} siswa…`);

      try {
        const result = await batchGiveManualCoin(selectedIds, amount, reason);
        if (result.success) {
          toast.success(`Berhasil memberikan ${amount} Koin ke ${selectedIds.length} siswa`, { id: loadingToast });
          setIsCoinOpen(false);
          setCoinReason("");
          setCustomCoin("");
          onClear();
        } else {
          toast.error((result as any).error || "Gagal memberikan koin", { id: loadingToast });
        }
      } catch (error) {
        console.error("Batch coin error:", error);
        toast.error("Terjadi kesalahan sistem", { id: loadingToast });
      }
    });
  };

  const handleBatchBadge = (badge: BadgePreset) => {
    if (isPending || selectedIds.length === 0) return;
    
    startTransition(async () => {
      const loadingToast = toast.loading(`Memberikan badge ${badge.emoji} ke ${selectedIds.length} siswa…`);
      
      try {
        const result = await batchAssignBadge(selectedIds, badge.id);
        if (result.success) {
          toast.success(`Berhasil memberikan badge ${badge.emoji} ${badge.label} ke ${selectedIds.length} siswa`, { id: loadingToast });
          onClear();
        } else {
          toast.error(result.error || "Gagal memberikan badge", { id: loadingToast });
        }
      } catch (error) {
        console.error("Batch badge error:", error);
        toast.error("Terjadi kesalahan sistem", { id: loadingToast });
      }
    });
  };

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ y: 100, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: 100, x: "-50%", opacity: 0 }}
          className="fixed bottom-12 left-1/2 z-50 flex items-center gap-4 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl px-6 py-3 rounded-3xl w-max max-w-[95vw]"
        >
          <div className="flex items-center gap-3 border-r border-zinc-200 dark:border-zinc-800 pr-6">
            <Badge className="rounded-full h-7 w-7 p-0 flex items-center justify-center font-bold bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 text-xs">
              {selectedIds.length}
            </Badge>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap leading-tight">Siswa</span>
              <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-tight whitespace-nowrap leading-tight">Terpilih</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* XP Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl px-4 text-[11px] font-bold gap-2 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  disabled={isPending}
                >
                  <Coins className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  Beri XP
                  <NavArrowDown className="w-3 h-3 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" side="top" sideOffset={12} className="w-48 p-2 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md bg-white/95 dark:bg-zinc-950/95">
                <div className="grid grid-cols-1 gap-1">
                  {XP_OPTIONS.map((xp) => (
                    <Button
                      key={xp}
                      variant="ghost"
                      size="sm"
                      className="group justify-between h-9 px-3 rounded-lg text-xs font-medium hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      onClick={() => handleBatchXP(xp)}
                    >
                      <span className="flex items-center gap-2">
                        <Coins className="w-3 h-3 text-amber-500" aria-hidden="true" />
                        +{xp} XP
                      </span>
                      <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* GuruCoin Popover */}
            <Popover open={isCoinOpen} onOpenChange={setIsCoinOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl px-4 text-[11px] font-bold gap-2 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                  disabled={isPending}
                >
                  <Wallet className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                  Beri Koin
                  <NavArrowDown className="w-3 h-3 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" side="top" sideOffset={12} className="w-64 p-3 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md bg-white/95 dark:bg-zinc-950/95">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Alasan</Label>
                    <Input
                      placeholder="Contoh: Reward Kelas"
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
                          if (e.key === "Enter") handleBatchCoin(parseInt(customCoin));
                        }}
                      />
                      <Button 
                        size="sm" 
                        className="h-8 px-3 rounded-lg text-[10px] font-bold bg-yellow-500 hover:bg-yellow-600 text-white border-none shadow-none"
                        onClick={() => handleBatchCoin(parseInt(customCoin))}
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
                          className="group justify-between h-9 px-3 rounded-lg text-xs font-medium hover:bg-yellow-50 dark:hover:bg-yellow-950/30"
                          onClick={() => handleBatchCoin(coin)}
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl px-4 text-[11px] font-bold gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  disabled={isPending}
                >
                  <Medal className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                  Beri Badge
                  <NavArrowDown className="w-3 h-3 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="center" side="top" sideOffset={12} className="w-64 p-2 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md bg-white/95 dark:bg-zinc-950/95">
                <div className="max-h-[300px] overflow-y-auto pr-1">
                  {badges.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-500 italic">
                      Belum ada badge yang tersedia
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1">
                      {badges.map((badge) => (
                        <Button
                          key={badge.id}
                          variant="ghost"
                          size="sm"
                          className="group justify-start h-11 px-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 gap-3"
                          onClick={() => handleBatchBadge(badge)}
                        >
                          <span className="text-lg bg-zinc-100 dark:bg-zinc-900 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
                            {badge.emoji}
                          </span>
                          <div className="flex flex-col items-start overflow-hidden flex-1">
                            <span className="text-xs font-bold truncate w-full text-left">{badge.label}</span>
                            <span className="text-[10px] text-zinc-500">+{badge.xp} XP</span>
                          </div>
                          <Check className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2" />

            <DownloadCardsButton 
              students={selectedStudents}
              variant="ghost"
              size="sm"
              label="Cetak Kartu"
              className="h-10 rounded-xl px-4 text-[11px] font-bold gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            />
            
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-2" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              aria-label="Tutup bar hadiah"
              className="h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              disabled={isPending}
            >
              <Xmark className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
