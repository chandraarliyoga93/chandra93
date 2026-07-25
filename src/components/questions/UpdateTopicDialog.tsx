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
import { updateTopicSupabase } from "@/actions/questions-supabase";
import { toast } from "sonner";
import { FormInput } from "@/components/forms/FormInput";

const topicFormSchema = z.object({
  name: z.string().min(3, "Nama topik minimal 3 karakter"),
});

type TopicFormValues = z.infer<typeof topicFormSchema>;

interface UpdateTopicDialogProps {
  topic: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateTopicDialog({ 
  topic, 
  open, 
  onOpenChange 
}: UpdateTopicDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      name: topic.name,
    },
  });

  async function onSubmit(values: TopicFormValues) {
    setIsPending(true);
    try {
      const result = await updateTopicSupabase(topic.id, values.name);
      if (result.success) {
        toast.success("Berhasil disimpan");
        onOpenChange(false);
      } else {
        toast.error("Terjadi Kesalahan", { description: result.error || "Gagal memperbarui topik" });
      }
    } catch (error) {
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
          <DialogTitle className="text-xl font-semibold tracking-tight">Edit Nama Topik</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Perubahan ini akan memperbarui topik pada semua soal yang terkait.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <FormInput
              control={form.control}
              name="name"
              label="Nama Topik"
              placeholder="Contoh: Matematika Dasar"
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
