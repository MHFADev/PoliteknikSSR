import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  const email = "admin@politeknik-ssr.ac.id";
  const password = "admin123456"; // Ganti dengan password yang lebih aman nanti ya!
  const fullName = "Admin Politeknik SSR";

  try {
    // 1. Buat user via admin API
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "admin",
        approved: true,
      },
    });

    if (authError || !data.user) {
      return NextResponse.json(
        { error: authError?.message || "Gagal membuat user" },
        { status: 500 }
      );
    }

    // 2. Explicitly insert (or upsert) into profiles table, include approved
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
        role: "admin",
        approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("Profile error:", profileError);
      return NextResponse.json(
        { error: "Gagal membuat profil: " + profileError.message },
        { status: 500 }
      );
    }

    // 3. Also update user metadata with approved to true
    await supabase.auth.admin.updateUserById(data.user.id, {
      user_metadata: {
        approved: true,
        full_name: fullName,
        role: "admin",
      },
    });

    return NextResponse.json({
      message: "Admin berhasil dibuat!",
      email,
      password,
      fullName,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
