import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('tatib'); // Your database name
    const collection = db.collection('lingkungan'); // Your collection name

    const rawData = await collection.find({}).toArray();

    // Map the data to match your frontend expectations
    const mappedData = rawData.map(item => ({
      _id: item._id,
      namaLingkungan: item.nama || item.namaLingkungan || "N/A",
      namaKetua: item.ketua || item.namaKetua || "N/A", 
      jumlahTatib: item.jumlah_tatib || item.jumlahTatib || 0,
      availability: {
        sabtu1700: item.availability?.yakobus_sabtu?.includes('17.00') || false,
        minggu0800: item.availability?.yakobus_minggu?.includes('08.00') || false,
        minggu1100: item.availability?.yakobus_minggu?.includes('11.00') || false,
        minggu1700: item.availability?.yakobus_minggu?.includes('17.00') || false,
        minggu0730: item.availability?.p2_minggu?.includes('07.30') || false,
        minggu1030: item.availability?.p2_minggu?.includes('10.30') || false,
      }
    }));

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('tatib'); // Your database name
    const collection = db.collection('lingkungan'); // Your collection name

    const body = await request.json();
    
    // Convert the frontend data format to match your existing MongoDB structure
    const mongoData = {
      nama: body.namaLingkungan,
      ketua: body.namaKetua,
      jumlah_tatib: body.jumlahTatib,
      availability: {
        yakobus_sabtu: body.availability.sabtu1700 ? ['17.00'] : [],
        yakobus_minggu: [
          ...(body.availability.minggu0800 ? ['08.00'] : []),
          ...(body.availability.minggu1100 ? ['11.00'] : []),
          ...(body.availability.minggu1700 ? ['17.00'] : [])
        ],
        p2_minggu: [
          ...(body.availability.minggu0730 ? ['07.30'] : []),
          ...(body.availability.minggu1030 ? ['10.30'] : [])
        ]
      }
    };

    const result = await collection.insertOne(mongoData);

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Database insert error:', error);
    return NextResponse.json(
      { error: 'Failed to insert data' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('tatib'); // Your database name
    const collection = db.collection('lingkungan'); // Your collection name

    const body = await request.json();
    const { _id, ...updateData } = body;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Database update error:', error);
    return NextResponse.json(
      { error: 'Failed to update data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db('tatib'); // Your database name
    const collection = db.collection('lingkungan'); // Your collection name

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Database delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}