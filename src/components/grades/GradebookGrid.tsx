"use client";

import * as React from "react";
import { ColumnDef, CellContext } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { DataTable } from "@/components/data-table/data-table";
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Assignment, GradebookRow, Grade } from "@/types/gradebook";
import { calculateAverage } from "@/lib/grading";
import { GradeCell } from "./GradeCell";
import { User, ScaleFrameEnlarge, ViewGrid } from "iconoir-react";
import { cn } from "@/lib/utils";
import { saveGrade } from "@/actions/grades-supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTableExportButton } from "@/components/data-table/data-table-export-button";

interface GradebookGridProps {
  students: { id: string; name: string }[];
  assignments: Assignment[];
  grades: Record<string, { grade: number; feedback: string }>;
  classId: string;
}

export function GradebookGrid({ students, assignments, grades, classId }: GradebookGridProps) {
  const [localGrades, setLocalGrades] = React.useState(grades);
  const [savingCells, setSavingCells] = React.useState<Record<string, boolean>>({});
  const [isCompact, setIsCompact] = React.useState(false);

  // Handle grade change
  const handleGradeChange = React.useCallback(async (
    studentId: string, 
    assignmentId: string, 
    value: number | null,
    remarks?: string
  ) => {
    const gradeKey = `${assignmentId}_${studentId}`;
    
    setLocalGrades(prev => ({
      ...prev,
      [gradeKey]: {
        grade: value ?? 0,
        feedback: remarks ?? prev[gradeKey]?.feedback ?? ""
      }
    }));
  }, []);

  const persistGrade = React.useCallback(async (
    studentId: string,
    assignmentId: string,
    value: number | null,
    remarks?: string
  ) => {
    if (value === null) return;

    const gradeKey = `${assignmentId}_${studentId}`;
    setSavingCells(prev => ({ ...prev, [gradeKey]: true }));

    try {
      const result = await saveGrade(classId, assignmentId, studentId, value, remarks);
      if (!result.success) {
        toast.error((result as any).error || "Gagal menyimpan nilai");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan nilai");
    } finally {
      setSavingCells(prev => ({ ...prev, [gradeKey]: false }));
    }
  }, [classId]);

  // Transform data for the grid
  const data = React.useMemo(() => {
    return students.map((student) => {
      const row: GradebookRow = {
        studentId: student.id,
        studentName: student.name,
      };

      assignments.forEach((asgn) => {
        const gradeKey = `${asgn.id}_${student.id}`;
        const gradeData = localGrades[gradeKey];
        row[asgn.id] = gradeData ? { value: gradeData.grade, remarks: gradeData.feedback } : { value: null };
      });

      return row;
    });
  }, [students, assignments, localGrades]);

  // Define columns
  const columns = React.useMemo<ColumnDef<GradebookRow>[]>(() => {
    const cols: ColumnDef<GradebookRow>[] = [
      {
        id: "studentName",
        accessorKey: "studentName",
        header: "Nama Siswa",
        size: isCompact ? 180 : 250,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 px-1">
            <div className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-muted",
              isCompact ? "h-6 w-6" : "h-8 w-8"
            )}>
              <User className={isCompact ? "h-3 w-3" : "h-4 w-4"} />
            </div>
            <span className={cn("truncate font-medium", isCompact ? "text-xs" : "text-sm")}>
              {row.original.studentName}
            </span>
          </div>
        ),
      },
    ];

    // Group assignments by category
    const categories = Array.from(new Set(assignments.map((a) => a.category)));
    let globalColIdx = 1;

    categories.forEach((category) => {
      const categoryAssignments = assignments.filter((a) => a.category === category);
      
      cols.push({
        id: `category-${category}`,
        header: category,
        columns: categoryAssignments.map((asgn) => {
          const currentColIdx = globalColIdx++;
          
          return {
            id: asgn.id,
            accessorKey: asgn.id,
            header: asgn.title,
            size: isCompact ? 80 : 120,
            cell: ({ getValue, row }: CellContext<GradebookRow, any>) => {
              const grade = getValue() as Grade | undefined;
              const gradeKey = `${asgn.id}_${row.original.studentId}`;
              const isSaving = savingCells[gradeKey];
              
              return (
                <GradeCell
                  value={grade?.value ?? null}
                  remarks={grade?.remarks}
                  onValueChange={(val) => handleGradeChange(row.original.studentId, asgn.id, val, grade?.remarks)}
                  onRemarksChange={(rem) => {
                    handleGradeChange(row.original.studentId, asgn.id, grade?.value ?? null, rem);
                  }}
                  onPersist={(val, rem) => persistGrade(row.original.studentId, asgn.id, val, rem)}
                  rowIndex={row.index}
                  colIndex={currentColIdx}
                  studentId={row.original.studentId}
                  assignmentId={asgn.id}
                  isSaving={isSaving}
                />
              );
            },
          };
        }),
      } as any);
    });

    // Add Average Column
    cols.push({
      id: "average",
      header: "Rata-rata",
      size: isCompact ? 70 : 100,
      cell: ({ row }) => {
        const studentGrades = assignments.map((asgn) => {
          const grade = row.original[asgn.id] as Grade | undefined;
          return grade?.value;
        });
        const average = calculateAverage(studentGrades);
        const avgNum = parseFloat(average);
        
        return (
          <div className={cn(
            "font-bold text-center w-full",
            isCompact ? "text-xs" : "text-sm",
            avgNum >= 75 ? "text-green-600" : avgNum >= 60 ? "text-yellow-600" : "text-destructive"
          )}>
            {average}
          </div>
        );
      },
    });

    return cols;
  }, [assignments, isCompact, savingCells, handleGradeChange, persistGrade]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      minSize: 40,
      size: 150,
      maxSize: 500,
    },
    state: {
      columnPinning: {
        left: ["studentName"],
      },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setIsCompact(!isCompact)}
                  className={cn(isCompact && "bg-muted")}
                >
                  {isCompact ? <ViewGrid className="h-4 w-4" /> : <ScaleFrameEnlarge className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isCompact ? "Mode Normal" : "Mode Kompak"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">&ge; 75</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">&ge; 60</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">&lt; 60</span>
          </div>
        </div>
        <DataTableExportButton
          table={table}
          fileName={`nilai-kelas-${classId}`}
          title="Laporan Nilai"
          subtitle="Daftar Nilai Siswa"
          className={`Kelas ${classId}`}
          date={format(new Date(), "dd MMMM yyyy", { locale: idLocale })}
          type="gradebook"
        />
      </div>

      <div className="rounded-md border bg-background">
        <DataTable table={table} />
      </div>
      <div className="text-xs text-muted-foreground">
        * Gunakan Tombol Panah, Tab, atau Enter untuk navigasi antar sel. Nilai disimpan otomatis saat berpindah sel.
      </div>
    </div>
  );
}
