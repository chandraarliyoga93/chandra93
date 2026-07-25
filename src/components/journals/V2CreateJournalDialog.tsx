"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Plus, 
  Journal as JournalIcon, 
  NavArrowRight, 
  Calendar as CalendarIcon,
  NavArrowDown
} from "iconoir-react";
import { createJournalSupabase } from "@/actions/journals-supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

const journalSchema = z.object({
  classId: z.string().min(1, "Pilih kelas"),
  topic: z.string().min(3, "Topik minimal 3 karakter"),
  activities: z.string().min(5, "Ringkasan aktivitas minimal 5 karakter"),
  incidents: z.string().optional(),
  mood: z.string().min(1, "Pilih mood"),
  date: z.date(),
});

type JournalFormValues = z.infer<typeof journalSchema>;

interface V2CreateJournalDialogProps {
  classes: { id: string; name: string }[];
}

const MOODS = [
  { value: "😊", label: "Senang" },
  { value: "😐", label: "Biasa" },
  { value: "😔", label: "Sedih" },
  { value: "😠", label: "Kesal" },
  { value: "😴", label: "Mengantuk" },
];

export function V2CreateJournalDialog({ classes }: V2CreateJournalDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<JournalFormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      classId: "",
      topic: "",
      activities: "",
      incidents: "",
      mood: "😊",
      date: new Date(),
    },
  });

  async function onSubmit(values: JournalFormValues) {
    setIsPending(true);
    try {
      const result = await createJournalSupabase(values);
      if (result.success) {
        toast.success("Berhasil disimpan");
        setOpen(false);
        form.reset();
      } else {
        toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menyimpan jurnal" });
      }
    } catch {
      toast.error("Terjadi Kesalahan", { description: "Terjadi kesalahan sistem" });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title="Buat Jurnal Baru"
      description="Dokumentasikan sesi pembelajaran Anda hari ini dengan rapi."
      headerContent={
        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
          <JournalIcon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </div>
      }
      trigger={
        <Button className="rounded-full gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900">
          <Plus className="w-4 h-4" />
          Buat Jurnal Baru
        </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-zinc-700 dark:text-zinc-300">Tanggal Jurnal</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "h-11 justify-start text-left font-normal rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-zinc-400" />
                        <span className="flex-1 font-medium text-sm">
                          {field.value ? (
                            format(field.value, "dd MMMM yyyy", { locale: idLocale })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                        </span>
                        <NavArrowDown className="ml-2 h-4 w-4 text-zinc-400" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-[1.5rem] border-zinc-200 dark:border-zinc-800 shadow-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      locale={idLocale}
                      className="rounded-[1.5rem]"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">Kelas</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5">
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="rounded-lg">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-700 dark:text-zinc-300">Topik Materi</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Contoh: Aljabar Linear" 
                      className="rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="activities"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">Ringkasan Aktivitas</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Apa saja yang dilakukan di kelas?" 
                    className="rounded-xl min-h-[100px] border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="incidents"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-700 dark:text-zinc-300">Catatan Khusus (Opsional)</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Ada kejadian luar biasa atau catatan khusus?" 
                    className="rounded-xl min-h-[80px] border-zinc-200 dark:border-zinc-800 focus:ring-zinc-900/5 dark:focus:ring-zinc-100/5 resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-zinc-700 dark:text-zinc-300 text-center block">Mood Kelas</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex justify-center gap-3"
                  >
                    {MOODS.map((m) => (
                      <FormItem key={m.value} className="flex flex-col items-center space-y-1">
                        <FormControl>
                          <RadioGroupItem
                            value={m.value}
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel 
                          className={cn(
                            "w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl cursor-pointer transition-all duration-200",
                            field.value === m.value 
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-lg shadow-zinc-900/20 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 dark:shadow-zinc-100/10" 
                              : "bg-zinc-50 border-zinc-200 hover:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-600"
                          )}
                        >
                          {m.value}
                        </FormLabel>
                        <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">{m.label}</span>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full rounded-xl py-6 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 gap-2 font-medium"
          >
            {isPending ? "Menyimpan..." : "Simpan Jurnal"}
            {!isPending && <NavArrowRight className="w-4 h-4" />}
          </Button>
        </form>
      </Form>
    </ResponsiveModal>
  );
}
