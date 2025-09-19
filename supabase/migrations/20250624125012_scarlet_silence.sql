/*
  # Add active field to metro stations

  1. Changes
    - Add `active` column to `metro_stations` table with default value true
    - Update existing stations to be active by default

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE metro_stations
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Update existing stations to be active
UPDATE metro_stations SET active = true WHERE active IS NULL;