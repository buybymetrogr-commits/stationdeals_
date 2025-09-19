/*
  # Fix businesses table RLS INSERT policy

  1. Security Changes
    - Drop existing problematic INSERT policy
    - Create new simplified INSERT policy for authenticated users
    - Ensure users can only create businesses for themselves
    - Maintain admin and service role access

  2. Policy Changes
    - Remove dependency on is_business_owner() function for INSERT
    - Simplify the INSERT policy to just check owner_id = auth.uid()
    - Keep other policies intact
*/

-- Drop the existing INSERT policy that's causing issues
DROP POLICY IF EXISTS "Business users can create businesses" ON businesses;

-- Create a new, simpler INSERT policy
CREATE POLICY "Authenticated users can create businesses for themselves"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Ensure the policy for admins still works
DROP POLICY IF EXISTS "Admin users can manage all businesses" ON businesses;
CREATE POLICY "Admin users can manage all businesses"
  ON businesses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Ensure service role has full access
DROP POLICY IF EXISTS "Service role can manage all businesses" ON businesses;
CREATE POLICY "Service role can manage all businesses"
  ON businesses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);