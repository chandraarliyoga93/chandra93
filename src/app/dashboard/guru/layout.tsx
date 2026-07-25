import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { BreadcrumbProvider } from "@/components/layout/BreadcrumbContext"
import { ModalProvider } from "@/components/providers/modal-provider"
import { V2Sidebar } from "@/components/layout/V2Sidebar"
import { V2Header } from "@/components/layout/V2Header"
import { PageTransition } from "@/components/layout/PageTransition"
import { MobileBottomNav } from "@/components/layout/MobileBottomNav"
import { cookies } from "next/headers"
import React from "react"

export const dynamic = "force-dynamic";

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sidebarState = cookieStore.get("sidebar_state")?.value
  const defaultOpen = sidebarState === "true"

  return (
    <BreadcrumbProvider>
      <ModalProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <div className="hidden md:block">
            <V2Sidebar />
          </div>
          <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 pb-20 md:pb-0">
            <V2Header />
            <main className="flex-1 p-2 md:p-4">
              <div className="min-h-[calc(100vh-theme(spacing.16)-theme(spacing.4))] w-full rounded-xl border border-zinc-200/50 bg-white p-4 md:p-6 shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
                <PageTransition>
                  {children}
                </PageTransition>
              </div>
            </main>
            <MobileBottomNav />
          </SidebarInset>
        </SidebarProvider>
      </ModalProvider>
    </BreadcrumbProvider>
  )
}
