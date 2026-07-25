"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface V2ClassTabsProps {
  classId: string;
}

export function V2ClassTabs({ classId }: V2ClassTabsProps) {
  const pathname = usePathname();
  const baseUrl = `/dashboard/guru/classes/${classId}`;

  const tabs = [
    { name: "Overview", href: baseUrl, exact: true },
    { name: "Attendance", href: `${baseUrl}/attendance` },
    { name: "Grades", href: `${baseUrl}/grades` },
    { name: "Students", href: `${baseUrl}/students` },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl w-full sm:w-fit border border-zinc-200/50 dark:border-zinc-800/50 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-lg whitespace-nowrap",
              isActive
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
