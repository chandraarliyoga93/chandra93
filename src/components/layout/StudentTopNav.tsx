"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Settings, ViewGrid, Trophy, Shop, Book } from "iconoir-react";
import { supabase } from "@/lib/supabase";
import { logoutAction } from "@/actions/auth-supabase";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

/** Sinkron dengan `STUDENT_GLOBAL_LMS_HREF` di `StudentCourseList` (modul server — string disalin). */
const STUDENT_GLOBAL_LMS_HREF = "/dashboard/siswa?view=lms" as const;

export function StudentTopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await logoutAction();
      router.push("/");
      toast.success("See ya! 👋");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard/siswa", icon: ViewGrid },
    { label: "LMS", href: STUDENT_GLOBAL_LMS_HREF, icon: Book },
    { label: "Leaderboard", href: "/dashboard/siswa/leaderboard", icon: Trophy },
    { label: "Market", href: "/dashboard/siswa/market", icon: Shop },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-neo-bg border-b-4 border-neo-border transition-colors">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8 h-full">
          {/* Logo */}
          <Link 
            href="/dashboard/siswa" 
            className="text-xl font-black tracking-tighter hover:scale-105 transition-transform shrink-0 text-foreground"
          >
            KELAS<span className="text-neo-primary">GURU</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 h-full">
            {navItems.map((item) => {
              const isLmsTabActive = pathname === "/dashboard/siswa" && searchParams.get("view") === "lms";
              const isActive = item.label === "LMS" ? isLmsTabActive : pathname === item.href;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "h-full px-4 flex items-center font-black text-xs uppercase tracking-widest gap-2 transition-all relative border-x-2 border-transparent",
                    isActive 
                      ? "text-black dark:text-white bg-yellow-400 dark:bg-yellow-600 border-x-black dark:border-x-white italic after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-black dark:after:bg-white" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4 stroke-[3]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile & Theme */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 outline-none group hover:bg-transparent p-0">
                <span className="hidden md:block font-black text-xs uppercase italic tracking-tighter group-hover:underline text-foreground">
                  {user?.user_metadata?.full_name || "Student"}
                </span>
                <div className="h-10 w-10 rounded-none border-4 border-neo-border overflow-hidden transition-transform group-hover:scale-105 group-active:scale-95 bg-yellow-400 shadow-[2px_2px_0px_0px_var(--neo-border)]">
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ""} alt={user?.user_metadata?.full_name || "User"} />
                    <AvatarFallback className="bg-yellow-400 text-black font-black">
                      {user?.user_metadata?.full_name?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 border-4 border-neo-border shadow-[8px_8px_0px_0px_var(--neo-border)] rounded-none mt-2 bg-neo-bg p-0"
            >
              <DropdownMenuLabel className="font-black uppercase italic tracking-tighter bg-yellow-400 dark:bg-indigo-900 border-b-4 border-neo-border p-3 text-black dark:text-white">My Account</DropdownMenuLabel>
              <div className="p-1">
                <DropdownMenuItem asChild className="cursor-pointer font-black uppercase text-[10px] tracking-widest focus:bg-neo-primary focus:text-white rounded-none italic text-foreground">
                  <Link href="/dashboard/siswa/profile" className="flex items-center w-full px-2 py-2">
                    <UserIcon className="mr-2 h-4 w-4 stroke-[2.5]" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer font-black uppercase text-[10px] tracking-widest focus:bg-neo-primary focus:text-white rounded-none italic text-foreground">
                  <div className="flex items-center w-full px-2 py-2">
                    <Settings className="mr-2 h-4 w-4 stroke-[2.5]" />
                    <span>Settings</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-neo-border/10 mx-1" />
                <DropdownMenuItem 
                  className="cursor-pointer font-black uppercase text-[10px] tracking-widest text-red-600 focus:bg-red-600 focus:text-white rounded-none italic"
                  onClick={handleLogout}
                >
                  <div className="flex items-center w-full px-2 py-2">
                    <LogOut className="mr-2 h-4 w-4 stroke-[3]" />
                    <span>Log out</span>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
