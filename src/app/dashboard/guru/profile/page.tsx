import { getTeacherProfile } from "@/actions/users-supabase";
import { getDashboardStatsSupabase as getDashboardStats, getAttendanceTrendsSupabase as getAttendanceTrends } from "@/actions/analytics-supabase";
import { ProfileClient } from "@/components/guru/profile/ProfileClient";
import { PageTransition } from "@/components/layout/PageTransition";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profil Guru | Kelas Guru",
};

export const dynamic = "force-dynamic";

export default async function GuruProfilePage() {
  const [profileResult, dashboardStats, attendanceTrends] = await Promise.all([
    getTeacherProfile(),
    getDashboardStats(),
    getAttendanceTrends(),
  ]);

  if (!profileResult || !profileResult.success || !profileResult.data) {
    redirect("/dashboard/guru");
  }

  const teacherProfile = profileResult.data as any;

  // Calculate average attendance from trends
  const avgAttendance = (attendanceTrends as any[]).length > 0
    ? Math.round((attendanceTrends as any[]).reduce((acc: number, curr: any) => acc + curr.percentage, 0) / (attendanceTrends as any[]).length)
    : 0;

  const stats = {
    totalClasses: (dashboardStats as any).totalClasses || 0,
    totalStudents: (dashboardStats as any).totalStudents || 0,
    avgAttendance: `${avgAttendance}%`,
  };

  return (
    <PageTransition>
      <ProfileClient initialData={teacherProfile} stats={stats} />
    </PageTransition>
  );
}
