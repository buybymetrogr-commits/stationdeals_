/*
  # Create offers table and management system

  1. New Tables
    - `offers`
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key to businesses)
      - `title` (text)
      - `description` (text)
      - `discount_text` (text) - e.g., "20%", "1+1 Δωρεάν"
      - `valid_from` (timestamptz)
      - `valid_until` (timestamptz)
      - `image_url` (text)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on offers table
    - Add policies for business owners to manage their offers
    - Add policies for public read access to active offers
*/

CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  discount_text text NOT NULL,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Public can view active offers
CREATE POLICY "Public can view active offers"
  ON offers
  FOR SELECT
  USING (is_active = true);

-- Business owners can manage their offers
CREATE POLICY "Business owners can manage their offers"
  ON offers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = offers.business_id 
      AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = offers.business_id 
      AND owner_id = auth.uid()
    )
  );

-- Service role can manage all offers
CREATE POLICY "Service role can manage all offers"
  ON offers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample offers for existing businesses
INSERT INTO offers (business_id, title, description, discount_text, valid_until, image_url)
SELECT 
  b.id,
  CASE 
    WHEN b.category_id = 'health' THEN 'Έκπτωση σε προϊόντα ομορφιάς'
    WHEN b.category_id = 'cafe' THEN 'Δωρεάν pastry με κάθε καφέ'
    WHEN b.category_id = 'restaurant' THEN 'Έκπτωση στο μεσημεριανό menu'
    WHEN b.category_id = 'grocery' THEN 'Προσφορά σε είδη πρώτης ανάγκης'
  END,
  CASE 
    WHEN b.category_id = 'health' THEN 'Έκπτωση 15% σε όλα τα προϊόντα ομορφιάς και περιποίησης'
    WHEN b.category_id = 'cafe' THEN 'Με κάθε αγορά καφέ, πάρτε ένα pastry δωρεάν'
    WHEN b.category_id = 'restaurant' THEN 'Έκπτωση 20% στο μεσημεριανό menu από Δευτέρα έως Παρασκευή'
    WHEN b.category_id = 'grocery' THEN 'Έκπτωση 10% σε επιλεγμένα είδη πρώτης ανάγκης'
  END,
  CASE 
    WHEN b.category_id = 'health' THEN '15%'
    WHEN b.category_id = 'cafe' THEN 'Δωρεάν pastry'
    WHEN b.category_id = 'restaurant' THEN '20%'
    WHEN b.category_id = 'grocery' THEN '10%'
  END,
  now() + interval '30 days',
  CASE 
    WHEN b.category_id = 'health' THEN 'https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg'
    WHEN b.category_id = 'cafe' THEN 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'
    WHEN b.category_id = 'restaurant' THEN 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg'
    WHEN b.category_id = 'grocery' THEN 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg'
  END
FROM businesses b
LIMIT 3;