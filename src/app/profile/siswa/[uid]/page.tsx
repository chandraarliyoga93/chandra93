import { getPublicStudentProfileSupabase as getPublicStudentProfile } from "@/actions/students";
import { getStudentBadgesActionSupabase as getStudentBadgesAction } from "@/actions/gamification-supabase";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flash, Calendar, Medal } from "iconoir-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

// This helps prevent the "Failed to collect page data" error in Next.js 15+ 
// by telling it there are no static versions of this page to pre-render.
export function generateStaticParams() {
  return [];
}

interface PageProps {
  params: Promise<{ uid: string }>;
}

export const metadata: Metadata = {
  title: "Student Showcase | Kelas Guru",
  description: "Lihat pencapaian dan koleksi badge siswa di Kelas Guru.",
};

async function ProfileContent({ uid }: { uid: string }) {
  // If we are during build phase, bail out or handle gracefully
  // This is a safety check for Vercel build data collection
  let studentData: any = null;
  let badges: any[] = [];

  try {
    const [sData, bData] = await Promise.all([
      getPublicStudentProfile(uid),
      getStudentBadgesAction(uid),
    ]);
    studentData = sData;
    badges = bData || [];
  } catch (error) {
    console.warn("Database connection failed during render (possibly build time):", error);
    // During build, we can't fetch data, so we show a "Not Found" or bail
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
      notFound();
    }
  }

  if (!studentData) {
    notFound();
  }

  const student = studentData as any;

  const isRubyProfile = student.equipped?.profile === "ruby-profile";
  const isGoldBorder = student.equipped?.border === "gold-border";
  const isNeonName = student.equipped?.name === "neon-name";
  const isDiamondBadge = student.equipped?.badge === "diamond-badge";

  return (
    <div className="max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Top Header Section */}
      <div className="text-center space-y-2">
        <div className="inline-block bg-yellow-400 text-black border-4 border-black px-4 py-1 font-black uppercase italic tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          Hall of Fame
        </div>
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase text-foreground">
          Student Showcase
        </h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Left Side: ID Card (Re-styled for public) */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <Card className={cn(
            "w-full border-4 rounded-none shadow-[12px_12px_0px_0px_var(--neo-border)] overflow-hidden transition-colors duration-500",
            isRubyProfile ? "bg-rose-50 border-rose-600" : "bg-neo-bg border-neo-border"
          )}>
            <CardHeader className={cn(
              "border-b-4 p-4 transition-colors duration-500",
              isRubyProfile ? "bg-rose-600 border-rose-900" : "bg-yellow-400 dark:bg-indigo-900 border-neo-border"
            )}>
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                <span className={isRubyProfile ? "text-white" : "text-black dark:text-white"}>Official Student Pass</span>
                <span className={isRubyProfile ? "bg-white text-rose-600 px-2" : "bg-black text-white px-2"}>PRO</span>
              </div>
            </CardHeader>
            <CardContent className="p-8 flex flex-col items-center space-y-6">
              <div className="relative">
                <div className={cn(
                  "w-40 h-40 border-4 overflow-hidden transition-all duration-500",
                  isGoldBorder 
                    ? "border-yellow-400 shadow-[6px_6px_0px_0px_#fbbf24] scale-105" 
                    : "border-neo-border shadow-[6px_6px_0px_0px_var(--neo-border)]",
                  isRubyProfile ? "bg-rose-100" : "bg-cyan-100 dark:bg-cyan-900"
                )}>
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={student.photo} className="object-cover" />
                    <AvatarFallback className="rounded-none bg-transparent text-foreground text-4xl font-black">
                      {student.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn(
                  "absolute -top-3 -right-3 border-4 p-2 shadow-[4px_4px_0px_0px_var(--neo-border)] transition-colors duration-500",
                  isDiamondBadge ? "bg-blue-500 border-white text-white" : "bg-indigo-600 border-neo-border text-white"
                )}>
                  {isDiamondBadge ? <Trophy className="w-6 h-6" /> : <Medal className="w-6 h-6" />}
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className={cn(
                  "text-3xl font-black uppercase italic tracking-tighter transition-all duration-500",
                  isNeonName ? "text-green-500 [text-shadow:3px_3px_0px_#000] animate-pulse" : "text-foreground"
                )}>
                  {student.name}
                </h2>
                {student.alias && (
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 italic">
                    @{student.alias}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-white dark:bg-zinc-900 border-4 border-black p-3 text-center">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Level</p>
                  <p className="text-3xl font-black italic">{student.level}</p>
                </div>
                <div className="bg-white dark:bg-zinc-900 border-4 border-black p-3 text-center">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">XP</p>
                  <p className="text-3xl font-black italic">{student.xp}</p>
                </div>
              </div>
            </CardContent>
            <div className="h-4 bg-neo-border flex">
              <div className="flex-1 bg-indigo-600 border-r-2 border-neo-border"></div>
              <div className="flex-1 bg-cyan-400 border-r-2 border-neo-border"></div>
              <div className="flex-1 bg-yellow-400 border-r-2 border-neo-border"></div>
              <div className="flex-1 bg-rose-500"></div>
            </div>
          </Card>
        </div>

        {/* Right Side: Achievements & Badges */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-6 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Badge Collection
            </h3>

            {(badges as any[]).length === 0 ? (
              <div className="py-12 text-center border-4 border-dashed border-zinc-300 dark:border-zinc-700">
                <p className="font-bold text-muted-foreground italic uppercase">Belum ada badge yang dikumpulkan</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(badges as any[]).map((badge) => (
                  <div 
                    key={badge.id}
                    className="group flex flex-col items-center p-4 border-4 border-black bg-neo-bg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                  >
                    <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{badge.emoji}</div>
                    <span className="text-[10px] font-black uppercase text-center leading-tight">{badge.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-indigo-600 text-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 border-4 border-black text-black">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-black uppercase text-white/80">Active Student Since</p>
                <p className="text-2xl font-black italic uppercase">{student.joinedAt ? format(new Date(student.joinedAt), "MMMM yyyy") : "January 2026"}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black bg-slate-100 dark:bg-zinc-800 text-[10px] font-black uppercase italic tracking-tighter">
              <Flash className="w-3 h-3 text-yellow-500" />
              Powered by Kelas Guru Pro
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function PublicStudentProfilePage({ params }: PageProps) {
  const { uid } = await params;

  return (
    <div className="min-h-screen bg-background font-gen-z p-4 md:p-8 flex items-center justify-center siswa-theme">
      <Suspense fallback={
        <div className="max-w-4xl w-full h-[600px] bg-muted animate-pulse border-4 border-black shadow-[12px_12px_0px_0px_var(--neo-border)]" />
      }>
        <ProfileContent uid={uid} />
      </Suspense>
    </div>
  );
}
