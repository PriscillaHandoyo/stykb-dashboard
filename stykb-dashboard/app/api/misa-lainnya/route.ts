import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('misa_lainnya')
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json(data || { celebrations: [] });
  } catch (error) {
    console.error("Error reading misa lainnya data:", error);
    return NextResponse.json({ celebrations: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('misa_lainnya')
      .update({
        celebrations: body.celebrations || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error saving misa lainnya data:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to save data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
