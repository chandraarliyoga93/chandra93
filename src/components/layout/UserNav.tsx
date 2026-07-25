"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { logoutAction } from "@/actions/auth-supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut } from "iconoir-react";
import { SmoothDropdown, SmoothDropdownItem } from "@/components/micro-interactions/smooth-dropdown";
import { cn } from "@/lib/utils";

export function UserNav() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse border border-border/50" />
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await logoutAction();
      router.push("/");
      toast.success("Berhasil keluar");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Gagal keluar");
    }
  };

  const displayName = profile?.name || user.email?.split('@')[0] || "User";
  const userEmail = user.email || "";
  const photoURL = (profile as any)?.photo || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <SmoothDropdown
      trigger={({ isOpen }) => (
        <Button 
          variant="ghost" 
          className={cn(
            "relative h-9 w-9 rounded-full p-0 overflow-hidden hover:bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-0 transition-all duration-300",
            isOpen && "ring-1 ring-primary/20"
          )}
        >
          <Avatar className="h-9 w-9 border border-border/60 transition-all duration-300 hover:border-primary/30 hover:scale-105 active:scale-95 shadow-sm">
            <AvatarImage src={photoURL} alt={displayName} className="object-cover" />
            <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold tracking-tighter">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      )}
      contentClassName="w-64"
    >
      <div className="px-3 py-2">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-semibold leading-none text-foreground tracking-tight">
            {displayName}
          </p>
          <p className="text-xs leading-none text-muted-foreground font-medium truncate opacity-80">
            {userEmail}
          </p>
        </div>
      </div>
      
      <div className="h-px bg-border/40 my-1" />
      
      <SmoothDropdownItem 
        onClick={handleLogout}
        destructive 
        icon={LogOut}
      >
        Logout
      </SmoothDropdownItem>
    </SmoothDropdown>
  );
}
