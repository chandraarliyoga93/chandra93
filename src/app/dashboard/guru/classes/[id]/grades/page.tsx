import { Suspense } from "react";
import { 
  getClassByIdSupabase as getClassById, 
  getTasksSupabase as getTasks, 
  getClassGradesSupabase as getClassGrades 
} from "@/actions/classes-supabase";
import { getStudentsByClassSupabase } from "@/actions/students";
import { V2GradebookGrid } from "@/components/grades/V2GradebookGrid";
import { InputNilaiTab } from "@/components/grades/InputNilaiTab";
import { V2TasksTable } from "@/components/tasks/V2TasksTable";
import { ViewGrid, EditPencil, List } from "iconoir-react";
import { notFound } from "next/navigation";
import { URLTabs } from "@/components/ui/url-tabs";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

async function GradesContent({ id, currentPage }: { id: string, currentPage: number }) {
  let kelas = null;
  let tasks = [];
  let studentsResult: any = { data: [] };
  let grades = {};

  try {
    const [kData, tData, sResult, gData] = await Promise.all([
      getClassById(id),
      getTasks(id),
      getStudentsByClassSupabase(id, { limit: 0 }),
      getClassGrades(id),
    ]);
    kelas = kData;
    tasks = tData;
    studentsResult = sResult;
    grades = gData;
  } catch (error) {
    console.warn("Database connection failed during build:", error);
  }

  if (!kelas) {
    notFound();
  }

  const students = (studentsResult as any).data || [];

  const tabs = [
    {
      value: "tasks",
      label: "Daftar Tugas (Tasks)",
      icon: <List className="h-4 w-4" />,
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold tracking-tight">Daftar Tugas</h3>
              <p className="text-sm text-zinc-500">Kelola tugas dan aktivitas kelas Anda</p>
            </div>
            <CreateTaskDialog classId={id} />
          </div>
          
          <div className="rounded-[2rem] border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 overflow-hidden shadow-sm">
            <V2TasksTable 
              tasks={tasks.map((t: any) => ({
                ...t,
                guruId: t.guruId || "", 
              }))} 
              totalPages={1} 
              currentPage={currentPage} 
            />
          </div>
        </div>
      )
    },
    {
      value: "input",
      label: "Isi Nilai (Fill Grades)",
      icon: <EditPencil className="h-4 w-4" />,
      content: (
        <InputNilaiTab 
          classId={id}
          tasks={tasks}
          students={students.map((s: any) => ({ uid: s.id, name: s.name }))}
          grades={grades}
        />
      )
    },
    {
      value: "rekap",
      label: "Daftar Nilai (Gradebook)",
      icon: <ViewGrid className="h-4 w-4" />,
      content: (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <V2GradebookGrid 
            students={students.map((s: any) => ({ id: s.id, name: s.name }))}
            assignments={tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              classId: t.classId,
              category: "Other",
              maxPoints: 100,
              date: t.createdAt
            }))}
            grades={grades}
            classId={id}
          />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <URLTabs
        defaultValue="tasks"
        paramName="tab"
        listClassName="bg-zinc-100/50 dark:bg-zinc-900/50 p-1 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50"
        triggerClassName="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg px-6 py-2 text-sm font-semibold"
        tabs={tabs}
      />
    </div>
  );
}

interface GradesPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GradesPage({ 
  params,
  searchParams,
}: GradesPageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const currentPage = Number(sParams?.page) || 1;

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
      <GradesContent id={id} currentPage={currentPage} />
    </Suspense>
  );
}
