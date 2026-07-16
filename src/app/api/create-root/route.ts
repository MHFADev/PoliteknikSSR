import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = createAdminClient();

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { email, password, fullName } = parsed.data;

  try {
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "root",
      },
    });

    if (authError || !data.user) {
      return NextResponse.json(
        { error: authError?.message || "Gagal membuat root" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
        role: "root",
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
      message: "Root berhasil dibuat!",
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

export async function GET() {
  const supabase = createAdminClient();

  const email = "root@politeknik-ssr.ac.id";
  const password = "root123456";
  const fullName = "Root Politeknik SSR";

  try {
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "root",
      },
    });

    if (authError || !data.user) {
      return NextResponse.json(
        { error: authError?.message || "Gagal membuat root" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
        role: "root",
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
      message: "Root berhasil dibuat!",
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