"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumb } from "@/components/layout/DashboardBreadcrumb";
import { UserNav } from "@/components/layout/UserNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Search } from "iconoir-react";
import { cn } from "@/lib/utils";
import { useKBar } from "kbar";

export function Header() {
  const { query } = useKBar();

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md transition-all duration-300 ease-in-out md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors duration-200" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4 bg-border/60 hidden sm:block"
        />
        <div className="hidden sm:block">
          <DashboardBreadcrumb />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Placeholder */}
        <div className="relative hidden lg:block group" onClick={() => query.toggle()}>
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          </div>
          <div 
            className={cn(
              "flex h-9 w-64 items-center rounded-full border border-input/50 bg-background/50 pl-10 pr-4 text-sm text-muted-foreground",
              "cursor-pointer hover:bg-accent/50 hover:border-accent-foreground/20 transition-all duration-200",
              "group-focus-within:border-primary/30 group-focus-within:bg-background group-focus-within:ring-1 group-focus-within:ring-primary/20"
            )}
          >
            Search... <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
        
        <div className="lg:hidden">
          <button 
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
            onClick={() => query.toggle()}
          >
            <Search className="h-5 w-5" />
            </button>
        </div>

        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
