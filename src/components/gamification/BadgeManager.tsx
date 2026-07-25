"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Medal, Plus, EditPencil, Trash, InfoCircle, NavArrowDown } from "iconoir-react";
import { BadgePreset, saveBadgeSupabase as saveBadge, deleteBadgeSupabase as deleteBadge } from "@/actions/gamification-supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BadgeManagerProps {
  initialBadges: BadgePreset[];
}

export function BadgeManager({ initialBadges }: BadgeManagerProps) {
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

  const [formData, setFormData] = useState({
    emoji: "🌟",
    label: "",
    xp: 100,
  });

  const handleOpenAddDialog = () => {
    setEditingBadge(null);
    setFormData({ emoji: "🌟", label: "", xp: 100 });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (badge: BadgePreset) => {
    setEditingBadge(badge);
    setFormData({
      emoji: badge.emoji,
      label: badge.label,
      xp: badge.xp,
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
      } else {
        toast.error(result.error || "Gagal menyimpan badge");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Pustaka Badge</h3>
          <p className="text-sm text-muted-foreground">
            Kumpulan preset XP yang bisa Anda berikan kepada siswa dengan cepat.
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Badge
        </Button>
      </div>

      {badges.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-full bg-muted mb-4">
              <Medal className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-lg">Belum ada badge</h4>
            <p className="text-muted-foreground max-w-xs mt-2">
              Mulai buat badge preset seperti &quot;Tugas Tepat Waktu&quot; atau &quot;Aktif di Kelas&quot;.
            </p>
            <Button variant="outline" onClick={handleOpenAddDialog} className="mt-6">
              Buat Badge Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <Card key={badge.id} className="group hover:border-primary/50 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-2xl">
                  {badge.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold truncate">{badge.label}</h4>
                  <p className="text-xs font-medium text-primary">+{badge.xp} XP</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleOpenEditDialog(badge)}
                  >
                    <EditPencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(badge.id)}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBadge ? "Edit Badge" : "Tambah Badge Baru"}</DialogTitle>
            <DialogDescription>
              Isi detail badge di bawah ini. Badge ini akan muncul di menu cepat pemberian XP.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="emoji" className="text-right">
                Emoji
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-20 h-12 text-2xl flex items-center justify-center gap-1 p-0"
                    >
                      {formData.emoji}
                      <NavArrowDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none shadow-none w-auto z-[60]" side="right" align="start">
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
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <InfoCircle className="w-3 h-3" />
                  Klik box untuk memilih emoji.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Nama
              </Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="col-span-3"
                placeholder="Misal: Tugas Sempurna"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="xp" className="text-right">
                Bonus XP
              </Label>
              <Input
                id="xp"
                type="number"
                value={formData.xp}
                onChange={(e) => setFormData({ ...formData, xp: parseInt(e.target.value) })}
                className="col-span-3"
                min={1}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Menyimpan..." : "Simpan Badge"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
