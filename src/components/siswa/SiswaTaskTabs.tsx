"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCheck, Flash, NavArrowRight, Book } from "iconoir-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { progressBar } from "@/lib/progress-bar";

interface SiswaTaskTabsProps {
  activeView: string;
  tasksContent: React.ReactNode;
  examsContent: React.ReactNode;
  historyContent: React.ReactNode;
  lmsContent: React.ReactNode;
}

export function SiswaTaskTabs({ 
  activeView, 
  tasksContent, 
  examsContent, 
  historyContent,
  lmsContent
}: SiswaTaskTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (view: string) => {
    if (view === activeView) return;
    progressBar.start();
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const tabs = [
    { id: "tasks", label: "Daftar Misi", icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: "lms", label: "Materi", icon: <Book className="w-5 h-5 text-emerald-500" /> },
    { id: "exams", label: "Ujian Aktif", icon: <Flash className="w-5 h-5 text-yellow-500" /> },
    { id: "history", label: "Hasil Ujian", icon: <NavArrowRight className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Headers */}
      <div className="flex items-center gap-2 sm:gap-3 border-b-2 border-neo-border/70 pb-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-t-xl font-black uppercase italic transition-all whitespace-nowrap relative border-2 border-transparent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              activeView === tab.id 
                ? "bg-black text-white translate-y-1 border-black shadow-[2px_2px_0px_0px_var(--neo-border)]"
                : "text-zinc-500 hover:text-black hover:bg-zinc-100/70 active:translate-y-0.5"
            )}
          >
            {activeView === tab.id && (
              <motion.div
                layoutId="siswa-tasks-tab-bg"
                className="absolute inset-0 bg-black rounded-t-xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {tab.icon}
            <span className="text-sm sm:text-base">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeView === "tasks" && tasksContent}
            {activeView === "lms" && lmsContent}
            {activeView === "exams" && examsContent}
            {activeView === "history" && historyContent}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
