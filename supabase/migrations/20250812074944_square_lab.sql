/*
  # Fix RLS policies for businesses table

  1. Security Changes
    - Update INSERT policy for businesses to allow business users to create businesses
    - Ensure proper owner_id validation
    - Allow service role full access for admin operations

  2. Policy Updates
    - Modify existing INSERT policy to be more permissive for authenticated business users
    - Keep existing SELECT, UPDATE, DELETE policies intact
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Business users can create businesses" ON businesses;

-- Create new INSERT policy that allows authenticated users to create businesses
CREATE POLICY "Authenticated users can create businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is setting themselves as owner
    auth.uid() = owner_id
  );

-- Ensure the business owner role check function exists and works properly
CREATE OR REPLACE FUNCTION is_business_owner()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has business role or is admin
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('business', 'admin')
  );
END;
$$;

-- Update the existing INSERT policy to be more flexible
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON businesses;

CREATE POLICY "Business users can create businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is authenticated and setting themselves as owner
    auth.uid() = owner_id
  );

-- Ensure admin users can manage all businesses
DROP POLICY IF EXISTS "Admin users can manage all businesses" ON businesses;

CREATE POLICY "Admin users can manage all businesses"
  ON businesses
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Ensure service role has full access
DROP POLICY IF EXISTS "Service role can manage all businesses" ON businesses;

CREATE POLICY "Service role can manage all businesses"
  ON businesses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);