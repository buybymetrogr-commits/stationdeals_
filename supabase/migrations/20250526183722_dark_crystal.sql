/*
  # Create metro stations table

  1. New Tables
    - `metro_stations`
      - `id` (text, primary key)
      - `name` (text)
      - `lat` (double precision)
      - `lng` (double precision)
      - `lines` (text[])
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for public read access
    - Add policies for admin management
*/

CREATE TABLE metro_stations (
  id text PRIMARY KEY,
  name text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  lines text[] NOT NULL,
  status text NOT NULL CHECK (status IN ('planned', 'under-construction', 'operational')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE metro_stations ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Metro stations are viewable by everyone"
  ON metro_stations
  FOR SELECT
  USING (true);

-- Admin management
CREATE POLICY "Admin users can manage metro stations"
  ON metro_stations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert initial data
INSERT INTO metro_stations (id, name, lat, lng, lines, status)
VALUES
  ('new-railway-station', 'Νέος Σιδηροδρομικός Σταθμός', 40.6518, 22.9288, ARRAY['main'], 'under-construction'),
  ('dimokratias-square', 'Πλατεία Δημοκρατίας', 40.6445, 22.9334, ARRAY['main'], 'under-construction'),
  ('venizelou', 'Βενιζέλου', 40.6363, 22.9386, ARRAY['main'], 'under-construction'),
  ('agia-sofia', 'Αγία Σοφία', 40.6334, 22.9415, ARRAY['main'], 'under-construction'),
  ('sintrivani', 'Συντριβάνι', 40.6297, 22.9534, ARRAY['main'], 'under-construction'),
  ('panepistimio', 'Πανεπιστήμιο', 40.6273, 22.9597, ARRAY['main'], 'under-construction'),
  ('patrikio', 'Πατρίκιο', 40.6220, 22.9644, ARRAY['main'], 'under-construction'),
  ('fleming', 'Φλέμινγκ', 40.6166, 22.9698, ARRAY['main'], 'under-construction'),
  ('analipsi', 'Ανάληψη', 40.6124, 22.9722, ARRAY['main'], 'under-construction'),
  ('nea-elvetia', 'Νέα Ελβετία', 40.6042, 22.9744, ARRAY['main'], 'under-construction'),
  ('kalamaria', 'Καλαμαριά', 40.5876, 22.9525, ARRAY['main'], 'planned'),
  ('mikrothiva', 'Μικροθήβη', 40.5797, 22.9437, ARRAY['main'], 'planned'),
  ('aretsou', 'Αρετσού', 40.5747, 22.9352, ARRAY['main'], 'planned');

-- Create updated_at trigger
CREATE TRIGGER update_metro_stations_updated_at
  BEFORE UPDATE ON metro_stations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();