import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'lingkungan.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newData = await request.json();
    const filePath = path.join(process.cwd(), 'data', 'lingkungan.json');
    
    // Read existing data
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const existingData = JSON.parse(fileContents);
    
    // Add new entry with auto-increment ID
    const newId = existingData.length > 0 
      ? Math.max(...existingData.map((item: any) => item.id)) + 1 
      : 1;
    
    const newEntry = {
      id: newId,
      ...newData
    };
    
    existingData.push(newEntry);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    
    return NextResponse.json({ success: true, data: newEntry });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const updatedItem = await request.json();
    const filePath = path.join(process.cwd(), 'data', 'lingkungan.json');
    
    // Read existing data
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const existingData = JSON.parse(fileContents);
    
    // Find and update the item
    const updatedData = existingData.map((item: any) => 
      item.id === updatedItem.id ? updatedItem : item
    );
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const filePath = path.join(process.cwd(), 'data', 'lingkungan.json');
    
    // Read existing data
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const existingData = JSON.parse(fileContents);
    
    // Filter out the deleted item
    const updatedData = existingData.filter((item: any) => item.id !== id);
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
