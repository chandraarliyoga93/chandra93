"use server";

import { prisma } from "@/lib/prisma";
import { ensureSiswa, ensureGuru } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PurchaseItemSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string().min(1),
  price: z.number().int().min(0),
});

const GiveManualCoinSchema = z.object({
  studentId: z.string().min(1),
  amount: z.number().int().min(-10000).max(10000),
  reason: z.string().min(1).max(200),
});

const BatchGiveManualCoinSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  amount: z.number().int().min(-10000).max(10000),
  reason: z.string().min(1).max(200),
});

/**
 * Guru action to award GuruCoins to a student manually in Prisma/Supabase.
 */
export async function giveManualCoinSupabase(studentId: string, amount: number, reason: string) {
  try {
    const guru = await ensureGuru();
    const validated = GiveManualCoinSchema.safeParse({ studentId, amount, reason });
    
    if (!validated.success) {
      return { success: false, error: "Input tidak valid" };
    }

    return await prisma.$transaction(async (tx: any) => {
      const student = await tx.user.findUnique({
        where: { id: studentId },
      });
      if (!student || student.role !== "SISWA") {
        throw new Error("Siswa tidak ditemukan");
      }

      const currentCoins = student.guruCoin || 0;
      const newCoins = Math.max(0, currentCoins + amount);

      await tx.user.update({
        where: { id: studentId },
        data: {
          guruCoin: newCoins,
        },
      });

      // Log transaction
      await tx.economyLog.create({
        data: {
          studentId,
          amount,
          type: amount >= 0 ? "MANUAL_AWARD" : "MANUAL_DEDUCTION",
          reason,
          oldCoins: currentCoins,
          newCoins: newCoins,
        },
      });

      revalidatePath("/dashboard/guru");
      return { success: true, newCoins };
    });
  } catch (error) {
    console.error("Error giving manual coins (Supabase):", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal memberikan koin" };
  }
}

/**
 * Guru action to award GuruCoins to multiple students manually in Prisma/Supabase.
 */
export async function batchGiveManualCoinSupabase(studentIds: string[], amount: number, reason: string) {
  try {
    const guru = await ensureGuru();
    const validated = BatchGiveManualCoinSchema.safeParse({ studentIds, amount, reason });
    
    if (!validated.success) {
      return { success: false, error: "Input tidak valid" };
    }

    for (const id of studentIds) {
      await giveManualCoinSupabase(id, amount, reason);
    }

    revalidatePath("/dashboard/guru");
    revalidatePath("/dashboard/siswa");
    return { success: true };
  } catch (error) {
    console.error("Error batch giving coins (Supabase):", error);
    return { success: false, error: "Gagal memberikan koin massal" };
  }
}

/**
 * Siswa action to purchase an item using GuruCoins in Prisma/Supabase.
 */
export async function purchaseItemSupabase(itemId: string, itemName: string, price: number) {
  try {
    const user = await ensureSiswa();
    const validated = PurchaseItemSchema.safeParse({ itemId, itemName, price });
    
    if (!validated.success) {
      return { success: false, error: "Input tidak valid" };
    }

    return await prisma.$transaction(async (tx: any) => {
      // 1. Get student data
      const student = await tx.user.findUnique({
        where: { id: user.uid },
      });
      if (!student) {
        throw new Error("Data siswa tidak ditemukan");
      }

      const currentCoins = student.guruCoin || 0;

      if (currentCoins < price) {
        throw new Error("Koin tidak mencukupi");
      }

      const newCoins = currentCoins - price;
      
      // 2. Prepare inventory update
      const currentInventory = (student.inventory as any[]) || [];
      const newInventoryItem = {
        itemId,
        itemName,
        purchasedAt: new Date().toISOString(),
        status: "available"
      };
      
      const newInventory = [...currentInventory, newInventoryItem];

      // 3. Update User
      await tx.user.update({
        where: { id: user.uid },
        data: {
          guruCoin: newCoins,
          inventory: newInventory,
        },
      });

      // 4. Log purchase in EconomyLog
      await tx.economyLog.create({
        data: {
          studentId: user.uid,
          amount: -price,
          type: "PURCHASE",
          reason: `Membeli item: ${itemName}`,
          oldCoins: currentCoins,
          newCoins: newCoins,
        },
      });

      return { success: true, newCoins };
    });
  } catch (error) {
    console.error("Error purchasing item (Supabase):", error);
    return { success: false, error: error instanceof Error ? error.message : "Gagal melakukan pembelian" };
  }
}

/**
 * Siswa action to equip a purchased item in Prisma/Supabase.
 */
export async function equipItemSupabase(itemId: string, category: string) {
  try {
    const user = await ensureSiswa();
    
    const student = await prisma.user.findUnique({
      where: { id: user.uid },
    });

    if (!student) {
      return { success: false, error: "Data siswa tidak ditemukan" };
    }

    const inventory = (student.inventory as any[]) || [];
    const hasItem = inventory.some((item: any) => item.itemId === itemId);

    if (!hasItem) {
      return { success: false, error: "Kamu belum punya item ini!" };
    }

    const equipped = (student.equipped as Record<string, any>) || {};
    const newEquipped = {
      ...equipped,
      [category]: itemId,
    };

    await prisma.user.update({
      where: { id: user.uid },
      data: {
        equipped: newEquipped,
      },
    });

    revalidatePath("/dashboard/siswa/profile");
    return { success: true };
  } catch (error) {
    console.error("Error equipping item (Supabase):", error);
    return { success: false, error: "Gagal memasang item" };
  }
}
