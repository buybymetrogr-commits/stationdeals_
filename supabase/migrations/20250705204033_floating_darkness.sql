/*
  # Delete specific businesses

  1. Changes
    - Delete "Καφετέρια Central"
    - Delete "Εστιατόριο Μεσογειακό" 
    - Delete "Mini Market Express"
    - Related data (photos, hours, reviews, offers) will be deleted automatically due to CASCADE constraints

  2. Security
    - This will permanently remove the businesses and all associated data
*/

-- Delete the specified businesses
-- Related data (business_photos, business_hours, reviews, offers) will be automatically deleted due to CASCADE constraints

DELETE FROM businesses 
WHERE name IN (
  'Καφετέρια Central',
  'Εστιατόριο Μεσογειακό',
  'Mini Market Express'
);