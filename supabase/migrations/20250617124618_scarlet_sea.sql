/*
  # Fix metro stations RLS policy

  1. Changes
    - Update RLS policy to use auth.uid() instead of auth.jwt()
    - Create a helper function to check admin status
    - Update policies to work correctly with admin users

  2. Security
    - Maintain security while allowing admin users to manage stations
*/

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() ->> 'role') = 'admin' OR
      (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR
      (
        SELECT raw_app_meta_data ->> 'role' = 'admin'
        FROM auth.users
        WHERE id = auth.uid()
      ),
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can manage metro stations" ON metro_stations;

-- Create new admin policy using the helper function
CREATE POLICY "Admin users can manage metro stations"
  ON metro_stations
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Also allow service role full access
CREATE POLICY "Service role can manage metro stations"
  ON metro_stations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);