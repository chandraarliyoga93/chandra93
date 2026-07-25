import React from "react"
import { getGuruAnalyticsSupabase, getClassPerformanceDataSupabase, getAttendanceTrendsSupabase } from "@/actions/analytics-supabase"
import { getRecentActivitiesSupabase } from "@/actions/activities-supabase"
import { V2PageContainer } from "@/components/shared/V2PageContainer"
import { V2StatsCard } from "@/components/shared/V2StatsCard"
import { BarGraphRefined } from "@/components/dashboard/guru/BarGraphRefined"
import { RecentActivities } from "@/components/dashboard/guru/RecentActivities"
import { 
  Group, 
  Trophy, 
  Book, 
  Database,
  Plus,
  ArrowRight
} from "iconoir-react"
import Link from "next/link"

export const dynamic = "force-dynamic";

export default async function GuruDashboard() {
  const [stats, rawPerformanceData, attendanceTrends, recentActivities] = await Promise.all([
    getGuruAnalyticsSupabase(),
    getClassPerformanceDataSupabase(),
    getAttendanceTrendsSupabase(),
    getRecentActivitiesSupabase()
  ])

  // Map backend performance data to BarGraphRefined props
  const performanceData = rawPerformanceData.map((d: any) => ({
    className: d.className,
    averageGrade: d.average,
    studentCount: d.studentCount
  }))

  const quickActions = [
    {
      title: "Tambah Kelas",
      description: "Buat ruang belajar baru",
      href: "/dashboard/guru/classes",
      icon: Plus,
    },
    {
      title: "Input Jurnal",
      description: "Catat aktivitas mengajar",
      href: "/dashboard/guru/journals",
      icon: Book,
    },
    {
      title: "Gamifikasi",
      description: "Atur poin dan reward",
      href: "/dashboard/guru/gamification",
      icon: Trophy,
    },
    {
      title: "Bank Soal",
      description: "Kelola materi ujian",
      href: "/dashboard/guru/bank-soal",
      icon: Database,
    }
  ]

  // Calculate average attendance from trends
  const avgAttendance = attendanceTrends.length > 0 
    ? Math.round(attendanceTrends.reduce((acc: number, curr: any) => acc + curr.percentage, 0) / attendanceTrends.length)
    : 0

  return (
    <V2PageContainer className="space-y-8 pb-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Overview Kelas
        </h1>
        <p className="text-zinc-500">
          Pantau performa akademik dan aktivitas kelas Anda hari ini.
        </p>
      </div>

      {/* Top Row: Stats Cards */}
      <div className="flex overflow-x-auto gap-4 -mx-4 px-4 pb-4 no-scrollbar snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:mx-0 md:px-0 md:pb-0">
        <V2StatsCard
          title="Total Siswa"
          value={stats.totalStudents}
          description="Siswa terdaftar aktif"
          icon={<Group className="size-4" />}
          className="min-w-[240px] md:min-w-0 snap-start"
        />
        <V2StatsCard
          title="Total Kelas"
          value={stats.totalClasses}
          description="Ruang kelas aktif"
          icon={<Group className="size-4" />}
          className="min-w-[240px] md:min-w-0 snap-start"
        />
        <V2StatsCard
          title="Persentase Absensi"
          value={`${avgAttendance}%`}
          description="Rata-rata 7 hari terakhir"
          icon={<Book className="size-4" />}
          className="min-w-[240px] md:min-w-0 snap-start"
        />
        <V2StatsCard
          title="Jurnal Terisi"
          value={stats.journalsThisWeek}
          description="Laporan minggu ini"
          icon={<Database className="size-4" />}
          className="min-w-[240px] md:min-w-0 snap-start"
        />
        {/* Mobile Spacer */}
        <div className="min-w-[1px] md:hidden" />
      </div>

      {/* Middle Row: Bento Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="h-full overflow-hidden rounded-[2rem] border border-zinc-200/50 bg-white/50 dark:border-zinc-800/50 dark:bg-zinc-950/50 [&_[data-slot=card]]:border-none [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:bg-transparent">
            <BarGraphRefined 
              data={performanceData} 
              title="Performa Kelas"
              description="Perbandingan nilai rata-rata antar kelas"
            />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="h-full overflow-hidden rounded-[2rem] border border-zinc-200/50 bg-white/50 dark:border-zinc-800/50 dark:bg-zinc-950/50 [&_[data-slot=card]]:border-none [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:bg-transparent">
             <RecentActivities activities={recentActivities} />
          </div>
        </div>
      </div>

      {/* Bottom Row: Menu Cepat */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold tracking-tight">Menu Cepat</h2>
          <Link href="/dashboard/guru/classes" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            Semua menu <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, i) => (
            <Link 
              key={i}
              href={action.href}
              className="group relative flex flex-col gap-4 rounded-[1.5rem] border border-zinc-200/50 bg-white/50 p-6 transition-all hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-950/50 dark:hover:bg-zinc-900"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 group-hover:scale-110 transition-transform">
                <action.icon className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{action.title}</h3>
                <p className="text-xs text-zinc-500">{action.description}</p>
              </div>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <ArrowRight className="size-4 text-zinc-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </V2PageContainer>
  )
}
