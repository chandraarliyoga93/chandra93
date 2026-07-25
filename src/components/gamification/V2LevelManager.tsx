"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  Refresh,
  NavArrowRight
} from "iconoir-react";
import { LevelConfig, updateLevelConfigSupabase as updateLevelConfig, getLevelConfigSupabase as getLevelConfig } from "@/actions/gamification-supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const levelSchema = z.object({
  levels: z.array(z.object({
    rank: z.number(),
    name: z.string().min(1, "Nama level wajib diisi"),
    minXp: z.number().min(0, "Minimal XP tidak boleh negatif"),
  })).min(1, "Minimal harus ada satu level"),
});

type LevelFormValues = z.infer<typeof levelSchema>;

export function V2LevelManager({ initialLevels }: { initialLevels?: LevelConfig[] }) {
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
      <div className="flex justify-center py-20">
        <Refresh className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <Settings className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Konfigurasi Level</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Atur hierarki level dan ambang batas XP siswa.</p>
          </div>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={addNewLevel}
          className="rounded-full gap-2 border-zinc-200 dark:border-zinc-800"
        >
          <Plus className="w-4 h-4" />
          Tambah Level
        </Button>
      </div>

      <div className="rounded-[2rem] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                  <TableHead className="w-[100px] text-zinc-500 font-bold uppercase tracking-wider text-[10px] text-center">Rank</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Nama Level</TableHead>
                  <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Ambang Batas XP</TableHead>
                  <TableHead className="w-[100px] text-right px-6 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id} className="border-zinc-100 dark:border-zinc-900 group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                    <TableCell className="text-center">
                      <div className="inline-flex w-8 h-8 rounded-full items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-sm font-bold text-zinc-500">
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
                                placeholder="Nama Level" 
                                className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-medium h-12 px-0 text-zinc-900 dark:text-zinc-100"
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
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 font-bold tabular-nums h-12 px-0 w-24 text-zinc-900 dark:text-zinc-100"
                                />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">XP</span>
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
                        className="h-9 w-9 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        disabled={fields.length <= 1}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="p-6 bg-zinc-50/50 dark:bg-zinc-900/20 border-t border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-zinc-400 font-medium">
                * Level akan otomatis diurutkan berdasarkan XP terendah.
              </p>
              <Button 
                type="submit" 
                disabled={saving || !form.formState.isDirty} 
                className="rounded-full px-8 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 gap-2"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
                {!saving && <Check className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
