"use client";

import { useState, useTransition, useEffect } from "react";
import QRCode from "react-qr-code";
import { 
  User, 
  Settings, 
  Check, 
  EditPencil, 
  Camera,
  Trophy, 
  Flash,
  Calendar,
  Infinite
} from "iconoir-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { updateStudentAliasSupabase } from "@/actions/users-supabase";
import { getLevelConfigSupabase as getLevelConfig, LevelConfig } from "@/actions/gamification-supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ProfileAvatarPicker } from "./ProfileAvatarPicker";

interface StudentData {
  uid: string;
  name: string;
  alias: string;
  email: string;
  level: number;
  xp: number;
  joinedAt?: string;
  photo?: string;
  equipped?: Record<string, string>;
}

interface DigitalIDCardProps {
  studentData: StudentData;
}

export function DigitalIDCard({ studentData }: DigitalIDCardProps) {
  const [alias, setAlias] = useState(studentData.alias || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [levels, setLevels] = useState<LevelConfig[]>([]);

  useEffect(() => {
    const loadConfig = async () => {
      const config = await getLevelConfig();
      setLevels(config);
    };
    loadConfig();
  }, []);

  const handleUpdateAlias = () => {
    const trimmedAlias = alias.trim();
    if (!trimmedAlias) {
      toast.error("Alias tidak boleh kosong");
      return;
    }
    
    if (trimmedAlias === studentData.alias) {
      setIsEditing(false);
      return;
    }

    startTransition(async () => {
      const result = await updateStudentAliasSupabase(trimmedAlias);
      if (result.success) {
        toast.success("Alias berhasil diperbarui!");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Gagal memperbarui alias");
      }
    });
  };

  // Gamification logic
  const currentLevel = levels.find(l => l.rank === studentData.level);
  const nextLevel = levels.find(l => l.rank === studentData.level + 1);
  
  const currentLevelXP = currentLevel?.minXp || 0;
  const nextLevelXP = nextLevel?.minXp || (levels.length > 0 ? levels[levels.length - 1].minXp + 2500 : 1000);
  const progress = Math.min(100, Math.max(0, ((studentData.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));

  const isRubyProfile = studentData.equipped?.profile === "ruby-profile";
  const isGoldBorder = studentData.equipped?.border === "gold-border";
  const isNeonName = studentData.equipped?.name === "neon-name";
  const isDiamondBadge = studentData.equipped?.badge === "diamond-badge";

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/siswa/${studentData.uid}`
      : "";

  return (
    <Card className={cn(
      "max-w-md w-full border-4 rounded-none shadow-[8px_8px_0px_0px_var(--neo-border)] overflow-hidden transition-colors duration-500",
      isRubyProfile ? "bg-rose-50 dark:bg-rose-950/40 border-rose-600 dark:border-rose-500" : "bg-neo-bg border-neo-border"
    )}>
      {/* Header - Neo-brutalist Yellow */}
      <CardHeader className={cn(
        "border-b-4 p-4 space-y-0 transition-colors duration-500",
        isRubyProfile ? "bg-rose-600 border-rose-900" : "bg-yellow-400 dark:bg-indigo-900 border-neo-border"
      )}>
        <div className="flex justify-between items-center">
          <h2 className={cn(
            "text-2xl font-black italic uppercase tracking-tighter transition-colors duration-500",
            isRubyProfile ? "text-white" : "text-black dark:text-white"
          )}>
            IDENTITAS SISWA
          </h2>
          <div className={cn(
            "px-2 py-1 text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
            isRubyProfile ? "bg-white text-rose-600" : "bg-black text-yellow-400 dark:bg-white dark:text-indigo-900"
          )}>
            STUDENT PASS
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-6 space-y-6">
          {/* Top Section: Avatar and Info */}
          <div className="flex gap-6 items-start">
              <div className="relative">
                {/* Large Boxed Avatar */}
                <div className={cn(
                  "w-32 h-32 border-4 overflow-hidden transition-all duration-500",
                  isGoldBorder 
                    ? "border-yellow-400 shadow-[4px_4px_0px_0px_#fbbf24] scale-105" 
                    : "border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)]",
                  isRubyProfile ? "bg-rose-100" : "bg-cyan-100 dark:bg-cyan-900"
                )}>
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={studentData.photo} className="object-cover" />
                    <AvatarFallback className="rounded-none bg-transparent text-foreground">
                      <User className="w-12 h-12 stroke-[2.5]" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Edit Avatar Trigger */}
                <button 
                  onClick={() => setIsAvatarPickerOpen(true)}
                  className="absolute -bottom-2 -right-2 bg-black dark:bg-white text-white dark:text-black p-1.5 border-2 border-neo-border shadow-[2px_2px_0px_0px_var(--neo-border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all z-10"
                  aria-label="Ubah Avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Level/Trophy Badge */}
                <div className={cn(
                  "absolute -top-2 -right-2 border-2 p-1.5 shadow-[2px_2px_0px_0px_var(--neo-border)] transition-colors duration-500",
                  isDiamondBadge ? "bg-blue-500 border-white text-white" : "bg-indigo-600 border-neo-border text-white"
                )}>
                  {isDiamondBadge ? <Check className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                </div>
              </div>

            <div className="flex-1 space-y-1.5 min-w-0">
              <h3 className={cn(
                "text-xl font-black leading-none uppercase truncate italic tracking-tighter transition-all duration-500",
                isNeonName ? "text-green-500 [text-shadow:2px_2px_0px_#000] animate-pulse" : "text-foreground"
              )}>
                {studentData.name}
              </h3>
              <p className="text-xs font-bold text-muted-foreground font-mono truncate uppercase">
                {studentData.email}
              </p>
              
              <div className="pt-3">
                {/* QR Code Container pointing to Public Showcase */}
                <div className="bg-white dark:bg-slate-200 border-4 border-black p-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] inline-block">
                  {shareUrl ? (
                    <QRCode 
                      value={shareUrl} 
                      size={64}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      viewBox={`0 0 256 256`}
                      fgColor="#000000"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              "border-4 p-3 shadow-[4px_4px_0px_0px_var(--neo-border)] group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-500",
              isRubyProfile ? "bg-rose-100 border-rose-600" : "bg-indigo-50 dark:bg-indigo-950 border-neo-border"
            )}>
              <div className={cn(
                "text-[10px] font-black uppercase tracking-tighter transition-colors duration-500",
                isRubyProfile ? "text-rose-600" : "text-indigo-600 dark:text-indigo-400"
              )}>Level</div>
              <div className="text-4xl font-black text-foreground italic leading-none">
                {studentData.level}
              </div>
            </div>
            <div className={cn(
              "border-4 p-3 shadow-[4px_4px_0px_0px_var(--neo-border)] group hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all duration-500",
              isRubyProfile ? "bg-rose-100 border-rose-600" : "bg-cyan-50 dark:bg-cyan-950 border-neo-border"
            )}>
              <div className={cn(
                "text-[10px] font-black uppercase tracking-tighter transition-colors duration-500",
                isRubyProfile ? "text-rose-600" : "text-cyan-600 dark:text-cyan-400"
              )}>Bergabung</div>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-4 h-4 text-foreground" />
                <span className="text-xs font-black uppercase leading-none text-foreground">
                  {studentData.joinedAt ? format(new Date(studentData.joinedAt), "MMM yyyy") : "Jan 2026"}
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-1.5">
                <Flash className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Experience Points</span>
              </div>
              <span className="text-[10px] font-black font-mono bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5">
                {studentData.xp} / {nextLevelXP} XP
              </span>
            </div>
            <div className="relative h-7 border-4 border-neo-border bg-muted p-1 shadow-[4px_4px_0px_0px_var(--neo-border)]">
              <Progress 
                value={progress} 
                className="h-full w-full bg-transparent rounded-none [&>[data-slot=progress-indicator]]:bg-indigo-600 [&>[data-slot=progress-indicator]]:border-r-4 [&>[data-slot=progress-indicator]]:border-neo-border transition-all duration-500" 
              />
            </div>
          </div>

          {/* Alias Configuration */}
          <div className="pt-2 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 italic">
              <Settings className="w-3.5 h-3.5" />
              PENGATURAN ALIAS
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input 
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  disabled={!isEditing || isPending}
                  className={cn(
                    "border-4 border-neo-border rounded-none h-12 font-black text-lg shadow-[4px_4px_0px_0px_var(--neo-border)] focus-visible:ring-0 focus-visible:ring-offset-0 transition-all uppercase italic",
                    isEditing ? "bg-neo-bg" : "bg-muted/50 opacity-80"
                  )}
                  placeholder="ALIAS_SAYA"
                  maxLength={20}
                />
              </div>
              
              {isEditing ? (
                <Button 
                  onClick={handleUpdateAlias}
                  disabled={isPending}
                  className="h-12 px-4 border-4 border-neo-border rounded-none bg-green-400 hover:bg-green-500 text-black dark:text-zinc-950 shadow-[4px_4px_0px_0px_var(--neo-border)]"
                >
                  {isPending ? (
                    <Infinite className="w-6 h-6 animate-spin" />
                  ) : (
                    <Check className="w-6 h-6 stroke-[3]" />
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="h-12 px-4 border-4 border-neo-border rounded-none bg-yellow-400 hover:bg-yellow-500 text-black dark:text-zinc-950 shadow-[4px_4px_0px_0px_var(--neo-border)]"
                >
                  <EditPencil className="w-6 h-6 stroke-[3]" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Bottom Color Stripes - Neo-brutalist touch */}
      <div className="h-6 bg-neo-border flex border-t-4 border-neo-border">
        <div className="flex-1 bg-indigo-600 border-r-2 border-neo-border"></div>
        <div className="flex-1 bg-cyan-400 border-r-2 border-neo-border"></div>
        <div className="flex-1 bg-yellow-400 border-r-2 border-neo-border"></div>
        <div className="flex-1 bg-rose-500"></div>
      </div>

      <ProfileAvatarPicker 
        isOpen={isAvatarPickerOpen} 
        onOpenChange={setIsAvatarPickerOpen} 
        currentPhoto={studentData.photo}
      />
    </Card>
  );
}

