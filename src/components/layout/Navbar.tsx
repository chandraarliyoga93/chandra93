"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { logoutAction } from "@/actions/auth-supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { LogOut, Dashboard } from "iconoir-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Navbar() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard/guru") || pathname.startsWith("/dashboard/siswa")) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await logoutAction();
      router.push("/");
      toast.success("Berhasil keluar");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Gagal keluar");
    }
  };

  const dashboardPath = profile?.role === "Guru" ? "/dashboard/guru" : "/dashboard/siswa";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-black text-xl tracking-tighter text-zinc-950 dark:text-zinc-50 italic flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="w-8 h-8 bg-zinc-950 dark:bg-zinc-50 rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-black text-[10px] font-black">KG</span>
            </div>
            KELAS GURU
          </Link>
          
          {user && (
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href={dashboardPath}
                className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors flex items-center gap-1.5"
              >
                <Dashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <Avatar className="h-full w-full rounded-none">
                    <AvatarImage src={(profile as any)?.photo || undefined} alt={profile?.name || ""} />
                    <AvatarFallback className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 text-[10px] font-bold">
                      {(profile?.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-bold text-zinc-950 dark:text-zinc-50 leading-none">{profile?.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      {profile?.role || "User"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg mx-1.5 focus:bg-zinc-50 dark:focus:bg-zinc-900">
                  <Link href={dashboardPath} className="flex items-center">
                    <Dashboard className="mr-2 h-4 w-4 text-zinc-400" />
                    <span className="font-medium text-sm">Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-900/10 cursor-pointer rounded-lg mx-1.5">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="font-bold text-sm">Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/">
              <Button size="sm" className="rounded-xl font-bold bg-zinc-950 dark:bg-zinc-50 text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-200 px-5">
                Mulai Sekarang
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
