import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tahun = searchParams.get("tahun");
    const bulan = searchParams.get("bulan");

    if (!tahun || !bulan) {
      return NextResponse.json(
        { error: "tahun and bulan are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("kalendar_assignments")
      .select("*")
      .eq("tahun", parseInt(tahun))
      .eq("bulan", parseInt(bulan))
      .order("tanggal", { ascending: true });

    if (error) {
      console.error("Error fetching assignments:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Error in GET /api/kalendar-assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body;

    if (!assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { error: "assignments array is required" },
        { status: 400 }
      );
    }

    // Delete existing assignments for this month
    if (assignments.length > 0) {
      const { tahun, bulan } = assignments[0];
      console.log("🗑️  Deleting existing assignments for tahun:", tahun, "bulan:", bulan);
      
      // First, verify what exists
      const { data: existingData } = await supabase
        .from("kalendar_assignments")
        .select("id")
        .eq("tahun", tahun)
        .eq("bulan", bulan);
      
      console.log(`📊 Found ${existingData?.length || 0} existing assignments to delete`);
      
      const { error: deleteError } = await supabase
        .from("kalendar_assignments")
        .delete()
        .eq("tahun", tahun)
        .eq("bulan", bulan);
      
      if (deleteError) {
        console.error("❌ Delete failed:", deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      } else {
        console.log("✅ Delete successful");
        
        // Wait to ensure delete is fully committed before inserting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Remove duplicates from assignments array to prevent unique constraint violation
    const uniqueAssignments = assignments.filter((assignment, index, self) => {
      return index === self.findIndex((a) => (
        a.tahun === assignment.tahun &&
        a.bulan === assignment.bulan &&
        a.tanggal === assignment.tanggal &&
        a.gereja === assignment.gereja &&
        a.waktu === assignment.waktu
      ));
    });

    if (uniqueAssignments.length !== assignments.length) {
      const duplicateCount = assignments.length - uniqueAssignments.length;
      console.warn(`⚠️  Removed ${duplicateCount} duplicate assignments from input`);
      
      // Log some duplicate examples for debugging
      const seen = new Set();
      assignments.forEach((a, idx) => {
        const key = `${a.tahun}-${a.bulan}-${a.tanggal}-${a.gereja}-${a.waktu}`;
        if (seen.has(key)) {
          console.warn(`   Duplicate at index ${idx}: ${key}`);
        }
        seen.add(key);
      });
    }

    // Insert new assignments
    console.log("📝 Inserting", uniqueAssignments.length, "new assignments");
    const { data, error } = await supabase
      .from("kalendar_assignments")
      .insert(
        uniqueAssignments.map((a) => ({
          tahun: a.tahun,
          bulan: a.bulan,
          tanggal: a.tanggal,
          hari: a.hari,
          gereja: a.gereja,
          waktu: a.waktu,
          assigned_lingkungan: a.assigned_lingkungan,
          total_tatib: a.total_tatib,
          needs_more: a.needs_more,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      )
      .select();

    if (error) {
      console.error("Error saving assignments:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/kalendar-assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, assigned_lingkungan, total_tatib, needs_more } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("kalendar_assignments")
      .update({
        assigned_lingkungan,
        total_tatib,
        needs_more,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating assignment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error in PUT /api/kalendar-assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { tahun, bulan } = body;

    if (!tahun || bulan === undefined) {
      return NextResponse.json(
        { error: "tahun and bulan are required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("kalendar_assignments")
      .delete()
      .eq("tahun", tahun)
      .eq("bulan", bulan);

    if (error) {
      console.error("Error deleting assignments:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/kalendar-assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
