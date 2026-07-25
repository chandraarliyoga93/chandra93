"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { Refresh, Infinite, Xmark } from "iconoir-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateProfilePhotoSupabase } from "@/actions/users-supabase";
import { toast } from "sonner";

interface ProfileAvatarPickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhoto?: string;
}

const AVATAR_SEEDS = [
  "Felix", "Aneka", "Mia", "Caleb", 
  "Lia", "Leo", "Zoe", "Max", 
  "Ava", "Ian", "Luna", "Kael", 
  "Suri", "Ben", "Noa", "Jade"
];

const getDicebearUrl = (seed: string) => 
  `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`;

export function ProfileAvatarPicker({ 
  isOpen, 
  onOpenChange,
  currentPhoto 
}: ProfileAvatarPickerProps) {
  const [isPending, startTransition] = React.useTransition();

  const handleSelectAvatar = (seed: string) => {
    const url = getDicebearUrl(seed);
    
    startTransition(async () => {
      const result = await updateProfilePhotoSupabase(url);
      if (result.success) {
        toast.success("Avatar berhasil diperbarui!");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Gagal memperbarui avatar");
      }
    });
  };

  const handleRandomize = () => {
    const newSeed = Math.random().toString(36).substring(7);
    handleSelectAvatar(newSeed);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto flex-col rounded-none border-t-4 border-neo-border bg-neo-bg outline-none shadow-[0px_-8px_0px_0px_var(--neo-border)]">
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-neo-border/20" />
          
          <div className="flex flex-col p-6 pb-10 space-y-6 max-w-lg mx-auto w-full">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Drawer.Title asChild>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
                    PILIH AVATARMU
                  </h2>
                </Drawer.Title>
                <Drawer.Description asChild>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">
                    Biar profilmu makin kece bergaya Notion.
                  </p>
                </Drawer.Description>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                aria-label="Tutup"
                className="rounded-none border-2 border-neo-border hover:bg-rose-100"
              >
                <Xmark className="w-5 h-5" />
              </Button>
            </div>

            {/* Avatar Grid */}
            <div className="grid grid-cols-4 gap-4 py-2">
              {AVATAR_SEEDS.map((seed) => {
                const url = getDicebearUrl(seed);
                const isSelected = currentPhoto === url;

                return (
                  <button
                    key={seed}
                    onClick={() => handleSelectAvatar(seed)}
                    disabled={isPending}
                    aria-label={`Pilih avatar ${seed}`}
                    className={cn(
                      "aspect-square border-4 border-neo-border rounded-none overflow-hidden transition-all active:scale-95",
                      "hover:shadow-[4px_4px_0px_0px_var(--neo-border)] hover:-translate-x-1 hover:-translate-y-1",
                      isSelected ? "bg-yellow-400 shadow-[4px_4px_0px_0px_var(--neo-border)] -translate-x-1 -translate-y-1" : "bg-white dark:bg-slate-800",
                      isPending && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={url} alt={seed} className="object-cover" />
                      <AvatarFallback className="rounded-none text-xs font-black">
                        {seed.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                );
              })}
            </div>

            {/* Randomize Button */}
            <div className="pt-2">
              <Button
                onClick={handleRandomize}
                disabled={isPending}
                aria-label="Acak avatar"
                className="w-full h-14 border-4 border-neo-border rounded-none bg-cyan-400 hover:bg-cyan-500 text-black font-black text-lg uppercase italic tracking-tighter shadow-[6px_6px_0px_0px_var(--neo-border)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                {isPending ? (
                  <Infinite className="w-6 h-6 mr-2 animate-spin" />
                ) : (
                  <Refresh className="w-6 h-6 mr-2" />
                )}
                ACAK
              </Button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
