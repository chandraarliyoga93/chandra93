"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star } from "iconoir-react";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string;
  name: string;
  className?: string | null;
  photo: string | null;
  level: number;
  xp: number;
   levelName?: string;
}

interface V2LeaderboardProps {
  data: LeaderboardUser[];
  className?: string;
  isFiltered?: boolean;
}

export function V2Leaderboard({ data, className, isFiltered }: V2LeaderboardProps) {
  const top3 = data.slice(0, 3);
  const others = data.slice(3);

  if (data.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-[2rem] border-zinc-200 dark:border-zinc-800",
        className
      )}>
        <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-4">
          <Trophy className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">Belum Ada Data</h3>
        <p className="text-sm text-zinc-500 max-w-xs mt-2">
          Sepertinya belum ada data untuk klasemen saat ini.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-12", className)}>
      {/* Podium Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end justify-center gap-6 md:gap-4 px-4">
        {/* Second Place */}
        {top3[1] && (
          <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 group">
            <div className="relative mb-3">
              <Avatar className="w-16 h-16 border-2 border-zinc-200 dark:border-zinc-800">
                <AvatarImage src={top3[1].photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(top3[1].name)}`} />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-500">
                  {top3[1].name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-full shadow-sm">
                <Medal className="w-4 h-4 text-zinc-500" />
              </div>
            </div>
            <div className="w-full rounded-[1.5rem] border border-zinc-200 bg-white p-5 flex flex-col items-center justify-center transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-center line-clamp-1">{top3[1].name}</span>
              <span className="text-sm text-zinc-500 mb-1">{top3[1].xp} XP</span>
              {top3[1].levelName && (
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                  {top3[1].levelName}
                </span>
              )}
              <Badge variant="outline" className="rounded-full bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 font-medium">
                2nd Place
              </Badge>
            </div>
          </div>
        )}

        {/* First Place */}
        {top3[0] && (
          <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 z-10 scale-110">
            <div className="relative mb-4">
              <Avatar className="w-20 h-20 border-4 border-zinc-900 dark:border-zinc-100">
                <AvatarImage src={top3[0].photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(top3[0].name)}`} />
                <AvatarFallback className="bg-zinc-900 dark:bg-zinc-100 font-bold text-white dark:text-zinc-900 text-xl">
                  {top3[0].name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-3 -right-3 bg-zinc-900 dark:bg-zinc-100 border border-zinc-900 dark:border-zinc-100 p-2 rounded-full shadow-xl">
                <Trophy className="w-5 h-5 text-white dark:text-zinc-900" />
              </div>
            </div>
            <div className="w-full rounded-[2rem] border-2 border-zinc-900 bg-zinc-900 p-6 flex flex-col items-center justify-center text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-2xl shadow-zinc-900/20 dark:shadow-zinc-100/10">
              <span className="text-xl font-bold tracking-tight text-center line-clamp-1">{top3[0].name}</span>
              <span className="text-sm opacity-80 mb-1">{top3[0].xp} XP</span>
              {top3[0].levelName && (
                <span className="text-[10px] font-semibold opacity-90 uppercase tracking-widest mb-2">
                  {top3[0].levelName}
                </span>
              )}
              <Badge className="rounded-full bg-white text-zinc-900 hover:bg-white dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-900 border-none font-bold">
                CHAMPION
              </Badge>
            </div>
          </div>
        )}

        {/* Third Place */}
        {top3[2] && (
          <div className="order-3 md:order-3 flex flex-col items-center w-full md:w-1/3 group">
            <div className="relative mb-3">
              <Avatar className="w-16 h-16 border-2 border-zinc-200 dark:border-zinc-800">
                <AvatarImage src={top3[2].photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(top3[2].name)}`} />
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-900 font-bold text-zinc-500">
                  {top3[2].name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -top-2 -right-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-full shadow-sm">
                <Star className="w-4 h-4 text-zinc-500" />
              </div>
            </div>
            <div className="w-full rounded-[1.5rem] border border-zinc-200 bg-white p-5 flex flex-col items-center justify-center transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-center line-clamp-1">{top3[2].name}</span>
              <span className="text-sm text-zinc-500 mb-1">{top3[2].xp} XP</span>
              {top3[2].levelName && (
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                  {top3[2].levelName}
                </span>
              )}
              <Badge variant="outline" className="rounded-full bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 font-medium">
                3rd Place
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* List Section */}
      <div className="space-y-4 max-w-3xl mx-auto px-2">
        {others.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Peringkat Lainnya</h4>
          </div>
        )}
        <div className="grid gap-3">
          {others.map((user) => {
            const actualIndex = data.findIndex(u => u.id === user.id);
            return (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 bg-white dark:border-zinc-900 dark:bg-zinc-950/50 hover:border-zinc-200 dark:hover:border-zinc-800 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center font-bold text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors tabular-nums">
                    {actualIndex + 1}
                  </div>
                <Avatar className="w-10 h-10 border border-zinc-100 dark:border-zinc-900">
                  <AvatarImage src={user.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`} />
                  <AvatarFallback className="bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h5 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {user.name}
                  </h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Level {user.level}
                      {user.levelName && (
                        <span className="ml-1 normal-case tracking-normal">
                          · {user.levelName}
                        </span>
                      )}
                    </span>
                    {user.className && !isFiltered && (
                      <span className="text-[10px] text-zinc-400">• {user.className}</span>
                    )}
                  </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {user.xp} <span className="text-[10px] font-bold text-zinc-400 ml-1">XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
