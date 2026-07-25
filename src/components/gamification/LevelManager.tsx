"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Settings, 
  Plus, 
  Trash, 
  Check, 
  Refresh 
} from "iconoir-react";
import { LevelConfig, updateLevelConfigSupabase as updateLevelConfig, getLevelConfigSupabase as getLevelConfig } from "@/actions/gamification-supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const levelSchema = z.object({
  levels: z.array(z.object({
    rank: z.number(),
    name: z.string().min(1, "Nama level wajib diisi"),
    minXp: z.number().min(0, "Minimal XP tidak boleh negatif"),
  })).min(1, "Minimal harus ada satu level"),
});

type LevelFormValues = z.infer<typeof levelSchema>;

export function LevelManager({ initialLevels }: { initialLevels?: LevelConfig[] }) {
  const [loading, setLoading] = useState(!initialLevels);
  const [saving, setSaving] = useState(false);

  const form = useForm<LevelFormValues>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      levels: initialLevels || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "levels",
  });

  useEffect(() => {
    if (initialLevels) {
      form.reset({ levels: initialLevels });
      setLoading(false);
      return;
    }

    async function loadConfig() {
      try {
        const data = await getLevelConfig();
        form.reset({ levels: data });
      } catch (error) {
        toast.error("Gagal memuat data level");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [form, initialLevels]);

  async function onSubmit(data: LevelFormValues) {
    setSaving(true);
    try {
      // Sort levels by minXp and re-assign ranks
      const sortedLevels = [...data.levels]
        .sort((a, b) => a.minXp - b.minXp)
        .map((l, i) => ({ ...l, rank: i + 1 }));

      const result = await updateLevelConfig(sortedLevels);
      
      if (result.success) {
        toast.success("Konfigurasi level berhasil diperbarui");
        form.reset({ levels: sortedLevels });
      } else {
        toast.error(result.error || "Gagal memperbarui level");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  }

  const addNewLevel = () => {
    const lastLevel = fields.length > 0 ? fields[fields.length - 1] : null;
    const nextRank = fields.length + 1;
    const nextMinXp = lastLevel ? lastLevel.minXp + 500 : 0;
    
    append({
      rank: nextRank,
      name: `Level ${nextRank}`,
      minXp: nextMinXp,
    });
  };

  if (loading) {
    return (
      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0 flex justify-center py-20">
          <Refresh className="w-8 h-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-muted/40 shadow-sm transition-all hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Pengaturan Level</CardTitle>
              <CardDescription className="text-sm">
                Tentukan hierarki level dan ambang batas XP siswa.
              </CardDescription>
            </div>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addNewLevel}
            className="h-10 px-4 gap-2 bg-background border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/40 transition-all rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Tambah Level
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent border-muted/30">
                    <TableHead className="w-[80px] font-bold text-foreground">Rank</TableHead>
                    <TableHead className="min-w-[200px] font-bold text-foreground">Nama Level</TableHead>
                    <TableHead className="min-w-[150px] font-bold text-foreground">Minimal XP</TableHead>
                    <TableHead className="w-[80px] text-right px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {fields.map((field, index) => (
                      <motion.tr
                        key={field.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className="group border-muted/20 transition-colors hover:bg-muted/10"
                      >
                        <TableCell className="font-medium text-center bg-muted/5 group-hover:bg-primary/5 transition-colors">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-background border border-muted/50 text-sm shadow-sm">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`levels.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    placeholder="Contoh: Pionir" 
                                    className="border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30 h-10 px-0 hover:bg-muted/50 rounded-none transition-all px-3"
                                  />
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`levels.${index}.minXp`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      className="border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/30 h-10 pr-10 hover:bg-muted/50 rounded-none transition-all px-3"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider pointer-events-none">XP</span>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-[10px]" />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                            disabled={fields.length <= 1}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {fields.length === 0 && !loading && (
              <div className="p-12 text-center text-muted-foreground">
                <p>Belum ada level yang dikonfigurasi.</p>
                <Button variant="outline" size="sm" onClick={addNewLevel} className="mt-4">
                  Tambah Level Pertama
                </Button>
              </div>
            )}
            
            <CardFooter className="flex justify-between items-center bg-muted/10 border-t py-4">
              <p className="text-xs text-muted-foreground italic">
                Saran: Urutkan level berdasarkan XP terendah ke tertinggi.
              </p>
              <Button 
                type="submit" 
                disabled={saving || !form.formState.isDirty} 
                className="gap-2 px-8 min-w-[140px] shadow-lg shadow-primary/20"
              >
                {saving ? (
                  <>
                    <Refresh className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
