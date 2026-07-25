"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function syncUserSupabase(userData: {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}, role: 'Guru' | 'Siswa') {
  try {
    // Enforce Guru email restriction
    const adminGuruEmail = process.env.ADMIN_GURU_EMAIL;
    
    if (role === 'Guru' && userData.email !== adminGuruEmail) {
      return { success: false, error: "Hanya admin yang bisa masuk sebagai Guru" };
    }

    const dbUser = await prisma.user.upsert({
      where: { id: userData.uid },
      update: {
        role: role === 'Guru' ? 'ADMIN_GURU' : 'SISWA',
        email: userData.email, // Keep email in sync
        name: userData.displayName,
      },
      create: {
        id: userData.uid,
        email: userData.email,
        name: userData.displayName,
        username: userData.email.split('@')[0], // Default username
        role: role === 'Guru' ? 'ADMIN_GURU' : 'SISWA',
        xp: 0,
        level: 1,
        guruCoin: 0,
      },
    });

    // Set cookies for middleware and server actions (7 days)
    const cookieStore = await cookies();
    cookieStore.set("user-role", role, {
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    cookieStore.set("user-id", userData.uid, {
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { 
      success: true, 
      role,
    };
  } catch (error) {
    console.error("CRITICAL AUTH ERROR:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: `Gagal sinkronisasi: ${errorMessage}` };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("user-role");
  cookieStore.delete("user-id");
  cookieStore.delete("sidebar_state");
}
