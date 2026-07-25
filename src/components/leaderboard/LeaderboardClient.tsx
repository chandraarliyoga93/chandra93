"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "iconoir-react";
import { cn } from "@/lib/utils";
import { useOptimistic } from "react";
import { BadgePicker } from "../gamification/BadgePicker";
import { BadgePreset } from "@/actions/gamification-supabase";

interface LeaderboardUser {
  id: string;
  name: string;
  className?: string | null;
  photo: string | null;
  level: number;
  xp: number;
  levelName?: string;
}

interface LeaderboardClientProps {
  data: LeaderboardUser[];
  currentRank: number | null;
  type: "global" | "kelas";
  studentId: string;
  hasClassId?: boolean;
  isGuru?: boolean;
  variant?: "pure" | "neo";
  initialBadges?: BadgePreset[];
  userProfile?: { xp: number; level: number; name: string } | null;
}

export function LeaderboardClient({ 
  data, 
  currentRank, 
  type, 
  studentId, 
  hasClassId = true,
  isGuru = false,
  variant = "pure",
  initialBadges,
  userProfile
}: LeaderboardClientProps) {
  const isNeo = variant === "neo";

  const [optimisticData, addOptimisticReward] = useOptimistic(
    data,
    (state, { studentId, amount }: { studentId: string; amount: number }) => {
      return state
        .map((user) =>
          user.id === studentId ? { ...user, xp: user.xp + amount } : user
        )
        .sort((a, b) => b.xp - a.xp);
    }
  );

  const top3 = optimisticData.slice(0, 3);
  const others = optimisticData.slice(3);

  const handleReward = (targetStudentId: string, amount: number) => {
    addOptimisticReward({ studentId: targetStudentId, amount });
  };

  const getPodiumColor = (rank: number) => {
    if (isNeo) {
      switch (rank) {
        case 1: return "bg-yellow-400 dark:bg-yellow-600 border-neo-border shadow-[8px_8px_0px_0px_var(--neo-border)]";
        case 2: return "bg-slate-200 dark:bg-slate-800 border-neo-border shadow-[8px_8px_0px_0px_var(--neo-border)]";
        case 3: return "bg-amber-100 dark:bg-amber-900 border-neo-border shadow-[8px_8px_0px_0px_var(--neo-border)]";
        default: return "bg-neo-bg border-neo-border shadow-[8px_8px_0px_0px_var(--neo-border)]";
      }
    }
    switch (rank) {
      case 1: return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900";
      case 2: return "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800";
      case 3: return "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900";
      default: return "bg-background border-border";
    }
  };

  if (!hasClassId && type === "kelas") {
    return (
      <Card className={cn("mt-8 border shadow-sm", isNeo && "neo-card")}>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className={cn("bg-muted p-6 rounded-full mb-6", isNeo && "border-4 border-neo-border bg-neo-bg shadow-[4px_4px_0px_0px_var(--neo-border)] rounded-none")}>
            <Trophy className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className={cn("text-2xl font-bold tracking-tight text-foreground", isNeo && "font-black uppercase italic tracking-tighter")}>
            Belum Pilih Kelas
          </h3>
          <p className={cn("text-muted-foreground mt-2", isNeo && "font-bold uppercase text-[10px]")}>
            Masuk ke salah satu kelas Anda terlebih dahulu untuk melihat klasemen.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    // If no data in class view, we still want to show the list if there are students, just with 0 XP
    // But data prop should already contain all students if fetch logic is correct.
    // However, if the array is truly empty, it means no students in class.
    return (
      <Card className={cn("mt-8 border shadow-sm", isNeo && "neo-card")}>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className={cn("bg-muted p-6 rounded-full mb-6", isNeo && "border-4 border-neo-border bg-neo-bg shadow-[4px_4px_0px_0px_var(--neo-border)] rounded-none")}>
            <Trophy className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className={cn("text-2xl font-bold tracking-tight text-foreground", isNeo && "font-black uppercase italic tracking-tighter")}>
            Belum Ada Data
          </h3>
          <p className={cn("text-muted-foreground mt-2", isNeo && "font-bold uppercase text-[10px]")}>
            Sepertinya belum ada data untuk {type === "global" ? "peringkat global" : "kelas ini"}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentUser = optimisticData.find(u => u.id === studentId);
  const userIndex = optimisticData.findIndex(u => u.id === studentId);
  // Peringkat di bottom bar = urutan di list yang ditampilkan (1-based), supaya selalu sesuai
  const displayRank = userIndex >= 0 ? userIndex + 1 : (currentRank ?? "?");
  const nextUser = userIndex > 0 ? optimisticData[userIndex - 1] : null;
  const xpDifference = nextUser && currentUser ? nextUser.xp - currentUser.xp : null;

  return (
    <div className="space-y-10 mt-8 pb-40 md:pb-24">
      {/* Podium Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 md:gap-4 pt-10 px-4">
        {/* Second Place */}
        {top3[1] && (
          <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative mb-2">
              <Avatar className={cn("w-16 h-16 border shadow-sm", isNeo && "border-4 border-neo-border rounded-none shadow-[4px_4px_0px_0px_var(--neo-border)]")}>
                <AvatarImage src={top3[1].photo || ""} />
                <AvatarFallback className={cn("bg-slate-200 dark:bg-slate-800 font-bold text-xl", isNeo && "rounded-none")}>{top3[1].name[0]}</AvatarFallback>
              </Avatar>
              <div className={cn("absolute -top-3 -right-3 bg-muted border p-1 rounded-full shadow-sm", isNeo && "border-2 border-neo-border rounded-none bg-neo-bg")}>
                <Trophy className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <Card className={cn("w-full border shadow-sm min-h-[6rem] flex flex-col items-center justify-center p-4", getPodiumColor(2), isNeo && "rounded-none border-4")}>
              <span className={cn("text-lg font-bold tracking-tight line-clamp-2 text-center break-words", isNeo && "font-black uppercase italic tracking-tighter")}>{top3[1].name}</span>
              {top3[1].className && type === "global" && (
                <Badge 
                  variant={isNeo ? "default" : "outline"} 
                  className={cn(
                    "text-[9px] h-4 px-1.5 py-0 border-none uppercase mb-1", 
                    isNeo 
                      ? "bg-yellow-400 text-black rounded-none border-2 border-neo-border font-black text-[10px] shadow-[2px_2px_0px_0px_var(--neo-border)] hover:bg-yellow-400" 
                      : "text-muted-foreground font-medium border-muted-foreground/20"
                  )}
                >
                  {top3[1].className}
                </Badge>
              )}
              <span className={cn("text-sm font-medium opacity-80", isNeo && "font-black")}>{top3[1].xp} XP</span>
              {top3[1].levelName && (
                <span className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1", isNeo && "font-black text-zinc-700 dark:text-zinc-300 italic")}>
                  {top3[1].levelName}
                </span>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className={cn("text-[10px] font-bold uppercase", isNeo && "bg-black text-white dark:bg-white dark:text-black border-none rounded-none")}>2ND PLACE</Badge>
                {isGuru && (
                  <BadgePicker 
                    studentId={top3[1].id} 
                    studentName={top3[1].name} 
                    onAssign={(amount) => handleReward(top3[1].id, amount)}
                    size="icon"
                    className={isNeo ? "neo-btn h-6 w-6" : ""}
                    initialBadges={initialBadges}
                  />
                )}
              </div>
            </Card>
          </div>
        )}

        {/* First Place */}
        {top3[0] && (
          <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 z-10 mb-8 md:mb-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative mb-4 md:scale-125">
              <Avatar className={cn("w-20 h-20 border-2 border-primary shadow-md", isNeo && "border-4 border-neo-border rounded-none shadow-[6px_6px_0px_0px_var(--neo-border)]")}>
                <AvatarImage src={top3[0].photo || ""} />
                <AvatarFallback className={cn("bg-yellow-400 font-bold text-2xl", isNeo && "rounded-none")}>{top3[0].name[0]}</AvatarFallback>
              </Avatar>
              <div className={cn("absolute -top-4 -right-4 bg-yellow-400 border p-1.5 rounded-full shadow-md", isNeo && "border-2 border-neo-border rounded-none")}>
                <Trophy className="w-6 h-6 text-black" />
              </div>
            </div>
            <Card className={cn("w-full border-2 border-primary shadow-lg min-h-[8rem] flex flex-col items-center justify-center p-4", getPodiumColor(1), isNeo && "rounded-none border-4")}>
              <span className={cn("text-xl font-bold tracking-tight line-clamp-2 text-center break-words", isNeo && "font-black uppercase italic tracking-tighter text-2xl")}>{top3[0].name}</span>
              {top3[0].className && type === "global" && (
                <Badge 
                  variant={isNeo ? "default" : "outline"} 
                  className={cn(
                    "text-[10px] h-4 px-1.5 py-0 border-none uppercase mb-1", 
                    isNeo 
                      ? "bg-yellow-400 text-black rounded-none border-2 border-neo-border font-black text-[10px] shadow-[2px_2px_0px_0px_var(--neo-border)] hover:bg-yellow-400" 
                      : "text-muted-foreground font-medium border-muted-foreground/20"
                  )}
                >
                  {top3[0].className}
                </Badge>
              )}
              <span className={cn("text-sm font-semibold opacity-90", isNeo && "font-black")}>{top3[0].xp} XP</span>
              {top3[0].levelName && (
                <span className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1", isNeo && "font-black text-zinc-700 dark:text-zinc-300 italic")}>
                  {top3[0].levelName}
                </span>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge className={cn("bg-primary text-primary-foreground text-[10px] font-bold uppercase", isNeo && "bg-black text-white dark:bg-white dark:text-black border-none rounded-none")}>CHAMPION</Badge>
                {isGuru && (
                  <BadgePicker 
                    studentId={top3[0].id} 
                    studentName={top3[0].name} 
                    onAssign={(amount) => handleReward(top3[0].id, amount)}
                    className={isNeo ? "neo-btn" : ""}
                    initialBadges={initialBadges}
                  />
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Third Place */}
        {top3[2] && (
          <div className="order-3 md:order-3 flex flex-col items-center w-full md:w-1/3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative mb-2">
              <Avatar className={cn("w-16 h-16 border shadow-sm", isNeo && "border-4 border-neo-border rounded-none shadow-[4px_4px_0px_0px_var(--neo-border)]")}>
                <AvatarImage src={top3[2].photo || ""} />
                <AvatarFallback className={cn("bg-amber-100 dark:bg-amber-900 font-bold text-xl", isNeo && "rounded-none")}>{top3[2].name[0]}</AvatarFallback>
              </Avatar>
              <div className={cn("absolute -top-3 -right-3 bg-muted border p-1 rounded-full shadow-sm", isNeo && "border-2 border-neo-border rounded-none bg-neo-bg")}>
                <Trophy className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
            <Card className={cn("w-full border shadow-sm min-h-[5rem] flex flex-col items-center justify-center p-4", getPodiumColor(3), isNeo && "rounded-none border-4")}>
              <span className={cn("text-lg font-bold tracking-tight line-clamp-2 text-center break-words", isNeo && "font-black uppercase italic tracking-tighter")}>{top3[2].name}</span>
              {top3[2].className && type === "global" && (
                <Badge 
                  variant={isNeo ? "default" : "outline"} 
                  className={cn(
                    "text-[9px] h-4 px-1.5 py-0 border-none uppercase mb-1", 
                    isNeo 
                      ? "bg-yellow-400 text-black rounded-none border-2 border-neo-border font-black text-[10px] shadow-[2px_2px_0px_0px_var(--neo-border)] hover:bg-yellow-400" 
                      : "text-muted-foreground font-medium border-muted-foreground/20"
                  )}
                >
                  {top3[2].className}
                </Badge>
              )}
              <span className={cn("text-sm font-medium opacity-80", isNeo && "font-black")}>{top3[2].xp} XP</span>
              {top3[2].levelName && (
                <span className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1", isNeo && "font-black text-zinc-700 dark:text-zinc-300 italic")}>
                  {top3[2].levelName}
                </span>
              )}
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase", isNeo && "bg-black text-white dark:bg-white dark:text-black border-none rounded-none")}>3RD PLACE</Badge>
                {isGuru && (
                  <BadgePicker 
                    studentId={top3[2].id} 
                    studentName={top3[2].name} 
                    onAssign={(amount) => handleReward(top3[2].id, amount)}
                    size="icon"
                    className={isNeo ? "neo-btn h-6 w-6" : ""}
                    initialBadges={initialBadges}
                  />
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* List Section */}
      <div className="space-y-4 pt-4 px-2">
        {others.length > 0 && (
          <h3 className={cn("font-semibold text-muted-foreground text-sm uppercase tracking-wider", isNeo && "font-black text-foreground italic")}>Peringkat Lainnya</h3>
        )}
        <div className="grid gap-3">
          {others.map((user) => {
            const isMe = user.id === studentId;
            const actualIndex = optimisticData.findIndex(u => u.id === user.id);
            return (
              <Card 
                key={user.id} 
                className={cn(
                  "flex items-center justify-between p-3 border shadow-sm transition-colors",
                  isMe ? (isNeo ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-600 border-4 shadow-[4px_4px_0px_0px_var(--neo-border)]" : "bg-primary/5 border-primary/20") : (isNeo ? "border-4 border-neo-border rounded-none shadow-[4px_4px_0px_0px_var(--neo-border)] bg-neo-bg" : "hover:bg-muted/50")
                )}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className={cn("w-8 shrink-0 font-bold text-muted-foreground text-xl tabular-nums text-center", isNeo && "font-black text-foreground italic")}>
                    {actualIndex + 1}
                  </div>
                  <Avatar className={cn("w-10 h-10 shrink-0 border", isNeo && "border-2 border-neo-border rounded-none")}>
                    <AvatarImage src={user.photo || ""} />
                    <AvatarFallback className={cn("bg-muted font-bold text-xs uppercase", isNeo && "rounded-none")}>
                      {user.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h5 className={cn("font-bold text-sm flex items-center gap-2 flex-wrap break-words", isNeo && "font-black uppercase italic tracking-tighter")}>
                      <span className="break-words">{user.name}</span>
                      {user.className && type === "global" && (
                        <Badge 
                          variant={isNeo ? "default" : "outline"} 
                          className={cn(
                            "text-[9px] h-4 px-1.5 py-0 border-none uppercase", 
                            isNeo 
                              ? "bg-yellow-400 text-black rounded-none border-2 border-neo-border font-black text-[10px] shadow-[2px_2px_0px_0px_var(--neo-border)] hover:bg-yellow-400" 
                              : "text-muted-foreground font-medium border-muted-foreground/20"
                          )}
                        >
                          {user.className}
                        </Badge>
                      )}
                      {isMe && <Badge variant="default" className={cn("text-[8px] h-4 px-1.5 py-0 border-none uppercase", isNeo && "bg-indigo-600 dark:bg-indigo-500 rounded-none italic")}>Anda</Badge>}
                    </h5>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", isNeo && "font-black text-muted-foreground italic tracking-tight")}>
                        LEVEL {user.level}
                        {user.levelName && (
                          <span className="ml-1 normal-case tracking-normal">
                            · {user.levelName}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className={cn("font-bold text-lg tabular-nums", isNeo && "font-black italic")}>
                      {user.xp} <span className={cn("text-[10px] uppercase text-muted-foreground", isNeo && "text-muted-foreground font-black")}>XP</span>
                    </div>
                  </div>
                  {isGuru && (
                    <BadgePicker 
                      studentId={user.id} 
                      studentName={user.name} 
                      onAssign={(amount) => handleReward(user.id, amount)}
                      className={isNeo ? "neo-btn" : ""}
                      initialBadges={initialBadges}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sticky Personal Rank Bar: above bottom nav on mobile (nav h-16), normal on desktop */}
      {!isGuru && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl z-50 md:bottom-6">
          <Card className={cn("bg-primary p-4 text-primary-foreground flex items-center justify-between border shadow-lg", isNeo && "border-4 border-neo-border bg-indigo-600 dark:bg-indigo-950 rounded-none shadow-[8px_8px_0px_0px_var(--neo-border)] text-white")}>
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-full border-2 border-primary-foreground/20 bg-primary-foreground/10 flex items-center justify-center font-bold text-xl tabular-nums", isNeo && "rounded-none border-4 border-white bg-white/20 font-black italic shadow-[4px_4px_0px_0px_var(--neo-border)]")}>
                #{displayRank}
              </div>
              <div>
                <h4 className={cn("font-bold text-lg leading-none", isNeo && "font-black uppercase italic tracking-tighter")}>Peringkat Anda</h4>
                <p className={cn("text-primary-foreground/80 font-medium text-[10px] uppercase tracking-wider mt-1", isNeo && "text-white/80 font-black italic")}>
                  {userIndex === 0
                    ? "Anda berada di\u00A0puncak petualangan!"
                    : nextUser && typeof xpDifference === "number" && xpDifference > 0
                      ? `${xpDifference} XP lagi untuk menyalip ${nextUser.name.split(' ')[0]}`
                      : nextUser
                        ? `Sama dengan ${nextUser.name.split(' ')[0]}, gas lagi!`
                        : "Lihat peringkatmu di daftar di atas."}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className={cn("bg-background/10 border-background/20 text-primary-foreground font-bold text-xs uppercase", isNeo && "bg-yellow-400 text-black border-2 border-neo-border rounded-none shadow-[2px_2px_0px_0px_var(--neo-border)] font-black italic")}>
                {(() => {
                  const levelValue = currentUser?.level ?? userProfile?.level ?? "?";
                  const name = currentUser?.levelName;
                  return name ? `LEVEL ${levelValue} • ${name}` : `LEVEL ${levelValue}`;
                })()}
              </Badge>
              <span className={cn("font-bold text-sm tabular-nums", isNeo && "font-black italic")}>{currentUser?.xp ?? userProfile?.xp ?? 0} XP</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
