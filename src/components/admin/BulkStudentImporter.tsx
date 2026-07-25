"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { bulkRegisterStudents as bulkRegisterManualStudents } from "@/actions/admin-supabase";
import { Infinite, Database, Trash, Plus, MultiplePages, Check, Download } from "iconoir-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface StudentInput {
  name: string;
  username: string;
  password?: string;
}

export default function BulkStudentImporter({ classCode }: { classCode: string }) {
  const [students, setStudents] = useState<StudentInput[]>([
    { name: "", username: "", password: "" }
  ]);
  const [useDefaultPassword, setUseDefaultPassword] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [rawText, setRawText] = useState("");

  const handleAddRow = () => {
    setStudents([...students, { name: "", username: "", password: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    if (students.length === 1) {
      setStudents([{ name: "", username: "", password: "" }]);
      return;
    }
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleUpdateStudent = (index: number, field: keyof StudentInput, value: string) => {
    const newStudents = [...students];
    newStudents[index] = { ...newStudents[index], [field]: value };
    setStudents(newStudents);
  };

  const handlePaste = () => {
    const lines = rawText.split("\n").filter(line => line.trim() !== "");
    const parsed = lines.map(line => {
      const parts = line.split(/\t|,/);
      return {
        name: parts[0]?.trim() || "",
        username: parts[1]?.trim() || parts[parts.length - 1]?.trim().replace(/[^a-zA-Z0-9]/g, "") || "",
        password: ""
      };
    }).filter(s => s.name || s.username);

    if (parsed.length > 0) {
      setStudents(parsed);
      setShowPasteArea(false);
      setRawText("");
      toast.success(`${parsed.length} siswa berhasil dimuat ke tabel`);
    } else {
      toast.error("Format tidak valid atau data kosong");
    }
  };

  const handleImport = async () => {
    const validStudents = students.filter(s => s.name.trim() && s.username.trim());
    if (validStudents.length === 0) {
      toast.error("Masukan data siswa (Nama & Username) minimal 1 baris");
      return;
    }

    // If using default password, ensure password field is empty so server uses default
    const processedStudents = validStudents.map(s => ({
      ...s,
      password: useDefaultPassword ? undefined : s.password
    }));

    setIsPending(true);
    try {
      const result = await bulkRegisterManualStudents(processedStudents, classCode);
      if (result.success) {
        setResults(result.results || []);
        toast.success("Proses pendaftaran selesai!");
      } else {
        toast.error(result.error || "Gagal melakukan pendaftaran massal");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsPending(false);
    }
  };

  if (results) {
    return (
      <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="font-black tracking-tighter uppercase italic">Hasil Pendaftaran</CardTitle>
          <CardDescription className="text-primary-foreground/70 font-medium">
            Berikan data berikut kepada siswa Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px]">Nama</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">ID Login (Email)</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Password</TableHead>
                  <TableHead className="font-black uppercase text-[10px] text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((res, i) => (
                  <TableRow key={i} className="group">
                    <TableCell className="font-bold text-sm">{res.name}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">{res.email}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500 font-bold">{res.password}</TableCell>
                    <TableCell className="text-right">
                      {res.success ? (
                        <div className="flex items-center justify-end gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                          <Check className="w-3.5 h-3.5" /> Berhasil
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5 text-rose-600 font-black text-[10px] uppercase">
                          <Trash className="w-3.5 h-3.5" /> Gagal
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-6 bg-muted/20 border-t flex justify-end">
            <Button variant="outline" onClick={() => setResults(null)} className="rounded-xl font-bold h-11 px-6 border-2">
              Tutup & Selesai
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-none shadow-xl overflow-hidden bg-white dark:bg-zinc-950">
        <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 font-black tracking-tighter text-2xl uppercase italic">
                <Database className="w-6 h-6 text-primary" />
                Input Siswa Manual
              </CardTitle>
              <CardDescription className="font-medium">
                Masukan data siswa yang akan didaftarkan ke kelas ini. 
                <span className="block mt-1 text-[10px] text-primary font-black uppercase tracking-wider">
                  Domain: @siswa.kg | Password Default: Siswa123!
                </span>
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-900 px-3 py-2 rounded-xl border-2">
                <Switch 
                  id="default-pwd" 
                  checked={useDefaultPassword} 
                  onCheckedChange={setUseDefaultPassword}
                />
                <Label htmlFor="default-pwd" className="text-[10px] font-black uppercase cursor-pointer">
                  Password Default
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href="/templates/template_tambah_siswa.xlsx" 
                  download="template_tambah_siswa.xlsx"
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-xl font-bold h-10 px-4 gap-2 border-2 border-dashed"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Template</span>
                  </Button>
                </a>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowPasteArea(!showPasteArea)}
                  className={cn(
                    "rounded-xl font-bold h-10 px-4 gap-2 transition-all",
                    showPasteArea ? "bg-primary text-primary-foreground border-primary" : "border-2"
                  )}
                >
                  <MultiplePages className="w-4 h-4" />
                  {showPasteArea ? "Batal" : "Paste Excel"}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showPasteArea ? (
            <div className="p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-widest mb-2">Petunjuk Paste</p>
                <p className="text-sm text-amber-600 dark:text-amber-500 font-medium">
                  Copy kolom <span className="font-bold">Nama</span> dan <span className="font-bold">Username</span> dari Excel, lalu paste di bawah.
                  Username hanya boleh huruf dan angka.
                </p>
              </div>
              <textarea 
                placeholder="Budi Santoso	budi123&#10;Ani Wijaya	ani99"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full min-h-[200px] font-mono text-sm rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 p-4 focus:outline-none focus:border-primary transition-all"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowPasteArea(false)} className="rounded-xl font-bold">Batal</Button>
                <Button onClick={handlePaste} disabled={!rawText.trim()} className="rounded-xl font-bold px-8">Proses Data</Button>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                  <TableRow className="border-b hover:bg-transparent">
                    <TableHead className="w-[50px] text-center font-black uppercase text-[10px]">#</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Nama Lengkap</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Username (Login)</TableHead>
                    {!useDefaultPassword && (
                      <TableHead className="font-black uppercase text-[10px]">Password</TableHead>
                    )}
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={index} className="hover:bg-transparent border-b last:border-0 group">
                      <TableCell className="text-center font-bold text-zinc-400 text-xs">
                        {index + 1}
                      </TableCell>
                      <TableCell className="py-3">
                        <Input 
                          placeholder="Contoh: Budi Santoso"
                          value={student.name}
                          onChange={(e) => handleUpdateStudent(index, "name", e.target.value)}
                          className="h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent focus-visible:ring-1 font-bold text-sm"
                        />
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative">
                          <Input 
                            placeholder="username123"
                            value={student.username}
                            onChange={(e) => handleUpdateStudent(index, "username", e.target.value)}
                            className="h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent focus-visible:ring-1 font-mono text-sm pr-16"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400 uppercase">@siswa.kg</span>
                        </div>
                      </TableCell>
                      {!useDefaultPassword && (
                        <TableCell className="py-3">
                          <Input 
                            placeholder="Custom Password"
                            value={student.password}
                            onChange={(e) => handleUpdateStudent(index, "password", e.target.value)}
                            className="h-10 rounded-xl border-zinc-200 dark:border-zinc-800 bg-transparent focus-visible:ring-1 font-mono text-sm"
                          />
                        </TableCell>
                      )}
                      <TableCell className="py-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveRow(index)}
                          className="h-10 w-10 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 bg-zinc-50/30 dark:bg-zinc-900/10 flex items-center justify-between border-t">
                <Button 
                  variant="outline" 
                  onClick={handleAddRow}
                  className="rounded-xl font-bold h-10 border-2 hover:bg-white dark:hover:bg-zinc-900"
                >
                  <Plus className="w-4 h-4 mr-2" /> Tambah Baris
                </Button>
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:block">
                    {students.length} baris tersedia
                  </p>
                  <Button 
                    disabled={isPending} 
                    onClick={handleImport}
                    className="rounded-xl h-11 px-8 font-black shadow-lg shadow-primary/20 uppercase tracking-tight"
                  >
                    {isPending ? <Infinite className="animate-spin mr-2 h-4 w-4" /> : <Database className="w-4 h-4 mr-2" />}
                    Daftarkan Siswa
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {!showPasteArea && (
        <div className="flex items-center gap-2 px-2 text-zinc-400">
          <Database className="w-3.5 h-3.5" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            Siswa yang didaftarkan akan otomatis bergabung ke kelas dengan kode <span className="text-primary">{classCode}</span>
          </p>
        </div>
      )}
    </div>
  );
}
