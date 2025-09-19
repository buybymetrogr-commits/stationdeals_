/*
  # Create User Roles System

  1. New Tables
    - `user_roles` - Stores user role assignments
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text, 'admin' or 'business')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Functions
    - `get_user_role()` - Returns the role of the current user
    - `is_admin()` - Checks if current user is admin
    - `is_business_owner()` - Checks if current user is business owner

  3. Security
    - Enable RLS on `user_roles` table
    - Add policies for role management
    - Update existing policies to use role-based access
*/

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'business')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- Create function to check if user is business owner
CREATE OR REPLACE FUNCTION is_business_owner()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'business'
  );
$$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Users can view their own role"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update businesses table policies
DROP POLICY IF EXISTS "Authenticated users can create businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete their own businesses" ON businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON businesses;

-- New businesses policies with role-based access
CREATE POLICY "Business users can create businesses"
  ON businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_business_owner() AND auth.uid() = owner_id
  );

CREATE POLICY "Business owners can update their businesses"
  ON businesses
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() AND is_business_owner())
  WITH CHECK (owner_id = auth.uid() AND is_business_owner());

CREATE POLICY "Business owners can delete their businesses"
  ON businesses
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid() AND is_business_owner());

CREATE POLICY "Business owners can view their businesses"
  ON businesses
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() AND is_business_owner());

-- Update offers table policies
DROP POLICY IF EXISTS "Business owners can manage their offers" ON offers;
DROP POLICY IF EXISTS "Users can view their business offers" ON offers;

CREATE POLICY "Business owners can manage their offers"
  ON offers
  FOR ALL
  TO authenticated
  USING (
    is_business_owner() AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = offers.business_id 
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    is_business_owner() AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = offers.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Update business_photos policies
DROP POLICY IF EXISTS "Users can manage photos of their own businesses" ON business_photos;

CREATE POLICY "Business owners can manage their business photos"
  ON business_photos
  FOR ALL
  TO authenticated
  USING (
    is_business_owner() AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_photos.business_id 
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    is_business_owner() AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_photos.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Update business_hours policies
DROP POLICY IF EXISTS "Users can manage hours of their own businesses" ON business_hours;

CREATE POLICY "Business owners can manage their business hours"
  ON business_hours
  FOR ALL
  TO authenticated
  USING (
    is_business_owner() AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_hours.business_id 
      AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    is_business_owner() AND EXISTS (
      SELECT 1 FROM businesses 
      WHERE businesses.id = business_hours.business_id 
      AND businesses.owner_id = auth.uid()
    )
  );

-- Function to assign business role to new users
CREATE OR REPLACE FUNCTION assign_business_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign 'business' role to new users by default
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'business');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically assign business role to new users
CREATE TRIGGER assign_business_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_business_role();

-- Insert admin user (you can change this email to your admin email)
-- This will only work if the user already exists in auth.users
DO $$
BEGIN
  -- Try to insert admin role for a specific user (replace with actual admin email)
  INSERT INTO user_roles (user_id, role)
  SELECT id, 'admin'
  FROM auth.users 
  WHERE email = 'admin@buybymetro.com'
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    -- If user doesn't exist, that's okay
    NULL;
END $$;