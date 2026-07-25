"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Medal, Plus, EditPencil, Trash, InfoCircle, NavArrowDown, Star } from "iconoir-react";
import { BadgePreset, saveBadgeSupabase as saveBadge, deleteBadgeSupabase as deleteBadge, BadgeRequirement } from "@/actions/gamification-supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Exam } from "@/types/exam";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface V2BadgeManagerProps {
  initialBadges: BadgePreset[];
  exams: Exam[];
}

export function V2BadgeManager({ initialBadges, exams }: V2BadgeManagerProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [badges, setBadges] = useState<BadgePreset[]>(initialBadges);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgePreset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setBadges(initialBadges);
  }, [initialBadges]);

  const [formData, setFormData] = useState<{
    emoji: string;
    label: string;
    xp: number;
    requirement: BadgeRequirement;
  }>({
    emoji: "🌟",
    label: "",
    xp: 100,
    requirement: {
      type: "MANUAL",
      examId: "",
      minScore: 80,
    }
  });

  const handleOpenAddDialog = () => {
    setEditingBadge(null);
    setFormData({ 
      emoji: "🌟", 
      label: "", 
      xp: 100,
      requirement: {
        type: "MANUAL",
        examId: "",
        minScore: 80,
      }
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (badge: BadgePreset) => {
    setEditingBadge(badge);
    setFormData({
      emoji: badge.emoji,
      label: badge.label,
      xp: badge.xp,
      requirement: badge.requirement || {
        type: "MANUAL",
        examId: "",
        minScore: 80,
      }
    });
    setIsDialogOpen(true);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setFormData({ ...formData, emoji: emojiData.emoji });
    setIsEmojiPickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await saveBadge({
        id: editingBadge?.id,
        ...formData,
      });

      if (result.success) {
        toast.success(editingBadge ? "Badge diperbarui" : "Badge ditambahkan");
        router.refresh();
        setIsDialogOpen(false);
      } else {
        toast.error(result.error || "Gagal menyimpan badge");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus badge ini?")) return;

    try {
      const result = await deleteBadge(id);
      if (result.success) {
        toast.success("Badge dihapus");
        setBadges(badges.filter(b => b.id !== id));
      } else {
        toast.error(result.error || "Gagal menghapus badge");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <Star className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">Pustaka Badge</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Kelola preset reward XP untuk diberikan kepada siswa.</p>
          </div>
        </div>
        <Button 
          onClick={handleOpenAddDialog} 
          className="rounded-full gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
        >
          <Plus className="w-4 h-4" />
          Tambah Badge
        </Button>
      </div>

      {badges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800">
            <Medal className="w-8 h-8 text-zinc-300" />
          </div>
          <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Belum ada badge</h4>
          <p className="text-zinc-500 text-sm max-w-xs mt-2">
            Mulai buat badge preset seperti &quot;Tugas Tepat Waktu&quot; atau &quot;Aktif di Kelas&quot;.
          </p>
          <Button variant="outline" onClick={handleOpenAddDialog} className="mt-6 rounded-full border-zinc-200 dark:border-zinc-800">
            Buat Badge Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div 
              key={badge.id} 
              className="group relative bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-[2rem] p-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-zinc-900/5 dark:hover:shadow-zinc-100/5"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                  {badge.emoji}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{badge.label}</h4>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-black tracking-widest uppercase">
                    +{badge.xp} XP
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => handleOpenEditDialog(badge)}
                >
                  <EditPencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => handleDelete(badge.id)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">
              {editingBadge ? "Edit Badge" : "Tambah Badge Baru"}
            </DialogTitle>
            <DialogDescription className="text-zinc-500">
              Isi detail badge di bawah ini. Badge ini akan muncul di menu cepat pemberian XP.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <Label className="text-zinc-600 dark:text-zinc-400 font-medium">Visual Emoji</Label>
                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-24 h-24 text-4xl flex items-center justify-center rounded-[2rem] border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors group"
                    >
                      <div className="group-hover:scale-125 transition-transform duration-300">{formData.emoji}</div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-none w-auto z-[60]" side="bottom" align="center">
                    <div onWheel={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                      <EmojiPicker 
                        onEmojiClick={onEmojiClick}
                        theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
                        autoFocusSearch={false}
                        width={350}
                        height={400}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="label" className="text-zinc-600 dark:text-zinc-400 font-medium">Nama Badge</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800 h-12 focus:ring-zinc-900/5"
                  placeholder="Misal: Tugas Sempurna"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="xp" className="text-zinc-600 dark:text-zinc-400 font-medium">Nilai XP</Label>
                <div className="relative">
                  <Input
                    id="xp"
                    type="number"
                    value={formData.xp}
                    onChange={(e) => setFormData({ ...formData, xp: parseInt(e.target.value) })}
                    className="rounded-xl border-zinc-200 dark:border-zinc-800 h-12 pr-12 font-bold tabular-nums"
                    min={1}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">XP</div>
                </div>
              </div>

              <Separator className="bg-zinc-100 dark:bg-zinc-900" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-zinc-600 dark:text-zinc-400 font-medium">Persyaratan Badge</Label>
                </div>
                
                <Tabs 
                  value={formData.requirement.type} 
                  onValueChange={(val) => setFormData({ 
                    ...formData, 
                    requirement: { ...formData.requirement, type: val as "MANUAL" | "CBT_COMPLETION" } 
                  })}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 rounded-xl h-10 bg-zinc-100 dark:bg-zinc-900 p-1">
                    <TabsTrigger value="MANUAL" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">
                      Manual
                    </TabsTrigger>
                    <TabsTrigger value="CBT_COMPLETION" className="text-[10px] font-bold uppercase tracking-wider rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">
                      CBT Exam
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {formData.requirement.type === "CBT_COMPLETION" && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-500">Pilih Ujian</Label>
                      <Select 
                        value={formData.requirement.examId} 
                        onValueChange={(val) => setFormData({
                          ...formData,
                          requirement: { ...formData.requirement, examId: val }
                        })}
                      >
                        <SelectTrigger className="rounded-xl border-zinc-200 dark:border-zinc-800">
                          <SelectValue placeholder="Pilih ujian..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                          {exams.length === 0 ? (
                            <div className="p-4 text-center text-xs text-zinc-500">
                              Belum ada ujian yang dibuat.
                            </div>
                          ) : (
                            exams.map((exam) => (
                              <SelectItem key={exam.id} value={exam.id!} className="rounded-lg">
                                {exam.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-500">Nilai Minimal</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.requirement.minScore}
                          onChange={(e) => setFormData({
                            ...formData,
                            requirement: { ...formData.requirement, minScore: parseInt(e.target.value) }
                          })}
                          className="rounded-xl border-zinc-200 dark:border-zinc-800 pr-12 font-bold tabular-nums"
                          min={0}
                          max={100}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">SCORE</div>
                      </div>
                      <p className="text-[10px] text-zinc-400 px-1">Badge akan diberikan otomatis saat siswa mencapai nilai ini.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-8">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-full">
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="rounded-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 px-8"
              >
                {isLoading ? "Menyimpan..." : "Simpan Badge"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
