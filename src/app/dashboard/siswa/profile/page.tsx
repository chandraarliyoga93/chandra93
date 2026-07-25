import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DigitalIDCard } from "@/components/siswa/DigitalIDCard";
import { InventoryGrid } from "@/components/siswa/InventoryGrid";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Box } from "iconoir-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil Saya | Kelas Guru",
  description: "Lihat identitas digital dan progres belajarmu.",
};

async function getAuthUser() {
  const cookieStore = await cookies();
  const uid = cookieStore.get("user-id")?.value;
  const role = cookieStore.get("user-role")?.value;

  if (!uid || !role) return null;
  return { uid, role };
}

export default async function SiswaProfilePage() {
  const user = await getAuthUser();

  if (!user || user.role !== "Siswa") {
    notFound();
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.uid },
  });

  if (!dbUser) {
    notFound();
  }

  const studentData = {
    uid: dbUser.id,
    name: dbUser.name || "Siswa",
    alias: (dbUser as any).alias || "",
    email: dbUser.email || "-",
    level: dbUser.level || 1,
    xp: dbUser.xp || 0,
    photo: (dbUser as any).photo || "",
    joinedAt: dbUser.createdAt.toISOString(),
    equipped: (dbUser as any).equipped || {},
  };

  const inventory = (dbUser as any).inventory || [];
  const equipped = (dbUser as any).equipped || {};

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" className="rounded-none hover:bg-slate-100 transition-all active:scale-95 border-4 border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Link href="/dashboard/siswa" className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            <span className="font-black uppercase italic tracking-tighter">Kembali</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-12 lg:flex-row lg:items-start">
        {/* Left Side: ID Card */}
        <div className="flex flex-col items-center gap-4 lg:w-1/3">
          <DigitalIDCard studentData={studentData} />
          <p className="max-w-[300px] text-center text-xs font-bold text-muted-foreground uppercase italic">
            Kartu ID ini bukti kamu resmi jadi bagian dari circle Kelas Guru.
          </p>
        </div>

        {/* Right Side: Inventory */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 border-b-4 border-neo-border pb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neo-border bg-neo-bg shadow-[2px_2px_0px_0px_var(--neo-border)]">
              <Box className="h-5 w-5 text-foreground" />
            </div>
            <h2 className="text-2xl font-black italic tracking-tighter text-foreground uppercase">Inventory Item</h2>
          </div>

          <InventoryGrid inventory={inventory} equipped={equipped} />
        </div>
      </div>
    </div>
  );
}
