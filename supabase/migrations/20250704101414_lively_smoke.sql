/*
  # Add tier field to businesses table

  1. Changes
    - Add `tier` column to `businesses` table
    - Set default value to 'next-door'
    - Update existing businesses with sample tier values

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

-- Add tier column to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS tier text DEFAULT 'next-door' CHECK (tier IN ('next-door', 'unicorns', 'classics'));

-- Update existing businesses with sample tier values
UPDATE businesses 
SET tier = CASE 
  WHEN category_id = 'health' THEN 'classics'
  WHEN category_id = 'cafe' THEN 'unicorns'
  WHEN category_id = 'restaurant' THEN 'classics'
  WHEN category_id = 'grocery' THEN 'next-door'
  ELSE 'next-door'
END
WHERE tier IS NULL;