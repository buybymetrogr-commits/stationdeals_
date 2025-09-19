/*
  # Add active status to businesses

  1. Changes
    - Add `active` column to `businesses` table with default value true
    - Update existing businesses to be active by default

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

ALTER TABLE businesses
ADD COLUMN active boolean DEFAULT true;

-- Update existing businesses to be active
UPDATE businesses SET active = true WHERE active IS NULL;