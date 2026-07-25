import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsReport, Trophy, WarningTriangle } from "iconoir-react";

interface GradebookSummaryProps {
  average: string;
  highest: string;
  lowest: string;
  totalStudents: number;
  totalAssignments: number;
}

export function GradebookSummary({ 
  average, 
  highest, 
  lowest, 
  totalStudents, 
  totalAssignments 
}: GradebookSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Kelas</CardTitle>
          <StatsReport className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{average}</div>
          <p className="text-xs text-muted-foreground">Dari seluruh tugas</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Nilai Tertinggi</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{highest}</div>
          <p className="text-xs text-muted-foreground">Pencapaian terbaik</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Nilai Terendah</CardTitle>
          <WarningTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowest}</div>
          <p className="text-xs text-muted-foreground">Perlu perhatian</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Status Data</CardTitle>
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">{totalStudents} Siswa</div>
          <p className="text-xs text-muted-foreground">{totalAssignments} Tugas terdata</p>
        </CardContent>
      </Card>
    </div>
  );
}
