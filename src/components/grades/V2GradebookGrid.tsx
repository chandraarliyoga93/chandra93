"use client";

import * as React from "react";
import { ColumnDef, CellContext } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Assignment, GradebookRow, Grade } from "@/types/gradebook";
import { calculateAverage } from "@/lib/grading";
import { V2GradeCell } from "@/components/grades/V2GradeCell";
import { Group, ScaleFrameEnlarge, ViewGrid, Download } from "iconoir-react";
import { cn } from "@/lib/utils";
import { saveGrade } from "@/actions/grades-supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTableExportButton } from "@/components/data-table/data-table-export-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface V2GradebookGridProps {
  students: { id: string; name: string }[];
  assignments: Assignment[];
  grades: Record<string, { grade: number; feedback: string }>;
  classId: string;
}

export function V2GradebookGrid({ students, assignments, grades, classId }: V2GradebookGridProps) {
  const [localGrades, setLocalGrades] = React.useState<Record<string, { 
    grade: number; 
    feedback: string;
    rewardXP?: number;
    rewardBadgeId?: string;
  }>>(grades);

  // Sync with server data when it changes (after revalidatePath)
  React.useEffect(() => {
    setLocalGrades(grades);
  }, [grades]);

  const [savingCells, setSavingCells] = React.useState<Record<string, boolean>>({});
  const [isCompact, setIsCompact] = React.useState(false);

  const handleGradeChange = React.useCallback(async (
    studentId: string, 
    assignmentId: string, 
    value: number | null,
    remarks?: string,
    xp?: number,
    badgeId?: string
  ) => {
    const gradeKey = `${assignmentId}_${studentId}`;
    
    setLocalGrades(prev => ({
      ...prev,
      [gradeKey]: {
        grade: value ?? 0,
        feedback: remarks ?? prev[gradeKey]?.feedback ?? "",
        rewardXP: xp ?? prev[gradeKey]?.rewardXP,
        rewardBadgeId: badgeId ?? prev[gradeKey]?.rewardBadgeId
      }
    }));
  }, []);

  const persistGrade = React.useCallback(async (
    studentId: string,
    assignmentId: string,
    value: number | null,
    remarks?: string,
    xp?: number,
    badgeId?: string
  ) => {
    if (value === null) return;

    const gradeKey = `${assignmentId}_${studentId}`;
    setSavingCells(prev => ({ ...prev, [gradeKey]: true }));

    try {
      const result = await saveGrade(
        classId, 
        assignmentId, 
        studentId, 
        value, 
        remarks,
        xp,
        badgeId
      );
      if (!result.success) {
        toast.error((result as any).error || "Failed to save grade");
      }
    } catch (error) {
      toast.error("Error occurred while saving grade");
    } finally {
      setSavingCells(prev => ({ ...prev, [gradeKey]: false }));
    }
  }, [classId]);

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

  const columns = React.useMemo<ColumnDef<GradebookRow>[]>(() => {
    const cols: ColumnDef<GradebookRow>[] = [
      {
        id: "studentName",
        accessorKey: "studentName",
        header: "Student Name",
        size: isCompact ? 180 : 250,
        cell: ({ row }) => (
          <div className="flex items-center gap-3 px-2">
            <span className={cn("truncate font-bold tracking-tight", isCompact ? "text-xs" : "text-sm")}>
              {row.original.studentName}
            </span>
          </div>
        ),
      },
    ];

    const categories = Array.from(new Set(assignments.map((a) => a.category)));
    let globalColIdx = 1;

    categories.forEach((category) => {
      const categoryAssignments = assignments.filter((a) => a.category === category);
      
      categoryAssignments.forEach((asgn) => {
        const currentColIdx = globalColIdx++;
        cols.push({
          id: asgn.id,
          accessorKey: asgn.id,
          header: asgn.title,
          size: isCompact ? 80 : 120,
          cell: ({ getValue, row }: CellContext<GradebookRow, any>) => {
            const grade = getValue() as Grade | undefined;
            const gradeKey = `${asgn.id}_${row.original.studentId}`;
            const isSaving = savingCells[gradeKey];
            const localData = localGrades[gradeKey];
            
            return (
              <V2GradeCell
                value={grade?.value ?? null}
                remarks={grade?.remarks}
                rewardXP={localData?.rewardXP}
                rewardBadgeId={localData?.rewardBadgeId}
                onValueChange={(val: number | null) => handleGradeChange(
                  row.original.studentId, 
                  asgn.id, 
                  val, 
                  grade?.remarks,
                  localData?.rewardXP,
                  localData?.rewardBadgeId
                )}
                onRemarksChange={(rem: string | undefined) => {
                  handleGradeChange(
                    row.original.studentId, 
                    asgn.id, 
                    grade?.value ?? null, 
                    rem,
                    localData?.rewardXP,
                    localData?.rewardBadgeId
                  );
                }}
                onPersist={(val: number | null, rem: string | undefined, xp?: number, badgeId?: string) => persistGrade(
                  row.original.studentId, 
                  asgn.id, 
                  val, 
                  rem,
                  xp,
                  badgeId
                )}
                rowIndex={row.index}
                colIndex={currentColIdx}
                studentId={row.original.studentId}
                assignmentId={asgn.id}
                isSaving={isSaving}
              />
            );
          },
        });
      });
    });

    cols.push({
      id: "average",
      header: "Average",
      size: isCompact ? 70 : 100,
      cell: ({ row }) => {
        const studentGrades = assignments.map((asgn) => {
          const grade = row.original[asgn.id] as Grade | undefined;
          return grade?.value;
        });
        const average = calculateAverage(studentGrades);
        
        return (
          <div className={cn(
            "font-black text-center w-full",
            isCompact ? "text-xs" : "text-sm",
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
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setIsCompact(!isCompact)}
                  className={cn("h-10 w-10 rounded-xl border-zinc-200/50", isCompact && "bg-zinc-100")}
                >
                  {isCompact ? <ViewGrid className="h-4 w-4" /> : <ScaleFrameEnlarge className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl font-bold">
                {isCompact ? "Standard View" : "Compact View"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <DataTableExportButton
          table={table}
          fileName={`grades-${classId}`}
          title="Gradebook Report"
          subtitle={`Class: ${classId}`}
          type="gradebook"
          className="h-10 px-6 rounded-xl border-zinc-200/50 font-bold text-xs gap-2"
        />
      </div>

      <div className="rounded-[2rem] border border-zinc-200/50 bg-white dark:border-zinc-800/50 dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="relative overflow-auto max-h-[700px]">
          <Table className="border-collapse">
            <TableHeader className="sticky top-0 z-20 bg-white/80 backdrop-blur-md dark:bg-zinc-950/80">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b-zinc-200/50 hover:bg-transparent">
                  {headerGroup.headers.map((header, i) => {
                    const isFirst = i === 0;
                    const isLast = i === headerGroup.headers.length - 1;
                    
                    return (
                      <TableHead 
                        key={header.id} 
                        className={cn(
                          "h-14 text-zinc-500 font-bold text-[10px] uppercase tracking-widest text-center border-r border-zinc-100 dark:border-zinc-900 last:border-0",
                          isFirst && "sticky left-0 z-30 bg-white dark:bg-zinc-950 shadow-[2px_0px_5px_-2px_rgba(0,0,0,0.1)]",
                          isLast && "sticky right-0 z-30 bg-white dark:bg-zinc-950 shadow-[-2px_0px_5px_-2px_rgba(0,0,0,0.1)]"
                        )}
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b-zinc-200/50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                  {row.getVisibleCells().map((cell, i) => {
                    const isFirst = i === 0;
                    const isLast = i === row.getVisibleCells().length - 1;
                    
                    return (
                      <TableCell 
                        key={cell.id} 
                        className={cn(
                          "p-0 border-r border-zinc-100 dark:border-zinc-900 last:border-0",
                          isFirst && "sticky left-0 z-10 bg-white dark:bg-zinc-950 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900/50 shadow-[2px_0px_5px_-2px_rgba(0,0,0,0.1)]",
                          isLast && "sticky right-0 z-10 bg-white dark:bg-zinc-950 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900/50 shadow-[-2px_0px_5px_-2px_rgba(0,0,0,0.1)]"
                        )}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-4">
        * Use Arrow Keys, Tab, or Enter to navigate. Changes persist automatically on blur.
      </div>
    </div>
  );
}
