import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to extract wilayah from lingkungan name
function extractWilayah(namaLingkungan) {
  // Remove "Lingkungan" prefix if exists
  let name = namaLingkungan.replace(/^Lingkungan\s+/i, '').trim();
  
  // Match patterns like "Agnes 2", "Santo Yosef", "FX 1", etc.
  const match = name.match(/^(.+?)\s*\d+\s*$/);
  if (match) {
    return match[1].trim();
  }
  
  // For names without numbers like "Santo Yosef", "Santa Maria"
  return name;
}

async function importLingkungan() {
  try {
    console.log('🚀 Starting lingkungan import...\n');

    // Read lingkungan.json
    const dataPath = path.join(__dirname, '..', 'data', 'lingkungan.json');
    const lingkunganData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    console.log(`📋 Found ${lingkunganData.length} lingkungan to import\n`);

    // Step 1: Extract unique wilayah names
    const wilayahNames = new Set();
    lingkunganData.forEach(ling => {
      const wilayah = extractWilayah(ling.namaLingkungan);
      wilayahNames.add(wilayah);
    });

    console.log(`🏘️  Found ${wilayahNames.size} unique wilayah:\n${Array.from(wilayahNames).join(', ')}\n`);

    // Step 2: Get existing wilayah from database
    const { data: existingWilayah, error: wilayahFetchError } = await supabase
      .from('wilayah')
      .select('id, nama_wilayah');

    if (wilayahFetchError) {
      console.error('❌ Error fetching existing wilayah:', wilayahFetchError);
      return;
    }

    const existingWilayahMap = new Map();
    existingWilayah?.forEach(w => {
      existingWilayahMap.set(w.nama_wilayah, w.id);
    });

    console.log(`✅ Found ${existingWilayahMap.size} existing wilayah in database\n`);

    // Step 3: Insert missing wilayah
    const wilayahToInsert = [];
    for (const wilayahName of wilayahNames) {
      if (!existingWilayahMap.has(wilayahName)) {
        wilayahToInsert.push({ nama_wilayah: wilayahName });
      }
    }

    if (wilayahToInsert.length > 0) {
      console.log(`➕ Inserting ${wilayahToInsert.length} new wilayah...\n`);
      const { data: newWilayah, error: wilayahInsertError } = await supabase
        .from('wilayah')
        .insert(wilayahToInsert)
        .select();

      if (wilayahInsertError) {
        console.error('❌ Error inserting wilayah:', wilayahInsertError);
        return;
      }

      // Add newly inserted wilayah to map
      newWilayah?.forEach(w => {
        existingWilayahMap.set(w.nama_wilayah, w.id);
      });
      console.log(`✅ Successfully inserted ${newWilayah?.length} new wilayah\n`);
    } else {
      console.log('ℹ️  All wilayah already exist in database\n');
    }

    // Step 4: Check existing lingkungan to avoid duplicates
    const { data: existingLingkungan, error: lingkunganFetchError } = await supabase
      .from('lingkungan')
      .select('nama_lingkungan');

    if (lingkunganFetchError) {
      console.error('❌ Error fetching existing lingkungan:', lingkunganFetchError);
      return;
    }

    const existingLingkunganNames = new Set(
      existingLingkungan?.map(l => l.nama_lingkungan) || []
    );

    console.log(`✅ Found ${existingLingkunganNames.size} existing lingkungan in database\n`);

    // Step 5: Prepare lingkungan data for insertion
    const lingkunganToInsert = [];
    let skippedCount = 0;

    for (const ling of lingkunganData) {
      // Skip if already exists
      if (existingLingkunganNames.has(ling.namaLingkungan)) {
        skippedCount++;
        continue;
      }

      const wilayahName = extractWilayah(ling.namaLingkungan);
      const wilayahId = existingWilayahMap.get(wilayahName);

      if (!wilayahId) {
        console.warn(`⚠️  Warning: No wilayah found for "${ling.namaLingkungan}" (extracted: "${wilayahName}")`);
        continue;
      }

      // Normalize jumlahTatib to integer
      let jumlahTatib = ling.jumlahTatib;
      if (typeof jumlahTatib === 'string') {
        jumlahTatib = parseInt(jumlahTatib.replace(/[^\d]/g, '')) || 0;
      }

      lingkunganToInsert.push({
        nama_lingkungan: ling.namaLingkungan,
        nama_ketua: ling.namaKetua,
        nomor_telepon: ling.nomorTelepon,
        jumlah_tatib: jumlahTatib,
        availability: ling.availability,
        wilayah_id: wilayahId
      });
    }

    if (skippedCount > 0) {
      console.log(`ℹ️  Skipping ${skippedCount} lingkungan that already exist\n`);
    }

    // Step 6: Insert lingkungan
    if (lingkunganToInsert.length > 0) {
      console.log(`➕ Inserting ${lingkunganToInsert.length} new lingkungan...\n`);
      
      // Insert in batches of 100 to avoid timeout
      const batchSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < lingkunganToInsert.length; i += batchSize) {
        const batch = lingkunganToInsert.slice(i, i + batchSize);
        const { data, error } = await supabase
          .from('lingkungan')
          .insert(batch)
          .select();

        if (error) {
          console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
          continue;
        }

        insertedCount += data?.length || 0;
        console.log(`✅ Inserted batch ${i / batchSize + 1}: ${data?.length} lingkungan`);
      }

      console.log(`\n✨ Successfully imported ${insertedCount} lingkungan!\n`);
    } else {
      console.log('ℹ️  No new lingkungan to insert\n');
    }

    console.log('🎉 Import complete!\n');
    
    // Summary
    console.log('📊 Summary:');
    console.log(`   Total lingkungan in file: ${lingkunganData.length}`);
    console.log(`   Already existing: ${skippedCount}`);
    console.log(`   Newly inserted: ${lingkunganToInsert.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the import
importLingkungan();
