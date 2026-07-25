import { getStudentsActionSupabase } from "@/actions/students";
import { studentSearchParamsCache } from "@/lib/parsers";
import { DashboardBreadcrumb } from "@/components/layout/DashboardBreadcrumb";
import { SearchParams } from "nuqs/server";
import { Group, Settings } from "iconoir-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { V2StudentRoster } from "@/components/students/V2StudentRoster";
import { Card } from "@/components/ui/card";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface StudentsPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const { page, pageSize, search, sortBy, sortOrder } = studentSearchParamsCache.parse(await searchParams);

  const cookieStore = await cookies();
  const userId = cookieStore.get("user-id")?.value;
  const adminEmail = process.env.ADMIN_GURU_EMAIL;

  const [result, authUser] = await Promise.all([
    getStudentsActionSupabase({
      page,
      limit: pageSize,
      search,
    }),
    userId ? prisma.user.findUnique({ where: { id: userId } }) : null
  ]);

  const students = (result as any).success ? (result as any).data : [];
  const isAdmin = authUser?.email === adminEmail;

  return (
    <div className="p-6 md:p-8 space-y-8 pb-10">
      <div className="flex flex-col gap-4">
        <DashboardBreadcrumb />
        
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <Group className="h-6 w-6 text-zinc-900 dark:text-zinc-100" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Direktori Siswa
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400">
                Kelola dan pantau seluruh data siswa dalam satu tempat yang terpusat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="outline" size="sm" asChild className="rounded-xl border-zinc-200 dark:border-zinc-800 font-bold gap-2">
                <Link href="/dashboard/guru/admin">
                  <Settings className="w-4 h-4" />
                  Admin Tools
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Card className="shadow-sm rounded-xl overflow-hidden">
        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
          <V2StudentRoster 
            students={students.map((s: any) => ({
              ...s,
              joinedAt: s.createdAt as string
            }))} 
            classId=""
            isGlobal={true}
          />
        </Suspense>
      </Card>
    </div>
  );
}
