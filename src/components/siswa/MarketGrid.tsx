"use client";

import { useState } from "react";
import { MarketItem } from "@/lib/market-items";
import { purchaseItemSupabase } from "@/actions/market-supabase";
import { motion } from "framer-motion";
import { Coins, CheckCircle, InfoCircle, SystemRestart } from "iconoir-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface MarketGridProps {
  items: MarketItem[];
  currentCoins: number;
  inventory: { itemId: string }[];
}

export function MarketGrid({ items, currentCoins, inventory }: MarketGridProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const isPurchased = (itemId: string) => {
    return inventory.some((item) => item.itemId === itemId);
  };

  const handlePurchase = async (item: MarketItem) => {
    if (currentCoins < item.price) {
      toast.error("Koinmu belum cukup nih! 🔥");
      return;
    }

    setLoadingId(item.id);
    try {
      const result = await purchaseItemSupabase(item.id, item.name, item.price);
      if (result.success) {
        toast.success(`${item.name} berhasil dibeli! Cek di profilmu. 🚀`);
        router.refresh();
      } else {
        toast.error((result as { error?: string }).error || "Gagal beli item. Coba lagi nanti.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, index) => {
        const bought = isPurchased(item.id);
        const canAfford = currentCoins >= item.price;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`group relative flex flex-col overflow-hidden rounded-[2rem] border-4 border-neo-border bg-white dark:bg-zinc-900 p-6 shadow-[8px_8px_0px_0px_var(--neo-border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_var(--neo-border)]`}
          >
            {/* Category Badge */}
            <div 
              className="absolute right-4 top-4 rounded-full border-2 border-black px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              style={{ backgroundColor: item.color }}
            >
              {item.category}
            </div>

            {/* Icon/Emoji */}
            <div className="mb-6 flex h-24 w-24 items-center justify-center self-center rounded-[2.5rem] border-4 border-neo-border bg-neo-bg text-5xl shadow-[4px_4px_0px_0px_var(--neo-border)] group-hover:rotate-6 transition-transform">
              {item.icon}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-black uppercase italic tracking-tighter leading-tight text-foreground">
                {item.name}
              </h3>
              <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Price & Action */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-yellow-400">
                  <Coins className="h-4 w-4 text-black" />
                </div>
                <span className="text-xl font-black tracking-tighter text-foreground">{item.price}</span>
              </div>

              <button
                disabled={bought || loadingId === item.id || !canAfford}
                onClick={() => handlePurchase(item)}
                className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-4 border-black font-black uppercase italic tracking-tighter transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
                  ${bought 
                    ? "bg-neo-accent text-black cursor-default opacity-80" 
                    : !canAfford 
                      ? "bg-muted text-muted-foreground cursor-not-allowed grayscale" 
                      : "bg-neo-primary text-foreground hover:bg-neo-primary/90"}
                `}
              >
                {loadingId === item.id ? (
                  <SystemRestart className="h-5 w-5 animate-spin" />
                ) : bought ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Sudah Punya
                  </>
                ) : !canAfford ? (
                  "Koin Kurang"
                ) : (
                  "Sikat!"
                )}
              </button>
            </div>

            {/* Tooltip-like info */}
            {!bought && canAfford && (
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase italic opacity-0 group-hover:opacity-100 transition-opacity">
                <InfoCircle className="h-3 w-3" />
                Klik untuk beli instan!
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
