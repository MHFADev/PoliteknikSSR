import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: locations } = await supabase
      .from("allowed_locations")
      .select("id, nama, latitude, longitude, radius_meters")
      .order("created_at", { ascending: true });

    return NextResponse.json(locations || []);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Gagal mengambil lokasi" },
      { status: 500 }
    );
  }
}
