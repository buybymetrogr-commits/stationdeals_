/*
  # Add application settings table

  1. New Tables
    - `app_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting key name
      - `value` (text) - Setting value
      - `description` (text) - Human readable description
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `app_settings` table
    - Add policy for admins to manage settings
    - Add policy for public to read certain settings

  3. Initial Data
    - Insert default station deals distance setting (200m)
*/

CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all settings
CREATE POLICY "Admin users can manage app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Public can read certain settings (like station deals distance)
CREATE POLICY "Public can read app settings"
  ON app_settings
  FOR SELECT
  TO public
  USING (key IN ('station_deals_distance', 'app_name', 'app_description'));

-- Service role can manage all settings
CREATE POLICY "Service role can manage app settings"
  ON app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO app_settings (key, value, description) VALUES
  ('station_deals_distance', '200', 'Maximum distance in meters for Station Deals from metro stations'),
  ('app_name', 'MetroBusiness', 'Application name'),
  ('app_description', 'Επιχειρήσεις κοντά στο Μετρό Θεσσαλονίκης', 'Application description')
ON CONFLICT (key) DO NOTHING;