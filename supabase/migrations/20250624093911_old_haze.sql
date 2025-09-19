/*
  # Fix offers policies for better access control

  1. Changes
    - Update RLS policies to allow proper access to offers
    - Add policy for users to view offers from their businesses
    - Ensure admin users can manage all offers

  2. Security
    - Maintain security while allowing proper access
    - Users can only manage offers from their own businesses
    - Admins can manage all offers
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active offers" ON offers;
DROP POLICY IF EXISTS "Business owners can manage their offers" ON offers;
DROP POLICY IF EXISTS "Service role can manage all offers" ON offers;

-- Create new comprehensive policies

-- Public can view active offers
CREATE POLICY "Public can view active offers"
  ON offers
  FOR SELECT
  TO public
  USING (is_active = true);

-- Authenticated users can view offers from their businesses
CREATE POLICY "Users can view their business offers"
  ON offers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = offers.business_id 
      AND owner_id = auth.uid()
    )
  );

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

-- Admin users can manage all offers
CREATE POLICY "Admin users can manage all offers"
  ON offers
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Service role can manage all offers
CREATE POLICY "Service role can manage all offers"
  ON offers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);