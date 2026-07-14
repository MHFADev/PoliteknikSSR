import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  const email = "owner@politeknik-ssr.ac.id";
  const password = "owner123456";
  const fullName = "Owner Politeknik SSR";

  try {
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "owner",
        approved: true,
      },
    });

    if (authError || !data.user) {
      return NextResponse.json(
        { error: authError?.message || "Gagal membuat owner" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
        role: "owner",
        approved: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      return NextResponse.json(
        { error: "Gagal membuat profil: " + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Owner berhasil dibuat!",
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
