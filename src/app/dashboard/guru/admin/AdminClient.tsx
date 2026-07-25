"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import BulkStudentImporter from "@/components/admin/BulkStudentImporter";
import SchoolYearResetCard from "@/components/admin/SchoolYearResetCard";
import { Settings, Group, Database } from "iconoir-react";
import { ClassData } from "@/actions/classes-supabase";

interface AdminClientProps {
  classes: ClassData[];
}

export default function AdminClient({ classes }: AdminClientProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/10">
          <Settings className="w-6 h-6 text-white dark:text-zinc-900" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase italic">Admin Tools</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Panel khusus Admin Utama untuk manajemen sistem tingkat lanjut.</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Step 1: Select Class */}
        <Card className="md:col-span-1 rounded-3xl border-none shadow-xl bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-black tracking-tighter uppercase italic text-lg">
              <Group className="w-5 h-5" />
              Langkah 1
            </CardTitle>
            <CardDescription className="text-primary-foreground/70 font-medium">
              Pilih kelas target untuk pendaftaran siswa manual.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class-select" className="text-xs font-black uppercase tracking-widest opacity-70">Target Kelas</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class-select" className="rounded-xl border-none bg-white/10 text-white font-bold h-12 focus:ring-offset-0 focus:ring-white/20">
                  <SelectValue placeholder="Pilih Kelas..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id} className="font-bold py-3 rounded-lg">
                      {cls.name}
                    </SelectItem>
                  ))}
                  {classes.length === 0 && (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">
                      Belum ada kelas tersedia
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedClass && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Kode Kelas</p>
                <p className="font-mono font-black text-xl tracking-tighter">{selectedClass.code}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Import UI */}
        <div className="md:col-span-2">
          {selectedClass ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <BulkStudentImporter classCode={selectedClass.code} />
            </div>
          ) : (
            <Card className="h-full rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center p-12 text-center bg-zinc-50/30 dark:bg-zinc-950/30">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-6">
                <Database className="w-8 h-8 text-zinc-300" />
              </div>
              <h3 className="text-xl font-black text-zinc-400 uppercase tracking-tight">Menunggu Pilihan Kelas</h3>
              <p className="text-sm text-zinc-400 max-w-xs mt-2 font-medium">Silakan pilih kelas di panel kiri untuk mulai mendaftarkan siswa secara manual.</p>
            </Card>
          )}
        </div>
      </div>

      <SchoolYearResetCard />
    </div>
  );
}
