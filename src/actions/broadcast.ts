"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getStudyPrograms() {
  const supabase = createClient();
  const { data } = await supabase
    .from("study_programs")
    .select("*")
    .order("nama", { ascending: true });
  return data ?? [];
}

export async function getAnnouncements() {
  const supabase = createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*, announcement_recipients(study_program_id)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAnnouncementsForStudent(studentId: string, jurusanId: string | null) {
  const supabase = createClient();

  const { data } = await supabase
    .from("announcements")
    .select("id, title, content, broadcast_to_all, created_at, announcement_recipients(study_program_id)")
    .order("created_at", { ascending: false });

  if (!data) return [];

  // Filter announcements from the last 2 days
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  return data.filter((a: any) => {
    const createdAt = new Date(a.created_at);
    if (createdAt < twoDaysAgo) return false;

    if (a.broadcast_to_all) return true;
    if (!jurusanId) return false;
    return a.announcement_recipients?.some((r: any) => r.study_program_id === jurusanId);
  });
}

export async function sendAnnouncement(
  title: string,
  content: string,
  broadcastToAll: boolean,
  studyProgramIds: string[]
) {
  const supabase = createAdminClient();
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { data: announcement, error: insertError } = await supabase
    .from("announcements")
    .insert({
      title,
      content,
      broadcast_to_all: broadcastToAll,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError) return { success: false, message: insertError.message };

  if (!broadcastToAll && studyProgramIds.length > 0) {
    const recipients = studyProgramIds.map((spId) => ({
      announcement_id: announcement.id,
      study_program_id: spId,
    }));

    const { error: recipientsError } = await supabase
      .from("announcement_recipients")
      .insert(recipients);

    if (recipientsError) return { success: false, message: recipientsError.message };
  }

  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/siswa/pengumuman");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) return { success: false, message: error.message };
  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/siswa/pengumuman");
  return { success: true };
}
