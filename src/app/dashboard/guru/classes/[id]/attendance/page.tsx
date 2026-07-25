import { 
  getAttendanceByDateSupabase as getAttendanceByDate, 
  getAttendanceHistorySupabase as getAttendanceHistory 
} from "@/actions/attendance-supabase";
import { getClassByIdSupabase as getClassById } from "@/actions/classes-supabase";
import { getStudentsByClassSupabase } from "@/actions/students";
import V2AttendanceGrid from "@/components/attendance/V2AttendanceGrid";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  ClockRotateRight, 
  InfoCircle, 
  NavArrowRight,
  ClipboardCheck
} from "iconoir-react";
import { URLTabs } from "@/components/ui/url-tabs";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { V2DatePicker } from "@/components/shared/V2DatePicker";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { V2AttendanceHistoryTable } from "@/components/attendance/V2AttendanceHistoryTable";
import { attendanceSearchParamsCache } from "@/lib/parsers";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

async function AttendanceContent({ id, sParams }: { id: string, sParams: any }) {
  const { 
    date: dateParam, 
    tab, 
    page, 
    pageSize 
  } = attendanceSearchParamsCache.parse(sParams);
  
  const date = dateParam || format(new Date(), "yyyy-MM-dd");
  const limit = pageSize || 10;

  let studentsResult: any = { data: [] };
  let initialAttendance = {};
  let historyData: any = { data: [], total: 0 };
  let kelas = null;

  try {
    const [sResult, iAttendance, hData, kData] = await Promise.all([
      tab === "input" ? getStudentsByClassSupabase(id, { limit: 0 }) : Promise.resolve({ data: [] }),
      tab === "input" ? getAttendanceByDate(id, date) : Promise.resolve({}),
      tab === "riwayat" ? getAttendanceHistory(id, page, limit) : Promise.resolve({ data: [], total: 0 }),
      getClassById(id)
    ]);
    studentsResult = sResult;
    initialAttendance = iAttendance;
    historyData = hData;
    kelas = kData;
  } catch (error) {
    console.warn("Database connection failed during build:", error);
  }

  if (!kelas) {
    notFound();
  }

  const students = (studentsResult as any).data || [];
  const hasExistingAttendance = Object.keys(initialAttendance).length > 0;

  const tabs = [
    {
      value: "input",
      label: "Isi Absensi (Fill Attendance)",
      icon: <ClipboardCheck className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {hasExistingAttendance ? (
            <div className="rounded-xl border border-zinc-200/50 bg-zinc-50/50 p-12 text-center space-y-6 dark:border-zinc-800/50 dark:bg-zinc-900/50 animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-zinc-950">
                <InfoCircle className="h-10 w-10 text-zinc-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Presensi Sudah Terisi</h3>
                <p className="mx-auto max-w-sm text-zinc-500 dark:text-zinc-400 font-medium">
                  Data kehadiran untuk tanggal <strong>{format(parseISO(date), "dd MMMM yyyy", { locale: idLocale })}</strong> sudah tercatat di sistem.
                </p>
              </div>
              <div className="pt-4">
                <Button asChild className="rounded-2xl font-bold h-12 px-8 shadow-lg shadow-zinc-200 dark:shadow-none">
                  <Link href={`/dashboard/guru/classes/${id}/attendance?tab=riwayat`}>
                    Lihat & Edit di Riwayat <NavArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <V2AttendanceGrid 
              classId={id} 
              students={students} 
              initialAttendance={initialAttendance}
              date={date}
            />
          )}
        </div>
      )
    },
    {
      value: "riwayat",
      label: "Riwayat Absensi (Attendance History)",
      icon: <ClockRotateRight className="w-4 h-4" />,
      content: (
        <div className="space-y-4">
          <V2AttendanceHistoryTable 
            data={historyData.data} 
            totalPages={Math.ceil(historyData.total / limit)}
            classId={id}
            className={kelas.name}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight uppercase italic">
            Presensi Siswa (Student Attendance)
          </h2>

          <div className="flex items-center gap-3">
            <V2DatePicker className="w-full md:w-[240px] shadow-sm" />
          </div>
        </div>

        <URLTabs 
          defaultValue="input"
          paramName="tab"
          listClassName="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50"
          triggerClassName="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg px-6 py-2 text-sm font-semibold transition-all"
          tabs={tabs}
        />
      </div>
    </div>
  );
}

interface AttendancePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AttendancePage({ 
  params,
  searchParams
}: AttendancePageProps) {
  const { id } = await params;
  const sParams = await searchParams;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
      <AttendanceContent id={id} sParams={sParams} />
    </Suspense>
  );
}
