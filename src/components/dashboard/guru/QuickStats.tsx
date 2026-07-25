import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Group, OpenBook, EditPencil, Book } from 'iconoir-react';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  stats: {
    totalStudents: number;
    totalClasses: number;
    pendingGrades: number;
    journalsThisWeek: number;
  };
}

export function QuickStats({ stats }: QuickStatsProps) {
  const statItems = [
    {
      label: 'Total Siswa',
      value: stats.totalStudents,
      icon: Group,
      description: 'Siswa aktif',
    },
    {
      label: 'Total Kelas',
      value: stats.totalClasses,
      icon: OpenBook,
      description: 'Kelas aktif',
    },
    {
      label: 'Menunggu Dinilai',
      value: stats.pendingGrades,
      icon: EditPencil,
      description: 'Tugas perlu direview',
      alert: stats.pendingGrades > 0,
    },
    {
      label: 'Jurnal',
      value: stats.journalsThisWeek,
      icon: Book,
      description: 'Minggu ini',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {item.label}
            </CardTitle>
            <item.icon className={cn("h-4 w-4 text-muted-foreground", item.alert && "text-red-500")} />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", item.alert && "text-red-600")}>
              {item.value}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
