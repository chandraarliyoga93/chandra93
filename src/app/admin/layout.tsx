import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { BreadcrumbProvider } from "@/components/layout/BreadcrumbContext"
import { ModalProvider } from "@/components/providers/modal-provider"
import { cookies } from "next/headers"
import React from "react"

export const dynamic = "force-dynamic";

export default async function AdminLayout({
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
          <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
            <main className="flex-1 p-2 md:p-4">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </ModalProvider>
    </BreadcrumbProvider>
  )
}
