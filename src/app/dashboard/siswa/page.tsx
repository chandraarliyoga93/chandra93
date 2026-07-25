import { getEnrolledClassesSupabase } from "@/actions/enrollment-supabase";
import { EnrolledClassCard } from "@/components/siswa/EnrolledClassCard";
import { StudentProgressHero } from "@/components/siswa/StudentProgressHero";
import { GlobalExamList } from "@/components/siswa/GlobalExamList";
import { RecentGradesFeed } from "@/components/siswa/RecentGradesFeed";
import { getAuthUser } from "@/lib/auth-server";
import { getActiveAnnouncementsSupabase } from "@/actions/announcements-supabase";
import { getStudentStatsSupabase } from "@/actions/gamification-supabase";
import { getTasksWithPaginationSupabase, getTaskCount } from "@/actions/tasks-supabase";
import { getStudentGradesInClassSupabase } from "@/actions/grades-supabase";
import { Flash, Trophy, Group, ArrowLeft, Book } from "iconoir-react";
import { redirect } from "next/navigation";
import { SocialBanner } from "@/components/siswa/SocialBanner";
import { StudentTaskCard } from "@/components/siswa/StudentTaskCard";
import { StudentExamList } from "@/components/siswa/StudentExamList";
import { StudentExamHistory } from "@/components/siswa/StudentExamHistory";
import { SiswaTaskTabs } from "@/components/siswa/SiswaTaskTabs";
import { LoadMoreTasks } from "@/components/siswa/LoadMoreTasks";
import StudentCourseList from "@/components/lms/StudentCourseList";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface EnrolledClass {
  id: string;
  name: string;
  description: string;
  code: string;
  studentCount: number;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SiswaDashboard({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "Siswa") {
    redirect("/");
  }

  const params = await searchParams;
  const classId = params.classId as string | undefined;
  const activeView = (params.view as string) || "tasks";

  const [classes, studentStats] = await Promise.all([
    getEnrolledClassesSupabase(),
    getStudentStatsSupabase(user.uid)
  ]);
  
  const displayName = studentStats?.name || "Siswa";
  const xp = studentStats?.xp || 0;
  const level = studentStats?.level || 1;

  // If in class view, fetch class-specific data
  let classSpecificData = null;
  if (classId) {
    const PAGE_SIZE = 5;
    const [classInfo, initialTasks, grades, totalTasks] = await Promise.all([
      prisma.class.findUnique({ where: { id: classId }, select: { name: true } }),
      getTasksWithPaginationSupabase(classId, PAGE_SIZE),
      getStudentGradesInClassSupabase(classId, user.uid),
      getTaskCount(classId)
    ]);

    if (classInfo) {
      const completedTasks = grades.length || 0;
      const averageGrade = completedTasks > 0 
        ? grades.reduce((acc: number, curr) => acc + (curr.grade || 0), 0) / completedTasks 
        : 0;

      classSpecificData = {
        name: classInfo.name,
        initialTasks,
        grades,
        totalTasks,
        completedTasks,
        averageGrade,
        lastId: initialTasks.length === PAGE_SIZE ? initialTasks[initialTasks.length - 1].id : undefined
      };
    }
  }

  // Fetch announcements for social banner
  const classIds = (classes || []).map((c) => c.id);
  const announcements = await getActiveAnnouncementsSupabase(classIds);

  return (
    <div className="space-y-8 md:space-y-12">
      {announcements.length > 0 && (
        <SocialBanner announcements={announcements} />
      )}

      <div className="mx-auto max-w-7xl space-y-8 md:space-y-12">
        {/* 1. Hero Section (Progress) */}
        <StudentProgressHero 
          xp={xp}
          level={level}
          displayName={displayName}
          classStats={classSpecificData ? {
            name: classSpecificData.name,
            totalTasks: classSpecificData.totalTasks,
            completedTasks: classSpecificData.completedTasks,
            averageGrade: classSpecificData.averageGrade
          } : undefined}
        />

        {classSpecificData ? (
          /* Class Specific Content (Missions & Exams) */
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-neo-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)]">
                  <Flash className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">Misi & Ujian Kelas</h2>
              </div>
              <Link 
                href="/dashboard/siswa"
                className="flex items-center gap-2 bg-black text-white px-4 py-2 font-black uppercase italic text-sm border-2 border-neo-border shadow-[4px_4px_0px_0px_var(--neo-border)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Ganti Circle
              </Link>
            </div>

            <SiswaTaskTabs 
              activeView={activeView}
              tasksContent={
                <div className="grid gap-6">
                  {classSpecificData.initialTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 rounded-[2.5rem] border-4 border-dashed border-neo-border bg-muted/30 text-center">
                      <h3 className="text-xl font-black italic uppercase">Belum Ada Misi</h3>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4">
                        {classSpecificData.initialTasks.map((task) => {
                          const taskGrade = classSpecificData.grades.find((g) => g.taskId === task.id);
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
                        classId={classId!} 
                        initialLastId={classSpecificData.lastId} 
                        grades={classSpecificData.grades} 
                      />
                    </>
                  )}
                </div>
              }
              lmsContent={<StudentCourseList variant="class" classId={classId!} />}
              examsContent={<StudentExamList classId={classId!} />}
              historyContent={<StudentExamHistory classId={classId!} />}
            />
          </div>
        ) : activeView === "lms" ? (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 border-b-4 border-neo-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)]">
                  <Book className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
                    Semua Materi
                  </h2>
                  <p className="mt-1 max-w-xl text-sm font-bold text-muted-foreground italic">
                    Akses cepat lewat menu LMS — gabungan materi dari semua circle kamu.
                  </p>
                </div>
              </div>
            </div>
            <StudentCourseList
              variant="global"
              enrolledClassIds={(classes || []).map((c) => c.id)}
            />
            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b-4 border-neo-border pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)]">
                  <Group className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
                  Circle Belajarmu
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(classes || []).map((cls: EnrolledClass) => (
                  <EnrolledClassCard
                    key={cls.id}
                    id={cls.id}
                    name={cls.name}
                    description={cls.description}
                    studentCount={cls.studentCount}
                    xp={xp}
                    level={level}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Global Dashboard Content */
          <>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3 border-b-4 border-neo-border pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)]">
                    <Flash className="h-5 w-5 text-foreground" />
                  </div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">Misi Aktif</h2>
                </div>
                <GlobalExamList />
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b-4 border-neo-border pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)]">
                    <Trophy className="h-5 w-5 text-foreground" />
                  </div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">Nilai Terbaru</h2>
                </div>
                <RecentGradesFeed />
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3 border-b-4 border-neo-border pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)]">
                  <Group className="h-5 w-5 text-foreground" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">Circle Belajarmu</h2>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(classes || []).map((cls: EnrolledClass) => (
                  <EnrolledClassCard
                    key={cls.id}
                    id={cls.id}
                    name={cls.name}
                    description={cls.description}
                    studentCount={cls.studentCount}
                    xp={xp}
                    level={level}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
