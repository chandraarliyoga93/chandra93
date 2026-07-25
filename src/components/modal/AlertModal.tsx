"use client";

import * as React from "react";
import { WarningTriangle, Infinite } from "iconoir-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useModal } from "@/hooks/use-modal";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

export function AlertModal() {
  const { isOpen, onClose, type, data } = useModal();
  const [isPending, setIsPending] = React.useState(false);
  const isMobile = useIsMobile();

  const isModalOpen = isOpen && type === "alert";
  const { 
    title = "Apakah Anda yakin?", 
    description = "Tindakan ini tidak dapat dibatalkan. Data yang dihapus akan hilang secara permanen.",
    confirmText = "Hapus",
    cancelText = "Batal",
    onConfirm,
    variant = "destructive"
  } = data;

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onConfirm) return;

    setIsPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  if (isMobile) {
    return (
      <Drawer.Root open={isModalOpen} onOpenChange={onClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto flex-col rounded-t-[2rem] border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 outline-none">
            <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-col p-6 pb-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={cn(
                  "rounded-full size-14 flex items-center justify-center",
                  variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                  <WarningTriangle className="size-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    {title}
                  </h2>
                  <p className="text-muted-foreground/80 leading-relaxed px-4">
                    {description}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Button
                  onClick={handleConfirm}
                  disabled={isPending}
                  variant={variant}
                  className={cn(
                    "w-full rounded-2xl h-14 text-lg font-bold shadow-lg transition-[transform,opacity] active:scale-95",
                    variant === "destructive" && "shadow-destructive/20",
                    isPending && "opacity-80"
                  )}
                >
                  {isPending ? (
                    <>
                      <Infinite className="mr-2 h-5 w-5 animate-spin" />
                      Memproses…
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
                <Button
                  disabled={isPending}
                  onClick={onClose}
                  variant="outline"
                  className="w-full rounded-2xl h-14 text-lg font-medium border-2 hover:bg-secondary transition-colors"
                >
                  {cancelText}
                </Button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <AlertDialog open={isModalOpen} onOpenChange={onClose}>
      <AlertDialogContent className={cn(
        "max-w-[400px] border-border shadow-2xl",
        variant === "destructive" && "border-destructive/20 shadow-destructive/10"
      )}>
        <AlertDialogHeader>
          <AlertDialogMedia className={cn(
            "rounded-full size-12 mb-4",
            variant === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}>
            <WarningTriangle className="size-6" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground/80 leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
          <AlertDialogCancel 
            disabled={isPending}
            className="rounded-xl border-2 font-medium hover:bg-secondary transition-colors"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            variant={variant}
            className={cn(
              "rounded-xl font-bold shadow-lg transition-[transform,opacity] active:scale-95",
              variant === "destructive" && "shadow-destructive/20",
              isPending && "opacity-80"
            )}
          >
            {isPending ? (
              <>
                <Infinite className="mr-2 h-4 w-4 animate-spin" />
                Memproses…
              </>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
