import { Suspense } from "react";
import { getClassByIdSupabase as getClassById } from "@/actions/classes-supabase";
import { getTasksSupabase as getTasks } from "@/actions/classes-supabase";
import { getStudentsByClassSupabase as getClassStudents } from "@/actions/students";
import { getClassGradesSupabase as getClassGrades } from "@/actions/classes-supabase";
import { GradebookGrid } from "@/components/grades/GradebookGrid";
import { GradebookSummary } from "@/components/grades/GradebookSummary";
import PageContainer from "@/components/layout/PageContainer";
import { DashboardBreadcrumb } from "@/components/layout/DashboardBreadcrumb";
import { notFound } from "next/navigation";
import { SearchParams } from "nuqs/server";
import { Assignment, GradeCategory } from "@/types/gradebook";
import { calculateAverage } from "@/lib/grading";

export const dynamic = "force-dynamic";

async function GradebookContent({ classId }: { classId: string }) {
  const [kelas, tasks, studentsResult, grades] = await Promise.all([
    getClassById(classId),
    getTasks(classId),
    getClassStudents(classId),
    getClassGrades(classId),
  ]);

  if (!kelas) {
    notFound();
  }

  const students = (studentsResult as any).data || [];
  const assignments: Assignment[] = (tasks as any[]).map((t: any) => ({
    id: t.id,
    title: t.title,
    category: (t as any).category || ("Other" as GradeCategory),
    maxPoints: (t as any).maxPoints || 100,
    date: t.date?.toISOString() || new Date().toISOString(),
    classId: t.classId,
  }));

  // Calculate summary stats
  const allGrades = Object.values(grades).map((g: any) => g.grade);
  const classAverage = calculateAverage(allGrades);
  const highestGrade = allGrades.length > 0 ? Math.max(...allGrades).toFixed(2) : "-";
  const lowestGrade = allGrades.length > 0 ? Math.min(...allGrades).toFixed(2) : "-";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <DashboardBreadcrumb />
        <h1 className="text-3xl font-bold tracking-tight">Gradebook: {kelas.name}</h1>
        <p className="text-muted-foreground text-lg">
          Kelola nilai siswa dengan tampilan spreadsheet yang responsif.
        </p>
      </div>

      <GradebookSummary
        average={classAverage}
        highest={highestGrade}
        lowest={lowestGrade}
        totalStudents={(students as any[]).length}
        totalAssignments={assignments.length}
      />

      <GradebookGrid
        students={(students as any[]).map((s: any) => ({ id: s.uid, name: s.name }))}
        assignments={assignments}
        grades={grades}
        classId={classId}
      />
    </div>
  );
}

export default async function GradebookPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const classId = typeof sp.classId === "string" ? sp.classId : undefined;

  return (
    <PageContainer>
      {!classId ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <DashboardBreadcrumb />
            <h1 className="text-3xl font-bold tracking-tight">Gradebook</h1>
            <p className="text-muted-foreground text-lg">
              Silakan pilih kelas terlebih dahulu untuk melihat gradebook.
            </p>
          </div>
        </div>
      ) : (
        <Suspense fallback={<div className="h-[400px] w-full bg-muted animate-pulse rounded-md" />}>
          <GradebookContent classId={classId} />
        </Suspense>
      )}
    </PageContainer>
  );
}
