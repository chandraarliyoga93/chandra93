"use client"

import * as React from "react"
import { Search } from "iconoir-react"

import { useKBar } from "kbar"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardBreadcrumb } from "@/components/layout/DashboardBreadcrumb"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

export function V2Header() {
  const { query } = useKBar();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-zinc-200/50 bg-white/50 px-4 backdrop-blur-xl transition-[background-color,border-color,backdrop-filter] duration-300 dark:border-zinc-800/50 dark:bg-zinc-950/50">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <DashboardBreadcrumb />
      </div>
      
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        {/* KBar Visual Trigger */}
        <Button
          variant="outline"
          className="relative h-9 w-full justify-start rounded-[0.5rem] bg-zinc-50/50 text-sm font-normal text-zinc-500 shadow-none transition-[background-color] hover:bg-zinc-100 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 md:w-40 lg:w-64"
          onClick={() => query.toggle()}
        >
          <Search className="mr-2 size-4" />
          <span>Cari…</span>
          <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium opacity-100 dark:bg-zinc-950 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>
    </header>
  )
}
