"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  Action,
} from "kbar";
import { 
  Dashboard, 
  OpenBook, 
  Medal, 
  Book,
  MultiplePages,
  Database,
  ElectronicsChip,
  Search,
} from "iconoir-react";
import { cn } from "@/lib/utils";
import { progressBar } from "@/lib/progress-bar";

export function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isSiswa = pathname.startsWith("/dashboard/siswa");
  const guruBase = "/dashboard/guru";

  const actions: Action[] = [
    {
      id: "dashboard",
      name: "Dashboard",
      shortcut: ["d"],
      keywords: "home dashboard utama",
      perform: () => {
        progressBar.start();
        router.push(isSiswa ? "/dashboard/siswa" : guruBase);
      },
      icon: <Dashboard className="w-5 h-5" />,
    },
    {
      id: "classes",
      name: "Manajemen Kelas",
      shortcut: ["c"],
      keywords: "kelas students siswa management",
      perform: () => {
        progressBar.start();
        router.push(isSiswa ? "/dashboard/siswa" : `${guruBase}/classes`);
      },
      icon: <OpenBook className="w-5 h-5" />,
    },
    {
      id: "gamification",
      name: "Gamifikasi",
      shortcut: ["g"],
      keywords: "leaderboard level badge rank",
      perform: () => {
        progressBar.start();
        router.push(isSiswa ? "/dashboard/siswa/leaderboard" : `${guruBase}/gamification`);
      },
      icon: <Medal className="w-5 h-5" />,
    },
    {
      id: "journals",
      name: "Jurnal Mengajar",
      shortcut: ["j"],
      keywords: "jurnal catatan mengajar harian",
      perform: () => {
        progressBar.start();
        router.push(`${guruBase}/journals`);
      },
      icon: <Book className="w-5 h-5" />,
    },
    {
      id: "lms",
      name: "Manajemen Kursus",
      shortcut: ["l"],
      keywords: "lms kursus materi modul pembelajaran online",
      perform: () => {
        progressBar.start();
        router.push(`${guruBase}/lms`);
      },
      icon: <MultiplePages className="w-5 h-5" />,
    },
    {
      id: "questions",
      name: "Bank Soal",
      shortcut: ["q"],
      keywords: "soal pertanyaan ujian test bank",
      perform: () => {
        progressBar.start();
        router.push(`${guruBase}/bank-soal`);
      },
      icon: <Database className="w-5 h-5" />,
    },
    {
      id: "cbt",
      name: "CBT Ujian",
      shortcut: ["x"],
      keywords: "cbt ujian exam test kuis quiz",
      perform: () => {
        progressBar.start();
        router.push(`${guruBase}/cbt`);
      },
      icon: <ElectronicsChip className="w-5 h-5" />,
    },
  ];

  return (
    <KBarProvider actions={actions}>
      <KBarPortal>
        <KBarPositioner className="z-[9999] bg-background/80 backdrop-blur-sm">
          <KBarAnimator className={cn(
            "w-full max-w-[600px] overflow-hidden bg-card",
            isSiswa 
              ? "rounded-xl border-4 border-neo-border bg-neo-bg shadow-[8px_8px_0px_0px_var(--neo-border)]" 
              : "rounded-lg border shadow-lg"
          )}>
            <div className={cn(
              "flex items-center px-4",
              isSiswa ? "border-b-4 border-neo-border" : "border-b"
            )}>
              <Search className="mr-2 h-5 w-5 text-muted-foreground" />
              <KBarSearch className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <kbd className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] uppercase",
                isSiswa 
                  ? "border-2 border-neo-border font-black shadow-[2px_2px_0px_0px_var(--neo-border)] bg-muted text-foreground" 
                  : "border bg-muted text-muted-foreground"
              )}>
                Esc
              </kbd>
            </div>
            <RenderResults isSiswa={isSiswa} />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
}

function RenderResults({ isSiswa }: { isSiswa: boolean }) {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === "string" ? (
          <div className={cn(
            "px-4 py-2 text-[10px] uppercase tracking-widest text-muted-foreground",
            isSiswa && "font-black"
          )}>
            {item}
          </div>
        ) : (
          <KBarResultItem item={item} active={active} isSiswa={isSiswa} />
        )
      }
    />
  );
}

const KBarResultItem = React.forwardRef(({ 
  item, 
  active, 
  isSiswa 
}: { 
  item: any, 
  active: boolean, 
  isSiswa: boolean 
}, ref: React.Ref<HTMLDivElement>) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center justify-between px-4 py-3 transition-colors",
        active 
          ? (isSiswa ? "bg-indigo-600 text-white" : "bg-accent text-accent-foreground")
          : "bg-transparent text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        {item.icon}
        <div className="flex flex-col">
          <span className={cn("text-sm", isSiswa ? "font-black italic uppercase tracking-tighter" : "font-medium")}>
            {item.name}
          </span>
          {item.subtitle && (
            <span className="text-[10px] opacity-70">{item.subtitle}</span>
          )}
        </div>
      </div>
      {item.shortcut?.length ? (
        <div className="flex gap-1">
          {item.shortcut.map((sc: string) => (
            <kbd
              key={sc}
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] uppercase",
                isSiswa 
                  ? "border-2 border-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-slate-100 text-black" 
                  : "border bg-muted text-muted-foreground"
              )}
            >
              {sc}
            </kbd>
          ))}
        </div>
      ) : null}
    </div>
  );
});

KBarResultItem.displayName = "KBarResultItem";
