"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

type Notif = { user_id: string; title: string; message?: string; link?: string };

/**
 * Insert notifications (service role — bypass RLS). Dipanggil dari server action lain.
 */
export async function createNotifications(items: Notif[]): Promise<void> {
  if (!items.length) return;
  try {
    const db = createAdminClient() as any;
    await db.from("notifications").insert(items);
  } catch {
    // notif jangan sampai menggagalkan aksi utama
  }
}

/**
 * Unread notification counts per link, untuk badge di sidebar.
 */
export async function getUnreadNotificationCounts(): Promise<Record<string, number>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const db = createClient() as any;
  const { data } = await db
    .from("notifications")
    .select("link")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .not("link", "is", null);

  const counts: Record<string, number> = {};
  for (const n of data || []) {
    const l = n.link as string;
    counts[l] = (counts[l] || 0) + 1;
  }
  return counts;
}

/**
 * Tandai semua notifikasi user dengan link tertentu sebagai sudah dibaca.
 */
export async function markNotificationsRead(link: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !link) return;

  const db = createClient() as any;
  await db
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("link", link)
    .eq("is_read", false);
}
