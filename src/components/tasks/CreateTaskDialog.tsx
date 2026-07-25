"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PlusCircle, Infinite, Trophy, Medal } from "iconoir-react";
import { createTask, updateTask, Task } from "@/actions/tasks-supabase";
import { getBadgesSupabase as getBadges, BadgePreset } from "@/actions/gamification-supabase";
import { toast } from "sonner";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";

const taskFormSchema = z.object({
  title: z.string().min(3, "Judul tugas minimal 3 karakter"),
  description: z.string().min(5, "Deskripsi minimal 5 karakter"),
  rewards: z.object({
    xp: z.number().min(0, "XP minimal 0"),
    badgeId: z.string().optional(),
  }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export function CreateTaskDialog({ 
  classId, 
  initialData,
  trigger,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: { 
  classId: string;
  initialData?: Task;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;
  
  const [badges, setBadges] = useState<BadgePreset[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isEditing = !!initialData;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    values: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      rewards: {
        xp: initialData?.rewards?.xp || 50,
        badgeId: initialData?.rewards?.badgeId || "none",
      },
    },
  });

  useEffect(() => {
    if (open) {
      getBadges().then((data) => setBadges(data as any));
    }
  }, [open]);

  const onSubmit = (values: TaskFormValues) => {
    const formattedValues = {
      ...values,
      rewards: {
        ...values.rewards,
        badgeId: values.rewards.badgeId === "none" ? undefined : values.rewards.badgeId
      }
    };

    startTransition(async () => {
      const result = isEditing 
        ? await updateTask(initialData.id, formattedValues)
        : await createTask(classId, formattedValues);

      if (result.success) {
        toast.success(isEditing ? "Tugas diperbarui!" : "Tugas berhasil dibuat!");
        setOpen(false);
        if (!isEditing) form.reset();
        router.refresh();
      } else {
        toast.error(result.error || "Gagal menyimpan tugas");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Buat Tugas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tugas" : "Buat Tugas Baru"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Perbarui detail tugas dan sistem hadiah." : "Buat tugas baru untuk siswa di kelas ini."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <div className="space-y-4">
              <FormInput
                control={form.control as any}
                name="title"
                label="Judul Tugas"
                placeholder="Contoh: PR Matematika Aljabar"
                disabled={isPending}
              />
              <FormTextarea
                control={form.control as any}
                name="description"
                label="Deskripsi"
                placeholder="Jelaskan instruksi tugas di sini..."
                disabled={isPending}
              />
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border space-y-4">
              <div className="flex items-center gap-2 text-zinc-500">
                <Trophy className="w-4 h-4" />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Sistem Hadiah</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  control={form.control as any}
                  name="rewards.xp"
                  label="XP Reward"
                  type="number"
                  placeholder="50"
                  disabled={isPending}
                />

                <FormField
                  control={form.control as any}
                  name="rewards.badgeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus Badge</FormLabel>
                      <Select 
                        disabled={isPending} 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-zinc-950">
                            <SelectValue placeholder="Pilih Badge" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none" className="text-zinc-400 italic">Tanpa Badge</SelectItem>
                          {badges.map(badge => (
                            <SelectItem key={badge.id} value={badge.id}>
                              <span className="flex items-center gap-2">
                                <span>{badge.emoji}</span>
                                <span>{badge.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-[10px] text-zinc-400 italic">
                * Hadiah diberikan otomatis saat nilai pertama kali diinput atau saat nilai meningkat.
              </p>
            </div>
            
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Infinite className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  isEditing ? "Simpan Perubahan" : "Buat Tugas"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
