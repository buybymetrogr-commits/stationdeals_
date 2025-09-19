/*
  # Add sample offer to existing business

  1. Changes
    - Add a sample offer to the existing pharmacy business
    - This will help demonstrate the offers section appearing first in the business detail modal

  2. Sample Offer
    - 20% discount on beauty products
    - Valid for 30 days from now
*/

-- Add a sample offer to the existing pharmacy business
INSERT INTO offers (business_id, brand, title, description, discount_text, valid_from, valid_until, image_url, is_active)
SELECT 
  b.id,
  'Pharmacy Plus',
  'Έκπτωση σε προϊόντα ομορφιάς',
  'Έκπτωση 20% σε όλα τα προϊόντα ομορφιάς και περιποίησης. Ισχύει για όλες τις γνωστές μάρκες.',
  '20%',
  now(),
  now() + interval '30 days',
  'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg',
  true
FROM businesses b
WHERE b.name LIKE '%Φαρμακείο%'
AND NOT EXISTS (
  SELECT 1 FROM offers o WHERE o.business_id = b.id
)
LIMIT 1;

-- Add a second offer to make it more interesting
INSERT INTO offers (business_id, brand, title, description, discount_text, valid_from, valid_until, image_url, is_active)
SELECT 
  b.id,
  'Health Plus',
  'Δωρεάν μέτρηση πίεσης',
  'Δωρεάν μέτρηση αρτηριακής πίεσης με κάθε αγορά άνω των 15€. Προσφορά ισχύει καθημερινά.',
  'Δωρεάν υπηρεσία',
  now(),
  now() + interval '60 days',
  'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg',
  true
FROM businesses b
WHERE b.name LIKE '%Φαρμακείο%'
LIMIT 1;