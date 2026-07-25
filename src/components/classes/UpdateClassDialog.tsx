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
} from "@/components/ui/dialog";
import { 
  Form, 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EditPencil, NavArrowRight } from "iconoir-react";
import { updateClassSupabase as updateClass, ClassData } from "@/actions/classes-supabase";
import { toast } from "sonner";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";

const classFormSchema = z.object({
  name: z.string().min(3, "Nama kelas minimal 3 karakter"),
  description: z.string().optional(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface UpdateClassDialogProps {
  classData: ClassData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateClassDialog({ 
  classData, 
  open, 
  onOpenChange 
}: UpdateClassDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: classData.name,
      description: classData.description || "",
    },
  });

  async function onSubmit(values: ClassFormValues) {
    setIsPending(true);
    try {
      const result = await updateClass(classData.id, values);
      if (result.success) {
        toast.success("Berhasil disimpan");
        onOpenChange(false);
      } else {
        toast.error("Terjadi Kesalahan", { description: result.error || "Gagal memperbarui kelas" });
      }
    } catch (_error) {
      toast.error("Terjadi Kesalahan", { description: "Terjadi kesalahan sistem" });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-[1.5rem] border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
            <EditPencil className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">Edit Detail Kelas</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Perbarui nama atau deskripsi kelas Anda.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <FormInput
              control={form.control}
              name="name"
              label="Nama Kelas"
              placeholder="Contoh: Matematika Dasar"
              disabled={isPending}
            />
            <FormTextarea
              control={form.control}
              name="description"
              label="Deskripsi (Opsional)"
              placeholder="Berikan gambaran singkat tentang kelas ini..."
              disabled={isPending}
            />

            <Button 
              type="submit" 
              disabled={isPending} 
              className="w-full rounded-xl py-6 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 gap-2 font-medium"
            >
              {isPending ? "Memuat..." : "Simpan Perubahan"}
              {!isPending && <NavArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
