import Link from "next/link";
import { getCourseDetails } from "@/actions/lms-course-supabase";
import { LessonFullPageEditor } from "@/components/lms/LessonFullPageEditor";
import type { LmsLesson, QuizData } from "@/components/lms/lms-lesson-types";
import { Button } from "@/components/ui/button";
interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

function findLesson(
  course: {
    modules: Array<{
      id: string;
      lessons: Array<{
        id: string;
        title: string;
        content: string | null;
        attachments: unknown;
        order: number;
        moduleId: string;
        createdAt: Date;
        updatedAt: Date;
        type?: string;
        quizData?: any;
      }>;
    }>;
  },
  lessonId: string,
): LmsLesson | null {
  for (const mod of course.modules) {
    const hit = mod.lessons.find((l) => l.id === lessonId);
    if (hit) {
      return {
        id: hit.id,
        title: hit.title,
        content: hit.content,
        type: (hit.type as "TEXT" | "QUIZ") || "TEXT",
        quizData: hit.quizData as any as QuizData,
        attachments: Array.isArray(hit.attachments)
          ? (hit.attachments as Array<{ name?: string }>)
          : undefined,
        order: hit.order,
        moduleId: hit.moduleId,
        createdAt: hit.createdAt,
        updatedAt: hit.updatedAt,
      };
    }
  }
  return null;
}

export default async function GuruLessonEditorPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  const result = await getCourseDetails(courseId);

  if (!result.success || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-xl font-semibold">Tidak ditemukan</h1>
        <p className="text-muted-foreground text-center">{result.error}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/guru/lms">Ke daftar kursus</Link>
        </Button>
      </div>
    );
  }

  const lesson = findLesson(result.data, lessonId);
  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-xl font-semibold">Materi tidak ditemukan</h1>
        <Button asChild variant="outline">
          <Link href={`/dashboard/guru/lms/${courseId}`}>Kembali ke kurikulum</Link>
        </Button>
      </div>
    );
  }

  return (
    <LessonFullPageEditor
      courseId={courseId}
      courseTitle={result.data.title}
      lesson={lesson}
    />
  );
}
