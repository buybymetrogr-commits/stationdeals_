/*
  # Fix business registration RLS policy

  1. Security Updates
    - Update INSERT policy for businesses table to allow authenticated users to create businesses
    - Ensure the policy allows users to insert businesses where they are the owner
    - Fix the policy condition to properly check auth.uid() = owner_id

  2. Changes
    - Drop existing restrictive INSERT policy if it exists
    - Create new INSERT policy that allows authenticated users to insert their own businesses
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own businesses" ON businesses;

-- Create new INSERT policy for businesses
CREATE POLICY "Authenticated users can create businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Ensure the existing SELECT policy allows users to view their own businesses
DROP POLICY IF EXISTS "Users can view their own businesses" ON businesses;

CREATE POLICY "Users can view their own businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Ensure UPDATE policy exists for business owners
DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;

CREATE POLICY "Users can update their own businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Ensure DELETE policy exists for business owners
DROP POLICY IF EXISTS "Users can delete their own businesses" ON businesses;

CREATE POLICY "Users can delete their own businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());