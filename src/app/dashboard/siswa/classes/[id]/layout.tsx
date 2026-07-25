import { getStudentStatsSupabase } from "@/actions/gamification-supabase";
import { getStudentGradesInClassSupabase } from "@/actions/grades-supabase";
import { getTaskCount } from "@/actions/tasks-supabase";
import { StudentProgressHero } from "@/components/siswa/StudentProgressHero";
import { getAuthUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function SiswaClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user || user.role !== "Siswa") {
    redirect("/");
  }

  // Fetch all necessary data for the unified header
  const [studentStats, classData, grades, totalTasks] = await Promise.all([
    getStudentStatsSupabase(user.uid),
    prisma.class.findUnique({ where: { id }, select: { name: true } }),
    getStudentGradesInClassSupabase(id, user.uid),
    getTaskCount(id)
  ]);

  if (!classData) {
    redirect("/dashboard/siswa");
  }

  const completedTasks = grades.length || 0;
  const averageGrade = completedTasks > 0 
    ? grades.reduce((acc: number, curr) => acc + (curr.grade || 0), 0) / completedTasks 
    : 0;

  return (
    <div className="space-y-8 md:space-y-12">
      <StudentProgressHero 
        xp={studentStats?.xp || 0}
        level={studentStats?.level || 1}
        displayName={studentStats?.name || "Siswa"}
        classStats={{
          name: classData.name,
          totalTasks,
          completedTasks,
          averageGrade
        }}
      />
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </div>
  );
}
