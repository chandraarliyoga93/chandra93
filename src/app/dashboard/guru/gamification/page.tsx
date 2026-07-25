import { URLTabs } from "@/components/ui/url-tabs"
import { Card } from "@/components/ui/card"
import { V2Leaderboard } from "@/components/gamification/V2Leaderboard"
import { V2LevelManager } from "@/components/gamification/V2LevelManager"
import { V2BadgeManager } from "@/components/gamification/V2BadgeManager"
import { getGlobalLeaderboardSupabase, getClassLeaderboardSupabase } from "@/actions/leaderboard-supabase"
import { getLevelConfigSupabase, getBadgesSupabase } from "@/actions/gamification-supabase"
import { getGuruClassesSupabase } from "@/actions/classes-supabase"
import { getGuruExamsSupabase } from "@/actions/exam-supabase"
import { ClassSelector } from "@/components/leaderboard/ClassSelector"
import { gamificationSearchParamsCache } from "@/lib/parsers"
import { Trophy, Settings, Star, Medal } from "iconoir-react"
import { SearchParams } from "nuqs/server"

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic";

export default async function GamificationV2Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { classId } = gamificationSearchParamsCache.parse(await searchParams)

  const [classesResult, levels, badges, leaderboard, examsResult] = await Promise.all([
    getGuruClassesSupabase({ pageSize: 100 }), // Fetch more for selection
    getLevelConfigSupabase(),
    getBadgesSupabase(),
    classId && classId !== "global"
      ? getClassLeaderboardSupabase(classId)
      : getGlobalLeaderboardSupabase(),
    getGuruExamsSupabase()
  ])

  const classes = classesResult.data;
  const exams = (examsResult.success && examsResult.data) ? examsResult.data : [];

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/10">
          <Trophy className="w-6 h-6 text-white dark:text-zinc-900" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Gamifikasi</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur sistem reward, level, dan pantau peringkat siswa.</p>
        </div>
      </div>

      <Card className="p-6 border-none shadow-sm rounded-xl">
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
          <URLTabs
            defaultValue="leaderboard"
            className="w-full"
            listClassName="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50"
            triggerClassName="rounded-xl px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-500 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 transition-all"
            indicatorClassName="bg-white dark:bg-zinc-950 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl"
            tabs={[
              {
                value: "leaderboard",
                label: "Klasemen",
                icon: <Medal className="w-4 h-4" aria-hidden="true" />,
                 content: (
                   <div className="pt-4 flex flex-col gap-6">
                     <ClassSelector classes={classes} />
                     <V2Leaderboard 
                       data={leaderboard} 
                       isFiltered={!!classId && classId !== "global"} 
                     />
                   </div>
                 )
              },
              {
                value: "levels",
                label: "Level",
                icon: <Settings className="w-4 h-4" aria-hidden="true" />,
                content: (
                  <div className="pt-4">
                    <V2LevelManager initialLevels={levels} />
                  </div>
                )
              },
              {
                value: "badges",
                label: "Badge",
                icon: <Star className="w-4 h-4" aria-hidden="true" />,
                 content: (
                   <div className="pt-4">
                     <V2BadgeManager initialBadges={badges as any} exams={exams} />
                   </div>
                 )

              }
            ]}
          />
        </Suspense>
      </Card>
    </div>
  )
}
