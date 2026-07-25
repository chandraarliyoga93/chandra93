import { Database, Folder, Page } from "iconoir-react";
import { getQuestionTopicsSupabase } from "@/actions/questions-supabase";
import { getPassagesSupabase } from "@/actions/passages-supabase";
import { CreateQuestionDialog } from "@/components/questions/CreateQuestionDialog";
import { CreatePassageDialog } from "@/components/questions/CreatePassageDialog";
import { Card } from "@/components/ui/card";
import { DashboardBreadcrumb } from "@/components/layout/DashboardBreadcrumb";
import { V2TopicTable } from "@/components/questions/V2TopicTable";
import { PassageTable } from "@/components/questions/PassageTable";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { URLTabs } from "@/components/ui/url-tabs";

export const dynamic = "force-dynamic";

export default async function GuruQuestionsPage(props: { searchParams: Promise<{ page?: string; pageSize?: string; search?: string; tab?: string }> }) {
  const searchParams = await props.searchParams;
  
  const tab = searchParams.tab || "topics";
  
  const topicsResult = await getQuestionTopicsSupabase({ 
    page: Number(searchParams.page) || 1, 
    pageSize: Number(searchParams.pageSize) || 10, 
    search: searchParams.search || "" 
  });

  const passagesResult = await getPassagesSupabase({
    page: Number(searchParams.page) || 1,
    pageSize: Number(searchParams.pageSize) || 10,
    search: searchParams.search || ""
  });

  const currentPage = Number(searchParams.page) || 1;

  return (
    <div className="p-6 md:p-8 space-y-8 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <DashboardBreadcrumb />
          
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                <Database className="h-6 w-6 text-zinc-900 dark:text-zinc-100" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Bank Soal (Question Bank)
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Kelola semua materi evaluasi Anda di satu tempat secara profesional.
                </p>
              </div>
            </div>
            
            {tab === "topics" ? (
              <CreateQuestionDialog />
            ) : (
              <CreatePassageDialog />
            )}
          </div>
        </div>

        <URLTabs
          defaultValue="topics"
          tabs={[
            {
              value: "topics",
              label: "Daftar Topik",
              icon: <Folder className="w-4 h-4" />,
              content: (
                <Card className="shadow-sm rounded-xl overflow-hidden">
                  <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
                    <V2TopicTable 
                      topics={topicsResult.data} 
                      totalPages={topicsResult.totalPages}
                      currentPage={currentPage}
                    />
                  </Suspense>
                </Card>
              )
            },
            {
              value: "passages",
              label: "Daftar Wacana",
              icon: <Page className="w-4 h-4" />,
              content: (
                <Card className="shadow-sm rounded-xl overflow-hidden">
                  <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
                    <PassageTable 
                      passages={passagesResult.data} 
                      totalPages={passagesResult.totalPages}
                      totalCount={passagesResult.totalCount}
                    />
                  </Suspense>
                </Card>
              )
            }
          ]}
        />
      </div>
    </div>
  );
}
