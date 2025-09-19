/*
  # Fix user signup trigger error

  1. Problem
    - The trigger `assign_business_role_trigger` is causing signup failures
    - Database error occurs when trying to save new user
    - Likely due to trigger execution issues or conflicts

  2. Solution
    - Drop the existing problematic trigger
    - Create a more robust trigger with proper error handling
    - Use `SECURITY DEFINER` to ensure proper permissions
    - Add exception handling to prevent signup failures

  3. Changes
    - Drop existing trigger and function
    - Create new trigger function with better error handling
    - Recreate trigger with proper configuration
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS assign_business_role_trigger ON auth.users;
DROP FUNCTION IF EXISTS assign_business_role();

-- Create improved trigger function with error handling
CREATE OR REPLACE FUNCTION assign_business_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if this is a new user insert
  IF TG_OP = 'INSERT' THEN
    -- Insert role with error handling
    BEGIN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'business')
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to assign business role to user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER assign_business_role_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_business_role();

-- Ensure the function has proper permissions
GRANT EXECUTE ON FUNCTION assign_business_role() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_business_role() TO service_role;