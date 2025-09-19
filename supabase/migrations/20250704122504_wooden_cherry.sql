/*
  # Fix business policies for proper ownership handling

  1. Changes
    - Update business policies to handle tier changes properly
    - Ensure users can only edit their own businesses
    - Simplify ownership verification

  2. Security
    - Maintain security while allowing proper tier updates
    - Users can only manage their own businesses
*/

-- Drop existing business policies
DROP POLICY IF EXISTS "Users can manage their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete their own businesses" ON businesses;

-- Create new comprehensive policies for businesses

-- Users can insert their own businesses
CREATE POLICY "Users can insert their own businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own businesses (including tier changes)
CREATE POLICY "Users can update their own businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own businesses
CREATE POLICY "Users can delete their own businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Users can view their own businesses (for management)
CREATE POLICY "Users can view their own businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);