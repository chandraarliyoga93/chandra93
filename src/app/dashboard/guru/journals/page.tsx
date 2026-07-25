import { V2PageContainer } from "@/components/shared/V2PageContainer"
import { V2JournalTable } from "@/components/journals/V2JournalTable"
import { V2CreateJournalDialog } from "@/components/journals/V2CreateJournalDialog"
import { JournalExportActions } from "@/components/journals/JournalExportActions"
import { getJournalsSupabase } from "@/actions/journals-supabase"
import { getGuruClassesSupabase } from "@/actions/classes-supabase"
import { Journal as JournalIcon } from "iconoir-react"

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const dynamic = "force-dynamic";

export default async function JournalsV2Page(props: { searchParams: Promise<{ page?: string; pageSize?: string }> }) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;

  const [journalsData, classesData] = await Promise.all([
    getJournalsSupabase({ page, pageSize }),
    getGuruClassesSupabase({ pageSize: 100 }) // Fetch all classes for filter dropdown
  ])

  return (
    <V2PageContainer>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/10">
              <JournalIcon className="w-6 h-6 text-white dark:text-zinc-900" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Jurnal Mengajar (Teaching Journal)</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Kelola dan tinjau aktivitas pengajaran Anda secara profesional.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <JournalExportActions classes={classesData.data} />
            <V2CreateJournalDialog classes={classesData.data} />
          </div>
        </div>

        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
          <V2JournalTable 
            data={journalsData.data} 
            totalPages={journalsData.totalPages}
            currentPage={page}
            classes={classesData.data}
          />
        </Suspense>
      </div>
    </V2PageContainer>
  )
}
