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
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { NavArrowRight, PageEdit, Plus } from "iconoir-react";
import { savePassageSupabase as savePassage } from "@/actions/passages-supabase";
import { toast } from "sonner";
import { FormInput } from "@/components/forms/FormInput";
import { FormTextarea } from "@/components/forms/FormTextarea";
import { Passage } from "@/types/exam";
import { MathRenderer } from "@/components/ui/math-renderer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const passageFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Judul bacaan wajib diisi"),
  content: z.string().min(1, "Konten bacaan wajib diisi"),
  imageUrl: z.string().optional().nullable(),
});

type PassageFormValues = z.infer<typeof passageFormSchema>;

interface CreatePassageDialogProps {
  initialData?: Passage;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreatePassageDialog({ 
  initialData, 
  onSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: CreatePassageDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setInternalOpen;
  const [isPending, setIsPending] = useState(false);

  const form = useForm<PassageFormValues>({
    resolver: zodResolver(passageFormSchema),
    defaultValues: {
      id: initialData?.id,
      title: initialData?.title || "",
      content: initialData?.content || "",
      imageUrl: initialData?.imageUrl || "",
    },
  });

  async function onSubmit(values: PassageFormValues) {
    setIsPending(true);
    try {
      const result = await savePassage(values);
      if (result.success) {
        toast.success(initialData ? "Bacaan diperbarui" : "Bacaan ditambahkan");
        setOpen(false);
        if (!initialData) form.reset();
        onSuccess?.();
      } else {
        toast.error("Gagal menyimpan", { description: result.error });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Bacaan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] rounded-[1.5rem] border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-4">
            <PageEdit className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {initialData ? "Edit Bacaan" : "Buat Bacaan Baru"}
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Bacaan ini dapat digunakan kembali pada soal-soal di bank soal.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <div className="space-y-4">
              <FormInput
                control={form.control}
                name="title"
                label="Judul Bacaan"
                placeholder="Contoh: Teks Proklamasi"
                disabled={isPending}
              />

              <Tabs defaultValue="edit" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                  <TabsTrigger value="edit" className="rounded-lg font-bold text-xs">Edit Konten</TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-lg font-bold text-xs">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="pt-4">
                  <FormTextarea
                    control={form.control}
                    name="content"
                    label="Isi Bacaan"
                    placeholder="Masukkan konten bacaan di sini..."
                    disabled={isPending}
                  />
                </TabsContent>
                <TabsContent value="preview" className="pt-4">
                  <div className="min-h-[150px] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-y-auto">
                    {form.watch("content") ? (
                      <MathRenderer text={form.watch("content")} className="text-sm leading-relaxed" />
                    ) : (
                      <p className="text-zinc-500 italic text-sm">Belum ada konten untuk ditampilkan.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <FormInput
                control={form.control}
                name="imageUrl"
                label="URL Gambar (Opsional)"
                placeholder="https://..."
                disabled={isPending}
              />
            </div>

            <Button 
              type="submit" 
              disabled={isPending} 
              className="w-full rounded-xl py-6 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 gap-2 font-medium"
            >
              {isPending ? "Memuat..." : initialData ? "Simpan Perubahan" : "Buat Bacaan"}
              {!isPending && <NavArrowRight className="w-4 h-4" />}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
