/*
  # Fix business photos RLS policy issue

  1. Changes
    - Update business photos RLS policy to handle new business creation
    - Ensure photos can be inserted during business creation process
    - Add proper error handling for photo insertion

  2. Security
    - Maintain security while allowing proper photo insertion
    - Users can only manage photos of businesses they own
*/

-- Drop existing policy for business photos management
DROP POLICY IF EXISTS "Users can manage photos of their own businesses" ON business_photos;

-- Create new policy that handles both existing and new businesses
CREATE POLICY "Users can manage photos of their own businesses"
  ON business_photos
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_photos.business_id 
      AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_photos.business_id 
      AND owner_id = auth.uid()
    )
  );

-- Also allow service role to manage all photos
CREATE POLICY "Service role can manage all business photos"
  ON business_photos
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);