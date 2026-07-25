"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ViewGrid, User, Trophy, Shop, Book } from "iconoir-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

/** Sinkron dengan `STUDENT_GLOBAL_LMS_HREF` di `StudentCourseList` (modul server — string disalin). */
const STUDENT_GLOBAL_LMS_HREF = "/dashboard/siswa?view=lms" as const;

/** Label dipendekkan untuk nyaman di layar sempit (5 tab). */
const simpleNavItems = [
  {
    label: "Utama",
    ariaLabel: "Beranda",
    href: "/dashboard/siswa",
    icon: ViewGrid,
  },
  {
    label: "Top",
    ariaLabel: "Peringkat",
    href: "/dashboard/siswa/leaderboard",
    icon: Trophy,
  },
  {
    label: "Materi",
    ariaLabel: "Materi pembelajaran",
    href: STUDENT_GLOBAL_LMS_HREF,
    icon: Book,
  },
  {
    label: "Toko",
    ariaLabel: "Market",
    href: "/dashboard/siswa/market",
    icon: Shop,
  },
  {
    label: "Saya",
    ariaLabel: "Profil",
    href: "/dashboard/siswa/profile",
    icon: User,
  },
] as const;

export function StudentBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-neo-bg border-t-2 border-neo-border pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
      aria-label="Navigasi utama siswa"
    >
      <div className="flex min-h-[3.75rem] items-stretch">
        {simpleNavItems.map((item) => {
          const isLmsTabActive = pathname === "/dashboard/siswa" && searchParams.get("view") === "lms";
          const isActive =
            item.href === STUDENT_GLOBAL_LMS_HREF ? isLmsTabActive : pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.ariaLabel}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden px-0.5 py-1.5 transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isActive
                  ? "text-black dark:text-zinc-950"
                  : "text-zinc-500 dark:text-zinc-400 active:bg-muted/60"
              )}
            >
              <div
                className={cn(
                  "relative z-10 flex min-w-0 flex-col items-center justify-center gap-0.5 transition-transform duration-200",
                  isActive && "-translate-y-px"
                )}
              >
                <Icon
                  strokeWidth={isActive ? 3 : 2.25}
                  className={cn(
                    "h-[22px] w-[22px] shrink-0",
                    isActive && "animate-in zoom-in-75 duration-300"
                  )}
                  aria-hidden
                />
                <span className="max-w-full truncate text-center text-[9px] font-black uppercase leading-none tracking-tight sm:text-[10px]">
                  {item.label}
                </span>
              </div>

              {/* Active Background - Solid Yellow for Siswa Theme */}
              {isActive && (
                 <motion.div 
                   layoutId="student-bottom-nav-active"
                   className="absolute inset-0 bg-yellow-400 border-x border-black dark:border-zinc-950" 
                   initial={false}
                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                 />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
