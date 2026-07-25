import { getStudentProfileSupabase as getStudentProfile } from "@/actions/students";
import { MARKET_ITEMS } from "@/lib/market-items";
import { MarketGrid } from "@/components/siswa/MarketGrid";
import { Coins, Shop } from "iconoir-react";
import { redirect } from "next/navigation";
import { Student } from "@/types/student";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const profile = await getStudentProfile() as Student | null;

  if (!profile) {
    redirect("/");
  }

  const currentCoins = profile.guruCoin || 0;
  const inventory = profile.inventory || [];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shop className="h-8 w-8 text-neo-primary" />
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">
              Marketplace
            </h1>
          </div>
          <p className="text-lg font-bold text-muted-foreground">
            Tukar koinmu sama barang-barang keren!
          </p>
        </div>

        {/* Coin Display */}
        <div className="flex items-center gap-4 rounded-2xl border-4 border-neo-border bg-neo-accent px-6 py-4 shadow-[4px_4px_0px_0px_var(--neo-border)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Coins className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs font-black uppercase text-black/60">Koinmu</p>
            <p className="text-2xl font-black text-black leading-none">{currentCoins}</p>
          </div>
        </div>
      </div>

      {/* Market Items Grid */}
      <MarketGrid 
        items={MARKET_ITEMS} 
        currentCoins={currentCoins} 
        inventory={inventory} 
      />
    </div>
  );
}
