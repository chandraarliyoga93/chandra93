"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useParams, useRouter } from "next/navigation";
import { 
  Dashboard, OpenBook, GraduationCap, ClipboardCheck, Page, Group, LogOut, Trophy, Book, Medal, Database, Settings, ElectronicsChip
} from "iconoir-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { logoutAction } from "@/actions/auth-supabase";
import { toast } from "sonner";
import { progressBar } from "@/lib/progress-bar";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const classId = params?.id as string;
  const profilePhoto = (profile as { photo?: string } | null)?.photo || "";

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_GURU_EMAIL || "devisaidulloh@gmail.com";
  const isAdminGuru = user?.email === adminEmail; 

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

  const navMain = profile?.role === "Guru" ? [
    {
      title: "Dashboard",
      url: "/dashboard/guru",
      icon: Dashboard,
      isActive: pathname === "/dashboard/guru",
    },
    {
      title: "Kelas Saya",
      url: "/dashboard/guru/classes",
      icon: OpenBook,
      isActive: pathname === "/dashboard/guru/classes" || (pathname.startsWith("/dashboard/guru/classes") && !classId),
    },
    {
      title: "LMS",
      url: "/dashboard/guru/lms",
      icon: Page,
      isActive: pathname.startsWith("/dashboard/guru/lms"),
    },
    {
      title: "Poin & Hadiah",
      url: "/dashboard/guru/gamification",
      icon: Medal,
      isActive: pathname.startsWith("/dashboard/guru/gamification"),
    },
    {
      title: "Jurnal Mengajar",
      url: "/dashboard/guru/journals",
      icon: Book,
      isActive: pathname === "/dashboard/guru/journals",
    },
    {
      title: "Bank Soal",
      url: "/dashboard/guru/bank-soal",
      icon: Database,
      isActive: pathname.startsWith("/dashboard/guru/bank-soal"),
    },
    {
      title: "CBT Ujian",
      url: "/dashboard/guru/cbt",
      icon: ElectronicsChip,
      isActive: pathname.startsWith("/dashboard/guru/cbt"),
    },
    ...(isAdminGuru ? [{
      title: "Panel Admin",
      url: "/dashboard/guru/admin",
      icon: Settings,
      isActive: pathname.startsWith("/dashboard/guru/admin"),
    }] : []),
  ] : [
    {
      title: "Dashboard",
      url: "/dashboard/siswa",
      icon: Dashboard,
      isActive: pathname === "/dashboard/siswa",
    },
    {
      title: "Leaderboard",
      url: "/dashboard/siswa/leaderboard",
      icon: Trophy,
      isActive: pathname === "/dashboard/siswa/leaderboard",
    },
  ];

  const currentClassNav = classId ? [
    {
      title: "Overview",
      url: `/dashboard/guru/classes/${classId}`,
      icon: Dashboard,
      isActive: pathname === `/dashboard/guru/classes/${classId}`,
    },
    {
      title: "Presensi",
      url: `/dashboard/guru/classes/${classId}/attendance`,
      icon: ClipboardCheck,
      isActive: pathname.startsWith(`/dashboard/guru/classes/${classId}/attendance`),
    },
    {
      title: "Penilaian & Tugas",
      url: `/dashboard/guru/classes/${classId}/grades`,
      icon: Page,
      isActive: pathname.startsWith(`/dashboard/guru/classes/${classId}/grades`),
    },
    {
      title: "Siswa",
      url: `/dashboard/guru/classes/${classId}/students`,
      icon: Group,
      isActive: pathname.startsWith(`/dashboard/guru/classes/${classId}/students`),
    },
  ] : [];

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link 
                href={profile?.role === "Guru" ? "/dashboard/guru" : "/dashboard/siswa"}
                onClick={() => progressBar.start()}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">Kelas Guru</span>
                  <span className="truncate text-xs">{profile?.role === "Guru" ? "Panel Guru" : "Panel Siswa"}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Global</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={item.isActive} 
                  tooltip={item.title}
                  className={cn(item.isActive && "!bg-transparent")}
                >
                  <Link 
                    href={item.url} 
                    className="relative"
                    onClick={() => progressBar.start()}
                  >
                    {item.isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="absolute inset-0 rounded-md bg-sidebar-accent"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                    <item.icon className="relative z-10" />
                    <span className="relative z-10">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {classId && (
          <SidebarGroup>
            <SidebarGroupLabel>Kelas Saat Ini</SidebarGroupLabel>
            <SidebarMenu>
              {currentClassNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={item.isActive} 
                    tooltip={item.title}
                    className={cn(item.isActive && "!bg-transparent")}
                  >
                    <Link 
                      href={item.url} 
                      className="relative"
                      onClick={() => progressBar.start()}
                    >
                      {item.isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute inset-0 rounded-md bg-sidebar-accent"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                      <item.icon className="relative z-10" />
                      <span className="relative z-10">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              size="lg" 
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              tooltip="Keluar"
            >
              <LogOut className="size-4" />
              <span className="font-semibold group-data-[collapsible=icon]:hidden">Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={profilePhoto} alt={profile?.name || ""} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {(profile?.name || "G").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{profile?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
