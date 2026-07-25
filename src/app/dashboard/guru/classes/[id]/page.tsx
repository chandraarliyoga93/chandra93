import { getClassByIdSupabase, getTaskCountSupabase, getClassDetailedStatsSupabase } from "@/actions/classes-supabase";
import { getStudentsByClassSupabase } from "@/actions/students";
import { V2StatsCard } from "@/components/shared/V2StatsCard";
import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Group, 
  Notes as TaskList,
  Fingerprint as AttendanceIcon,
  StatsUpSquare as GradesIcon,
  ArrowRight,
  InfoCircle
} from "iconoir-react";
import { AreaGraphRefined } from "@/components/dashboard/guru/AreaGraphRefined";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

interface OverviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function OverviewPage({ params }: OverviewPageProps) {
  const { id } = await params;
  
  const [classData, studentsData, taskCount, detailedStats] = await Promise.all([
    getClassByIdSupabase(id),
    getStudentsByClassSupabase(id),
    getTaskCountSupabase(id),
    getClassDetailedStatsSupabase(id)
  ]);

  if (!classData) {
    notFound();
  }

  const students = studentsData.success ? studentsData.data : [];
  const studentCountTotal = classData.studentCount || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <V2StatsCard
          title="Total Siswa"
          value={studentCountTotal}
          description="Terdaftar di kelas ini"
          icon={<Group className="w-5 h-5" />}
        />
        <V2StatsCard
          title="Rata-rata Nilai"
          value={detailedStats.avgGrade}
          description="Dari semua tugas"
          icon={<GradesIcon className="w-5 h-5" />}
          trend={{
            value: 0,
            label: "vs bulan lalu",
            isPositive: true
          }}
        />
        <V2StatsCard
          title="Persentase Absensi"
          value={`${detailedStats.avgAttendance}%`}
          description="Rata-rata 5 sesi terakhir"
          icon={<AttendanceIcon className="w-5 h-5" />}
        />
        <V2StatsCard
          title="Total Tugas"
          value={taskCount}
          description="Tugas yang dibuat"
          icon={<TaskList className="w-5 h-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AreaGraphRefined 
            data={detailedStats.attendanceHistory} 
            title="Tren Absensi"
            description="Riwayat absensi 10 sesi terakhir"
            dateRangeLabel="Menampilkan 10 record terakhir"
          />
        </div>
        
        <div className="space-y-6">
          <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] bg-white dark:bg-zinc-950 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-lg">
                <InfoCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50 tracking-tight uppercase">
                  Informasi Kelas
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Informasi Umum</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-900">
                <span className="text-xs text-zinc-500 font-medium">Nama Kelas</span>
                <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">{classData.name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-900">
                <span className="text-xs text-zinc-500 font-medium">Kode Akses</span>
                <span className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-zinc-950 dark:text-zinc-50 tracking-tighter uppercase">
                  {classData.code}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-zinc-500 font-medium">Total Siswa</span>
                <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">{studentCountTotal} Siswa</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-2">Menu Cepat</h3>
            <div className="grid gap-2">
              {[
                { label: "Absensi", href: `/dashboard/guru/classes/${id}/attendance`, icon: AttendanceIcon },
                { label: "Daftar Nilai", href: `/dashboard/guru/classes/${id}/grades`, icon: GradesIcon },
                { label: "Daftar Siswa", href: `/dashboard/guru/classes/${id}/students`, icon: Group },
              ].map((action) => (
                <Link 
                  key={action.href}
                  href={action.href}
                  className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      <action.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{action.label}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-zinc-50 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
