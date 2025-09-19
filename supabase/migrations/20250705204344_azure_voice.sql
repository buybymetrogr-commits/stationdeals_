/*
  # Fix business tier update permissions

  1. Changes
    - Update business policies to allow tier changes
    - Ensure users can edit all fields of their own businesses
    - Fix RLS policy logic for business updates

  2. Security
    - Maintain security while allowing proper business management
    - Users can only edit their own businesses
*/

-- Drop existing business policies that might be causing issues
DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON businesses;

-- Create new policy for business updates that allows all field changes
CREATE POLICY "Users can update their own businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Create policy for users to view their own businesses
CREATE POLICY "Users can view their own businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Ensure admin users can manage all businesses
DROP POLICY IF EXISTS "Admin users can manage all businesses" ON businesses;
CREATE POLICY "Admin users can manage all businesses"
  ON businesses
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Update the existing businesses to have proper owner_id
-- Set owner_id to the admin user for existing businesses without owner
UPDATE businesses 
SET owner_id = (SELECT id FROM auth.users WHERE email = 'vasilis@2vv.gr' LIMIT 1)
WHERE owner_id IS NULL;