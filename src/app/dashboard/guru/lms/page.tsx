import Link from "next/link";
import { Plus } from "iconoir-react";

import {
  GuruLmsCoursesGrid,
} from "@/components/lms/GuruCoursePipelineCard";
import { GuruLmsOverviewStats } from "@/components/lms/GuruLmsOverviewStats";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { getAuthUser } from "@/lib/auth-server";
import {
  type CourseLifecycleStatus,
  getCoursePipelineState,
} from "@/lib/lms/flow";
import { prisma } from "@/lib/prisma";

export default async function LmsGuruPage() {
  const user = await getAuthUser();
  if (!user) return null;

  let coursesRaw;
  try {
    coursesRaw = await prisma.course.findMany({
      where: { teacherId: user.uid },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        status: true,
        _count: {
          select: { modules: true, assignments: true },
        },
        modules: {
          select: { _count: { select: { lessons: true } } },
        },
      },
    });
  } catch {
    return (
      <div className="p-6">
        <Heading
          title="LMS Kelas Guru"
          description="Manajemen kursus dan materi pembelajaran"
        />
        <div className="mt-8 p-6 border rounded-lg bg-destructive/10 text-destructive text-center">
          <p>Gagal memuat daftar kursus</p>
        </div>
      </div>
    );
  }

  const courses = coursesRaw.map((c) => {
    const hasModules = c._count.modules > 0;
    const hasLessons = c.modules.some((m) => m._count.lessons > 0);
    const hasAssignments = c._count.assignments > 0;
    const status = (c.status === "PUBLISHED"
      ? "PUBLISHED"
      : "DRAFT") as CourseLifecycleStatus;
    const pipelineState = getCoursePipelineState({
      hasModules,
      hasLessons,
      hasAssignments,
      status,
    });
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      coverImage: c.coverImage,
      pipelineState,
    };
  });

  let publishedStat = 0;
  let assignedStat = 0;
  for (const c of courses) {
    if (c.pipelineState === "PUBLISHED") publishedStat += 1;
    if (c.pipelineState === "ASSIGNED") assignedStat += 1;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Heading
          title="Manajemen Kursus"
          description="Alur: Draft → Siap Di-assign → Sudah Di-assign → Published. Siswa memprogres materi sebagai Belum Mulai, Sedang Belajar, atau Selesai."
        />
        <Button
          asChild
          className="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Link href="/dashboard/guru/lms/create">
            <Plus className="w-4 h-4 mr-2" />
            Buat Kursus
          </Link>
        </Button>
      </div>

      <GuruLmsOverviewStats
        total={courses.length}
        published={publishedStat}
        assigned={assignedStat}
      />

      <GuruLmsCoursesGrid courses={courses} />
    </div>
  );
}
