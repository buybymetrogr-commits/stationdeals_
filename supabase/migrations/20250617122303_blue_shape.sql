/*
  # Create admin user krikis@gmail.com

  1. Changes
    - Create new admin user with email krikis@gmail.com
    - Set password to hma!@#45
    - Assign admin role in app metadata
    - Confirm email automatically

  2. Security
    - User will have admin privileges for managing metro stations and businesses
*/

-- Create admin user krikis@gmail.com
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'krikis@gmail.com',
  crypt('hma!@#45', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{"role":"admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);