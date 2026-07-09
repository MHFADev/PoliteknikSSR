"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generatePermanentStudentToken } from "@/lib/qr-token";

interface AddStudentArgs {
  fullName: string;
  email: string;
  password: string;
  identityNumber?: string;
  instansi?: string;
  kelas?: string;
<<<<<<< HEAD
=======
  jurusanId?: string;
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
}

export async function addStudent({
  fullName,
  email,
  password,
  identityNumber,
  instansi,
  kelas,
<<<<<<< HEAD
=======
  jurusanId,
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
}: AddStudentArgs): Promise<{ success: true; studentId: string; permanentToken: string } | { success: false; message: string }> {
  const supabase = createAdminClient();

  const { data: { user: authUser }, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "siswa",
    },
  });

  if (authError) {
    return { success: false, message: "Gagal membuat akun: " + authError.message };
  }

  const studentId = authUser!.id;

  // Update the profile with additional info (since handle_new_user might miss some fields)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      identity_number: identityNumber || null,
      instansi: instansi || null,
      kelas: kelas || null,
<<<<<<< HEAD
=======
      jurusan_id: jurusanId || null,
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
    })
    .eq("id", studentId);

  if (profileError) {
    return { success: false, message: "Gagal menyimpan data siswa: " + profileError.message };
  }

  const permanentToken = await generatePermanentStudentToken(studentId, process.env.QR_SIGNING_SECRET!);

  revalidatePath("/dashboard/admin/pengguna");

  return { success: true, studentId, permanentToken };
}

export async function ensureStudyProgram(
  nama: string
): Promise<{ id: string | null; error?: string }> {
  const supabase = createAdminClient();
  const trimmed = nama.trim();
  if (!trimmed) return { id: null };

  const { data: existing } = await supabase
    .from("study_programs")
    .select("id")
    .ilike("nama", trimmed)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const kode = trimmed
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 10);

  const { data, error } = await supabase
    .from("study_programs")
    .insert({ nama: trimmed, kode })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id };
}
