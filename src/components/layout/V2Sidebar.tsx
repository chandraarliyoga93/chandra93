"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Home,
	Group,
	Trophy,
	Book,
	MultiplePages,
	Database,
	ElectronicsChip,
	LogOut,
	User,
	Menu,
	Settings,
} from "iconoir-react";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { logoutAction } from "@/actions/auth-supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const baseNavMain = [
	{
		title: "Dashboard",
		url: "/dashboard/guru",
		icon: Home,
	},
	{
		title: "Kelas Saya",
		url: "/dashboard/guru/classes",
		icon: Group,
	},
	{
		title: "Poin & Hadiah",
		url: "/dashboard/guru/gamification",
		icon: Trophy,
	},
	{
		title: "Jurnal Mengajar",
		url: "/dashboard/guru/journals",
		icon: Book,
	},
	{
		title: "Manajemen Kursus",
		url: "/dashboard/guru/lms",
		icon: MultiplePages,
	},
	{
		title: "Bank Soal",
		url: "/dashboard/guru/bank-soal",
		icon: Database,
	},
	{
		title: "CBT Ujian",
		url: "/dashboard/guru/cbt",
		icon: ElectronicsChip,
	},
];

export function V2Sidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const pathname = usePathname();
	const router = useRouter();
	const { user, profile } = useAuth();
	const { state } = useSidebar();
	const profilePhoto = (profile as { photo?: string } | null)?.photo || "";
	const adminEmail =
		process.env.NEXT_PUBLIC_ADMIN_GURU_EMAIL || "devisaidulloh@gmail.com";
	const isAdminGuru = user?.email === adminEmail;

	const navMain = [
		...baseNavMain,
		...(isAdminGuru
			? [
					{
						title: "Admin Tools",
						url: "/dashboard/guru/admin",
						icon: Settings,
					},
				]
			: []),
	];

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

	return (
		<Sidebar
			variant="inset"
			collapsible="icon"
			className={cn(
				"border-r border-zinc-200/50 bg-white/50 backdrop-blur-xl transition-[width,background-color,border-color,backdrop-filter] duration-300 dark:border-zinc-800/50 dark:bg-zinc-950/50",
				state === "collapsed"
					? "w-[calc(var(--sidebar-width-icon)+2px)]"
					: "w-[var(--sidebar-width)]",
			)}
			{...props}
		>
			<SidebarHeader className="p-4">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton size="lg" asChild>
							<Link href="/dashboard/guru" className="flex items-center gap-3">
								<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
									<Menu className="size-4" />
								</div>
								<div className="flex flex-col gap-0.5 leading-none">
									<span className="font-semibold">Kelas Guru</span>
									<span className="text-xs text-zinc-500">Panel Guru</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent className="px-2">
				<SidebarMenu>
					{navMain.map((item) => {
						const isActive =
							item.url === "/dashboard/guru"
								? pathname === item.url
								: pathname === item.url || pathname.startsWith(`${item.url}/`);
						return (
							<SidebarMenuItem key={item.title}>
								<SidebarMenuButton
									asChild
									isActive={isActive}
									tooltip={item.title}
									className={cn(
										"transition-all duration-200",
										isActive
											? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
											: "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
									)}
								>
									<Link href={item.url}>
										<item.icon className="size-4" />
										<span>{item.title}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarContent>
			<SidebarFooter className="p-2">
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-zinc-800 transition-[background-color]"
								>
									<Avatar className="size-8 rounded-lg">
										<AvatarImage
											src={profilePhoto}
											alt={profile?.name || "Guru"}
										/>
										<AvatarFallback className="rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-bold">
											{(profile?.name || "G").charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
										<span className="truncate font-semibold">
											{profile?.name || "Guru User"}
										</span>
										<span className="truncate text-xs text-zinc-500">
											{user?.email}
										</span>
									</div>
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
								side="bottom"
								align="end"
								sideOffset={4}
							>
								<DropdownMenuLabel className="p-0 font-normal">
									<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
										<Avatar className="size-8 rounded-lg">
											<AvatarImage
												src={profilePhoto}
												alt={profile?.name || "Guru"}
											/>
											<AvatarFallback className="rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-bold">
												{(profile?.name || "G").charAt(0).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div className="grid flex-1 text-left text-sm leading-tight">
											<span className="truncate font-semibold">
												{profile?.name}
											</span>
											<span className="truncate text-xs text-zinc-500">
												{user?.email}
											</span>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="cursor-pointer transition-[background-color]"
									asChild
								>
									<Link
										href="/dashboard/guru/profile"
										className="w-full flex items-center"
									>
										<User className="mr-2 size-4" />
										Pengaturan Profil
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 transition-[background-color]"
									onClick={handleLogout}
								>
									<LogOut className="mr-2 size-4" />
									Keluar
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
