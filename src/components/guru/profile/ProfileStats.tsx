"use client";

import React from "react";
import { Group, OpenBook, Calendar } from "iconoir-react";

interface ProfileStatsProps {
  stats?: {
    totalClasses: number;
    totalStudents: number;
    avgAttendance: string;
  };
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const items = [
    {
      label: "Total Kelas",
      value: stats?.totalClasses ?? 0,
      icon: OpenBook,
    },
    {
      label: "Total Siswa",
      value: stats?.totalStudents ?? 0,
      icon: Group,
    },
    {
      label: "Rerata Absensi",
      value: stats?.avgAttendance ?? "0%",
      icon: Calendar,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <item.icon className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {item.label}
            </p>
            <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
