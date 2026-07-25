"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { Group, MoreHoriz, EditPencil, Trash } from "iconoir-react"
import { ClassData } from "@/actions/classes-supabase"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface V2ClassCardProps {
  classData: ClassData
  onEdit?: (classData: ClassData) => void
  onDelete?: (classData: ClassData) => void
  className?: string
}

export function V2ClassCard({
  classData,
  onEdit,
  onDelete,
  className,
}: V2ClassCardProps) {
  const { id, name, code, studentCount, createdAt } = classData

  const relativeDate = formatDistanceToNow(new Date(createdAt), {
    addSuffix: true,
    locale: idLocale,
  })

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card
        className={cn(
          "group relative overflow-hidden rounded-2xl border-zinc-200/50 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-950 dark:hover:border-zinc-700",
          className
        )}
      >
        <div className="flex flex-col gap-6">
          {/* Top Row */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <Group className="h-5 w-5" />
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <MoreHoriz className="h-5 w-5" />
                    <span className="sr-only">Menu aksi</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                  <DropdownMenuItem
                    onClick={() => onEdit?.(classData)}
                    className="cursor-pointer gap-2 py-2"
                  >
                    <EditPencil className="h-4 w-4" />
                    <span>Edit Kelas</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete?.(classData)}
                    className="cursor-pointer gap-2 py-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-950/30"
                  >
                    <Trash className="h-4 w-4" />
                    <span>Hapus Kelas</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Middle Section */}
          <div className="relative z-10 space-y-2">
            <Link
              href={`/dashboard/guru/classes/${id}`}
              className="block group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"
            >
              <h3 className="line-clamp-1 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {name}
              </h3>
            </Link>
            <Badge
              variant="secondary"
              className="rounded-lg bg-zinc-100 font-mono text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {code}
            </Badge>
          </div>

          {/* Bottom Section */}
          <div className="relative z-10 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-900">
            <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <Group className="h-4 w-4" />
              <span>{studentCount} Siswa</span>
            </div>
            <div className="text-xs text-zinc-400 dark:text-zinc-500">
              Dibuat {relativeDate}
            </div>
          </div>
        </div>

        {/* Full card link overlay (except for actions) */}
        <Link
          href={`/dashboard/guru/classes/${id}`}
          className="absolute inset-0 z-0"
          aria-hidden="true"
        />
      </Card>
    </motion.div>
  )
}
