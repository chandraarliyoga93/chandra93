"use client";

import { useState } from "react";
import { MARKET_ITEMS } from "@/lib/market-items";
import { equipItemSupabase } from "@/actions/market-supabase";
import { motion } from "framer-motion";
import { Check, SystemRestart } from "iconoir-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InventoryGridProps {
  inventory: any[];
  equipped: Record<string, string>;
}

export function InventoryGrid({ inventory, equipped }: InventoryGridProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border-4 border-dashed border-neo-border p-12 text-center">
        <p className="text-xl font-black italic uppercase tracking-tighter text-muted-foreground">
          Inventory Kamu Masih Kosong! 💨
        </p>
        <p className="mt-2 font-bold text-muted-foreground">
          Yuk, belanja dulu di Marketplace biar makin keren.
        </p>
      </div>
    );
  }

  const handleEquip = async (itemId: string, category: string) => {
    setLoadingId(itemId);
    try {
      const result = await equipItemSupabase(itemId, category);
      if (result.success) {
        toast.success("Item berhasil dipasang! 🔥");
        router.refresh();
      } else {
        toast.error((result as any).error || "Gagal memasang item.");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {inventory.map((invItem, index) => {
        const itemDetails = MARKET_ITEMS.find((m) => m.id === invItem.itemId);
        if (!itemDetails) return null;

        const isEquipped = equipped[itemDetails.category] === invItem.itemId;

        return (
          <motion.div
            key={invItem.itemId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative flex flex-col items-center rounded-3xl border-4 border-black p-4 transition-all hover:translate-x-[2px] hover:translate-y-[2px] 
              ${isEquipped 
                ? "bg-neo-accent shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                : "bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"}
            `}
          >
            {/* Category */}
            <span className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {itemDetails.category}
            </span>

            {/* Icon */}
            <div className="mb-4 text-4xl group-hover:scale-110 transition-transform">
              {itemDetails.icon}
            </div>

            {/* Name */}
            <h4 className="mb-4 text-center text-sm font-black uppercase italic tracking-tighter leading-none">
              {itemDetails.name}
            </h4>

            {/* Action */}
            <button
              disabled={isEquipped || loadingId === invItem.itemId}
              onClick={() => handleEquip(invItem.itemId, itemDetails.category)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black py-2 text-xs font-black uppercase italic tracking-tighter transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
                ${isEquipped 
                  ? "bg-white text-black cursor-default" 
                  : "bg-black text-white hover:bg-black/90"}
              `}
            >
              {loadingId === invItem.itemId ? (
                <SystemRestart className="h-4 w-4 animate-spin" />
              ) : isEquipped ? (
                <>
                  <Check className="h-4 w-4" />
                  Dipasang
                </>
              ) : (
                "Pasang"
              )}
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
