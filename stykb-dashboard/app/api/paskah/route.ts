import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('paskah')
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json(data || { schedules: {}, assignments: {} });
  } catch (error) {
    console.error("Error reading paskah data:", error);
    return NextResponse.json({ schedules: {}, assignments: {} });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('paskah')
      .update({
        schedules: body.schedules || {},
        assignments: body.assignments || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error saving paskah data:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to save data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
