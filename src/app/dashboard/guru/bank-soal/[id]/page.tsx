import { Suspense } from "react";
import { getQuestionsByTopicSupabase, getTopicByIdSupabase } from "@/actions/questions-supabase";
import { V2QuestionTable } from "@/components/questions/V2QuestionTable";
import { CreateQuestionDialog } from "@/components/questions/CreateQuestionDialog";
import { Card } from "@/components/ui/card";
import { DashboardBreadcrumb } from "@/components/layout/DashboardBreadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, NavArrowLeft } from "iconoir-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { questionSearchParamsCache } from "@/lib/parsers";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

interface TopicDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TopicDetailPage(props: TopicDetailPageProps) {
  const params = await props.params;
  const sParams = await props.searchParams;
  
  const topicId = decodeURIComponent(params.id);
  const parsed = questionSearchParamsCache.parse(sParams);

  const [result, topicResult] = await Promise.all([
    getQuestionsByTopicSupabase({ 
      topicId, 
      page: parsed.page, 
      pageSize: parsed.pageSize,
      search: parsed.search,
      type: parsed.type || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
    }),
    getTopicByIdSupabase(topicId)
  ]);

  const topicName = topicResult.success && topicResult.data ? topicResult.data.name : topicId;

  return (
    <div className="p-6 md:p-8 space-y-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <DashboardBreadcrumb />
          
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon" className="rounded-full">
                <Link href="/dashboard/guru/bank-soal">
                  <NavArrowLeft className="h-6 w-6" />
                </Link>
              </Button>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                <Database className="h-6 w-6 text-zinc-900 dark:text-zinc-100" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 capitalize">
                  {topicName}
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Daftar soal untuk topik ini. Total {result.totalCount} soal ditemukan.
                </p>
              </div>
            </div>
            
            <CreateQuestionDialog initialTopic={topicName} />
          </div>
        </div>

        <Card className="shadow-sm rounded-xl overflow-hidden p-0 border-none bg-transparent">
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
            <V2QuestionTable 
              data={result.data} 
              pageCount={result.totalPages} 
              totalCount={result.totalCount}
            />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
