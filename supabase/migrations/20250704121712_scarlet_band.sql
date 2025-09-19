/*
  # Fix business photos RLS policy for tier updates

  1. Changes
    - Update RLS policies to handle business ownership verification correctly
    - Add better error handling for business photos
    - Ensure tier updates work properly

  2. Security
    - Maintain security while allowing proper business management
    - Fix ownership verification logic
*/

-- Drop all existing policies for business_photos
DROP POLICY IF EXISTS "Public photos are viewable by everyone" ON business_photos;
DROP POLICY IF EXISTS "Users can manage photos of their own businesses" ON business_photos;
DROP POLICY IF EXISTS "Service role can manage all business photos" ON business_photos;

-- Create new comprehensive policies

-- Public can view all photos
CREATE POLICY "Public photos are viewable by everyone"
  ON business_photos
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can manage photos of their own businesses
CREATE POLICY "Users can manage photos of their own businesses"
  ON business_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_photos.business_id 
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_photos.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Service role can manage all photos
CREATE POLICY "Service role can manage all business photos"
  ON business_photos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin users can manage all photos
CREATE POLICY "Admin users can manage all business photos"
  ON business_photos
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Also update business_hours policies to match
DROP POLICY IF EXISTS "Users can manage hours of their own businesses" ON business_hours;

CREATE POLICY "Users can manage hours of their own businesses"
  ON business_hours
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_hours.business_id 
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_hours.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Add service role policy for business_hours
CREATE POLICY "Service role can manage all business hours"
  ON business_hours
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add admin policy for business_hours
CREATE POLICY "Admin users can manage all business hours"
  ON business_hours
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());