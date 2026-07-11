"use server";

import { Repositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";

export async function getStudyPrograms() {
  return Repositories.studyProgram().getAll();
}

export async function getAnnouncements() {
  return Repositories.announcement().getAll();
}

export async function getAnnouncementsForStudent(studentId: string, jurusanId: string | null) {
  const data = await Repositories.announcement().getAll();
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);
  return data.filter((a) => {
    const createdAt = new Date(a.createdAt);
    if (createdAt < twoDaysAgo) return false;
    if (a.broadcastToAll) return true;
    if (!jurusanId) return false;
    return a.recipients.includes(jurusanId);
  });
}

export async function sendAnnouncement(
  title: string,
  content: string,
  broadcastToAll: boolean,
  studyProgramIds: string[]
) {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const result = await Repositories.announcement().create({
    title,
    content,
    createdBy: user.id,
    broadcastToAll,
    studyProgramIds,
  });

  if (result.error) return { success: false, message: result.error };

  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/siswa/pengumuman");
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const result = await Repositories.announcement().delete(id);

  if (result.error) return { success: false, message: result.error };

  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/siswa/pengumuman");
  return { success: true };
}
