"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  className?: string
}

export function V2StatsCard({ title, value, description, icon, trend, className }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="h-full"
    >
      <Card className={cn("rounded-[2rem] border-zinc-200/50 bg-white/50 backdrop-blur-sm h-full flex flex-col justify-between transition-colors duration-300 hover:border-zinc-300 dark:border-zinc-800/50 dark:bg-zinc-950/50 dark:hover:border-zinc-700", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</CardTitle>
          {icon && <div className="text-zinc-400 dark:text-zinc-500">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</div>
          {(description || trend) && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {trend && (
                <span className={cn("mr-1 font-medium", trend.isPositive ? "text-emerald-600" : "text-rose-600")}>
                  {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                </span>
              )}
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
