"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form";
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
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Infinite, Trash, PlusCircle, MediaImage as ImageIcon, Book as PassageIcon, Page as NewPageIcon } from "iconoir-react";
import { saveQuestionSupabase, getQuestionTopicsSupabase } from "@/actions/questions-supabase";
import { addQuestionToExamSupabase } from "@/actions/exam-supabase";
import { getPassagesSupabase, savePassageSupabase } from "@/actions/passages-supabase";
import { Passage } from "@/types/exam";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TopicSelector } from "./TopicSelector";
import { PassageSelector } from "./PassageSelector";
import { LatexPicker } from "./LatexPicker";
import { MathRenderer } from "@/components/ui/math-renderer";
import { QuestionLivePreview } from "./QuestionLivePreview";


const optionSchema = z.object({
  id: z.string(),
  text: z.string(),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
});

const pairSchema = z.object({
  id: z.string(),
  left: z.string(),
  right: z.string(),
});

const matrixRowSchema = z.object({
  id: z.string(),
  text: z.string(),
});

const matrixColumnSchema = z.object({
  id: z.string(),
  text: z.string(),
});

const essayKeywordSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Kata kunci tidak boleh kosong"),
  weight: z.number().min(0.1, "Bobot minimal 0.1"),
  type: z.enum(["required", "bonus"]),
});

const questionFormSchema = z.object({
  topicId: z.string().min(1, "Topik wajib diisi"),
  type: z.enum([
    "pg",
    "pg_kompleks",
    "bs",
    "menjodohkan",
    "mengurutkan",
    "essay",
    "matrix",
    "short_answer",
  ]),
  passageId: z.string().nullable().optional(),
  isNewPassage: z.boolean(),
  draftPassageTitle: z.string().optional().or(z.literal("")),
  draftPassageContent: z.string().optional().or(z.literal("")),
  draftPassageImageUrl: z.string().optional().nullable().or(z.literal("")),
  text: z.string().min(5, "Pertanyaan minimal 5 karakter"),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  options: z.array(optionSchema).optional(),
  pairs: z.array(pairSchema).optional(),
  rows: z.array(matrixRowSchema).optional(),
  columns: z.array(matrixColumnSchema).optional(),
  answer: z.any(),
  explanation: z.string().optional(),
  // Bobot soal umum (digunakan semua tipe)
  maxPoints: z
    .number()
    .min(0.5, "Bobot minimal 0.5")
    .max(100, "Bobot maksimal 100")
    .default(1),
  // Konfigurasi isian singkat
  shortAnswerConfig: z
    .object({
      acceptableAnswers: z.array(z.string()).default([]),
    })
    .optional(),
  // Konfigurasi essay berbasis kata kunci
  essayConfig: z
    .object({
      maxPoints: z
        .number()
        .min(0.5, "Bobot essay minimal 0.5")
        .max(100, "Bobot essay maksimal 100"),
      keywords: z.array(essayKeywordSchema).default([]),
    })
    .optional(),
}).superRefine((data, ctx) => {
  // Validate new passage fields if isNewPassage is true
  if (data.isNewPassage) {
    if (!data.draftPassageTitle?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Judul wacana wajib diisi",
        path: ["draftPassageTitle"],
      });
    }
    if (!data.draftPassageContent?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Konten wacana wajib diisi",
        path: ["draftPassageContent"],
      });
    }
  }

  // 1. Validate options ONLY for PG types and Mengurutkan
  if (data.type === 'pg' || data.type === 'pg_kompleks' || data.type === 'mengurutkan') {
    if (!data.options || data.options.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimal harus ada 2 opsi/item",
        path: ["options"],
      });
    } else {
      data.options.forEach((opt, index) => {
        if (!opt.text || opt.text.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field ${index + 1} tidak boleh kosong`,
            path: ["options", index, "text"],
          });
        }
      });
    }
  }

  // 2. Validate pairs ONLY for Menjodohkan
  if (data.type === 'menjodohkan') {
    if (!data.pairs || data.pairs.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimal harus ada 1 pasangan",
        path: ["pairs"],
      });
    } else {
      data.pairs.forEach((pair, index) => {
        if (!pair.left?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Kolom kiri harus diisi",
            path: ["pairs", index, "left"],
          });
        }
        if (!pair.right?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Kolom kanan harus diisi",
            path: ["pairs", index, "right"],
          });
        }
      });

      // Check for duplicate right-side items
      const rightItems = data.pairs.map(p => p.right?.trim()).filter(Boolean);
      const uniqueRightItems = new Set(rightItems);
      if (rightItems.length !== uniqueRightItems.size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Jawaban (kolom kanan) harus unik/berbeda satu sama lain",
          path: ["pairs"],
        });
      }
    }
  }

  // 3. Validate Matrix
  if (data.type === 'matrix') {
    if (!data.rows || data.rows.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimal harus ada 1 baris",
        path: ["rows"],
      });
    } else {
      data.rows.forEach((row, index) => {
        if (!row.text?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Teks baris harus diisi",
            path: ["rows", index, "text"],
          });
        }
      });
    }

    if (!data.columns || data.columns.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Minimal harus ada 2 kolom",
        path: ["columns"],
      });
    } else {
      data.columns.forEach((col, index) => {
        if (!col.text?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Teks kolom harus diisi",
            path: ["columns", index, "text"],
          });
        }
      });
    }

    // Ensure all rows have an answer selected
    const answer = data.answer as Record<string, string>;
    data.rows?.forEach(row => {
      if (!answer?.[row.id]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Pilih jawaban untuk baris ini`,
          path: ["answer", row.id],
        });
      }
    });
  }

  // 4. Validate answer based on type
  if (data.type === 'pg' && !data.answer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pilih satu jawaban benar",
      path: ["answer"],
    });
  }
  
  if (data.type === 'pg_kompleks') {
    if (!Array.isArray(data.answer) || data.answer.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pilih minimal satu jawaban benar",
        path: ["answer"],
      });
    }
  }

  if (data.type === "essay") {
    // Essay wajib punya minimal satu kata kunci atau fallback ke answer lama
    if (!data.essayConfig || data.essayConfig.keywords.length === 0) {
      if (!data.answer || (typeof data.answer === "string" && data.answer.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Isi minimal satu kata kunci atau kunci jawaban essay",
          path: ["answer"],
        });
      }
    }
  }
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface CreateQuestionDialogProps {
  initialTopic?: string;
  initialData?: any;
  examId?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateQuestionDialog({ 
  initialTopic = "", 
  initialData,
  examId,
  trigger,
  onSuccess
}: CreateQuestionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [existingTopics, setExistingTopics] = useState<string[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);

  // Fetch topics and passages for the dropdown
  useEffect(() => {
    if (open) {
      getQuestionTopicsSupabase({ pageSize: 1000 }).then((result: any) => {
        if (result.data) {
          setExistingTopics(result.data.map((t: any) => t.name));
        }
      });
      getPassagesSupabase().then((result: any) => {
        if (result.data) {
          setPassages(result.data);
        }
      });
    }
  }, [open]);

  const isEditing = !!initialData;
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const getEditingDefaults = useCallback((data: any) => {
    const defaultOptions = [
      { id: "opt-1", text: "", imageUrl: "" },
      { id: "opt-2", text: "", imageUrl: "" },
      { id: "opt-3", text: "", imageUrl: "" },
      { id: "opt-4", text: "", imageUrl: "" },
    ];
    const optMap = (opt: any) => ({ id: opt.id, text: opt.text, imageUrl: opt.imageUrl || "" });
    let options = data.options?.map(optMap) || defaultOptions;
    if (data.type === "mengurutkan" && Array.isArray(data.answer) && data.options?.length) {
      options = (data.answer as string[])
        .map(id => data.options.find((o: any) => o.id === id))
        .filter(Boolean)
        .map(optMap);
    }
    let shortAnswerCfg = data.shortAnswerConfig || { acceptableAnswers: [] };
    if (data.type === "short_answer" && (!shortAnswerCfg.acceptableAnswers?.length) && data.answer) {
      const ans = typeof data.answer === "string" ? [data.answer] : Array.isArray(data.answer) ? data.answer : [];
      shortAnswerCfg = { acceptableAnswers: ans.filter(Boolean) };
    }
    return {
      topicId: data.topicId,
      type: data.type,
      passageId: data.passageId || null,
      isNewPassage: false,
      draftPassageTitle: "",
      draftPassageContent: "",
      draftPassageImageUrl: "",
      text: data.text,
      imageUrl: data.imageUrl || "",
      maxPoints: data.maxPoints ?? 1,
      shortAnswerConfig: shortAnswerCfg,
      essayConfig: data.essayConfig || undefined,
      options,
      pairs: data.pairs || [{ id: "pair-1", left: "", right: "" }],
      rows: data.rows || [{ id: "row-1", text: "" }],
      columns: data.columns || [{ id: "col-1", text: "Benar" }, { id: "col-2", text: "Salah" }],
      answer: data.answer,
      explanation: data.explanation || "",
    };
  }, []);

  const form = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: initialData ? (getEditingDefaults(initialData) as QuestionFormValues) : {
      topicId: initialTopic,
      type: "pg",
      passageId: null,
      isNewPassage: false,
      draftPassageTitle: "",
      draftPassageContent: "",
      draftPassageImageUrl: "",
      text: "",
      imageUrl: "",
      maxPoints: 1,
      shortAnswerConfig: { acceptableAnswers: [] },
      options: [
        { id: "opt-1", text: "", imageUrl: "" },
        { id: "opt-2", text: "", imageUrl: "" },
        { id: "opt-3", text: "", imageUrl: "" },
        { id: "opt-4", text: "", imageUrl: "" },
      ],
      pairs: [
        { id: "pair-1", left: "", right: "" },
      ],
      rows: [
        { id: "row-1", text: "" },
      ],
      columns: [
        { id: "col-1", text: "Benar" },
        { id: "col-2", text: "Salah" },
      ],
      answer: "opt-1",
      explanation: "",
    },
  });

  // Reset form dengan kunci jawaban saat buka dialog edit (defaultValues hanya dipakai saat mount)
  useEffect(() => {
    if (open && initialData) {
      form.reset(getEditingDefaults(initialData));
    }
  }, [open, initialData, form, getEditingDefaults]);

  const onSubmit: SubmitHandler<QuestionFormValues> = async (values) => {
    setIsPending(true);
    try {
      let finalPassageId = values.passageId;

      // Handle new passage drafting
      if (values.isNewPassage && values.draftPassageTitle && values.draftPassageContent) {
        const passageResult = await savePassageSupabase({
          title: values.draftPassageTitle,
          content: values.draftPassageContent,
          imageUrl:
            typeof values.draftPassageImageUrl === "string" &&
            values.draftPassageImageUrl.trim()
              ? values.draftPassageImageUrl.trim()
              : null,
        });

        if (passageResult.success && passageResult.id) {
          finalPassageId = passageResult.id;
        } else {
          toast.error("Gagal menyimpan wacana", { description: passageResult.error });
          setIsPending(false);
          return;
        }
      }

      const finalValues = { 
        ...values,
        passageId: finalPassageId 
      };

      if (values.type === 'mengurutkan') {
        finalValues.answer = values.options?.map(opt => opt.id);
      } else if (values.type === 'menjodohkan') {
        const pairMap: Record<string, string> = {};
        values.pairs?.forEach(p => {
          pairMap[p.id] = p.right;
        });
        finalValues.answer = pairMap;
      }

      // Remove drafting fields from final question data
      const {
        isNewPassage,
        draftPassageTitle,
        draftPassageContent,
        draftPassageImageUrl,
        ...dataToSave
      } = isEditing ? { ...finalValues, id: initialData.id } : finalValues;

      const result = await saveQuestionSupabase(dataToSave as any);
      
      if (result.success) {
        toast.success(isEditing ? "Pertanyaan diperbarui" : "Pertanyaan disimpan");
        // Only add to exam if we are in an exam context
        if (!isEditing && examId && result.id) {
          const questionToExam: any = {
            ...dataToSave,
            id: `q_${result.id}_${Math.random().toString(36).substring(2, 9)}`,
            bankQuestionId: result.id,
          };
          await addQuestionToExamSupabase(examId, questionToExam);
        }
        setOpen(false);
        onSuccess?.();
        if (!isEditing) form.reset();
      } else {
        toast.error("Gagal menyimpan", { description: result.error || "Terjadi kesalahan pada server" });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Terjadi Kesalahan", { description: error instanceof Error ? error.message : "Sistem" });
    } finally {
      setIsPending(false);
    }
  };

  const watchedRows = form.watch("rows") || [];
  const watchedColumns = form.watch("columns") || [];

  const handleInsertLatex = (fieldName: string, latex: string) => {
    const currentValue = form.getValues(fieldName as any) || "";
    
    // Use ref for main question textarea, fallback to getElementById for others
    const textarea = fieldName === "text" 
      ? questionTextareaRef.current 
      : document.getElementById(fieldName) as HTMLTextAreaElement | HTMLInputElement;
    
    if (textarea) {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      
      // Check if we are inside a math block ($...$)
      // Simple heuristic: odd number of dollars before cursor means inside block
      const beforeText = currentValue.substring(0, start);
      const afterText = currentValue.substring(end);
      const dollarCountBefore = (beforeText.match(/\$/g) || []).length;
      const isInsideMath = dollarCountBefore % 2 !== 0;
      
      const toInsert = isInsideMath ? latex : `$${latex}$`;
      const newValue = beforeText + toInsert + afterText;
      
      form.setValue(fieldName as any, newValue, { shouldDirty: true, shouldTouch: true });
      
      // Set cursor after the inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + toInsert.length, start + toInsert.length);
      }, 0);
    } else {
      form.setValue(fieldName as any, currentValue + `$${latex}$`, { shouldDirty: true, shouldTouch: true });
    }
  };

  // keyName prevents useFieldArray from overwriting our custom "id" (opt-1, pair-1, etc.)
  // so answer & formatAnswerForDisplay can use stable option IDs
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "options",
    keyName: "rhfId",
  });

  const { fields: pairFields, append: appendPair, remove: removePair } = useFieldArray({
    control: form.control,
    name: "pairs",
    keyName: "rhfId",
  });

  const { fields: rowFields, append: appendRow, remove: removeRow } = useFieldArray({
    control: form.control,
    name: "rows",
    keyName: "rhfId",
  });

  const { fields: columnFields, append: appendColumn, remove: removeColumn } = useFieldArray({
    control: form.control,
    name: "columns",
    keyName: "rhfId",
  });

  const questionType = form.watch("type");

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, onSubmit]);

  const handleRemoveOption = (index: number) => {
    const optionId = optionFields[index].id;
    const currentAnswer = form.getValues("answer");
    
    // Remove from answer if it's the selected one
    if (questionType === 'pg' && currentAnswer === optionId) {
      form.setValue("answer", "");
    } else if (questionType === 'pg_kompleks' && Array.isArray(currentAnswer)) {
      form.setValue("answer", currentAnswer.filter((id: string) => id !== optionId));
    }
    
    removeOption(index);
  };

  return (

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Soal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-7xl h-[95vh] p-0 overflow-hidden flex flex-col gap-0 border-none sm:rounded-2xl">
        <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight">{isEditing ? "Edit Pertanyaan" : "Buat Pertanyaan Baru"}</DialogTitle>
            <DialogDescription className="text-xs">
              {isEditing ? "Perbarui detail pertanyaan Anda." : "Tambahkan soal baru ke dalam bank soal Anda."}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold uppercase text-[10px]">
              {questionType.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.log("Form Validation Errors:", errors);
              const firstError = Object.values(errors)[0];
              const message = (firstError as any)?.message || "Mohon lengkapi semua field yang wajib diisi";
              toast.error("Terjadi Kesalahan", { description: message });
            })} 
            className="flex-1 flex overflow-hidden relative"
          >
            {/* Left Column: Editor */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-white dark:bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="topicId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">Topik / Bab</FormLabel>
                      <TopicSelector 
                        value={field.value} 
                        onChange={field.onChange} 
                        existingTopics={existingTopics} 
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">Jenis Soal</FormLabel>
                      <Select 
                          onValueChange={(val) => {
                            field.onChange(val);
                            if (val === 'pg_kompleks') form.setValue("answer", []);
                            if (val === 'bs') form.setValue("answer", true);
                            if (val === 'essay') form.setValue("answer", "");
                            if (val === 'matrix') form.setValue("answer", {});
                            if (val === 'short_answer') form.setValue("shortAnswerConfig", { acceptableAnswers: [] });
                          }} 
                          value={field.value}
                          name={field.name}
                        >
                        <FormControl>
                          <SelectTrigger id="question-type-trigger" className="h-11">
                            <SelectValue placeholder="Pilih jenis" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pg">Pilihan Ganda</SelectItem>
                          <SelectItem value="pg_kompleks">PG Kompleks</SelectItem>
                          <SelectItem value="bs">Benar/Salah</SelectItem>
                          <SelectItem value="matrix">Matriks / Tabel</SelectItem>
                          <SelectItem value="menjodohkan">Menjodohkan</SelectItem>
                          <SelectItem value="mengurutkan">Mengurutkan</SelectItem>
                          <SelectItem value="short_answer">Isian Singkat</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Passage Selection Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PassageIcon className="w-4 h-4 text-zinc-500" />
                    <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Wacana / Bacaan Pendukung</Label>
                  </div>
                  <FormField
                    control={form.control}
                    name="isNewPassage"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <Label htmlFor="new-passage-toggle" className="text-[10px] font-bold uppercase text-primary">Buat Baru</Label>
                        <Switch
                          id="new-passage-toggle"
                          checked={field.value}
                          onCheckedChange={(val) => {
                            field.onChange(val);
                            if (val) form.setValue("passageId", null);
                          }}
                        />
                      </div>
                    )}
                  />
                </div>

                {!form.watch("isNewPassage") ? (
                  <FormField
                    control={form.control}
                    name="passageId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <PassageSelector 
                          value={field.value || null} 
                          onChange={field.onChange} 
                          passages={passages} 
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="space-y-4 p-4 rounded-xl border bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <NewPageIcon className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Draft Wacana Baru</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="draftPassageTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input 
                              placeholder="Judul Wacana Baru" 
                              {...field} 
                              className="h-10 bg-white dark:bg-zinc-950"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="draftPassageContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Tuliskan konten wacana di sini..." 
                              {...field} 
                              className="min-h-[100px] bg-white dark:bg-zinc-950 resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="draftPassageImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                            Gambar wacana (URL, opsional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com/gambar-wacana.jpg"
                              {...field}
                              value={field.value ?? ""}
                              className="h-10 bg-white dark:bg-zinc-950"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">Media Pendukung (URL Gambar)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg" 
                          {...field} 
                          value={field.value || ""}
                          className="h-11"
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setImageError(false);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">Teks Pertanyaan</FormLabel>
                        <LatexPicker onPick={(latex) => handleInsertLatex("text", latex)} />
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          id="text"
                          ref={questionTextareaRef}
                          placeholder="Tuliskan teks pertanyaan di sini... Gunakan $ untuk rumus."
                          className="min-h-[120px] text-base leading-relaxed resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Global Scoring Settings */}
              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="maxPoints"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                            Bobot Soal (Poin Maksimal)
                          </FormLabel>
                          <p className="text-[10px] text-zinc-400 font-medium">
                            Digunakan untuk menghitung skor akhir ujian (0–100) relatif terhadap soal lain.
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            className="w-24 h-9 text-sm font-bold text-right"
                            min={0.5}
                            max={100}
                            step={0.5}
                            value={field.value ?? 1}
                            onChange={(e) => field.onChange(parseFloat(e.target.value || "1"))}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Type Specific Dynamic Fields */}
              <div className="space-y-6 pt-4 border-t">
                {questionType === 'pg' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Opsi Jawaban & Kunci</Label>
                      {optionFields.length < 6 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold"
                          onClick={() => appendOption({ id: `opt-${Math.random().toString(36).substring(2, 9)}`, text: "", imageUrl: "" })}
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> TAMBAH OPSI
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {optionFields.map((option, index) => (
                        <div key={(option as { rhfId?: string }).rhfId ?? option.id} className="flex items-start gap-3 p-3 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50">
                          <button 
                            type="button"
                            className={cn(
                              "w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-black transition-all",
                              form.watch("answer") === option.id 
                                ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg shadow-primary/20" 
                                : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-400"
                            )}
                            onClick={() => form.setValue("answer", option.id)}
                          >
                            {String.fromCharCode(65 + index)}
                          </button>
                          <div className="flex-1 space-y-2">
                            <div className="relative group">
                              <Input 
                                id={`options.${index}.text`}
                                placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                                {...form.register(`options.${index}.text` as const)}
                                className="pr-24 border-none bg-transparent focus-visible:ring-0 text-sm p-0 h-8"
                              />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="icon" 
                                      className={cn(
                                        "h-7 w-7",
                                        form.watch(`options.${index}.imageUrl`) ? "text-primary" : "text-zinc-400"
                                      )}
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-4" align="end">
                                    <div className="space-y-3">
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase">URL Gambar Opsi</Label>
                                        <Input 
                                          placeholder="https://..." 
                                          {...form.register(`options.${index}.imageUrl` as const)}
                                          className="h-8 text-xs"
                                        />
                                      </div>
                                      {form.watch(`options.${index}.imageUrl`) && (
                                        <Button 
                                          type="button" 
                                          variant="destructive" 
                                          size="sm" 
                                          className="w-full h-8 text-[10px] font-bold"
                                          onClick={() => form.setValue(`options.${index}.imageUrl`, "")}
                                        >
                                          Hapus Gambar
                                        </Button>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <LatexPicker onPick={(latex) => handleInsertLatex(`options.${index}.text`, latex)} />
                                {optionFields.length > 2 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveOption(index)}
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            {form.formState.errors.options?.[index]?.text && (
                              <p className="text-[10px] text-destructive font-medium">
                                {form.formState.errors.options[index]?.text?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {questionType === 'pg_kompleks' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Opsi Jawaban (Multi-pilih)</Label>
                      {optionFields.length < 6 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold"
                          onClick={() => appendOption({ id: `opt-${Math.random().toString(36).substring(2, 9)}`, text: "", imageUrl: "" })}
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> TAMBAH OPSI
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {optionFields.map((option, index) => {
                        const optId = form.getValues(`options.${index}.id`) ?? option.id;
                        const currentAnswers = Array.isArray(form.watch("answer")) ? form.watch("answer") : [];
                        const isChecked = currentAnswers.includes(optId);
                        
                        return (
                          <div key={(option as { rhfId?: string }).rhfId ?? option.id} className="flex items-start gap-4 p-4 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50">
                            <Checkbox 
                              id={`check-${optId}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const nextAnswers = checked 
                                  ? [...currentAnswers, optId]
                                  : currentAnswers.filter((id: string) => id !== optId);
                                form.setValue("answer", nextAnswers);
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="relative group">
                                <Input 
                                  id={`options.${index}.text`}
                                  placeholder={`Opsi ${String.fromCharCode(65 + index)}`}
                                  {...form.register(`options.${index}.text` as const)}
                                  className="pr-24 border-none bg-transparent focus-visible:ring-0 text-sm p-0 h-8"
                                />
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn(
                                          "h-7 w-7",
                                          form.watch(`options.${index}.imageUrl`) ? "text-primary" : "text-zinc-400"
                                        )}
                                      >
                                        <ImageIcon className="w-4 h-4" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4" align="end">
                                      <div className="space-y-3">
                                        <div className="space-y-1">
                                          <Label className="text-[10px] font-bold uppercase">URL Gambar Opsi</Label>
                                          <Input 
                                            placeholder="https://..." 
                                            {...form.register(`options.${index}.imageUrl` as const)}
                                            className="h-8 text-xs"
                                          />
                                        </div>
                                        {form.watch(`options.${index}.imageUrl`) && (
                                          <Button 
                                            type="button" 
                                            variant="destructive" 
                                            size="sm" 
                                            className="w-full h-8 text-[10px] font-bold"
                                            onClick={() => form.setValue(`options.${index}.imageUrl`, "")}
                                          >
                                            Hapus Gambar
                                          </Button>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <LatexPicker onPick={(latex) => handleInsertLatex(`options.${index}.text`, latex)} />
                                  {optionFields.length > 2 && (
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleRemoveOption(index)}
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {form.formState.errors.options?.[index]?.text && (
                                <p className="text-[10px] text-destructive font-medium">
                                  {form.formState.errors.options[index]?.text?.message}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {questionType === 'menjodohkan' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pasangkan Item</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-[10px] font-bold"
                        onClick={() => appendPair({ id: `pair-${Math.random().toString(36).substring(2, 9)}`, left: "", right: "" })}
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> TAMBAH PASANGAN
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {pairFields.map((field, index) => (
                        <div key={(field as { rhfId?: string }).rhfId ?? field.id} className="space-y-1">
                          <div className="flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 rounded-xl border">
                            <Input 
                              id={`pair-left-${index}`}
                              placeholder="Kiri (Item A)"
                              className="flex-1 h-10 bg-white dark:bg-zinc-950"
                              {...form.register(`pairs.${index}.left` as const)}
                            />
                            <div className="text-zinc-300 font-bold">↔</div>
                            <Input 
                              id={`pair-right-${index}`}
                              placeholder="Kanan (Pasangan A)"
                              className="flex-1 h-10 bg-white dark:bg-zinc-950"
                              {...form.register(`pairs.${index}.right` as const)}
                            />
                            {pairFields.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 text-destructive hover:bg-destructive/10"
                                onClick={() => removePair(index)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          {(form.formState.errors.pairs?.[index]?.left || form.formState.errors.pairs?.[index]?.right) && (
                            <p className="text-[10px] text-destructive font-medium px-1">
                              {form.formState.errors.pairs[index]?.left?.message || form.formState.errors.pairs[index]?.right?.message}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {questionType === 'matrix' && (
                  <div className="space-y-8">
                    {/* Columns Management */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Kolom (Pilihan / Kriteria)</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold"
                          onClick={() => appendColumn({ id: `col-${Math.random().toString(36).substring(2, 9)}`, text: "" })}
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> TAMBAH KOLOM
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {columnFields.map((field, index) => (
                          <div key={(field as { rhfId?: string }).rhfId ?? field.id} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border group">
                            <Input 
                              {...form.register(`columns.${index}.text` as const)}
                              placeholder="Label Kolom"
                              className="h-8 w-32 text-xs border-none bg-transparent focus-visible:ring-0 font-bold uppercase"
                            />
                            {columnFields.length > 2 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeColumn(index)}
                              >
                                <Trash className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rows and Answer Management */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Baris (Pernyataan) & Kunci Jawaban</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold"
                          onClick={() => appendRow({ id: `row-${Math.random().toString(36).substring(2, 9)}`, text: "" })}
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> TAMBAH BARIS
                        </Button>
                      </div>

                      <div className="rounded-xl border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b">
                              <tr>
                                <th className="p-4 text-left font-bold text-zinc-500 text-[10px] uppercase tracking-wider">Pernyataan</th>
                                {watchedColumns.map((col) => (
                                  <th key={(col as { rhfId?: string }).rhfId ?? col.id} className="p-4 text-center font-bold text-zinc-500 text-[10px] uppercase tracking-wider min-w-[100px]">
                                    {col.text || "..."}
                                  </th>
                                ))}
                                <th className="w-12"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {watchedRows.map((row, rowIndex) => (
                                <tr key={(row as { rhfId?: string }).rhfId ?? row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                                  <td className="p-2">
                                    <div className="space-y-1">
                                      <Input 
                                        {...form.register(`rows.${rowIndex}.text` as const)}
                                        placeholder="Tulis pernyataan di sini..."
                                        className="h-10 border-none bg-transparent focus-visible:ring-0 font-medium text-zinc-700 dark:text-zinc-300"
                                      />
                                      {form.formState.errors.rows?.[rowIndex]?.text && (
                                        <p className="text-[10px] text-destructive px-3 font-medium">
                                          {form.formState.errors.rows[rowIndex]?.text?.message}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  {watchedColumns.map((col) => (
                                    <td key={(col as { rhfId?: string }).rhfId ?? col.id} className="p-2 text-center">
                                      <div className="flex justify-center">
                                        <input
                                          type="radio"
                                          name={`matrix-row-${row.id}`}
                                          className="w-5 h-5 cursor-pointer accent-primary"
                                          aria-label={`Pilih ${col.text} untuk ${row.text}`}
                                          checked={form.watch(`answer.${row.id}`) === col.id}
                                          onChange={() => form.setValue(`answer.${row.id}`, col.id, { shouldValidate: true })}
                                        />
                                      </div>
                                    </td>
                                  ))}
                                  <td className="p-2">
                                    {rowFields.length > 1 && (
                                      <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => removeRow(rowIndex)}
                                      >
                                        <Trash className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {form.formState.errors.answer && Object.keys(form.formState.errors.answer).length > 0 && (
                        <p className="text-xs text-destructive font-medium bg-destructive/5 border border-destructive/10 p-3 rounded-lg flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                          Mohon tentukan kunci jawaban untuk setiap pernyataan di atas.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {questionType === 'mengurutkan' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Item Urutan (Urutan Benar)</Label>
                      {optionFields.length < 6 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-bold"
                          onClick={() => appendOption({ id: `opt-${Math.random().toString(36).substring(2, 9)}`, text: "", imageUrl: "" })}
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> TAMBAH ITEM
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {optionFields.map((option, index) => (
                        <div key={(option as { rhfId?: string }).rhfId ?? option.id} className="flex items-center gap-4 p-3 rounded-xl border bg-zinc-50/50 dark:bg-zinc-900/50">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-black border border-primary/20">
                            {index + 1}
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 relative group">
                              <Input 
                                id={`ordering-${index}`}
                                placeholder={`Item urutan ke-${index + 1}`}
                                {...form.register(`options.${index}.text` as const)}
                                className="border-none bg-transparent focus-visible:ring-0 h-8 pr-24"
                              />
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      type="button" 
                                      variant="ghost" 
                                      size="icon" 
                                      className={cn(
                                        "h-7 w-7",
                                        form.watch(`options.${index}.imageUrl`) ? "text-primary" : "text-zinc-400"
                                      )}
                                    >
                                      <ImageIcon className="w-4 h-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-4" align="end">
                                    <div className="space-y-3">
                                      <div className="space-y-1">
                                        <Label className="text-[10px] font-bold uppercase">URL Gambar Item</Label>
                                        <Input 
                                          placeholder="https://..." 
                                          {...form.register(`options.${index}.imageUrl` as const)}
                                          className="h-8 text-xs"
                                        />
                                      </div>
                                      {form.watch(`options.${index}.imageUrl`) && (
                                        <Button 
                                          type="button" 
                                          variant="destructive" 
                                          size="sm" 
                                          className="w-full h-8 text-[10px] font-bold"
                                          onClick={() => form.setValue(`options.${index}.imageUrl`, "")}
                                        >
                                          Hapus Gambar
                                        </Button>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <LatexPicker onPick={(latex) => handleInsertLatex(`options.${index}.text`, latex)} />
                                {optionFields.length > 2 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleRemoveOption(index)}
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {questionType === 'short_answer' && (
                  <FormField
                    control={form.control}
                    name="shortAnswerConfig.acceptableAnswers"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                          Jawaban Benar (Isian Singkat)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={"Tulis satu jawaban per baris.\nContoh:\nphotosynthesis\nFotosintesis"}
                            className="min-h-[100px] text-sm"
                            value={(field.value || []).join("\n")}
                            onChange={(e) => {
                              const lines = e.target.value
                                .split("\n")
                                .map((l) => l.trim())
                                .filter((l) => l.length > 0);
                              field.onChange(lines);
                            }}
                          />
                        </FormControl>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          Pencocokan tidak peka huruf besar-kecil. Semua baris dianggap jawaban yang benar.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {questionType === 'bs' && (
                  <div className="flex items-center justify-between p-6 border-2 border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="space-y-1">
                      <Label htmlFor="bs-answer-switch" className="text-sm font-bold">Kunci Jawaban</Label>
                      <p className="text-xs text-zinc-500">Tentukan apakah pernyataan ini Benar atau Salah.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn("text-sm font-black italic uppercase", form.watch("answer") ? "text-emerald-500" : "text-rose-500")}>
                        {form.watch("answer") ? "BENAR" : "SALAH"}
                      </span>
                      <Switch 
                        id="bs-answer-switch"
                        checked={form.watch("answer")} 
                        onCheckedChange={(val: boolean) => form.setValue("answer", val)} 
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {questionType === 'essay' && (
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="essayConfig.maxPoints"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                Bobot Essay (Poin Maksimal)
                              </FormLabel>
                              <p className="text-[10px] text-zinc-400 font-medium">
                                Digunakan untuk menghitung skor awal essay berbasis kata kunci.
                              </p>
                            </div>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-24 h-9 text-sm font-bold text-right"
                                min={0.5}
                                max={100}
                                step={0.5}
                                value={field.value ?? form.watch("maxPoints") ?? 5}
                                onChange={(e) => field.onChange(parseFloat(e.target.value || "5"))}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="essayConfig.keywords"
                      render={() => {
                        const keywords = (form.watch("essayConfig.keywords") || []) as z.infer<typeof essayKeywordSchema>[];
                        return (
                          <FormItem className="space-y-3">
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                Kata Kunci Essay
                              </FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-[10px] font-bold"
                                onClick={() => {
                                  const current = keywords || [];
                                  form.setValue("essayConfig.keywords", [
                                    ...current,
                                    {
                                      id: `kw-${Math.random().toString(36).substring(2, 9)}`,
                                      text: "",
                                      weight: 1,
                                      type: "required" as const,
                                    },
                                  ]);
                                }}
                              >
                                <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> TAMBAH KATA KUNCI
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {keywords.length === 0 && (
                                <p className="text-[10px] text-zinc-400 font-medium">
                                  Opsional: jika kosong, sistem akan memakai kunci jawaban essay di bawah (fallback).
                                </p>
                              )}
                              {keywords.map((kw, index) => (
                                <div
                                  key={kw.id}
                                  className="grid grid-cols-[2fr,1fr,1fr,auto] gap-2 items-center rounded-xl border bg-zinc-50/60 dark:bg-zinc-900/60 p-2"
                                >
                                  <Input
                                    placeholder="Kata/frasa kunci"
                                    className="h-8 text-xs"
                                    value={kw.text}
                                    onChange={(e) => {
                                      const next = [...keywords];
                                      next[index] = { ...next[index], text: e.target.value };
                                      form.setValue("essayConfig.keywords", next, { shouldDirty: true });
                                    }}
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Bobot"
                                    className="h-8 text-xs text-right"
                                    min={0.1}
                                    step={0.1}
                                    value={kw.weight}
                                    onChange={(e) => {
                                      const next = [...keywords];
                                      next[index] = { ...next[index], weight: parseFloat(e.target.value || "1") };
                                      form.setValue("essayConfig.keywords", next, { shouldDirty: true });
                                    }}
                                  />
                                  <Select
                                    value={kw.type}
                                    onValueChange={(val: "required" | "bonus") => {
                                      const next = [...keywords];
                                      next[index] = { ...next[index], type: val };
                                      form.setValue("essayConfig.keywords", next, { shouldDirty: true });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="required">Required</SelectItem>
                                      <SelectItem value="bonus">Bonus</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      const next = keywords.filter((_, i) => i !== index);
                                      form.setValue("essayConfig.keywords", next, { shouldDirty: true });
                                    }}
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="answer"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                              Kunci Jawaban Essay (Fallback)
                            </FormLabel>
                            <LatexPicker onPick={(latex) => handleInsertLatex("answer", latex)} />
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              id="answer"
                              placeholder="Opsional: jawaban ideal sebagai referensi dan fallback ketika kata kunci kosong."
                              className="min-h-[100px] resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <div className="pt-6 border-t">
                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-bold uppercase tracking-wider text-zinc-500">Pembahasan (Opsional)</FormLabel>
                        <LatexPicker onPick={(latex) => handleInsertLatex("explanation", latex)} />
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          id="explanation"
                          placeholder="Penjelasan singkat mengapa jawaban tersebut benar..."
                          className="min-h-[100px] resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Extra Padding for Scroll */}
              <div className="h-20" />
            </div>

            {/* Right Column: Preview */}
            <div className="w-[500px] bg-zinc-50/50 dark:bg-zinc-900/30 overflow-y-auto p-8 hidden lg:block border-l scrollbar-none">
              <QuestionLivePreview
                data={form.watch() as any}
                isNewPassage={form.watch("isNewPassage")}
                draftPassageTitle={form.watch("draftPassageTitle")}
                draftPassageContent={form.watch("draftPassageContent")}
                draftPassageImageUrl={form.watch("draftPassageImageUrl")}
                availablePassages={passages}
              />
            </div>

            {/* Floating Footer Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t flex justify-end gap-3 z-10">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isPending} 
                className="min-w-[150px] font-bold shadow-lg shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <Infinite className="mr-2 h-4 w-4 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  isEditing ? "Simpan Perubahan" : "Simpan ke Bank Soal"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
