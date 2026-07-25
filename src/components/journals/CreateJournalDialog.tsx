"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
import { Plus, Journal, Infinite } from "iconoir-react";
import { createJournalSupabase as createJournal } from "@/actions/journals-supabase";
import { ClassData } from "@/actions/classes-supabase";
import { toast } from "sonner";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";

const journalSchema = z.object({
  classId: z.string().min(1, "Pilih kelas"),
  topic: z.string().min(3, "Topik minimal 3 karakter"),
  activities: z.string().min(5, "Ringkasan aktivitas minimal 5 karakter"),
  incidents: z.string().optional(),
  mood: z.string().min(1, "Pilih mood"),
});

type JournalFormValues = z.infer<typeof journalSchema>;

interface CreateJournalDialogProps {
  classes: ClassData[];
}

const MOODS = [
  { value: "😊", label: "Senang" },
  { value: "⚡", label: "Aktif" },
  { value: "😴", label: "Mengantuk" },
  { value: "😤", label: "Sulit" },
];

export function CreateJournalDialog({ classes }: CreateJournalDialogProps) {
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
    },
  });

  async function onSubmit(values: JournalFormValues) {
    setIsPending(true);
    try {
      const result = await createJournal(values);
      if (result.success) {
        toast.success("Berhasil disimpan");
        setOpen(false);
        form.reset();
      } else {
        toast.error("Terjadi Kesalahan", { description: result.error || "Gagal menyimpan jurnal" });
      }
    } catch (error) {
      toast.error("Terjadi Kesalahan", { description: "Terjadi kesalahan sistem" });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Tulis Jurnal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Buat Jurnal Mengajar</DialogTitle>
          <DialogDescription>
            Dokumentasikan sesi pembelajaran Anda hari ini.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="classId"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Pilih Kelas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormInput
                control={form.control}
                name="topic"
                label="Topik/Materi"
                placeholder="Judul materi..."
              />
            </div>

            <FormTextarea
              control={form.control}
              name="activities"
              label="Ringkasan Aktivitas"
              placeholder="Apa saja yang dilakukan di kelas?"
            />

            <FormTextarea
              control={form.control}
              name="incidents"
              label="Kejadian Penting (Opsional)"
              placeholder="Ada kejadian luar biasa atau catatan khusus?"
            />

            <FormField
              control={form.control}
              name="mood"
              render={({ field }: { field: any }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-center block">Mood Kelas</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex justify-center gap-4"
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
                            className={`
                              w-12 h-12 rounded-full border flex items-center justify-center text-2xl cursor-pointer transition-all
                              ${field.value === m.value 
                                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                : "bg-background hover:bg-muted border-input"}
                            `}
                          >
                            {m.value}
                          </FormLabel>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">{m.label}</span>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <Infinite className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Jurnal"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
