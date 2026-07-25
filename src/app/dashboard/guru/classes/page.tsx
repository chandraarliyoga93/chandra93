import { getGuruClassesSupabase } from "@/actions/classes-supabase"
import { V2ClassGrid } from "@/components/classes/V2ClassGrid"
import { CreateClassDialog } from "@/components/classes/CreateClassDialog"
import { XPConfigDialog } from "@/components/gamification/XPConfigDialog"
import { MultiplePages, OpenBook } from "iconoir-react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function GuruClassesV2Page(props: { searchParams: Promise<{ page?: string; pageSize?: string }> }) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const pageSize = Number(searchParams.pageSize) || 10;

  const result = await getGuruClassesSupabase({ page, pageSize })
  const classes = result.success ? result.data : []
  const totalPages = result.success ? result.totalPages : 0
  const totalCount = result.success ? result.totalCount : 0

  return (
    <div className="p-6 md:p-8 space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <MultiplePages className="h-6 w-6 text-zinc-900 dark:text-zinc-100" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Daftar Kelas
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">
              Kelola semua ruang belajar dan akses siswa Anda dalam satu tampilan terpadu.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/50 bg-white/50 p-1.5 dark:border-zinc-800/50 dark:bg-zinc-950/50">
            <XPConfigDialog />
            <CreateClassDialog />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
        {totalCount > 0 ? (
          <V2ClassGrid 
            data={classes} 
            totalPages={totalPages}
            currentPage={page}
          />
        ) : (
          <Card className="shadow-sm rounded-xl overflow-hidden">
            <div className="flex min-h-[400px] flex-col items-center justify-center p-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-50 shadow-sm dark:bg-zinc-900/50">
                <OpenBook className="h-10 w-10 text-zinc-400" aria-hidden="true" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Belum Ada Kelas
                </h3>
                <p className="mt-2 max-w-xs text-zinc-500 dark:text-zinc-400">
                  Mulai perjalanan mengajar Anda dengan membuat kelas pertama sekarang.
                </p>
              </div>
              <div className="mt-8">
                <CreateClassDialog />
              </div>
            </div>
          </Card>
        )}
      </Suspense>
    </div>
  )
}
