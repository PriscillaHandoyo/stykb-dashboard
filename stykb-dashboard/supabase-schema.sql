-- Create lingkungan table
CREATE TABLE lingkungan (
  id SERIAL PRIMARY KEY,
  nama_lingkungan TEXT NOT NULL,
  nama_ketua TEXT NOT NULL,
  nomor_telepon TEXT NOT NULL,
  jumlah_tatib TEXT NOT NULL,
  availability JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create paskah table for storing schedules
CREATE TABLE paskah (
  id SERIAL PRIMARY KEY,
  schedules JSONB NOT NULL DEFAULT '{}',
  assignments JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create misa_lainnya table
CREATE TABLE misa_lainnya (
  id SERIAL PRIMARY KEY,
  celebrations JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial empty records for paskah and misa_lainnya
INSERT INTO paskah (schedules, assignments) VALUES ('{}', '{}');
INSERT INTO misa_lainnya (celebrations) VALUES ('[]');

-- Create indexes for better performance
CREATE INDEX idx_lingkungan_nama ON lingkungan(nama_lingkungan);
CREATE INDEX idx_lingkungan_availability ON lingkungan USING GIN (availability);
