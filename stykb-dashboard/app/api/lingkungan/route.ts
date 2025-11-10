import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('lingkungan')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    // Transform snake_case to camelCase for frontend
    const transformedData = (data || []).map((item: any) => ({
      id: item.id,
      namaLingkungan: item.nama_lingkungan,
      namaKetua: item.nama_ketua,
      nomorTelepon: item.nomor_telepon,
      jumlahTatib: item.jumlah_tatib,
      availability: item.availability
    }));

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('GET /api/lingkungan error:', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newData = await request.json();
    
    const { data, error } = await supabase
      .from('lingkungan')
      .insert([{
        nama_lingkungan: newData.namaLingkungan,
        nama_ketua: newData.namaKetua,
        nomor_telepon: newData.nomorTelepon,
        jumlah_tatib: newData.jumlahTatib,
        availability: newData.availability
      }])
      .select()
      .single();

    if (error) throw error;

    // Transform response back to camelCase
    const transformedData = {
      id: data.id,
      namaLingkungan: data.nama_lingkungan,
      namaKetua: data.nama_ketua,
      nomorTelepon: data.nomor_telepon,
      jumlahTatib: data.jumlah_tatib,
      availability: data.availability
    };

    return NextResponse.json({ success: true, data: transformedData });
  } catch (error) {
    console.error('POST /api/lingkungan error:', error);
    return NextResponse.json({ 
      error: 'Failed to save data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedItem = await request.json();
    
    const { data, error } = await supabase
      .from('lingkungan')
      .update({
        nama_lingkungan: updatedItem.namaLingkungan,
        nama_ketua: updatedItem.namaKetua,
        nomor_telepon: updatedItem.nomorTelepon,
        jumlah_tatib: updatedItem.jumlahTatib,
        availability: updatedItem.availability,
        updated_at: new Date().toISOString()
      })
      .eq('id', updatedItem.id)
      .select()
      .single();

    if (error) throw error;

    // Transform response back to camelCase
    const transformedData = {
      id: data.id,
      namaLingkungan: data.nama_lingkungan,
      namaKetua: data.nama_ketua,
      nomorTelepon: data.nomor_telepon,
      jumlahTatib: data.jumlah_tatib,
      availability: data.availability
    };

    return NextResponse.json({ success: true, data: transformedData });
  } catch (error) {
    console.error('PUT /api/lingkungan error:', error);
    return NextResponse.json({ 
      error: 'Failed to update data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    
    const { error } = await supabase
      .from('lingkungan')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/lingkungan error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
