import React from "react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Book, Flash } from "iconoir-react";

interface Activity {
  id: string;
  type: string;
  studentName?: string;
  studentPhoto?: string;
  className?: string;
  reason?: string;
  amount?: number;
  timestamp: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card className="col-span-1 lg:col-span-1 border-none shadow-none bg-transparent">
      <CardHeader className="px-6">
        <CardTitle>Aktivitas Terbaru</CardTitle>
        <CardDescription>
          Riwayat interaksi dan administrasi kelas terbaru.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <div className="space-y-6">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada aktivitas terbaru.
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-center group hover:bg-zinc-100 dark:hover:bg-zinc-900/50 p-2 -mx-2 rounded-xl transition-colors">
                {activity.type === "JOURNAL" ? (
                  <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                    <Book className="size-5" />
                  </div>
                ) : activity.type === "EXAM_COMPLETION" ? (
                  <div className="h-9 w-9 rounded-full bg-yellow-400/10 dark:bg-yellow-400/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                    <Flash className="size-5" />
                  </div>
                ) : (
                  <Avatar className="h-9 w-9 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                    <AvatarImage src={activity.studentPhoto} alt={activity.studentName} />
                  <AvatarFallback className="bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {(activity.studentName as string)
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "?"}
                  </AvatarFallback>

                  </Avatar>
                )}
                
                <div className="ml-4 space-y-0.5 flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-none truncate text-zinc-900 dark:text-zinc-50">
                    {activity.type === "JOURNAL" ? activity.className : activity.studentName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {activity.reason}
                  </p>
                </div>
                
                <div className="ml-auto text-right pl-2">
                  {activity.type !== "JOURNAL" && activity.amount !== undefined && (
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {activity.amount > 0 ? "+" : ""}{activity.amount} {activity.type === "COIN" ? "Coin" : "XP"}
                    </div>
                  )}
                  {activity.type === "JOURNAL" && (
                    <div className="text-[10px] font-bold text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Jurnal
                    </div>
                  )}
                  {activity.type === "EXAM_COMPLETION" && (
                    <div className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 dark:bg-yellow-400/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Ujian
                    </div>
                  )}
                  <div className="text-[10px] text-zinc-400 uppercase font-medium mt-0.5">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: id,
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
