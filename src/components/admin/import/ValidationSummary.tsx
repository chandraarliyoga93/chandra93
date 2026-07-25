import * as React from "react";
import { CheckCircle2, AlertCircle, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ParsedStudentRecord } from "@/lib/student-import";

interface ValidationSummaryProps {
  data: ParsedStudentRecord[];
}

export function ValidationSummary({ data }: ValidationSummaryProps) {
  if (data.length === 0) return null;

  const total = data.length;
  const ready = data.filter((item) => item.status === "VALID").length;
  const errors = total - ready;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="border shadow-none">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <List className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Rekaman</p>
            <p className="text-2xl font-bold leading-none">{total}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-none">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Siap Diimpor</p>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                OK
              </Badge>
            </div>
            <p className="text-2xl font-bold leading-none">{ready}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-none">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-full bg-destructive/10 p-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Ada Masalah</p>
              {errors > 0 && (
                <Badge variant="destructive" className="h-auto px-1.5 py-0">
                  {errors}
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold leading-none">{errors}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
