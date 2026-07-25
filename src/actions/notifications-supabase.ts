"use server";

import { prisma } from "@/lib/prisma";
import { ensureGuru } from "@/lib/auth-server";

export async function getNotificationsActionSupabase(limit: number = 20) {
  try {
    const user = await getAuthUser();
    if (!user) return [];

    // Placeholder: Fetch notifications from a Notification table if it exists
    // For now returning empty array
    return [];
  } catch (error) {
    return [];
  }
}

export async function markAsReadActionSupabase(id: string) {
  try {
    const user = await getAuthUser();
    if (!user) return { success: false };

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  emoji: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export async function getNotificationsAction(limit: number = 20) { return getNotificationsActionSupabase(limit); }
export async function markAsReadAction(id: string) { return markAsReadActionSupabase(id); }

async function getAuthUser() {
  const { getAuthUser: getAuth } = await import("@/lib/auth-server");
  return await getAuth();
}
