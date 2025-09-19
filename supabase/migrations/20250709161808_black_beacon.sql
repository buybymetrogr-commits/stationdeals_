/*
  # Add brand field to offers table

  1. Changes
    - Add `brand` column to `offers` table
    - Set default value to empty string
    - Update existing offers with sample brand values

  2. Security
    - No changes to RLS policies needed as the column inherits existing table policies
*/

-- Add brand column to offers table
ALTER TABLE offers
ADD COLUMN IF NOT EXISTS brand text DEFAULT '';

-- Update existing offers with sample brand values based on business names
UPDATE offers 
SET brand = CASE 
  WHEN EXISTS (SELECT 1 FROM businesses WHERE businesses.id = offers.business_id AND businesses.name LIKE '%Φαρμακείο%') THEN 'Pharmacy Plus'
  WHEN EXISTS (SELECT 1 FROM businesses WHERE businesses.id = offers.business_id AND businesses.name LIKE '%Καφετέρια%') THEN 'Central Coffee'
  WHEN EXISTS (SELECT 1 FROM businesses WHERE businesses.id = offers.business_id AND businesses.name LIKE '%Εστιατόριο%') THEN 'Mediterranean Taste'
  WHEN EXISTS (SELECT 1 FROM businesses WHERE businesses.id = offers.business_id AND businesses.name LIKE '%Mini Market%') THEN 'Express Market'
  ELSE 'Local Brand'
END
WHERE brand = '' OR brand IS NULL;