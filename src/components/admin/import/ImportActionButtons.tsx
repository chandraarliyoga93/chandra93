"use client";

import * as React from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImportActionButtonsProps {
  onProcess: () => void;
  onClear: () => void;
  hasErrors: boolean;
  isProcessing: boolean;
  hasData: boolean;
}

export function ImportActionButtons({
  onProcess,
  onClear,
  hasErrors,
  isProcessing,
  hasData,
}: ImportActionButtonsProps) {
  if (!hasData) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-lg border bg-muted/50 p-4 sm:flex-row">
      <div className="text-sm text-muted-foreground">
        {hasErrors ? (
          <span className="text-destructive font-medium">
            Perbaiki kesalahan dalam data sebelum memproses impor.
          </span>
        ) : (
          <span>Seluruh data valid dan siap untuk diimpor ke sistem.</span>
        )}
      </div>
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={isProcessing}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Bersihkan
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onProcess}
          disabled={hasErrors || isProcessing}
          className="w-full sm:w-auto"
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Memproses...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Proses Impor
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
