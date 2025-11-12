import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("min_tatib_config")
      .select("*")
      .order("gereja", { ascending: true });

    if (error) {
      console.error("Error fetching min tatib config:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert to the format expected by frontend
    const config: { [church: string]: { [time: string]: number } } = {};
    
    data?.forEach((item) => {
      if (!config[item.gereja]) {
        config[item.gereja] = {};
      }
      config[item.gereja][item.waktu] = item.min_tatib;
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error in GET /api/min-tatib-config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json(
        { error: "config is required" },
        { status: 400 }
      );
    }

    // Convert from frontend format to database records
    const updates = [];
    for (const [gereja, times] of Object.entries(config)) {
      for (const [waktu, minTatib] of Object.entries(
        times as { [key: string]: number }
      )) {
        updates.push({
          gereja,
          waktu,
          min_tatib: minTatib,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Delete all existing config
    await supabase.from("min_tatib_config").delete().neq("id", 0);

    // Insert new config
    const { data, error } = await supabase
      .from("min_tatib_config")
      .insert(updates)
      .select();

    if (error) {
      console.error("Error updating min tatib config:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in PUT /api/min-tatib-config:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
