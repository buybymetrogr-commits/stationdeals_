-- Clear all existing data
DELETE FROM business_photos;
DELETE FROM business_hours;
DELETE FROM reviews;
DELETE FROM businesses;

-- Insert 4 businesses near Venizelou station (40.6363, 22.9386)
INSERT INTO businesses (id, name, description, category_id, address, lat, lng, phone, website, active, import_status) VALUES
(
  gen_random_uuid(),
  'Φαρμακείο Βενιζέλου',
  'Σύγχρονο φαρμακείο με πλήρη γκάμα φαρμάκων και προϊόντων υγείας. Εξειδικευμένο προσωπικό για συμβουλές.',
  'health',
  'Βενιζέλου 45, Θεσσαλονίκη 54624',
  40.6368,
  22.9390,
  '2310555123',
  'https://pharmacy-venizelou.gr',
  true,
  'manual'
),
(
  gen_random_uuid(),
  'Καφετέρια Central',
  'Μοντέρνα καφετέρια με specialty coffee και φρέσκα γλυκά. Ιδανική για δουλειά και συναντήσεις.',
  'cafe',
  'Βενιζέλου 52, Θεσσαλονίκη 54624',
  40.6360,
  22.9385,
  '2310555456',
  'https://central-cafe.gr',
  true,
  'manual'
),
(
  gen_random_uuid(),
  'Εστιατόριο Μεσογειακό',
  'Αυθεντική μεσογειακή κουζίνα με φρέσκα υλικά και παραδοσιακές συνταγές. Οικογενειακή ατμόσφαιρα.',
  'restaurant',
  'Βενιζέλου 38, Θεσσαλονίκη 54624',
  40.6365,
  22.9382,
  '2310555789',
  'https://mesogeiako-restaurant.gr',
  true,
  'manual'
),
(
  gen_random_uuid(),
  'Mini Market Express',
  'Σούπερ μάρκετ γειτονιάς με μεγάλη ποικιλία προϊόντων. Ανοιχτό καθημερινά μέχρι αργά.',
  'grocery',
  'Βενιζέλου 41, Θεσσαλονίκη 54624',
  40.6361,
  22.9388,
  '2310555321',
  null,
  true,
  'manual'
);

-- Add business photos
INSERT INTO business_photos (business_id, url, "order") 
SELECT 
  b.id,
  CASE 
    WHEN b.category_id = 'health' THEN 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg'
    WHEN b.category_id = 'cafe' THEN 'https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg'
    WHEN b.category_id = 'restaurant' THEN 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg'
    WHEN b.category_id = 'grocery' THEN 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg'
  END,
  0
FROM businesses b;

-- Add second photo for each business
INSERT INTO business_photos (business_id, url, "order") 
SELECT 
  b.id,
  CASE 
    WHEN b.category_id = 'health' THEN 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg'
    WHEN b.category_id = 'cafe' THEN 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'
    WHEN b.category_id = 'restaurant' THEN 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
    WHEN b.category_id = 'grocery' THEN 'https://images.pexels.com/photos/3962294/pexels-photo-3962294.jpeg'
  END,
  1
FROM businesses b;

-- Add business hours for all businesses
INSERT INTO business_hours (business_id, day, open, close, closed)
SELECT 
  b.id,
  day_name,
  CASE 
    WHEN day_name = 'Κυριακή' AND b.category_id = 'health' THEN null
    WHEN day_name = 'Κυριακή' AND b.category_id = 'cafe' THEN '10:00'
    WHEN day_name = 'Κυριακή' AND b.category_id = 'restaurant' THEN '12:00'
    WHEN day_name = 'Κυριακή' AND b.category_id = 'grocery' THEN '09:00'
    WHEN day_name = 'Σάββατο' AND b.category_id = 'health' THEN '08:00'
    WHEN day_name = 'Σάββατο' AND b.category_id = 'cafe' THEN '08:00'
    WHEN day_name = 'Σάββατο' AND b.category_id = 'restaurant' THEN '12:00'
    WHEN day_name = 'Σάββατο' AND b.category_id = 'grocery' THEN '08:00'
    ELSE '08:00'
  END,
  CASE 
    WHEN day_name = 'Κυριακή' AND b.category_id = 'health' THEN null
    WHEN day_name = 'Κυριακή' AND b.category_id = 'cafe' THEN '18:00'
    WHEN day_name = 'Κυριακή' AND b.category_id = 'restaurant' THEN '24:00'
    WHEN day_name = 'Κυριακή' AND b.category_id = 'grocery' THEN '15:00'
    WHEN day_name = 'Σάββατο' AND b.category_id = 'health' THEN '14:00'
    WHEN day_name = 'Σάββατο' AND b.category_id = 'cafe' THEN '24:00'
    WHEN day_name = 'Σάββατο' AND b.category_id = 'restaurant' THEN '24:00'
    WHEN day_name = 'Σάββατο' AND b.category_id = 'grocery' THEN '21:00'
    WHEN b.category_id = 'health' THEN '21:00'
    WHEN b.category_id = 'cafe' THEN '24:00'
    WHEN b.category_id = 'restaurant' THEN '24:00'
    WHEN b.category_id = 'grocery' THEN '22:00'
  END,
  CASE 
    WHEN day_name = 'Κυριακή' AND b.category_id = 'health' THEN true
    ELSE false
  END
FROM businesses b
CROSS JOIN (
  VALUES 
    ('Δευτέρα'),
    ('Τρίτη'),
    ('Τετάρτη'),
    ('Πέμπτη'),
    ('Παρασκευή'),
    ('Σάββατο'),
    ('Κυριακή')
) AS days(day_name);

-- Add some sample reviews
INSERT INTO reviews (business_id, user_id, rating, comment, created_at)
SELECT 
  b.id,
  (SELECT id FROM auth.users WHERE email = 'vasilis@2vv.gr' LIMIT 1),
  CASE 
    WHEN b.category_id = 'health' THEN 5
    WHEN b.category_id = 'cafe' THEN 4
    WHEN b.category_id = 'restaurant' THEN 5
    WHEN b.category_id = 'grocery' THEN 4
  END,
  CASE 
    WHEN b.category_id = 'health' THEN 'Εξαιρετική εξυπηρέτηση και πολύ καλές τιμές!'
    WHEN b.category_id = 'cafe' THEN 'Πολύ καλός καφές και ωραίος χώρος!'
    WHEN b.category_id = 'restaurant' THEN 'Υπέροχο φαγητό και φιλικό προσωπικό!'
    WHEN b.category_id = 'grocery' THEN 'Βολικό και με καλές τιμές!'
  END,
  now() - interval '5 days'
FROM businesses b;

-- Add second review for some businesses
INSERT INTO reviews (business_id, user_id, rating, comment, created_at)
SELECT 
  b.id,
  (SELECT id FROM auth.users WHERE email = 'krikis@gmail.com' LIMIT 1),
  CASE 
    WHEN b.category_id = 'health' THEN 4
    WHEN b.category_id = 'cafe' THEN 5
    WHEN b.category_id = 'restaurant' THEN 4
    WHEN b.category_id = 'grocery' THEN 5
  END,
  CASE 
    WHEN b.category_id = 'health' THEN 'Πολύ καλό φαρμακείο με ευγενικό προσωπικό.'
    WHEN b.category_id = 'cafe' THEN 'Ο καλύτερος καφές στην περιοχή!'
    WHEN b.category_id = 'restaurant' THEN 'Νόστιμο φαγητό και καλή ατμόσφαιρα.'
    WHEN b.category_id = 'grocery' THEN 'Πάντα βρίσκω ό,τι χρειάζομαι!'
  END,
  now() - interval '2 days'
FROM businesses b
WHERE b.category_id IN ('health', 'cafe');