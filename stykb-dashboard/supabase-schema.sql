-- Create wilayah table
CREATE TABLE wilayah (
  id SERIAL PRIMARY KEY,
  nama_wilayah TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lingkungan table
CREATE TABLE lingkungan (
  id SERIAL PRIMARY KEY,
  nama_lingkungan TEXT NOT NULL,
  nama_ketua TEXT NOT NULL,
  nomor_telepon TEXT NOT NULL,
  jumlah_tatib TEXT NOT NULL,
  wilayah_id INTEGER REFERENCES wilayah(id) ON DELETE SET NULL,
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

-- Create kalendar_assignments table (replaces localStorage)
CREATE TABLE kalendar_assignments (
  id SERIAL PRIMARY KEY,
  tahun INTEGER NOT NULL,
  bulan INTEGER NOT NULL, -- 0-11 (0=January, 11=December)
  tanggal TEXT NOT NULL,
  hari TEXT NOT NULL,
  gereja TEXT NOT NULL,
  waktu TEXT NOT NULL,
  assigned_lingkungan JSONB NOT NULL, -- Array of {name: string, tatib: number}
  total_tatib INTEGER NOT NULL,
  needs_more BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tahun, bulan, tanggal, gereja, waktu)
);

-- Create min_tatib_config table (replaces localStorage)
CREATE TABLE min_tatib_config (
  id SERIAL PRIMARY KEY,
  gereja TEXT NOT NULL,
  waktu TEXT NOT NULL, -- e.g., "Sabtu 17:00", "Minggu 08:00"
  min_tatib INTEGER NOT NULL DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gereja, waktu)
);

-- Insert initial empty records for paskah and misa_lainnya
INSERT INTO paskah (schedules, assignments) VALUES ('{}', '{}');
INSERT INTO misa_lainnya (celebrations) VALUES ('[]');

-- Insert default min_tatib configuration
INSERT INTO min_tatib_config (gereja, waktu, min_tatib) VALUES
  ('St. Yakobus', 'Sabtu 17:00', 20),
  ('St. Yakobus', 'Minggu 08:00', 20),
  ('St. Yakobus', 'Minggu 11:00', 20),
  ('St. Yakobus', 'Minggu 17:00', 20),
  ('Pegangsaan 2', 'Minggu 07:30', 20),
  ('Pegangsaan 2', 'Minggu 10:30', 20);

-- Create indexes for better performance
CREATE INDEX idx_lingkungan_nama ON lingkungan(nama_lingkungan);
CREATE INDEX idx_lingkungan_wilayah ON lingkungan(wilayah_id);
CREATE INDEX idx_lingkungan_availability ON lingkungan USING GIN (availability);
CREATE INDEX idx_kalendar_assignments_date ON kalendar_assignments(tahun, bulan);
CREATE INDEX idx_kalendar_assignments_gereja ON kalendar_assignments(gereja, waktu);
CREATE INDEX idx_wilayah_nama ON wilayah(nama_wilayah);
