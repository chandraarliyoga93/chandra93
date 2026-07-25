import { getTasksWithPaginationSupabase } from "@/actions/tasks-supabase";
import { getStudentGradesInClassSupabase } from "@/actions/grades-supabase";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardCheck, Book, NavArrowRight } from "iconoir-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { StudentTaskCard } from "@/components/siswa/StudentTaskCard";
import { LoadMoreTasks } from "@/components/siswa/LoadMoreTasks";
import { StudentExamList } from "@/components/siswa/StudentExamList";
import { StudentExamHistory } from "@/components/siswa/StudentExamHistory";
import { SiswaTaskTabs } from "@/components/siswa/SiswaTaskTabs";
import StudentCourseList, {
  STUDENT_GLOBAL_LMS_HREF,
} from "@/components/lms/StudentCourseList";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default async function SiswaTasksPage(props: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ view?: string }>
}) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const activeView = searchParams.view || "tasks";
  const cookieStore = await cookies();
  const studentId = cookieStore.get("user-id")?.value;

  if (!studentId) {
    return <div className="p-8 text-center font-bold">Unauthorized</div>;
  }

  // Fetch initial batch and necessary data
  const PAGE_SIZE = 5;
  const [initialTasks, grades] = await Promise.all([
    getTasksWithPaginationSupabase(id, PAGE_SIZE),
    getStudentGradesInClassSupabase(id, studentId)
  ]);

  const lastId = initialTasks.length === PAGE_SIZE ? initialTasks[initialTasks.length - 1].id : undefined;

  return (
    <div className="space-y-6 md:space-y-10 pb-6 md:pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border-4 border-neo-border bg-neo-bg p-4 shadow-[4px_4px_0px_0px_var(--neo-border)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-yellow-400 shadow-[2px_2px_0px_0px_var(--neo-border)]">
            <Book className="h-5 w-5 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-black uppercase italic tracking-tight text-muted-foreground">
              Materi di circle ini
            </p>
            <p className="text-sm font-black text-foreground">
              Buka tab <span className="italic">Materi</span> di bawah untuk kursus yang di-assign.
            </p>
          </div>
        </div>
        <Link
          href={STUDENT_GLOBAL_LMS_HREF}
          className="inline-flex items-center justify-center gap-2 border-4 border-neo-border bg-black px-4 py-2.5 text-xs font-black uppercase italic text-white shadow-[4px_4px_0px_0px_var(--neo-border)] transition-transform hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          data-testid="siswa-lms-global-shortcut"
        >
          <NavArrowRight className="h-4 w-4" strokeWidth={2.5} />
          Semua materi
        </Link>
      </div>
      <SiswaTaskTabs 
        activeView={activeView}
        tasksContent={
          <div className="space-y-6">
            {initialTasks.length === 0 ? (
              <Card className="border-4 border-dashed border-black bg-muted/30 rounded-[2.5rem]">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="bg-white border-4 border-black p-6 rounded-3xl mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <ClipboardCheck className="w-12 h-12 text-zinc-300" />
                  </div>
                  <h3 className="text-xl font-black uppercase italic">Belum Ada Misi</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2 font-bold text-sm">
                    Guru belum memberikan misi untuk kelas ini. Tetap semangat!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="grid gap-4">
                  {initialTasks.map((task) => {
                    const taskGrade = grades.find((g) => g.taskId === task.id);
                    return (
                      <StudentTaskCard 
                        key={task.id} 
                        task={task} 
                        gradeData={taskGrade || null} 
                      />
                    );
                  })}
                </div>
                
                <LoadMoreTasks 
                  classId={id} 
                  initialLastId={lastId} 
                  grades={grades} 
                />
              </div>
            )}
          </div>
        }
        lmsContent={<StudentCourseList variant="class" classId={id} />}
        examsContent={<StudentExamList classId={id} />}
        historyContent={<StudentExamHistory classId={id} />}
      />
    </div>
  );
}
