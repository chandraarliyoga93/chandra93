import { getCourseDetails } from "@/actions/lms-course-supabase";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CourseEditorClient } from "@/components/lms/CourseEditorClient";

interface CourseEditorPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseEditorPage({ params }: CourseEditorPageProps) {
  const { courseId } = await params;
  const result = await getCourseDetails(courseId);

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold">Kursus tidak ditemukan</h2>
        <p className="text-muted-foreground">{result.error || "Terjadi kesalahan saat memuat kursus."}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/guru/lms">Kembali ke Daftar Kursus</Link>
        </Button>
      </div>
    );
  }

  // Cast to match CourseEditorClient's expected type if necessary, 
  // but Prisma structure should be mostly compatible
  const course = result.data as any;

  return (
    <CourseEditorClient course={course} />
  );
}
