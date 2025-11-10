// Run this script to migrate your JSON data to Supabase
// Usage: node migrate-to-supabase.mjs

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://dtcimbtgviolxkeesfkx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Y2ltYnRndmlvbHhrZWVzZmt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NjA3MzUsImV4cCI6MjA3ODMzNjczNX0.F_jUhenlC_SoJHtPmxvHHXOZDLGTU7OgRoXvgQ3bEJA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Starting migration...\n');

  try {
    // 1. Migrate lingkungan data
    const lingkunganPath = path.join(__dirname, 'data', 'lingkungan.json');
    if (fs.existsSync(lingkunganPath)) {
      const lingkunganData = JSON.parse(fs.readFileSync(lingkunganPath, 'utf8'));
      
      console.log(`📊 Migrating ${lingkunganData.length} lingkungan records...`);
      
      for (const item of lingkunganData) {
        const { error } = await supabase.from('lingkungan').insert({
          nama_lingkungan: item.namaLingkungan,
          nama_ketua: item.namaKetua,
          nomor_telepon: item.nomorTelepon,
          jumlah_tatib: item.jumlahTatib,
          availability: item.availability
        });
        
        if (error) {
          console.error(`❌ Error migrating lingkungan ${item.namaLingkungan}:`, error);
        } else {
          console.log(`✅ Migrated: ${item.namaLingkungan}`);
        }
      }
    }

    // 2. Migrate paskah data
    const paskahPath = path.join(__dirname, 'data', 'paskah.json');
    if (fs.existsSync(paskahPath)) {
      const paskahData = JSON.parse(fs.readFileSync(paskahPath, 'utf8'));
      
      console.log('\n📊 Migrating paskah data...');
      
      const { error } = await supabase
        .from('paskah')
        .update({
          schedules: paskahData.schedules || {},
          assignments: paskahData.assignments || {}
        })
        .eq('id', 1);
      
      if (error) {
        console.error('❌ Error migrating paskah:', error);
      } else {
        console.log('✅ Paskah data migrated');
      }
    }

    // 3. Migrate misa-lainnya data
    const misaLainnyaPath = path.join(__dirname, 'data', 'misa-lainnya.json');
    if (fs.existsSync(misaLainnyaPath)) {
      const misaLainnyaData = JSON.parse(fs.readFileSync(misaLainnyaPath, 'utf8'));
      
      console.log('\n📊 Migrating misa lainnya data...');
      
      const { error } = await supabase
        .from('misa_lainnya')
        .update({
          celebrations: misaLainnyaData.celebrations || []
        })
        .eq('id', 1);
      
      if (error) {
        console.error('❌ Error migrating misa lainnya:', error);
      } else {
        console.log('✅ Misa lainnya data migrated');
      }
    }

    console.log('\n✨ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrate();
