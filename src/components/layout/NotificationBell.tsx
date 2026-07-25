"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, BellNotification, Check } from "iconoir-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { markAsReadAction, getNotificationsAction, Notification } from "@/actions/notifications-supabase";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const list = await getNotificationsAction(20);
    setNotifications(list as any);
    setUnreadCount((list as any[]).filter((n) => !n.isRead).length);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
  }, [userId, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    await markAsReadAction(id);
    fetchNotifications();
  };

  return (
    <Popover onOpenChange={(open) => open && fetchNotifications()}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-10 w-10 rounded-none border-4 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)] hover:bg-muted active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
        >
          {unreadCount > 0 ? (
            <BellNotification className="h-5 w-5 text-neo-primary animate-pulse" />
          ) : (
            <Bell className="h-5 w-5 text-foreground" />
          )}
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center border-2 border-black bg-red-500 text-[10px] font-black text-white"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 border-4 border-neo-border shadow-[8px_8px_0px_0px_var(--neo-border)] rounded-none bg-neo-bg p-0"
      >
        <div className="bg-neo-accent border-b-4 border-neo-border p-3 flex items-center justify-between">
          <h3 className="font-black uppercase italic tracking-tighter text-black">Notif Loe</h3>
          {unreadCount > 0 && (
             <span className="bg-black text-white text-[10px] px-2 py-0.5 font-black uppercase">
                {unreadCount} BARU
             </span>
          )}
        </div>
        
        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase italic">Sepi amat... Belum ada notif gess.</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-neo-border/10">
              {notifications.map((notif: any) => (
                <div 
                  key={notif.id}
                  className={cn(
                    "p-4 transition-colors relative group",
                    !notif.isRead ? "bg-neo-primary/5" : "bg-transparent opacity-70"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-neo-border bg-white text-xl shadow-[2px_2px_0px_0px_var(--neo-border)]">
                      {notif.emoji}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={cn(
                        "text-xs font-black uppercase italic leading-tight",
                        !notif.isRead ? "text-neo-primary" : "text-foreground"
                      )}>
                        {notif.title}
                      </p>
                      <p className="text-xs font-bold leading-normal text-foreground">
                        {notif.body}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="h-6 w-6 flex items-center justify-center border-2 border-neo-border bg-neo-accent hover:bg-yellow-400 shadow-[1px_1px_0px_0px_var(--neo-border)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
                        title="Tandai sudah dibaca"
                      >
                        <Check className="h-3 w-3 text-black stroke-[4]" />
                      </button>
                    )}
                  </div>
                  {notif.link && (
                    <Link 
                      href={notif.link}
                      className="absolute inset-0 z-0"
                      onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t-4 border-neo-border p-2 bg-muted/30">
          <Button 
            variant="ghost" 
            className="w-full font-black uppercase text-[10px] tracking-widest hover:bg-neo-primary hover:text-white rounded-none italic h-8"
            asChild
          >
            <Link href="/dashboard/siswa/notifications">Lihat Semua Notif</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
