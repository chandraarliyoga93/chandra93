"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  Xmark, 
  InfoCircle, 
  WarningTriangle,
} from "iconoir-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AttendanceStatus } from "@/actions/attendance-supabase";

interface AttendanceActionBarProps<TData> {
  table: Table<TData>;
}

export function AttendanceActionBar<TData>({ table }: AttendanceActionBarProps<TData>) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;

  const handleBulkStatusChange = (status: AttendanceStatus | undefined) => {
    // @ts-expect-error - meta is not typed in TanStack Table by default
    const onStatusChange = table.options.meta?.onStatusChange;
    
    if (onStatusChange) {
      selectedRows.forEach((row) => {
        // @ts-expect-error - row data has uid
        const studentId = row.original.uid;
        onStatusChange(studentId, status);
      });
      // Clear selection after action
      table.toggleAllPageRowsSelected(false);
    }
  };

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ y: 100, x: "-50%", opacity: 0 }}
          animate={{ y: 0, x: "-50%", opacity: 1 }}
          exit={{ y: 100, x: "-50%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 flex items-center gap-3 bg-card border shadow-2xl px-4 py-2 rounded-full min-w-[320px] max-w-[90vw] md:max-w-none"
        >
          <div className="flex items-center gap-2 px-2">
            <div className="bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
              {selectedCount}
            </div>
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              Siswa Terpilih
            </span>
          </div>

          <Separator orientation="vertical" className="h-8 mx-1" />

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusChange("present")}
              className="h-9 gap-2 px-3 text-xs font-bold hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 rounded-full"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Hadir</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusChange("sick")}
              className="h-9 gap-2 px-3 text-xs font-bold hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/50 rounded-full"
            >
              <InfoCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Sakit</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusChange("excused")}
              className="h-9 gap-2 px-3 text-xs font-bold hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/50 rounded-full"
            >
              <InfoCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Izin</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusChange("late")}
              className="h-9 gap-2 px-3 text-xs font-bold hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/50 rounded-full"
            >
              <WarningTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Telat</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBulkStatusChange("absent")}
              className="h-9 gap-2 px-3 text-xs font-bold hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 rounded-full"
            >
              <Xmark className="w-4 h-4" />
              <span className="hidden sm:inline">Alpha</span>
            </Button>
            
            <Separator orientation="vertical" className="h-8 mx-1" />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => table.toggleAllPageRowsSelected(false)}
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
              title="Batal"
            >
              <Xmark className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
