import { getClassByIdSupabase as getClassById } from "@/actions/classes-supabase";
import { getStudentsByClassSupabase } from "@/actions/students";
import { notFound } from "next/navigation";
import { Group, Settings } from "iconoir-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { V2StudentRoster } from "@/components/students/V2StudentRoster";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { studentSearchParamsCache } from "@/lib/parsers";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

async function StudentsContent({ id, parsed }: { id: string, parsed: any }) {
  let classData = null;
  let studentsResult: any = { data: [], totalEnrolled: 0, totalCount: 0 };
  let authUser = null;

  const cookieStore = await cookies();
  const userId = cookieStore.get("user-id")?.value;
  const adminEmail = process.env.ADMIN_GURU_EMAIL;

  try {
    const [cData, sResult, aUser] = await Promise.all([
      getClassById(id),
      getStudentsByClassSupabase(id, {
        page: 1,
        limit: 0,
        search: parsed.search,
        sortBy: parsed.sortBy,
        sortOrder: parsed.sortOrder,
      }),
      userId ? prisma.user.findUnique({ where: { id: userId } }) : null
    ]);
    classData = cData;
    studentsResult = sResult;
    authUser = aUser;
  } catch (error) {
    console.warn("Database connection failed during build data collection:", error);
  }

  if (!classData) {
    notFound();
  }

  const isAdmin = authUser?.email === adminEmail;
  const { data: students, totalEnrolled, totalCount } = studentsResult as any;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight uppercase italic">Student Roster</h2>
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 hidden sm:block">
              Total: {totalCount} Students
            </div>
            
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

      {totalEnrolled === 0 ? (
        <div className="p-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] bg-zinc-50/30 dark:bg-zinc-950/30 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-8">
            <Group className="w-10 h-10 text-zinc-400" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight uppercase">No Students Enrolled</h3>
            <p className="text-zinc-500 dark:text-zinc-400 max-sm font-medium leading-relaxed">
              You haven't added any students to this class yet. Go to the Admin Tools to register students!
            </p>
          </div>
        </div>
      ) : (
        <V2StudentRoster 
          students={students.map((s: any) => ({
            ...s,
            joinedAt: (s as any).joinedAt || new Date().toISOString()
          }))} 
          classId={id} 
          isGlobal={false}
        />
      )}
    </div>
  );
}

interface StudentsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StudentsPage({ params, searchParams }: StudentsPageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const parsed = studentSearchParamsCache.parse(sParams);

  return (
    <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
      <StudentsContent id={id} parsed={parsed} />
    </Suspense>
  );
}
