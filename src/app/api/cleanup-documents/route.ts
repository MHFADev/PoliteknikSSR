import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: expired, error: fetchError } = await supabase
      .from("student_documents")
      .select("id, file_url")
      .eq("is_kept", false)
      .lt("expires_at", now);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!expired || expired.length === 0) {
      return NextResponse.json({ deleted: 0 });
    }

    const ids = expired.map((d) => d.id);

    const { error: delError } = await supabase
      .from("student_documents")
      .delete()
      .in("id", ids);

    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: ids.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
