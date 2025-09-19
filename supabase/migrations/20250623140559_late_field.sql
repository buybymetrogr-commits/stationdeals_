/*
  # Fix reviews structure and data

  1. Changes
    - Add missing fields to reviews table
    - Update existing reviews with proper data structure
    - Add sample reviews with correct format

  2. New Fields
    - Add user_name field for display purposes
    - Ensure all reviews have proper user references
*/

-- Add user_name field to reviews table for easier display
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' AND column_name = 'user_name'
  ) THEN
    ALTER TABLE reviews ADD COLUMN user_name text;
  END IF;
END $$;

-- Update existing reviews with user names
UPDATE reviews 
SET user_name = COALESCE(
  (SELECT email FROM auth.users WHERE id = reviews.user_id),
  'Ανώνυμος Χρήστης'
);

-- Add more sample reviews with proper structure
INSERT INTO reviews (business_id, user_id, user_name, rating, comment, created_at)
SELECT 
  b.id,
  (SELECT id FROM auth.users WHERE email = 'vasilis@2vv.gr' LIMIT 1),
  'Βασίλης Π.',
  CASE 
    WHEN b.name LIKE '%Φαρμακείο%' THEN 5
    WHEN b.name LIKE '%Καφετέρια%' THEN 4
    WHEN b.name LIKE '%Εστιατόριο%' THEN 5
    WHEN b.name LIKE '%Mini Market%' THEN 4
    ELSE 4
  END,
  CASE 
    WHEN b.name LIKE '%Φαρμακείο%' THEN 'Εξαιρετική εξυπηρέτηση και πολύ καλές τιμές! Το προσωπικό είναι πάντα εξυπηρετικό.'
    WHEN b.name LIKE '%Καφετέρια%' THEN 'Πολύ καλός καφές και ωραίος χώρος! Ιδανικό για δουλειά.'
    WHEN b.name LIKE '%Εστιατόριο%' THEN 'Υπέροχο φαγητό και φιλικό προσωπικό! Θα ξανάρθω σίγουρα.'
    WHEN b.name LIKE '%Mini Market%' THEN 'Βολικό και με καλές τιμές! Βρίσκω πάντα ό,τι χρειάζομαι.'
    ELSE 'Πολύ καλή εμπειρία!'
  END,
  now() - interval '3 days'
FROM businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r 
  WHERE r.business_id = b.id 
  AND r.user_id = (SELECT id FROM auth.users WHERE email = 'vasilis@2vv.gr' LIMIT 1)
);

-- Add second set of reviews
INSERT INTO reviews (business_id, user_id, user_name, rating, comment, created_at)
SELECT 
  b.id,
  (SELECT id FROM auth.users WHERE email = 'krikis@gmail.com' LIMIT 1),
  'Χρήστος Κ.',
  CASE 
    WHEN b.name LIKE '%Φαρμακείο%' THEN 4
    WHEN b.name LIKE '%Καφετέρια%' THEN 5
    WHEN b.name LIKE '%Εστιατόριο%' THEN 4
    WHEN b.name LIKE '%Mini Market%' THEN 5
    ELSE 4
  END,
  CASE 
    WHEN b.name LIKE '%Φαρμακείο%' THEN 'Πολύ καλό φαρμακείο με ευγενικό προσωπικό. Συνιστώ ανεπιφύλακτα!'
    WHEN b.name LIKE '%Καφετέρια%' THEN 'Ο καλύτερος καφές στην περιοχή! Εξαιρετική ποιότητα και service.'
    WHEN b.name LIKE '%Εστιατόριο%' THEN 'Νόστιμο φαγητό και καλή ατμόσφαιρα. Οι τιμές είναι λογικές.'
    WHEN b.name LIKE '%Mini Market%' THEN 'Πάντα βρίσκω ό,τι χρειάζομαι! Εξαιρετικό κατάστημα γειτονιάς.'
    ELSE 'Καλή εμπειρία συνολικά!'
  END,
  now() - interval '1 day'
FROM businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r 
  WHERE r.business_id = b.id 
  AND r.user_id = (SELECT id FROM auth.users WHERE email = 'krikis@gmail.com' LIMIT 1)
);

-- Add third set of reviews for variety
INSERT INTO reviews (business_id, user_id, user_name, rating, comment, created_at)
VALUES
(
  (SELECT id FROM businesses WHERE name LIKE '%Φαρμακείο%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'vasilis@2vv.gr' LIMIT 1),
  'Μαρία Δ.',
  5,
  'Άριστη εξυπηρέτηση! Με βοήθησαν πολύ με τις συμβουλές τους για τα φάρμακα.',
  now() - interval '5 days'
),
(
  (SELECT id FROM businesses WHERE name LIKE '%Καφετέρια%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email = 'krikis@gmail.com' LIMIT 1),
  'Γιάννης Μ.',
  4,
  'Ωραίος χώρος και καλός καφές. Λίγο ακριβό αλλά αξίζει.',
  now() - interval '2 days'
);