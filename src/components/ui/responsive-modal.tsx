"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  headerContent?: React.ReactNode; // For custom icons/media in header
}

export function ResponsiveModal({
  children,
  title,
  description,
  trigger,
  open,
  onOpenChange,
  className,
  headerContent,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
          <Drawer.Content className={cn(
            "fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-auto max-h-[96%] flex-col rounded-t-[2rem] border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 outline-none",
            className
          )}>
            <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-col overflow-y-auto p-6 pb-10">
              {(title || description || headerContent) && (
                <div className="mb-6 flex flex-col items-center text-center space-y-4">
                  {headerContent}
                  <div className="space-y-2">
                    {title && (
                      <Drawer.Title className="text-2xl font-bold tracking-tight text-foreground">
                        {title}
                      </Drawer.Title>
                    )}
                    {description && (
                      <Drawer.Description className="text-muted-foreground/80 leading-relaxed px-4">
                        {description}
                      </Drawer.Description>
                    )}
                  </div>
                </div>
              )}
              {children}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={cn("sm:max-w-[550px] rounded-[1.5rem] border-zinc-200 dark:border-zinc-800", className)}>
        {(title || description || headerContent) && (
          <DialogHeader>
            {headerContent}
            {title && <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>}
            {description && (
              <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
