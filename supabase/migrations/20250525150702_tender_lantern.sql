/*
  # Update admin user password

  1. Changes
    - Update password for admin user (vasilis@2vv.gr)
    - Set new password to: vasilis!@#45
*/

-- Update admin user's password
UPDATE auth.users
SET encrypted_password = crypt('vasilis!@#45', gen_salt('bf'))
WHERE email = 'vasilis@2vv.gr';