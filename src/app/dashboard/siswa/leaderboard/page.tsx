import { cookies } from "next/headers";
import { URLTabs } from "@/components/ui/url-tabs";
import { 
  getGlobalLeaderboardSupabase as getGlobalLeaderboard, 
  getClassLeaderboardSupabase as getClassLeaderboard, 
  getStudentRankSupabase as getStudentRank 
} from "@/actions/leaderboard-supabase";
import { getStudentStatsSupabase as getStudentStats } from "@/actions/gamification-supabase";
import { Trophy } from "iconoir-react";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "global" } = await searchParams;
  const cookieStore = await cookies();
  const studentId = cookieStore.get("user-id")?.value;
  let classId = cookieStore.get("class-id")?.value;

  if (!studentId) {
    return <div className="p-8 text-center font-bold">Unauthorized</div>;
  }

  // If classId is missing from cookie, try to fetch it from student's enrollments
  if (!classId) {
    const { getEnrolledClassesSupabase } = await import("@/actions/enrollment-supabase");
    const classes = await getEnrolledClassesSupabase();
    if (classes && classes.length > 0) {
      classId = classes[0].id;
    }
  }

  // Fetch all data for both tabs to ensure they are ready and correct
  const [globalData, classData, globalRank, classRank, studentStats] = await Promise.all([
    getGlobalLeaderboard(),
    classId ? getClassLeaderboard(classId) : Promise.resolve([]),
    getStudentRank(studentId),
    classId ? getStudentRank(studentId, classId) : Promise.resolve(null),
    getStudentStats(studentId)
  ]);

  const tabs = [
    {
      value: "global",
      label: "Global",
      content: (
        <LeaderboardClient 
          data={globalData} 
          currentRank={globalRank} 
          type="global" 
          studentId={studentId} 
          variant="neo" 
          userProfile={studentStats}
        />
      ),
    },
    {
      value: "kelas",
      label: "Kelas Saya",
      content: (
        <LeaderboardClient 
          data={classData} 
          currentRank={classRank} 
          type="kelas" 
          studentId={studentId} 
          hasClassId={!!classId} 
          variant="neo" 
          userProfile={studentStats}
        />
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2 italic uppercase text-black">
            <Trophy className="w-8 h-8 text-yellow-500" />
            LEADERBOARD
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-tight text-[10px] mt-1 italic">
            Lihat siapa yang berada di puncak klasemen!
          </p>
        </div>
      </div>

      <URLTabs 
        defaultValue="global" 
        tabs={tabs}
        listClassName="bg-slate-100 p-1.5 rounded-none border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-auto"
        triggerClassName="rounded-none data-[state=active]:text-black font-black uppercase italic tracking-tighter text-xs transition-all px-6 py-2.5"
        indicatorClassName="rounded-none border-2 border-black"
      />
    </div>
  );
}
