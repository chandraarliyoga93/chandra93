"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, MultiplePages, Trophy, User } from "iconoir-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard/guru",
    icon: Home,
  },
  {
    label: "Kelas Saya",
    href: "/dashboard/guru/classes",
    icon: MultiplePages,
  },
  {
    label: "Poin & Hadiah",
    href: "/dashboard/guru/gamification",
    icon: Trophy,
  },
  {
    label: "Profil",
    href: "/dashboard/guru/profile",
    icon: User,
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/80 pb-safe backdrop-blur-xl md:hidden dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          // Check if it's the exact path or a subpath for everything except the dashboard root
          const isActive = item.href === "/dashboard/guru" 
            ? pathname === item.href 
            : pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 px-3 py-1 text-[10px] transition-colors duration-200",
                isActive ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <div className="relative z-10">
                <item.icon className={cn(
                  "size-6 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
              </div>
              <span className={cn(
                "relative z-10 font-medium transition-transform duration-200",
                isActive && "scale-105"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-bg"
                  className="absolute inset-0 rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
              )}
              
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-indicator"
                  className="absolute -top-3 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-50"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
