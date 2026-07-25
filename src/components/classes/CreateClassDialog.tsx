"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PlusCircle, Infinite } from "iconoir-react";
import { createClassSupabase as createClassManual } from "@/actions/classes-supabase";
import { toast } from "sonner";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";

const classFormSchema = z.object({
  name: z.string().min(3, "Nama kelas minimal 3 karakter"),
  description: z.string().optional(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

export function CreateClassDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (values: ClassFormValues) => {
    startTransition(async () => {
      const result = await createClassManual(values);
      if (result.success) {
        toast.success("Berhasil disimpan");
        setOpen(false);
        form.reset();
      } else {
        toast.error("Terjadi Kesalahan", { description: result.error || "Gagal membuat kelas" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Buat Kelas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Kelas Baru</DialogTitle>
          <DialogDescription>
            Isi detail kelas di bawah ini. Kode kelas unik akan dibuat secara otomatis.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
              label="Deskripsi"
              placeholder="Deskripsi singkat tentang kelas..."
              disabled={isPending}
            />
            
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending ? (
                  <>
                    <Infinite className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Buat Kelas"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
