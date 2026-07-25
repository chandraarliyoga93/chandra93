import { getExamFullInfoSupabase, getExamResultsSupabase } from "@/actions/exam-supabase";
import { WarningTriangle } from "iconoir-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LiveMonitoringClient } from "@/components/dashboard/guru/cbt/LiveMonitoringClient";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

async function MonitoringContent({ id }: { id: string }) {
  let examRes: any = { success: false, data: null };
  let resultsRes: any = { success: false, data: [] };

  try {
    const [eRes, rRes] = await Promise.all([
      getExamFullInfoSupabase(id),
      getExamResultsSupabase(id, { pageSize: 50 }),
    ]);
    examRes = eRes;
    resultsRes = rRes;
  } catch (error) {
    console.warn("Database failed during build:", error);
  }

  if (!examRes.success || !examRes.data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <WarningTriangle className="w-12 h-12 text-rose-500" />
        <h3 className="text-xl font-bold uppercase">Ujian Tidak Ditemukan</h3>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard/guru/cbt">Kembali ke CBT</Link>
        </Button>
      </div>
    );
  }

  const exam = examRes.data;

  const studentNames: Record<string, string> = {};
  const initialAttempts = resultsRes.success && Array.isArray(resultsRes.data) ? resultsRes.data : [];
  for (const res of initialAttempts) {
    if (res.studentId && res.studentName) {
      studentNames[res.studentId] = res.studentName;
    }
  }

  return (
    <LiveMonitoringClient
      exam={exam}
      studentNames={studentNames}
      initialAttempts={initialAttempts}
    />
  );
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveMonitoringPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-2xl" />}>
      <MonitoringContent id={id} />
    </Suspense>
  );
}

